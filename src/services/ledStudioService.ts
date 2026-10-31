export interface LedStudioProjectRecord {
  _id: string;
  title: string;
  description: string;
  b2FileKey: string;
  fileSize: number;
  thumbnailUrl: string;
  stageSummary: {
    widthM: number;
    depthM: number;
    heightM: number;
    ledCount: number;
    lightCount: number;
    cueCount: number;
  };
  shareEnabled: boolean;
  shareExpiresAt: string | null;
  updatedAt: string;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
export const LED_STUDIO_API_BASE = `${API_BASE}/led-studio`;

export async function listLedStudioProjects(token?: string | null): Promise<LedStudioProjectRecord[]> {
  const res = await fetch(`${API_BASE}/led-studio/projects`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load LED Studio projects');
  }
  return json.data || [];
}

export async function createLedStudioShareLink(
  projectId: string,
  expiresInHours = 168,
  token?: string | null
): Promise<{ shareToken: string; shareExpiresAt: string }> {
  const res = await fetch(`${API_BASE}/led-studio/projects/${encodeURIComponent(projectId)}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: 'include',
    body: JSON.stringify({ enabled: true, expiresInHours })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create share link');
  }
  return json.data;
}
