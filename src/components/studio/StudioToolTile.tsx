import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';

/**
 * Tile nhận diện của một công cụ Studio — dùng chung cho `/studio` (StudioHub)
 * và khối "Hệ sinh thái công cụ" trên landing page.
 *
 * - `variant="detailed"` (mặc định, dùng ở `/studio`): tile lớn theo lưới
 *   zig-zag 5 cột, có danh sách 3 tính năng.
 * - `variant="compact"` (landing page): tile gọn 4 cột đều nhau, mô tả kẹp
 *   2 dòng, không có danh sách tính năng.
 *
 * Cả hai biến thể đều có chân tile: nền tảng/trạng thái bên trái, nút mở bên phải.
 */

export type StudioToolKey = 'eventLibrary' | 'skills' | 'crm' | 'vocab' | 'vietyaku' | 'ledStudio';

/** Bộ màu nhận diện riêng của từng tool — làm các tile phân biệt rõ nhau. */
export interface ToolAccent {
    /** Màu chữ accent (CTA, icon) theo theme — không dùng `dark:` vì Tailwind CDN
     *  mặc định theo OS preference, không theo toggle data-theme của app. */
    textLight: string;
    textDark: string;
    /** Nền + viền cho logo chip */
    chip: string;
    /** Viền tile khi hover */
    hoverBorder: string;
    /** Đốm glow mờ ở góc tile + vạch accent trên đỉnh tile */
    glow: string;
    /** Kênh RGB thô của màu accent — cho spotlight bám con trỏ (biến thể detailed),
     *  vì `radial-gradient` cần giá trị màu thật chứ không dùng được class Tailwind. */
    rgb: string;
}

export interface StudioTool {
    key: StudioToolKey;
    index: string;
    to: string;
    /** Số cột tile chiếm trong lưới zig-zag 5 cột của `/studio` */
    span: string;
    /** Tile mở đầu mỗi hàng — chữ lớn hơn ở biến thể detailed */
    featured?: boolean;
    logo: ReactNode;
    /** Họa tiết kỹ thuật riêng của từng công cụ ở góc phải trên (biến thể detailed) */
    motif: ReactNode;
    accent: ToolAccent;
}

