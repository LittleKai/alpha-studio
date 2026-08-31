import { useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/context';

/**
 * Render HTML của TinyMCE trong thư viện sự kiện và **đóng khung mọi khối
 * `<pre>`** — khung có padding, tự xuống dòng khi câu dài, kèm nút Sao chép.
 *
 * Nút phải dựng bằng DOM API: nội dung đến từ chuỗi HTML qua
 * `dangerouslySetInnerHTML` nên không có chỗ đặt component React bên trong.
 * React không đụng vào con của node `dangerouslySetInnerHTML`, nên phần chèn
 * thêm ở đây an toàn; khi `html` đổi, React ghi lại innerHTML và effect chạy lại.
 */
export default function RichHtml({ html, className = '' }: { html: string; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const copyLabel = t('eventLibrary.detail.copyPrompt');
    const copiedLabel = t('eventLibrary.detail.copied');

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        const timers: number[] = [];

        root.querySelectorAll('pre').forEach(pre => {
            if (pre.dataset.framed) return;
            pre.dataset.framed = '1';

            // Lấy chữ TRƯỚC khi chèn nút, nếu không nhãn nút lọt vào nội dung chép
            const text = (pre.querySelector('code') ?? pre).textContent ?? '';

            const frame = document.createElement('div');
            frame.className = 'rich-html-pre';
            pre.replaceWith(frame);
            frame.appendChild(pre);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'rich-html-copy';
            button.textContent = copyLabel;
            button.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(text);
                } catch {
                    return; // Trình duyệt chặn clipboard — im lặng, không đổi nhãn
                }
                button.textContent = copiedLabel;
                button.classList.add('is-copied');
                timers.push(window.setTimeout(() => {
                    button.textContent = copyLabel;
                    button.classList.remove('is-copied');
                }, 1600));
            });
            frame.appendChild(button);
        });

        return () => timers.forEach(id => clearTimeout(id));
    }, [html, copyLabel, copiedLabel]);

    return (
        <div
            ref={ref}
            className={`tinymce-content ${className}`.trim()}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
