import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '../../i18n/context';

/** Một khối `<pre>` trong chuỗi HTML, tách ra để render riêng. */
const PRE_BLOCK = /<pre\b[^>]*>[\s\S]*?<\/pre>/gi;

interface Part {
    isPrompt: boolean;
    html: string;
}

/**
 * Cắt chuỗi HTML thành các mảnh xen kẽ: phần thường và phần `<pre>`.
 * Giữ nguyên thứ tự và không mất ký tự nào.
 */
function splitPromptBlocks(html: string): Part[] {
    const parts: Part[] = [];
    let cursor = 0;
    for (const match of html.matchAll(PRE_BLOCK)) {
        const start = match.index ?? 0;
        if (start > cursor) parts.push({ isPrompt: false, html: html.slice(cursor, start) });
        parts.push({ isPrompt: true, html: match[0] });
        cursor = start + match[0].length;
    }
    if (cursor < html.length) parts.push({ isPrompt: false, html: html.slice(cursor) });
    return parts;
}

/** Ô prompt: khung + nút Sao chép. Chép đúng chữ đang hiển thị trong `<pre>`. */
function PromptBlock({ html }: { html: string }) {
    const { t } = useTranslation();
    const boxRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | undefined>(undefined);
    const [copied, setCopied] = useState(false);

    useEffect(() => () => window.clearTimeout(timerRef.current), []);

    const copy = async () => {
        const pre = boxRef.current?.querySelector('pre');
        const text = (pre?.querySelector('code') ?? pre)?.textContent ?? '';
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return; // Trình duyệt chặn clipboard — im lặng, không đổi nhãn
        }
        setCopied(true);
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    };

    const label = copied ? t('eventLibrary.detail.copied') : t('eventLibrary.detail.copyPrompt');

    return (
        <div className="rich-html-pre" ref={boxRef}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            <button
                type="button"
                onClick={copy}
                className={`rich-html-copy${copied ? ' is-copied' : ''}`}
                title={label}
                aria-label={label}
            >
                {copied ? (
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-300 animate-in fade-in zoom-in duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                )}
            </button>
        </div>
    );
}

/**
 * Render HTML của TinyMCE trong thư viện sự kiện, **đóng khung mọi khối `<pre>`**
 * kèm nút Sao chép.
 *
 * Khung được dựng bằng React chứ không phải sửa DOM sau khi render: bản trước
 * chèn nút bằng DOM API vào bên trong node `dangerouslySetInnerHTML`, mỗi lần
 * React ghi lại innerHTML là khung và nút biến mất — trang khi có khung khi không.
 */
export default function RichHtml({ html, className = '' }: { html: string; className?: string }) {
    const parts = useMemo(() => splitPromptBlocks(html), [html]);

    return (
        <div className={`tinymce-content ${className}`.trim()}>
            {parts.map((part, idx) => (part.isPrompt
                ? <PromptBlock key={idx} html={part.html} />
                : <div key={idx} dangerouslySetInnerHTML={{ __html: part.html }} />
            ))}
        </div>
    );
}