export const STUDIO_TOOLS: StudioTool[] = [
    {
        key: 'eventLibrary',
        index: '01',
        to: '/studio/event-library',
        span: 'sm:col-span-3',
        featured: true,
        logo: <img src="/event-library-logo.png" alt="" className="w-full h-full object-contain rounded-lg" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="10" y="14" width="76" height="68" rx="8" strokeOpacity="0.45" />
                <line x1="10" y1="30" x2="86" y2="30" strokeOpacity="0.35" />
                <line x1="36" y1="30" x2="36" y2="82" strokeOpacity="0.35" />
                <path d="M44 66 L54 52 L64 58 L76 40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="76" cy="40" r="3" fill="currentColor" />
                <rect x="17" y="38" width="12" height="8" rx="2" strokeOpacity="0.5" />
                <rect x="17" y="52" width="12" height="8" rx="2" strokeOpacity="0.5" />
                <rect x="17" y="66" width="12" height="8" rx="2" strokeOpacity="0.5" />
            </svg>
        ),
        accent: {
            textLight: 'text-violet-700',
            textDark: 'text-violet-400',
            chip: 'bg-violet-500/10 border-violet-500/25',
            hoverBorder: 'hover:border-violet-500/60',
            glow: 'bg-violet-500',
            rgb: '124 92 255',
        },
    },
    {
        key: 'skills',
        index: '02',
        to: '/studio/ai-skills',
        span: 'sm:col-span-2',
        logo: <img src="/skills-logo.png" alt="" className="w-full h-full object-contain rounded-lg" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="14" y="18" width="24" height="24" rx="6" />
                <rect x="58" y="18" width="24" height="24" rx="6" strokeOpacity="0.5" />
                <rect x="36" y="56" width="24" height="24" rx="6" />
                <path d="M38 30 H58 M26 42 L42 56 M70 42 L54 56" strokeOpacity="0.5" strokeLinecap="round" />
                <path d="M22 27 L26 30 L22 33 M28 33 H32" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        accent: {
            textLight: 'text-cyan-700',
            textDark: 'text-cyan-400',
            chip: 'bg-cyan-500/10 border-cyan-500/25',
            hoverBorder: 'hover:border-cyan-500/60',
            glow: 'bg-cyan-500',
            rgb: '6 182 212',
        },
    },
    {
        key: 'ledStudio',
        index: '03',
        to: '/studio/led-studio',
        span: 'sm:col-span-3',
        featured: true,
        logo: <img src="/led-studio-logo.png" alt="" className="w-full h-full object-contain rounded-lg" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <polygon points="16,22 80,14 80,62 16,54" strokeWidth="1.8" />
                <line x1="36" y1="19.5" x2="36" y2="56.5" strokeOpacity="0.4" />
                <line x1="58" y1="16.8" x2="58" y2="59.2" strokeOpacity="0.4" />
                <line x1="16" y1="38" x2="80" y2="38" strokeOpacity="0.4" />
                <path d="M24 14 L8 82 M24 14 L42 82 M68 10 L52 82 M68 10 L88 82" strokeOpacity="0.35" strokeDasharray="3 3" />
            </svg>
        ),
        accent: {
            textLight: 'text-sky-700',
            textDark: 'text-cyan-300',
            chip: 'bg-cyan-500/10 border-cyan-500/25',
            hoverBorder: 'hover:border-cyan-400/60',
            glow: 'bg-cyan-400',
            rgb: '97 232 255',
        },
    },
    {
        key: 'crm',
        index: '04',
        to: '/studio/crm',
        span: 'sm:col-span-2',
        logo: <img src="/crm-logo.png" alt="" className="w-full h-full object-contain" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <path d="M14 20 H82 L62 48 V74 L34 66 V48 L14 20 Z" strokeLinejoin="round" />
                <line x1="22" y1="32" x2="74" y2="32" strokeOpacity="0.4" />
                <line x1="31" y1="44" x2="65" y2="44" strokeOpacity="0.4" />
                <circle cx="74" cy="64" r="10" strokeOpacity="0.6" />
                <path d="M70 64 L73 67 L79 61" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        accent: {
            textLight: 'text-blue-700',
            textDark: 'text-blue-400',
            chip: 'bg-blue-500/10 border-blue-500/25',
            hoverBorder: 'hover:border-blue-500/60',
            glow: 'bg-blue-500',
            rgb: '59 130 246',
        },
    },
    {
        key: 'vocab',
        index: '05',
        to: '/studio/vocab',
        span: 'sm:col-span-2',
        logo: <img src="/vocab/icons/Icon-192.png" alt="" className="w-full h-full object-contain rounded" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="26" y="14" width="52" height="38" rx="6" strokeOpacity="0.4" />
                <rect x="18" y="24" width="52" height="38" rx="6" />
                <line x1="28" y1="38" x2="54" y2="38" strokeLinecap="round" />
                <line x1="28" y1="48" x2="44" y2="48" strokeOpacity="0.5" strokeLinecap="round" />
                <path d="M16 78 Q38 78 52 68 T82 54" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
        ),
        accent: {
            textLight: 'text-emerald-700',
            textDark: 'text-emerald-400',
            chip: 'bg-emerald-500/10 border-emerald-500/25',
            hoverBorder: 'hover:border-emerald-500/60',
            glow: 'bg-emerald-500',
            rgb: '16 185 129',
        },
    },
    {
        key: 'vietyaku',
        index: '06',
        to: '/studio/vietyaku',
        span: 'sm:col-span-3',
        featured: true,
        logo: <img src="/vietyaku-logo.png" alt="" className="w-full h-full object-contain rounded" />,
        motif: (
            <svg aria-hidden="true" data-kind="diagram" viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full">
                <rect x="12" y="18" width="30" height="60" rx="6" />
                <rect x="54" y="18" width="30" height="60" rx="6" strokeOpacity="0.55" />
                <path d="M42 38 H54 M42 58 H54" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="20" y1="32" x2="34" y2="32" strokeLinecap="round" />
                <line x1="20" y1="44" x2="34" y2="44" strokeOpacity="0.5" strokeLinecap="round" />
                <line x1="62" y1="32" x2="76" y2="32" strokeLinecap="round" />
                <line x1="62" y1="44" x2="76" y2="44" strokeOpacity="0.5" strokeLinecap="round" />
            </svg>
        ),
        accent: {
            textLight: 'text-rose-700',
            textDark: 'text-rose-400',
            chip: 'bg-rose-500/10 border-rose-500/25',
            hoverBorder: 'hover:border-rose-500/60',
            glow: 'bg-rose-500',
            rgb: '244 63 94',
        },
    },
];

// Kẹp mô tả ở 2 dòng cho biến thể compact — không dựa vào `line-clamp-*` của
// Tailwind CDN
const CLAMP_2: React.CSSProperties = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
};

const IconCheck = ({ className }: { className: string }) => (
    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
);

interface Props {
    tool: StudioTool;
    variant?: 'detailed' | 'compact';
}

