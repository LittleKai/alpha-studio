const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('alpha_studio_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function jsonHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', ...getAuthHeaders() };
}

// ─── Quota types ────────────────────────────────────────────────────────────

export interface StudioQuotaSlot {
    used: number;
    limit: number | null;
    remaining: number | null;
}

export interface StudioUsage {
    unlimited: boolean;
    image: StudioQuotaSlot;
    video: StudioQuotaSlot;
    legacy: StudioQuotaSlot;
    // Legacy convenience — mirrors image.used/limit/remaining for consumers of old shape.
    used: number;
    limit: number | null;
    remaining: number | null;
}

export async function getStudioUsage(): Promise<StudioUsage> {
    const res = await fetch(`${API_URL}/studio/usage`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to get usage');

    const d = data.data;
    return {
        unlimited: !!d.unlimited,
        image: d.image ?? { used: 0, limit: null, remaining: null },
        video: d.video ?? { used: 0, limit: null, remaining: null },
        legacy: d.legacy ?? { used: 0, limit: null, remaining: null },
        // Back-compat (older callers still expect flat shape)
        used: d.image?.used ?? 0,
        limit: d.image?.limit ?? null,
        remaining: d.image?.remaining ?? null,
    };
}

// Legacy endpoint kept so older code paths don't break — new flows use
// generateImage / generateVideo which consume quota backend-side.
export async function consumeStudioUse(): Promise<StudioUsage> {
    const res = await fetch(`${API_URL}/studio/use`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
        const err = new Error(data.message || 'Limit reached') as Error & { limitReached?: boolean };
        if (res.status === 429) err.limitReached = true;
        throw err;
    }
    return getStudioUsage();
}

// ─── Generation types ───────────────────────────────────────────────────────

export type ImageModel = 'banana2' | 'banana-pro';
export type ImageRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type VideoModel =
    | 'veo'
    | 'veo-fast'
    | 'veo-quality'
    | 'veo-lite'
    | 'veo-fast-lp'    // Lower Priority — relaxed quota, slower turn-around
    | 'veo-lite-lp'    // Lower Priority Lite
    | 'veo-r2v';       // legacy alias
export type VideoRatio = '16:9' | '9:16';
export type VideoSubtype = 'Frames' | 'Ingredients';
export type VideoDuration = '4s' | '6s' | '8s';

export interface ReferenceImage {
    base64: string;      // raw base64 (no data: prefix)
    mimeType?: string;
}

export interface ImageGenerateInput {
    prompt: string;
    model: ImageModel;
    ratio: ImageRatio;
    seed?: number;
    referenceImage?: ReferenceImage;
    referenceImageUrl?: string;       // legacy single-image (kept for compat)
    referenceImageUrls?: string[];    // multi-image (preferred), max 2
}

export interface VideoGenerateInput {
    prompt: string;
    model: VideoModel;
    ratio: VideoRatio;
    subtype?: VideoSubtype;
    duration?: VideoDuration;
    count?: 1 | 2 | 3 | 4;
    seed?: number;
    referenceImage?: ReferenceImage;
    referenceImageUrl?: string;
    referenceImageUrls?: string[];
}

export interface StudioGenerationItem {
    index: number;
    previewUrl: string;       // Absolute URL — backend 302-redirects to CDN.
    saved: boolean;
    b2Url: string | null;
    seed: number;
    ext: string;
}

export interface StudioGeneration {
    id: string;
    type: 'image' | 'video';
    model: string;
    prompt: string;
    aspectRatio: string;
    count: number;
    hasReferenceImage: boolean;
    items: StudioGenerationItem[];
    projectId?: string;
    projectTitle?: string;
    createdAt: string;
    expiresAt: string;
    quota?: { used: number; limit: number } | null;
    genId?: string;
}

export interface StudioProgress {
    genId: string;
    progress: number;     // 0-100
    status: 'starting' | 'pasting' | 'generating' | 'retrying' | 'done' | 'failed' | 'unknown';
    elapsedSeconds: number;
    pasteCurrent?: number | null;   // 1-indexed, only set when status==='pasting'
    pasteTotal?: number | null;
    // Set when WAB detects a Google "Failed" tile mid-gen and clicks Retry.
    // FE uses retryAttempt as a monotonic counter to log each retry once.
    retryAttempt?: number | null;
    retryTotal?: number | null;
    retryError?: string | null;
}

export async function getStudioProgress(genId: string): Promise<StudioProgress> {
    const res = await fetch(`${API_URL}/studio/progress/${encodeURIComponent(genId)}`, {
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!data.success) {
        return { genId, progress: 0, status: 'unknown', elapsedSeconds: 0 };
    }
    return {
        genId,
        progress: data.data?.progress ?? 0,
        status: data.data?.status ?? 'unknown',
        elapsedSeconds: data.data?.elapsedSeconds ?? 0,
        pasteCurrent: data.data?.pasteCurrent ?? null,
        pasteTotal: data.data?.pasteTotal ?? null,
        retryAttempt: data.data?.retryAttempt ?? null,
        retryTotal: data.data?.retryTotal ?? null,
        retryError: data.data?.retryError ?? null,
    };
}

// ─── Errors ─────────────────────────────────────────────────────────────────

export class StudioApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public code?: string,
        public quota?: { used: number; limit: number; remaining: number },
    ) {
        super(message);
    }
}

