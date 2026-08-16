// Backend chạy trên Fly.io với min_machines_running = 0, nên request đầu tiên
// sau khi máy idle phải chờ cold start (Node boot + Mongo connect). Trong lúc đó
// Fly có thể trả 502/503 kèm body HTML, hoặc kết nối bị treo tới timeout.
// Helper này retry các lỗi tạm thời đó thay vì đẩy thẳng UI vào trạng thái lỗi.

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export interface RetryOptions {
    /** Số lần thử lại sau lần đầu (mặc định 3 → tối đa 4 request) */
    retries?: number;
    /** Timeout cho mỗi lần thử, ms (mặc định 12000) */
    timeoutMs?: number;
    /** Độ trễ gốc giữa các lần thử, ms — nhân đôi sau mỗi lần (mặc định 600) */
    backoffMs?: number;
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * fetch() với timeout mỗi lần thử + exponential backoff cho lỗi tạm thời
 * (mất mạng, timeout, 5xx, 408/425/429). Lỗi 4xx khác trả về nguyên response
 * để caller tự xử lý — không retry vì thử lại cũng vô ích.
 */
export const fetchWithRetry = async (
    url: string,
    init: RequestInit = {},
    options: RetryOptions = {}
): Promise<Response> => {
    const { retries = 3, timeoutMs = 12000, backoffMs = 600 } = options;

    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const abortOuter = () => controller.abort();
        init.signal?.addEventListener('abort', abortOuter);
        const timer = setTimeout(abortOuter, timeoutMs);

        try {
            const response = await fetch(url, { ...init, signal: controller.signal });

            if (RETRYABLE_STATUS.has(response.status) && attempt < retries) {
                await delay(backoffMs * 2 ** attempt);
                continue;
            }

            return response;
        } catch (error) {
            // Caller chủ động huỷ → không retry
            if (init.signal?.aborted) throw error;

            lastError = error;
            if (attempt < retries) {
                await delay(backoffMs * 2 ** attempt);
                continue;
            }
        } finally {
            clearTimeout(timer);
            init.signal?.removeEventListener('abort', abortOuter);
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error('Network request failed');
};

/**
 * Đọc message lỗi từ response mà không crash khi body không phải JSON
 * (Fly.io trả HTML khi máy đang khởi động).
 */
export const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
    try {
        const body = await response.json();
        if (body && typeof body.message === 'string' && body.message) return body.message;
    } catch {
        // Body rỗng hoặc không phải JSON — dùng fallback bên dưới
    }
    return `${fallback} (${response.status})`;
};
