const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// ─── Types ──────────────────────────────────────────────────────────────────

export const ITEM_TYPES = [
    'case_study', 'prompt', 'workflow', 'skill', 'template', 'report', 'playbook'
] as const;
export type ItemType = typeof ITEM_TYPES[number];

export const CATEGORIES = [
    'event', 'activation', 'roadshow', 'booth_exhibition',
    'stage_production', 'digital_event', 'other'
] as const;

export const OBJECTIVES = [
    'product_launch', 'brand_awareness', 'sales_activation',
    'customer_loyalty', 'internal_corporate'
] as const;

export const KPIS = [
    'brand_recall', 'attendance_reach', 'engagement',
    'leads_database', 'sales_conversion'
] as const;

export const BUDGET_TIERS = ['under_200m', '200m_1b', '1b_5b', '5b_20b', 'over_20b'] as const;

export const VERIFICATIONS = ['verified', 'partner_sourced', 'unverified'] as const;

export const DEPTHS = ['basic', 'deep', 'benchmark', 'forecast'] as const;

export const INDUSTRIES = [
    'fmcg', 'technology', 'automotive', 'retail_mall',
    'beauty', 'fnb', 'finance', 'healthcare', 'education', 'other'
] as const;

export interface LocalizedText {
    vi: string;
    en: string;
}

export interface LibraryMetric {
    label: string;
    value: string;
}

/**
 * Thân bài là danh sách khối. Mỗi khối chỉ dùng field thuộc `kind` của nó —
 * backend cắt sạch phần thừa trong `sanitizeSections`.
 *
 * Chữ trong khối là một ngôn ngữ, khác `title`/`summary`/`content` ở cấp mục.
 */
export const SECTION_KINDS = [
    'richText', 'keyValue', 'metrics', 'bulletGroups', 'steps', 'quote', 'gallery', 'linkedItems'
] as const;
export type SectionKind = typeof SECTION_KINDS[number];

export interface LibrarySection {
    kind: SectionKind;
    title: string;
    html?: string;
    rows?: { label: string; value: string }[];
    metrics?: { label: string; value: string; note: string }[];
    groups?: { title: string; items: string[] }[];
    steps?: { title: string; desc: string }[];
    quote?: string;
    quoteBy?: string;
    images?: string[];
    links?: { slug: string; label: string }[];
}

/** Khối rỗng đúng hình dạng cho từng `kind` — dùng khi thêm khối mới. */
export function emptySection(kind: SectionKind): LibrarySection {
    const base = { kind, title: '' };
    switch (kind) {
        case 'richText': return { ...base, html: '' };
        case 'keyValue': return { ...base, rows: [{ label: '', value: '' }] };
        case 'metrics': return { ...base, metrics: [{ label: '', value: '', note: '' }] };
        case 'bulletGroups': return { ...base, groups: [{ title: '', items: [''] }] };
        case 'steps': return { ...base, steps: [{ title: '', desc: '' }] };
        case 'quote': return { ...base, quote: '', quoteBy: '' };
        case 'gallery': return { ...base, images: [] };
        case 'linkedItems': return { ...base, links: [{ slug: '', label: '' }] };
    }
}

/** Đánh giá kèm nhận xét — thư viện không có khối bình luận riêng. */
export interface LibraryReview {
    score: number;
    comment: string;
    createdAt: string;
    author: { _id: string; name: string; avatar: string };
}

export interface LibraryAttachment {
    name: string;
    url: string;
    fileKey: string;
    size: string;
    mime: string;
}

export interface EventLibraryItem {
    _id: string;
    slug: string;
    itemType: ItemType;
    ownership: 'platform' | 'user';
    visibility: 'public' | 'private';
    owner?: string | null;
    title: LocalizedText;
    summary: LocalizedText;
    content?: LocalizedText;
    coverImage: string;
    category: string;
    industries: string[];
    objectives: string[];
    kpis: string[];
    budgetTier: string;
    verification: string;
    depth: string;
    tags: string[];
    metrics: LibraryMetric[];
    attachments: LibraryAttachment[];
    gallery: string[];
    sections: LibrarySection[];
    sourceUrl: string;
    sourceName: string;
    authorName: string;
    stats: { views: number; uses: number };
    likesCount: number;
    rating: { average: number; count: number };
    createdAt: string;
    updatedAt: string;
}

export type FilterCountMap = Record<string, number>;

export interface LibraryFilterCounts {
    itemTypes: FilterCountMap;
    categories: FilterCountMap;
    industries: FilterCountMap;
    objectives: FilterCountMap;
    kpis: FilterCountMap;
    budgetTiers: FilterCountMap;
    verifications: FilterCountMap;
    depths: FilterCountMap;
    ownerships: FilterCountMap;
}

export interface LibraryListResponse {
    success: boolean;
    data: EventLibraryItem[];
    pagination: { total: number; page: number; limit: number; pages: number };
    filterCounts: LibraryFilterCounts;
}

