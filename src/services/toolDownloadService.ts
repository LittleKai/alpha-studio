import { getAuthHeaders } from './cloudService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ToolDownloadPlatformStats {
    windows: number;
    android: number;
    mac?: number;
    linux?: number;
    other?: number;
}

export interface ToolDownloadInfo {
    toolId: string;
    toolName: string;
    totalDownloads: number;
    platforms: ToolDownloadPlatformStats;
    versions?: Record<string, number>;
    lastDownloadedAt: string | null;
    updatedAt?: string;
}

export interface ToolDownloadActivity {
    toolId: string;
    toolName: string;
    platform: string;
    version?: string;
    downloadedAt: string;
}

export interface ToolDownloadSummary {
    totalDownloads: number;
    windowsDownloads: number;
    androidDownloads: number;
    otherDownloads: number;
    topTool: { toolId: string; toolName: string; count: number } | null;
}

export interface ToolDownloadStatsResponse {
    summary: ToolDownloadSummary;
    tools: ToolDownloadInfo[];
    recentActivities: ToolDownloadActivity[];
}

/**
 * Public fire-and-forget tracker called when user clicks download button on web
 */
export const trackToolDownload = async (
    toolId: string,
    platform: 'windows' | 'android' | 'mac' | 'linux' | 'other' = 'windows',
    version?: string
): Promise<void> => {
    try {
        await fetch(`${API_URL}/tools/${encodeURIComponent(toolId)}/download`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, version }),
            keepalive: true,
        });
    } catch (err) {
        console.warn(`[trackToolDownload] failed for ${toolId}:`, err);
    }
};

/**
 * Admin: Fetch full download statistics and recent activity
 */
export const getToolDownloadStats = async (): Promise<ToolDownloadStatsResponse> => {
    const res = await fetch(`${API_URL}/admin/tool-downloads`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        throw new Error('Failed to fetch tool download stats');
    }
    const json = await res.json();
    return json.data;
};

/**
 * Admin: Update/calibrate download count for a tool
 */
export const updateToolDownloadCount = async (
    toolId: string,
    payload: {
        totalDownloads?: number;
        platforms?: Partial<ToolDownloadPlatformStats>;
        toolName?: string;
    }
): Promise<ToolDownloadInfo> => {
    const res = await fetch(`${API_URL}/admin/tool-downloads/${encodeURIComponent(toolId)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update download count');
    }
    const json = await res.json();
    return json.data;
};

/**
 * Admin: Reset download count for a tool
 */
export const resetToolDownloadCount = async (toolId: string): Promise<ToolDownloadInfo> => {
    const res = await fetch(`${API_URL}/admin/tool-downloads/${encodeURIComponent(toolId)}/reset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reset download count');
    }
    const json = await res.json();
    return json.data;
};