export default function StudioToolTile({ tool, variant = 'detailed' }: Props) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const accentText = theme === 'dark' ? tool.accent.textDark : tool.accent.textLight;
    const compact = variant === 'compact';
    const big = !compact && tool.featured;
    const cardRef = useRef<HTMLAnchorElement>(null);

    // Spotlight bám con trỏ — ghi toạ độ vào CSS var thay vì setState để không
    // render lại tile mỗi lần chuột nhích. Chỉ chạy ở biến thể detailed.
    const trackPointer = useCallback((e: MouseEvent<HTMLAnchorElement>) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
        el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
    }, []);

    return (
        <Link
            ref={cardRef}
            to={tool.to}
            onMouseMove={compact ? undefined : trackPointer}
            className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] transition-[transform,border-color,box-shadow] duration-300 ${tool.accent.hoverBorder} hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${compact ? 'p-5' : 'p-6 md:p-7 min-h-[260px] hover:shadow-[var(--glass-shadow)]'}`}
        >
            {/* Vạch accent định danh trên đỉnh tile — hiện sẵn 1/3 và bung toàn chiều ngang khi hover */}
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-[0.28] opacity-80 group-hover:scale-x-100 group-hover:opacity-100 transition-[transform,opacity] duration-500 ${tool.accent.glow}`}
            />
            {/* Đốm glow màu nhận diện của tool */}
            <span
                aria-hidden="true"
                className={`absolute rounded-full blur-3xl opacity-[0.14] group-hover:opacity-[0.24] transition-opacity duration-500 pointer-events-none ${tool.accent.glow} ${compact ? '-top-16 -right-16 w-40 h-40' : '-top-20 -right-20 w-56 h-56'}`}
            />

            {!compact && (
                <>
                    {/* Họa tiết kỹ thuật riêng của từng công cụ */}
                    <span
                        aria-hidden="true"
                        className={`absolute right-5 top-14 w-24 h-24 pointer-events-none opacity-[0.09] group-hover:opacity-[0.2] transition-opacity duration-500 ${accentText}`}
                    >
                        {tool.motif}
                    </span>
                    {/* Spotlight màu accent bám theo con trỏ */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: `radial-gradient(340px circle at var(--spot-x, 50%) var(--spot-y, 0px), rgb(${tool.accent.rgb} / 0.16), transparent 68%)`,
                        }}
                    />
                    {/* Vệt sáng quét chéo một lần mỗi khi rê chuột vào — dùng màu
                        accent thay vì trắng để nhìn thấy được ở cả hai theme */}
                    <span
                        aria-hidden="true"
                        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 -translate-x-full group-hover:translate-x-[420%] duration-0 group-hover:duration-[900ms] transition-transform ease-out pointer-events-none motion-reduce:hidden"
                        style={{
                            background: `linear-gradient(to right, transparent, rgb(${tool.accent.rgb} / 0.14), transparent)`,
                        }}
                    />
                </>
            )}

            <div className={`relative flex items-center ${compact ? 'gap-2.5' : 'justify-between gap-3'}`}>
                <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-xl border ${tool.accent.chip} ${accentText} ${compact ? 'w-9 h-9 p-1.5' : 'w-12 h-12 p-1.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transform-none'}`}>
                    {tool.logo}
                </span>
                {compact && (
                    <h3 className="flex-1 min-w-0 text-base font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
                        {t(`studio.hub.cards.${tool.key}.title`)}
                    </h3>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {!compact && (
                        <span className="text-xs font-extrabold tabular-nums text-[var(--text-secondary)] select-none">
                            {tool.index}
                        </span>
                    )}
                    <span className={`text-xs font-semibold border ${tool.accent.chip} ${accentText} rounded-md leading-none select-none ${compact ? 'px-2 py-1' : 'px-2.5 py-1'}`}>
                        {t(`studio.hub.badges.${tool.key}`)}
                    </span>
                </div>
            </div>

            {compact ? (
                <p className="relative mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]" style={CLAMP_2}>
                    {t(`studio.hub.cards.${tool.key}.desc`)}
                </p>
            ) : (
                <>
                    <div className="relative mt-4 space-y-1.5">
                        <h3 className={`font-extrabold tracking-tight leading-tight text-[var(--text-primary)] text-balance ${big ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                            {t(`studio.hub.cards.${tool.key}.title`)}
                        </h3>
                        <p className={`text-sm leading-relaxed text-[var(--text-secondary)] ${big ? 'max-w-[52ch]' : ''}`}>
                            {t(`studio.hub.cards.${tool.key}.desc`)}
                        </p>
                    </div>

                    {/* Điểm nhấn định danh (Signature Highlight) của từng công cụ */}
                    <div className="relative mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-[var(--border-primary)] py-3">
                        <span className={`text-base md:text-lg font-extrabold tracking-tight tabular-nums ${accentText}`}>
                            {t(`studio.hub.highlights.${tool.key}.value`)}
                        </span>
                        <span className="text-xs font-semibold leading-snug text-[var(--text-primary)]">
                            {t(`studio.hub.highlights.${tool.key}.label`)}
                        </span>
                    </div>

                    {/* 3 tính năng cụ thể của tool */}
                    <ul className="relative mt-4 space-y-1.5">
                        {(['f1', 'f2', 'f3'] as const).map((fk) => (
                            <li key={fk} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                                <IconCheck className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accentText}`} />
                                {t(`studio.hub.features.${tool.key}.${fk}`)}
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* Chân tile: nền tảng / trạng thái bên trái, nút mở bên phải */}
            <div className={`relative mt-auto flex items-center justify-between gap-3 ${compact ? 'pt-4' : 'pt-5 mt-6 border-t border-[var(--border-primary)]'}`}>
                <span className="min-w-0 text-xs font-semibold leading-snug text-[var(--text-secondary)]">
                    {t(`studio.hub.meta.${tool.key}`)}
                </span>
                <span className={`inline-flex items-center gap-1.5 flex-shrink-0 text-xs font-extrabold ${accentText} ${compact ? '' : `rounded-lg border px-3 py-1.5 ${tool.accent.chip}`}`}>
                    {t('studio.hub.open')}
                    <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </span>
            </div>
        </Link>
    );
}