export interface LibraryStats {
    total: number;
    verified: number;
    typeCounts: Record<string, number>;
    industryCount: number;
}

export interface LibraryQuery {
    page?: number;
    limit?: number;
    search?: string;
    scope?: 'all' | 'mine' | 'platform' | 'community';
    itemType?: string;
    category?: string[];
    industry?: string[];
    objective?: string[];
    kpi?: string[];
    budgetTier?: string[];
    verification?: string[];
    depth?: string[];
    sort?: string;
}

/** Dữ liệu người dùng chỉnh tay trong modal trước khi đăng lên thư viện. */
export interface PublishOverrides {
    itemType: ItemType;
    visibility: 'public' | 'private';
    category?: string;
    title?: string;
    summary?: string;
    industries?: string[];
    objectives?: string[];
    kpis?: string[];
    depth?: string;
    tags?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildQueryString(query: LibraryQuery): string {
    const params = new URLSearchParams();
    const setCsv = (key: string, values?: string[]) => {
        if (values?.length) params.set(key, values.join(','));
    };

    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search) params.set('search', query.search);
    if (query.scope && query.scope !== 'all') params.set('scope', query.scope);
    if (query.itemType) params.set('itemType', query.itemType);
    if (query.sort) params.set('sort', query.sort);
    setCsv('category', query.category);
    setCsv('industry', query.industry);
    setCsv('objective', query.objective);
    setCsv('kpi', query.kpi);
    setCsv('budgetTier', query.budgetTier);
    setCsv('verification', query.verification);
    setCsv('depth', query.depth);

    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

async function parseJson(res: Response) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
        throw new Error(data.message || `Request failed: ${res.status}`);
    }
    return data;
}

// ─── API ────────────────────────────────────────────────────────────────────

export async function getLibraryItems(query: LibraryQuery = {}): Promise<LibraryListResponse> {
    const res = await fetch(`${API_URL}/event-library${buildQueryString(query)}`, {
        headers: getAuthHeaders()
    });
    return parseJson(res);
}

export async function getLibraryStats(): Promise<LibraryStats> {
    const res = await fetch(`${API_URL}/event-library/stats`, { headers: getAuthHeaders() });
    const data = await parseJson(res);
    return data.data;
}

export async function getLibraryItem(slug: string): Promise<{
    item: EventLibraryItem;
    related: EventLibraryItem[];
    /** Trạng thái thích/chấm điểm của chính người đang xem */
    reviews: LibraryReview[];
    me: { liked: boolean; score: number; comment: string };
}> {
    const res = await fetch(`${API_URL}/event-library/${encodeURIComponent(slug)}`, {
        headers: getAuthHeaders()
    });
    const data = await parseJson(res);
    return {
        item: data.data,
        related: data.related || [],
        reviews: data.reviews || [],
        me: data.me || { liked: false, score: 0, comment: '' }
    };
}

/** Ghi nhận lượt dùng khi người xem bấm "Dùng ngay" / "Tải về". */
export async function markLibraryItemUsed(slug: string): Promise<void> {
    await fetch(`${API_URL}/event-library/${encodeURIComponent(slug)}/use`, {
        method: 'POST',
        headers: getAuthHeaders()
    }).catch(() => undefined);
}

export async function createLibraryItem(
    payload: Partial<EventLibraryItem>
): Promise<EventLibraryItem> {
    const res = await fetch(`${API_URL}/event-library`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await parseJson(res);
    return data.data;
}

export async function likeLibraryItem(slug: string): Promise<{ liked: boolean; likesCount: number }> {
    const res = await fetch(`${API_URL}/event-library/${encodeURIComponent(slug)}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    const data = await parseJson(res);
    return data.data;
}

export async function rateLibraryItem(
    slug: string,
    score: number,
    comment = ''
): Promise<{ rating: { average: number; count: number }; myScore: number }> {
    const res = await fetch(`${API_URL}/event-library/${encodeURIComponent(slug)}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score, comment })
    });
    const data = await parseJson(res);
    return data.data;
}

export async function updateLibraryItem(
    id: string,
    payload: Partial<EventLibraryItem>
): Promise<EventLibraryItem> {
    const res = await fetch(`${API_URL}/event-library/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
    });
    const data = await parseJson(res);
    return data.data;
}

export async function deleteLibraryItem(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/event-library/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    await parseJson(res);
}

export async function publishProjectToLibrary(
    projectId: string,
    overrides: PublishOverrides
): Promise<EventLibraryItem> {
    const res = await fetch(`${API_URL}/event-library/publish/project/${projectId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(overrides)
    });
    const data = await parseJson(res);
    return data.data;
}

export async function publishDocumentToLibrary(
    documentId: string,
    overrides: PublishOverrides
): Promise<EventLibraryItem> {
    const res = await fetch(`${API_URL}/event-library/publish/document/${documentId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(overrides)
    });
    const data = await parseJson(res);
    return data.data;
}