// Backend returns previewUrl as a path relative to its /api base, e.g.
// "/studio/media/:genId/:idx?t=...". We rewrite it to an absolute URL so
// <img src> / <video src> / fetch() all resolve against the backend, not the
// frontend's own origin.
function absolutizePreview(gen: any): any {
    if (!gen?.items) return gen;
    gen.items = gen.items.map((it: any) => ({
        ...it,
        previewUrl: typeof it.previewUrl === 'string' && it.previewUrl.startsWith('/')
            ? `${API_URL}${it.previewUrl}`
            : it.previewUrl,
    }));
    return gen;
}

async function handleGenerateResponse(res: Response): Promise<any> {
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
        throw new StudioApiError(
            res.status,
            data.message || `Yêu cầu thất bại (${res.status})`,
            undefined,
            data.data,
        );
    }
    return absolutizePreview(data.data);
}

// ─── Generate ───────────────────────────────────────────────────────────────

export async function generateImage(input: ImageGenerateInput, genId?: string): Promise<StudioGeneration> {
    const res = await fetch(`${API_URL}/studio/image/generate`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ ...input, ...(genId ? { genId } : {}) }),
    });
    return (await handleGenerateResponse(res)) as StudioGeneration;
}

// Browser-side UUID for genId. Used so the FE can start polling
// /progress/:genId immediately, before the long-running generateImage
// request returns. Falls back to a Math.random ID for older browsers.
export function newGenId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'gen-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function generateVideo(input: VideoGenerateInput, genId?: string): Promise<StudioGeneration> {
    const res = await fetch(`${API_URL}/studio/video/generate`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ ...input, ...(genId ? { genId } : {}) }),
    });
    return (await handleGenerateResponse(res)) as StudioGeneration;
}

// ─── Save to B2 ─────────────────────────────────────────────────────────────

export interface SaveResult {
    b2Url: string;
    b2Key?: string;
    alreadySaved?: boolean;
}

export async function saveGeneration(genId: string, itemIdx: number): Promise<SaveResult> {
    const res = await fetch(`${API_URL}/studio/save/${genId}/${itemIdx}`, {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Lưu thất bại');
    }
    return data.data as SaveResult;
}

export interface HQDownloadResult {
    url: string;
    source: 'cdn' | 'wab';
    quality: string;
    costCharged: number;
}

export async function downloadAtQuality(
    genId: string,
    itemIdx: number,
    quality: string,
): Promise<HQDownloadResult> {
    const res = await fetch(
        `${API_URL}/studio/download/${genId}/${itemIdx}?quality=${encodeURIComponent(quality)}`,
        { method: 'GET', headers: getAuthHeaders() },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
        const msg = data.message || `Download failed (${res.status})`;
        const err = new Error(msg) as Error & { status?: number; cost?: number; balance?: number };
        err.status = res.status;
        if (typeof data.cost === 'number') err.cost = data.cost;
        if (typeof data.balance === 'number') err.balance = data.balance;
        throw err;
    }
    return data.data as HQDownloadResult;
}

// ─── Reference image cleanup ────────────────────────────────────────────────

// Best-effort cancel of an in-flight gen. The agent's WAB worker checks
// the cancel flag every 3s during watch_progress, so the request stays
// pending up to that long after this call returns 200.
export async function cancelStudioGen(genId: string): Promise<void> {
    try {
        await fetch(`${API_URL}/studio/cancel/${encodeURIComponent(genId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
    } catch {
        /* swallow — UI will see the gen request fail anyway */
    }
}

// Best-effort cleanup of a B2-hosted reference image after gen completes.
// Swallows errors — if the cron sweep doesn't get to it for an hour, it
// will be purged automatically. The point is to keep things tidy in the
// happy path, not enforce hard cleanup here.
export async function deleteRefImage(url: string): Promise<void> {
    try {
        await fetch(`${API_URL}/studio/refs?url=${encodeURIComponent(url)}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
    } catch {
        /* swallow */
    }
}

// ─── History ────────────────────────────────────────────────────────────────

export async function getStudioHistory(
    limit = 20,
    type?: 'image' | 'video',
): Promise<StudioGeneration[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.set('type', type);
    const res = await fetch(`${API_URL}/studio/history?${params}`, {
        headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to get history');
    return ((data.data || []) as StudioGeneration[]).map(absolutizePreview);
}

// Load Studio Settings
export interface StudioSettings {
    useApiForStudio: boolean;
    useApiForImage: boolean;
    useApiForVideo: boolean;
    useApiForEdit: boolean;
    geminiApiKey?: string;
    videoApiKey?: string;
}

export async function getStudioSettings(): Promise<StudioSettings> {
    const res = await fetch(`${API_URL}/settings/public`, {
        headers: getAuthHeaders() // Cần token để lấy key (nếu trả thẳng về public keys trên BE. Wait, lúc nãy thêm geminiApiKey vào public keys)
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
        return {
            useApiForStudio: data.data.useApiForStudio || false,
            useApiForImage: data.data.useApiForImage || false,
            useApiForVideo: data.data.useApiForVideo || false,
            useApiForEdit: data.data.useApiForEdit || false,
            geminiApiKey: data.data.geminiApiKey,
            videoApiKey: data.data.videoApiKey,
        };
    }
    return {
        useApiForStudio: false,
        useApiForImage: false,
        useApiForVideo: false,
        useApiForEdit: false,
    };
}
