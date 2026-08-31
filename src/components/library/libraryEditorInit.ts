import { uploadImage } from '../../services/cloudinaryService';

/**
 * Cấu hình TinyMCE dùng chung cho hai ô soạn thảo của thư viện sự kiện
 * (nội dung tự do trong `LibraryItemForm` và khối `richText` trong
 * `SectionEditor`). Tách ra để hai chỗ không lệch nhau khi chỉnh.
 */
export function libraryEditorInit(theme: 'light' | 'dark', minHeight = 260) {
    return {
        // `autoresize` tự cơi nới chiều cao theo nội dung nên không đặt `height`
        min_height: minHeight,
        max_height: 640,
        autoresize_bottom_margin: 24,
        menubar: false,
        plugins: ['lists', 'link', 'autolink', 'image', 'table', 'autoresize'],
        toolbar: 'bold italic underline | bullist numlist | table | link image | removeformat',
        // Skin phải khớp nền sáng/tối của trang, nếu không ô soạn luôn đen
        skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
        content_css: theme === 'dark' ? 'dark' : 'default',
        branding: false,
        statusbar: false,
        // Ảnh co về đúng bề ngang ô soạn (chừa mép), không tràn và không kéo giãn
        content_style: [
            'body { font-family: sans-serif; font-size: 15px; }',
            'img { max-width: 96%; height: auto; display: block; margin: 12px auto; border-radius: 8px; }',
            'table { max-width: 100%; }'
        ].join(' '),
        // Ảnh chèn trong bài đi Cloudinary như mọi ảnh nhỏ khác
        images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
            const blob = blobInfo.blob();
            const file = new File([blob], blobInfo.filename() || 'image.png', { type: blob.type });
            const { url } = await uploadImage(file, 'content');
            return url;
        }
    };
}
