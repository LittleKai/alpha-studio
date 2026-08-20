// Ảnh tĩnh của Event Creative City và landing page được host trên Cloudinary thay vì
// nằm trong `public/`. Cloud name là giá trị công khai (đã xuất hiện trong bundle),
// không phải secret.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzchj4ysj';

export type AssetQuality = 'standard' | 'high';

/**
 * Chất lượng asset đặt theo từng nơi dùng, không phải một công tắc toàn cục.
 *
 * | | ảnh | video |
 * |---|---|---|
 * | `standard` | nguồn 1536×1024, `f_auto,q_auto` (~199KB full-screen) | file local trong `public/`, 1440×810 CRF 31 (~2.2MB/clip) |
 * | `high` | master 1920×1080 prefix `hq/`, `f_auto,q_auto:best` (~318KB) | Cloudinary `hq/…/vid/`, 1920×1080 CRF 23 (~10.5MB/clip) |
 */

let dynamicLandingQuality: AssetQuality = 'high';

export const setLandingQuality = (quality: AssetQuality) => {
    dynamicLandingQuality = quality;
};

export const getLandingQuality = (): AssetQuality => dynamicLandingQuality;

/** Landing page — chất lượng mặc định. */
export const LANDING_QUALITY: AssetQuality = 'high';

/** `/event-creative-city` là trang xem thử: bản nhẹ, không đốt bandwidth Cloudinary. */
export const PREVIEW_QUALITY: AssetQuality = 'standard';

/**
 * Danh sách chính xác các public_id đang có bản `hq/` 1920×1080 trên Cloudinary —
 * đúng 10 scene mà landing page chạm tới (hero still + 4 ô bento mỗi theme).
 * Scene nào không nằm ở đây sẽ đọc nguồn standard; thêm bừa vào là URL `hq/` trả 404.
 * Muốn dùng thêm scene ở chất lượng cao thì upload master từ
 * `deliverables/event-creative-city-video-prompts/images/` rồi bổ sung vào đây.
 */
const HQ_MASTERS = new Set([
    'event-creative-city/01-event-gate',
    'event-creative-city/03-concept-district',
    'event-creative-city/04-storyboard-avenue',
    'event-creative-city/05-production-workshop',
    'event-creative-city/07-showtime-plaza',
    'event-creative-city/concepts/living-storyboard/01-creative-desk',
    'event-creative-city/concepts/living-storyboard/02-moodboard-awakens',
    'event-creative-city/concepts/living-storyboard/03-storyboard-rises',
    'event-creative-city/concepts/living-storyboard/05-production-layers',
    'event-creative-city/concepts/living-storyboard/07-story-becomes-show',
]);

const hasHqMaster = (publicId: string) => HQ_MASTERS.has(publicId);

interface CdnImageOptions {
    /** Transform kích thước phụ, ví dụ `w_880`. */
    sizing?: string;
    /** Mặc định `LANDING_QUALITY`. */
    quality?: AssetQuality;
}

/**
 * Dựng URL ảnh đã upload sẵn lên Cloudinary.
 * @param publicId Đường dẫn không có phần mở rộng, ví dụ `event-creative-city/01-event-gate`.
 *                 Luôn truyền public_id của bản standard — hàm tự thêm prefix `hq/` khi cần.
 */
export const cdnImage = (publicId: string, options: CdnImageOptions = {}): string => {
    const { sizing, quality = dynamicLandingQuality } = options;
    const isHigh = quality === 'high';
    const qualityTransform = isHigh ? 'f_auto,q_auto:best' : 'f_auto,q_auto';
    const resolvedId = isHigh && hasHqMaster(publicId) ? `hq/${publicId}` : publicId;
    const transform = sizing ? `${qualityTransform},${sizing}` : qualityTransform;

    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${resolvedId}`;
};

export type VideoSetName = 'neon' | 'living-storyboard';

/**
 * Đường dẫn gốc của một bộ clip — caller tự nối `/L{0..6}.mp4`.
 *
 * ⚠️ `high` phát video thẳng từ Cloudinary nên mỗi lượt xem hết vòng lặp kéo
 * ~82MB (neon) / ~65MB (living-storyboard) khỏi quota bandwidth.
 */
export const videoBasePath = (set: VideoSetName, quality: AssetQuality = dynamicLandingQuality): string => (
    quality === 'high'
        ? `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/hq/event-creative-city/vid/${set}`
        : `/event-creative-city/vid/${set}`
);
