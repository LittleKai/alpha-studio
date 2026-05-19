const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => localStorage.getItem('alpha_studio_token');

const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

export type InteriorTemplateStatus = 'seed' | 'pending' | 'approved' | 'deprecated';
export type InteriorTemplateCategory = 'upper-cabinet' | 'lower-cabinet' | 'wardrobe' | 'shelf' | 'desk' | 'void' | 'other';

export interface InteriorTemplateDsl {
    frontSvg: any[];
    sideSvg: any[];
    planSvg: any[];
    isoBoxes: any[];
}

export interface InteriorTemplateRecord {
    _id: string;
    templateId: string;
    version: number;
    name: { vi: string; en: string };
    description: { vi: string; en: string };
    category: InteriorTemplateCategory;
    tags: string[];
    params: Record<string, { min?: number; max?: number; default?: number | string }>;
    styleOptions: Record<string, { values?: (string | number)[]; default?: string | number }>;
    dsl: InteriorTemplateDsl;
    status: InteriorTemplateStatus;
    authorId: { _id: string; email: string; name: string } | string | null;
    sourceProjectId: string | null;
    sourceInlineId: string | null;
    usageCount: number;
    previewDims: { width?: number; height?: number; depth?: number } | null;
    createdAt: string;
    updatedAt: string;
}

interface ListResponse {
    items: InteriorTemplateRecord[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}

async function handle<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === false) {
        throw new Error(json.message || `Request failed (${res.status})`);
    }
    return json.data as T;
}

export async function listAdminTemplates(params: {
    status?: InteriorTemplateStatus;
    category?: InteriorTemplateCategory;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<ListResponse> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category) query.set('category', params.category);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const res = await fetch(`${API_URL}/admin/interior-templates?${query.toString()}`, { headers: getHeaders() });
    return handle<ListResponse>(res);
}

export async function getAdminTemplate(id: string): Promise<InteriorTemplateRecord> {
    const res = await fetch(`${API_URL}/admin/interior-templates/${id}`, { headers: getHeaders() });
    return handle<InteriorTemplateRecord>(res);
}

export async function approveTemplate(id: string): Promise<InteriorTemplateRecord> {
    const res = await fetch(`${API_URL}/admin/interior-templates/${id}/approve`, { method: 'POST', headers: getHeaders() });
    return handle<InteriorTemplateRecord>(res);
}

export async function rejectTemplate(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/admin/interior-templates/${id}/reject`, { method: 'POST', headers: getHeaders() });
    await handle<void>(res);
}

export async function deprecateTemplate(id: string): Promise<InteriorTemplateRecord> {
    const res = await fetch(`${API_URL}/admin/interior-templates/${id}/deprecate`, { method: 'POST', headers: getHeaders() });
    return handle<InteriorTemplateRecord>(res);
}

export async function editTemplate(id: string, payload: Partial<{
    name: InteriorTemplateRecord['name'];
    description: InteriorTemplateRecord['description'];
    category: InteriorTemplateCategory;
    tags: string[];
    params: InteriorTemplateRecord['params'];
    styleOptions: InteriorTemplateRecord['styleOptions'];
    dsl: InteriorTemplateDsl;
    previewDims: InteriorTemplateRecord['previewDims'];
    bumpVersion: boolean;
}>): Promise<InteriorTemplateRecord> {
    const res = await fetch(`${API_URL}/admin/interior-templates/${id}/edit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
    });
    return handle<InteriorTemplateRecord>(res);
}

export async function commitInlineTemplate(projectId: string, inlineTemplateId: string): Promise<{ templateId: string; _id: string }> {
    const res = await fetch(`${API_URL}/interior/templates`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ projectId, inlineTemplateId })
    });
    return handle<{ templateId: string; _id: string }>(res);
}
