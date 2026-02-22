const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
// Custom CDN base URL — must match backend CDN_BASE_URL (e.g. https://cdn.example.com/file/bucket)
const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || '';

/**
 * Returns true if the URL points to a B2-backed file that requires a presigned URL to access.
 * Handles both direct backblazeb2.com URLs and custom CDN domains (VITE_CDN_BASE_URL).
 */
export function isB2Url(url: string): boolean {
    if (CDN_BASE && url.startsWith(CDN_BASE)) return true;
    return url.includes('backblazeb2.com');
}

/**
 * Get a short-lived presigned GET URL for streaming/downloading a B2 file.
 * The backend extracts the key from the public URL and signs it (4h expiry).
 */
export async function getB2SignedUrl(url: string, token: string): Promise<string> {
    const res = await fetch(`${API_URL}/upload/signed-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Không thể tạo URL tải xuống');
    }
    return data.data.signedUrl;
}

export interface B2UploadResult {
    url: string;
    key: string;
}

// ─── Multipart upload (for files ≥ 20 MB) ───────────────────────────────────
// Uploads up to MAX_CONCURRENT_PARTS chunks in parallel → much faster on large videos.

const MULTIPART_THRESHOLD = 20 * 1024 * 1024; // 20 MB
const PART_SIZE = 10 * 1024 * 1024;            // 10 MB per part (B2 min is 5 MB)
const MAX_CONCURRENT_PARTS = 4;

async function uploadToB2Multipart(
    file: File,
    folder: string,
    token: string,
    onProgress?: (progress: number) => void
): Promise<B2UploadResult> {
    const numParts = Math.ceil(file.size / PART_SIZE);

    // 1. Initialise multipart upload on backend
    const initRes = await fetch(`${API_URL}/upload/multipart-init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            folder,
            numParts,
        }),
    });
    const initData = await initRes.json();
    if (!initRes.ok || !initData.success) throw new Error(initData.message || 'Multipart init failed');
    const { uploadId, key, partUrls, publicUrl } = initData.data;

    // 2. Upload parts in parallel with concurrency limit
    const partProgress = new Array(numParts).fill(0);
    const completedParts: { PartNumber: number; ETag: string }[] = [];

    const uploadPart = (partIndex: number): Promise<void> =>
        new Promise((resolve, reject) => {
            const start = partIndex * PART_SIZE;
            const chunk = file.slice(start, Math.min(start + PART_SIZE, file.size));
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    partProgress[partIndex] = e.loaded / e.total;
                    if (onProgress) {
                        const overall = partProgress.reduce((s, p) => s + p, 0) / numParts;
                        onProgress(Math.round(overall * 100));
                    }
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    // ETag includes quotes — pass as-is to CompleteMultipartUpload
                    const etag = xhr.getResponseHeader('ETag') || '';
                    completedParts.push({ PartNumber: partIndex + 1, ETag: etag });
                    partProgress[partIndex] = 1;
                    if (onProgress) {
                        const overall = partProgress.reduce((s, p) => s + p, 0) / numParts;
                        onProgress(Math.round(overall * 100));
                    }
                    resolve();
                } else {
                    reject(new Error(`Part ${partIndex + 1} failed (HTTP ${xhr.status})`));
                }
            };
            xhr.onerror = () => reject(new Error('Network error on part upload'));
            xhr.open('PUT', partUrls[partIndex]);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(chunk);
        });

    // Concurrency pool
    const queue = Array.from({ length: numParts }, (_, i) => i);
    await Promise.all(
        Array.from({ length: Math.min(MAX_CONCURRENT_PARTS, numParts) }, async () => {
            while (queue.length > 0) {
                const i = queue.shift()!;
                await uploadPart(i);
            }
        })
    );

    // 3. Complete multipart upload
    completedParts.sort((a, b) => a.PartNumber - b.PartNumber);
    const completeRes = await fetch(`${API_URL}/upload/multipart-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, uploadId, parts: completedParts }),
    });
    const completeData = await completeRes.json();
    if (!completeRes.ok || !completeData.success) throw new Error(completeData.message || 'Multipart complete failed');

    return { url: publicUrl, key };
}

// ─── Single PUT upload (for files < 20 MB) ───────────────────────────────────

/**
 * Upload a file directly to Backblaze B2.
 * Automatically uses multipart parallel upload for files ≥ 20 MB,
 * and a single PUT for smaller files.
 *
 * @param file - File to upload
 * @param folder - Destination folder in the bucket (e.g. 'courses/videos')
 * @param token - JWT auth token
 * @param onProgress - Optional progress callback (0–100)
 */
export async function uploadToB2(
    file: File,
    folder: string,
    token: string,
    onProgress?: (progress: number) => void
): Promise<B2UploadResult> {
    if (file.size >= MULTIPART_THRESHOLD) {
        return uploadToB2Multipart(file, folder, token, onProgress);
    }

    // Step 1: Get presigned URL from backend
    const presignRes = await fetch(`${API_URL}/upload/presign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            filename: file.name,
            contentType: file.type || 'application/octet-stream',
            folder,
        }),
    });

    const presignData = await presignRes.json();

    if (!presignRes.ok || !presignData.success) {
        throw new Error(presignData.message || 'Không thể tạo URL upload');
    }

    const { presignedUrl, publicUrl, fileKey } = presignData.data;

    // Step 2: Upload file directly to B2 using XHR for progress tracking
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = Math.round((event.loaded / event.total) * 100);
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Upload thất bại (HTTP ${xhr.status})`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Upload thất bại - lỗi mạng'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
    });

    return { url: publicUrl, key: fileKey };
}
