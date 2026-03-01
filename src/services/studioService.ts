const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('alpha_studio_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export interface StudioUsage {
    used: number;
    limit: number | null;
    remaining: number | null;
    unlimited?: boolean;
}

export async function getStudioUsage(): Promise<StudioUsage> {
    const res = await fetch(`${API_URL}/studio/usage`, {
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to get usage');
    return data.data as StudioUsage;
}

// Returns updated usage after consuming one use.
// Throws an error (with .limitReached = true) if daily limit exceeded.
export async function consumeStudioUse(): Promise<StudioUsage> {
    const res = await fetch(`${API_URL}/studio/use`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!data.success) {
        const err = new Error(data.message || 'Limit reached') as Error & { limitReached?: boolean };
        if (res.status === 429) err.limitReached = true;
        throw err;
    }
    return data.data as StudioUsage;
}
