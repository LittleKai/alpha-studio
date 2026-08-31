import type { Editor as TinyMCEEditor } from 'tinymce';
import { uploadImage } from '../../services/cloudinaryService';

/** Nhãn tiếng người cho nút tự thêm — truyền từ component vì file này không gọi `t()` được. */
export interface EditorLabels {
    /** Tooltip nút tạo ô prompt */
    promptBox: string;
    /** Chữ mồi trong ô prompt rỗng */
    promptBoxPlaceholder: string;
}

/**
 * Cấu hình TinyMCE dùng chung cho hai ô soạn thảo của thư viện sự kiện
 * (nội dung tự do trong `LibraryItemForm` và khối `richText` trong
 * `SectionEditor`). Tách ra để hai chỗ không lệch nhau khi chỉnh.
 */
export function libraryEditorInit(theme: 'light' | 'dark', minHeight = 260, labels?: EditorLabels) {
    return {
        // `autoresize` tự cơi nới chiều cao theo nội dung nên không đặt `height`
        min_height: minHeight,
        max_height: 640,
        autoresize_bottom_margin: 24,
        menubar: false,
        plugins: ['lists', 'link', 'autolink', 'image', 'table', 'autoresize'],
        toolbar: 'bold italic underline | bullist numlist | promptbox | table | link image | removeformat',
        // Skin phải khớp nền sáng/tối của trang, nếu không ô soạn luôn đen
        skin: theme === 'dark' ? 'oxide-dark' : 'oxide',
        content_css: theme === 'dark' ? 'dark' : 'default',
        branding: false,
        statusbar: false,
        // Ảnh co về đúng bề ngang ô soạn (chừa mép), không tràn và không kéo giãn.
        // `pre` được vẽ giống khung prompt ngoài trang chi tiết để soạn thấy đúng kết quả.
        content_style: [
            // Chuỗi dài không ngắt được (URL, token) phải xuống dòng, nếu không
            // iframe soạn thảo trượt ngang và tràn khỏi panel
            'body { font-family: sans-serif; font-size: 15px; overflow-wrap: break-word; }',
            'img { max-width: 96%; height: auto; display: block; margin: 12px auto; border-radius: 8px; }',
            'table { max-width: 100%; }',
            `pre { margin: 12px 0; padding: 12px 14px; background: ${theme === 'dark' ? 'rgba(255,255,255,.05)' : 'rgba(124,92,255,.07)'};`,
            '  border: 1px solid rgba(124,92,255,.3); border-left: 3px solid #7c5cff; border-radius: 10px;',
            '  font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 14px; line-height: 1.6;',
            '  white-space: pre-wrap; overflow-wrap: anywhere; }',
            // `content_css` của TinyMCE tô nền riêng cho `code` — để nguyên thì mỗi
            // dòng prompt bị bôi một vệt xám thay vì cả khối là một ô
            'pre code { display: block; font: inherit; background: none; padding: 0; white-space: inherit; }'
        ].join(' '),

        /**
         * Nút **Ô prompt**: bọc đoạn đang chọn vào `<pre><code>` — đúng thứ mà
         * `RichHtml` bắt để vẽ khung kèm nút Sao chép ngoài trang chi tiết.
         * Đứng trong một ô prompt rồi bấm lại thì gỡ khung, trả về đoạn văn thường.
         */
        setup: (editor: TinyMCEEditor) => {
            editor.ui.registry.addButton('promptbox', {
                // Dùng chữ thay icon: nút này không có icon sẵn nào diễn đạt đúng
                text: 'Prompt',
                tooltip: labels?.promptBox ?? 'Prompt box',
                onAction: () => {
                    const pre = editor.dom.getParent(editor.selection.getNode(), 'pre');
                    if (pre) {
                        // Gỡ khung: giữ nguyên chữ, mỗi dòng thành một đoạn
                        const paragraphs = (pre.textContent ?? '')
                            .split('\n')
                            .map(line => `<p>${editor.dom.encode(line) || '<br>'}</p>`)
                            .join('');
                        pre.outerHTML = paragraphs;
                        // `outerHTML` đổi DOM thẳng nên phải ép TinyMCE phát sự kiện thay đổi
                        editor.setContent(editor.getContent());
                        return;
                    }
                    const selected = editor.selection.getContent({ format: 'text' });
                    const body = editor.dom.encode(selected || labels?.promptBoxPlaceholder || '');
                    editor.insertContent(`<pre><code>${body}</code></pre>`);
                }
            });
        },

        // Ảnh chèn trong bài đi Cloudinary như mọi ảnh nhỏ khác
        images_upload_handler: async (blobInfo: { blob: () => Blob; filename: () => string }) => {
            const blob = blobInfo.blob();
            const file = new File([blob], blobInfo.filename() || 'image.png', { type: blob.type });
            const { url } = await uploadImage(file, 'content');
            return url;
        }
    };
}
