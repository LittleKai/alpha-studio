const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// ─── Project Types ──────────────────────────────────────────────────────────

export interface WorkflowProjectInput {
    name: string;
    client?: string;
    description?: string;
    department?: string;
    status?: string;
    startDate?: string;
    deadline?: string;
    budget?: number;
    expenses?: number;
    expenseLog?: { id: string; name: string; amount: number; date: string }[];
    team?: object[];
    progress?: number;
    chatHistory?: object[];
    tasks?: object[];
    avatar?: string;
}

// ─── User Search ─────────────────────────────────────────────────────────────

export interface WorkflowUserResult {
    id: string;
    name: string;
    avatar: string;
    role: string;
    email: string;
    isExternal: boolean;
}

export const searchUsers = async (q: string): Promise<{ success: boolean; data: WorkflowUserResult[] }> => {
    const response = await fetch(`${API_URL}/workflow/users/search?q=${encodeURIComponent(q)}`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
};

// ─── Document Types ─────────────────────────────────────────────────────────

export interface WorkflowDocumentInput {
    name: string;
    type?: string;
    size?: string;
    uploadDate?: string;
    uploader?: string;
    status?: string;
    url?: string;
    fileKey?: string;
    isProject?: boolean;
    projectId?: string;
    comments?: object[];
    note?: string;
}

// ─── Projects ───────────────────────────────────────────────────────────────

export const getProjects = async () => {
    const response = await fetch(`${API_URL}/workflow/projects`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
};

export const createProject = async (data: WorkflowProjectInput) => {
    const response = await fetch(`${API_URL}/workflow/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
};

export const updateProject = async (id: string, data: Partial<WorkflowProjectInput>) => {
    const response = await fetch(`${API_URL}/workflow/projects/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
};

export const deleteProject = async (id: string) => {
    const response = await fetch(`${API_URL}/workflow/projects/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete project');
    return response.json();
};

// ─── Documents ──────────────────────────────────────────────────────────────

export const getDocuments = async (projectId?: string) => {
    const url = projectId
        ? `${API_URL}/workflow/documents?projectId=${projectId}`
        : `${API_URL}/workflow/documents`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
};

export const createDocument = async (data: WorkflowDocumentInput) => {
    const response = await fetch(`${API_URL}/workflow/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create document');
    return response.json();
};

export const updateDocument = async (id: string, data: Partial<WorkflowDocumentInput> & { comments?: object[] }) => {
    const response = await fetch(`${API_URL}/workflow/documents/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update document');
    return response.json();
};

export const deleteDocument = async (id: string) => {
    const response = await fetch(`${API_URL}/workflow/documents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete document');
    return response.json();
};
