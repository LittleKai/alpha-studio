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

/**
 * Upload a file directly to Backblaze B2 via presigned URL.
 * 1. Requests a presigned PUT URL from the backend.
 * 2. Uploads the file directly to B2 (browser → B2, no backend proxy).
 * 3. Returns the public URL and file key.
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
    // Step 1: Get presigned URL from backend
    const presignRes = await fetch(`${API_URL}/upload/presign`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            filename: file.name,
            contentType: file.type,
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
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
    });

    return { url: publicUrl, key: fileKey };
}
