const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

export const getAuthHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Types
export interface CloudSession {
    _id: string;
    userId: string | { _id: string; name: string; email: string };
    hostMachineId: string | {
        _id: string;
        name: string;
        specs: { cpu: string; ram: string; gpu: string };
        status: string;
    };
    containerId: string;
    noVncUrl: string;
    status: 'active' | 'ended';
    startedAt: string;
    endedAt: string | null;
    endReason: 'user_disconnect' | 'admin_force' | 'machine_offline' | 'error' | null;
    createdAt: string;
}

export interface HostMachine {
    _id: string;
    name: string;
    machineId: string;
    agentUrl: string;
    secret: string;
    status: 'available' | 'busy' | 'offline';
    specs: { cpu: string; ram: string; gpu: string };
    maxContainers: number;
    currentContainers: number;
    lastPingAt: string | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

// User endpoints
export const connectToCloud = async () => {
    const response = await fetch(`${API_URL}/cloud/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to connect');
    return data;
};

export const disconnectFromCloud = async () => {
    const response = await fetch(`${API_URL}/cloud/disconnect`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to disconnect');
    return data;
};

export const getActiveSession = async () => {
    const response = await fetch(`${API_URL}/cloud/session`, {
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get session');
    return data;
};

// Admin endpoints
export const getCloudMachines = async () => {
    const response = await fetch(`${API_URL}/cloud/admin/machines`, {
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get machines');
    return data;
};

export const registerMachine = async (machineData: {
    name: string;
    machineId: string;
    agentUrl: string;
    secret: string;
    specs?: { cpu?: string; ram?: string; gpu?: string };
    maxContainers?: number;
}) => {
    const response = await fetch(`${API_URL}/cloud/admin/machines`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(machineData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to register machine');
    return data;
};

export const updateMachine = async (id: string, machineData: Partial<HostMachine>) => {
    const response = await fetch(`${API_URL}/cloud/admin/machines/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(machineData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update machine');
    return data;
};

export const toggleMachine = async (id: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/machines/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to toggle machine');
    return data;
};

export const getCloudSessions = async (params: {
    page?: number;
    limit?: number;
    status?: string;
} = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);

    const response = await fetch(`${API_URL}/cloud/admin/sessions?${searchParams}`, {
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get sessions');
    return data;
};

export const forceEndSession = async (id: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/sessions/${id}/force-end`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to force end session');
    return data;
};

// ─── Flow Server admin endpoints ────────────────────────────────────────────

export interface FlowServer {
    _id: string;
    name: string;
    machineId: string;
    agentUrl: string;
    secret: string;
    status: 'available' | 'degraded' | 'offline';
    tokenValid: boolean;
    tokenExpiresAt: string | null;
    projectIds: string[];
    targetProjectCount: number;
    lastPingAt: string | null;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export const getFlowServers = async () => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers`, {
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to get flow servers');
    return data;
};

export const registerFlowServer = async (input: {
    name: string;
    machineId: string;
    agentUrl: string;
    secret: string;
    targetProjectCount?: number;
    initialProjectIds?: string;
}) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to register flow server');
    return data;
};

export const updateFlowServer = async (
    id: string,
    input: Partial<{ name: string; agentUrl: string; secret: string; targetProjectCount: number; initialProjectIds: string }>,
) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(input),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update flow server');
    return data;
};

export const toggleFlowServer = async (id: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to toggle flow server');
    return data;
};

export const deleteFlowServer = async (id: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete flow server');
    return data;
};

export const syncFlowServerProjects = async (id: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers/${id}/sync`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to sync flow server projects');
    return data;
};

export const deleteFlowServerProject = async (serverId: string, projectId: string) => {
    const response = await fetch(`${API_URL}/cloud/admin/flow-servers/${serverId}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete project from flow server');
    return data;
};
