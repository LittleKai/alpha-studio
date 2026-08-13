// Ảnh tĩnh của Event Creative City và landing page được host trên Cloudinary thay vì
// nằm trong `public/` — nguồn PNG 1536×1024 nặng ~2MB/ảnh, qua f_auto,q_auto còn ~200KB.
// Cloud name là giá trị công khai (đã xuất hiện trong bundle), không phải secret.

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzchj4ysj';

/**
 * Dựng URL ảnh đã upload sẵn lên Cloudinary.
 * @param publicId Đường dẫn không có phần mở rộng, ví dụ `event-creative-city/01-event-gate`.
 */
export const cdnImage = (publicId: string, transform = 'f_auto,q_auto'): string =>
    `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`;
