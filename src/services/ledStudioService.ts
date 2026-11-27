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

export type LedStudioGateState =
  | 'idle'
  | 'verifying'
  | 'ready'
  | 'password_required'
  | 'share_invalid'
  | 'share_pro_expired'
  | 'session_error';

export interface LedStudioSessionTicketResult {
  ok: boolean;
  status: number;
  issued: boolean;
  requiresPassword?: boolean;
  passwordProtected?: boolean;
  title?: string;
  expiresAt?: string;
  maxAge?: number;
  code?: string;
  message?: string;
}

export function resolveLedStudioTicketGate(
  res: LedStudioSessionTicketResult,
  ctx: {
    hasShareToken: boolean;
    silentRenewal: boolean;
    currentGateState: LedStudioGateState;
  }
): {
  nextGateState: LedStudioGateState;
  ok: boolean;
  passwordError: boolean;
  title?: string;
} {
  if (res.ok && res.issued) {
    return { nextGateState: 'ready', ok: true, passwordError: false };
  }
  if (res.ok && res.requiresPassword) {
    return {
      nextGateState: 'password_required',
      ok: false,
      passwordError: false,
      ...(res.title ? { title: res.title } : {})
    };
  }
  if (res.code === 'INVALID_SHARE_PASSWORD') {
    return { nextGateState: 'password_required', ok: false, passwordError: true };
  }
  if (ctx.silentRenewal && (res.code === 'NETWORK_ERROR' || res.status >= 500)) {
    return { nextGateState: ctx.currentGateState, ok: false, passwordError: false };
  }
  if (ctx.hasShareToken) {
    return {
      nextGateState: res.code === 'SHARE_PRO_EXPIRED' ? 'share_pro_expired' : 'share_invalid',
      ok: false,
      passwordError: false
    };
  }
  return { nextGateState: 'session_error', ok: false, passwordError: false };
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
export const LED_STUDIO_API_BASE = `${API_BASE}/led-studio`;

export async function acquireLedStudioSessionTicket(
  params: { token?: string | null; shareToken?: string | null; password?: string | null },
  options: { allowDevFallback?: boolean } = {}
): Promise<LedStudioSessionTicketResult> {
  const allowDevFallback = options.allowDevFallback ?? Boolean(import.meta.env.DEV);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.token) {
    headers.Authorization = `Bearer ${params.token}`;
  }
  const payload: Record<string, string> = {};
  if (params.shareToken) payload.shareToken = params.shareToken;
  if (params.password) payload.password = params.password;

  const callEndpoint = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const contentType = res.headers.get('content-type') || '';
    const json = contentType.includes('application/json') ? await res.json().catch(() => null) : null;
    return { res, json };
  };

  try {
    let { res, json } = await callEndpoint('/api/led-studio/session-ticket');
    if (allowDevFallback && (res.status === 404 || !json) && !LED_STUDIO_API_BASE.startsWith('/')) {
      ({ res, json } = await callEndpoint(`${LED_STUDIO_API_BASE}/session-ticket`));
    }

    if (res.ok && json?.success) {
      const data = json.data || {};
      return {
        ok: true,
        status: res.status,
        issued: Boolean(data.issued),
        requiresPassword: Boolean(data.requiresPassword),
        passwordProtected: Boolean(data.passwordProtected),
        title: typeof data.title === 'string' ? data.title : undefined,
        expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : undefined,
        maxAge: typeof data.maxAge === 'number' ? data.maxAge : undefined,
        message: json.message
      };
    }

    return {
      ok: false,
      status: res.status,
      issued: false,
      code: json?.code || (res.status === 401 ? 'AUTH_REQUIRED' : 'TICKET_REJECTED'),
      message: json?.message || 'Unable to verify LumiStage session'
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      issued: false,
      code: 'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Network error'
    };
  }
}

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

export interface LedStudioWorkspaceProjectSummary {
  id: string;
  title: string;
  revision: number;
  hasLocalOnlyMedia: boolean;
  manifestBytes: number;
  createdAt: string;
  updatedAt: string;
  stageSummary?: {
    widthM?: number;
    depthM?: number;
    heightM?: number;
    ledCount?: number;
    lightCount?: number;
    cueCount?: number;
  };
}

export interface LedStudioWorkspaceProjectsState {
  projects: LedStudioWorkspaceProjectSummary[];
  usedSlots: number;
  maxSlots: number;
  usedBytes: number;
  maxBytes: number;
  proActive: boolean;
}

export async function listLedStudioWorkspaceProjects(
  token?: string | null
): Promise<LedStudioWorkspaceProjectsState> {
  const res = await fetch(`${API_BASE}/led-studio/workspace/projects`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load workspace projects');
  }
  return json.data;
}

export async function deleteLedStudioWorkspaceProject(
  projectId: string,
  revision: number,
  token?: string | null
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/led-studio/workspace/projects/${encodeURIComponent(projectId)}?revision=${encodeURIComponent(String(revision))}`,
    {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include'
    }
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to delete workspace project');
  }
}

export interface LedStudioWorkspaceAssetsSummary {
  referencedCount: number;
  referencedBytes: number;
  purgeableCount: number;
  purgeableBytes: number;
  expiredPendingCount: number;
}

export interface LedStudioWorkspacePurgePreview {
  previewId: string;
  totalFiles: number;
  totalBytes: number;
  expiresAt: string;
}

export interface LedStudioWorkspacePurgeResult {
  previewId: string;
  deletedCount: number;
  deletedBytes: number;
  skippedCount: number;
  failedCount: number;
  failedItems: Array<{ assetId: string; error: string }>;
}

export async function getLedStudioWorkspaceAssetsSummary(
  token?: string | null
): Promise<LedStudioWorkspaceAssetsSummary> {
  const res = await fetch(`${API_BASE}/admin/led-studio-workspace-assets/summary`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: 'include'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load LED Studio asset summary');
  }
  return json.data;
}

export async function createLedStudioWorkspacePurgePreview(
  token?: string | null
): Promise<LedStudioWorkspacePurgePreview> {
  const res = await fetch(`${API_BASE}/admin/led-studio-workspace-assets/purge-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: 'include',
    body: JSON.stringify({})
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create purge preview');
  }
  return json.data;
}

export async function executeLedStudioWorkspacePurge(
  previewId: string,
  token?: string | null
): Promise<LedStudioWorkspacePurgeResult> {
  const res = await fetch(
    `${API_BASE}/admin/led-studio-workspace-assets/purges/${encodeURIComponent(previewId)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({})
    }
  );
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to execute purge');
  }
  return json.data;
}

export async function reconcileLedStudioWorkspaceUploads(
  token?: string | null
): Promise<{ expiredCount: number }> {
  const res = await fetch(`${API_BASE}/admin/led-studio-workspace-assets/reconcile-uploads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: 'include',
    body: JSON.stringify({})
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to reconcile uploads');
  }
  return json.data;
}
