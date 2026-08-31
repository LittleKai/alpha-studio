/**
 * Nhiều tài khoản Cloudinary, chia tải bằng cách bốc ngẫu nhiên — cùng quy ước
 * với VocabFlip (`tools/vocabflip/lib/core/constants/cloudinary_config.dart`):
 *
 * ```
 * VITE_CLOUDINARY_CLOUD_NAMES=cloud_a,cloud_b,cloud_c
 * VITE_CLOUDINARY_UPLOAD_PRESETS=preset_a,preset_b      # thiếu thì dùng lại preset cuối
 * ```
 *
 * Hai biến số ít cũ (`VITE_CLOUDINARY_CLOUD_NAME` / `VITE_CLOUDINARY_UPLOAD_PRESET`)
 * vẫn dùng được và được ghép vào **đầu** danh sách, nên môi trường chưa khai báo
 * biến mới chạy y như trước.
 *
 * ⚠️ Chỉ **upload** mới xoay vòng. Ảnh đã lưu mang URL đầy đủ nên vẫn được phục
 * vụ từ đúng tài khoản chứa nó; asset tĩnh tham chiếu theo `public_id` (Event
 * Creative City, landing) luôn đọc từ tài khoản **đầu tiên** — xem `PRIMARY_CLOUD_NAME`.
 *
 * Mọi giá trị ở đây là công khai (đã nằm trong bundle): cloud name và unsigned
 * upload preset. Tuyệt đối không đặt API secret sau prefix `VITE_`.
 */

export interface CloudinaryAccount {
    cloudName: string;
    uploadPreset: string;
}

const splitList = (value: string | undefined): string[] =>
    (value || '').split(',').map(s => s.trim()).filter(Boolean);

function buildAccounts(): CloudinaryAccount[] {
    const names = splitList(import.meta.env.VITE_CLOUDINARY_CLOUD_NAMES);
    const presets = splitList(import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESETS);

    const legacyName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '').trim();
    const legacyPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim() || 'alpha_studio';
    if (legacyName && !names.includes(legacyName)) {
        names.unshift(legacyName);
        presets.unshift(legacyPreset);
    }

    return names.map((cloudName, i) => ({
        cloudName,
        // Ít preset hơn cloud name thì dùng lại preset cuối — giống VocabFlip
        uploadPreset: presets[i] || presets[presets.length - 1] || legacyPreset
    }));
}

export const CLOUDINARY_ACCOUNTS: CloudinaryAccount[] = buildAccounts();

/** Tài khoản gốc — nơi chứa asset tĩnh tham chiếu bằng `public_id`. */
export const PRIMARY_CLOUD_NAME = CLOUDINARY_ACCOUNTS[0]?.cloudName || 'dzchj4ysj';

/** Bốc ngẫu nhiên một tài khoản để chia tải cho một lần upload. */
export function pickAccount(): CloudinaryAccount | undefined {
    if (!CLOUDINARY_ACCOUNTS.length) return undefined;
    return CLOUDINARY_ACCOUNTS[Math.floor(Math.random() * CLOUDINARY_ACCOUNTS.length)];
}

/**
 * Thứ tự thử cho một lần upload: tài khoản bốc được trước, rồi tới các tài khoản
 * còn lại. Nhờ vậy một tài khoản hết hạn mức không làm hỏng cả lượt upload.
 */
export function accountsToTry(): CloudinaryAccount[] {
    if (CLOUDINARY_ACCOUNTS.length <= 1) return [...CLOUDINARY_ACCOUNTS];
    const first = pickAccount();
    return first
        ? [first, ...CLOUDINARY_ACCOUNTS.filter(a => a.cloudName !== first.cloudName)]
        : [...CLOUDINARY_ACCOUNTS];
}
