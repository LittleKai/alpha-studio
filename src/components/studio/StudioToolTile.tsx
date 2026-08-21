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

export type StudioToolKey = 'skills' | 'crm' | 'vocab' | 'vietyaku';

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
    to: string;
    /** Số cột tile chiếm trong lưới zig-zag 5 cột của `/studio` */
    span: string;
    /** Tile mở đầu mỗi hàng — chữ lớn hơn ở biến thể detailed */
    featured?: boolean;
    logo: ReactNode;
    accent: ToolAccent;
}

export const STUDIO_TOOLS: StudioTool[] = [
    {
        key: 'skills',
        to: '/studio/skills',
        span: 'sm:col-span-3',
        featured: true,
        logo: <img src="/skills-logo.png" alt="" className="w-full h-full object-contain rounded-lg" />,
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
        key: 'crm',
        to: '/studio/crm/subscription',
        span: 'sm:col-span-2',
        logo: <img src="/crm-logo.png" alt="" className="w-full h-full object-contain" />,
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
        to: '/studio/vocab',
        span: 'sm:col-span-2',
        featured: true,
        logo: <img src="/vocab/icons/Icon-192.png" alt="" className="w-full h-full object-contain rounded" />,
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
        to: '/studio/vietyaku',
        span: 'sm:col-span-3',
        logo: <img src="/vietyaku-logo.png" alt="" className="w-full h-full object-contain rounded" />,
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
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className={className}>
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
            className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] transition-all duration-300 ${tool.accent.hoverBorder} hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] ${compact ? 'p-5' : 'p-6 md:p-7 min-h-[260px] hover:shadow-[0_18px_44px_-16px_rgba(0,0,0,0.35)]'}`}
        >
            {/* Vạch accent chạy dọc đỉnh tile khi hover */}
            <span
                aria-hidden="true"
                className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ${tool.accent.glow}`}
            />
            {/* Đốm glow màu nhận diện của tool */}
            <span
                aria-hidden="true"
                className={`absolute rounded-full blur-3xl opacity-[0.12] group-hover:opacity-[0.22] transition-opacity duration-500 pointer-events-none ${tool.accent.glow} ${compact ? '-top-16 -right-16 w-40 h-40' : '-top-20 -right-20 w-56 h-56'}`}
            />

            {!compact && (
                <>
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

            <div className={`relative flex items-center ${compact ? 'gap-2.5' : 'justify-between'}`}>
                <span className={`inline-flex items-center justify-center flex-shrink-0 rounded-xl border ${tool.accent.chip} ${accentText} ${compact ? 'w-9 h-9 p-2' : 'w-12 h-12 p-2.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transform-none'}`}>
                    {tool.logo}
                </span>
                {compact && (
                    <h3 className="flex-1 min-w-0 text-base font-black tracking-tight leading-tight text-[var(--text-primary)]">
                        {t(`studio.hub.cards.${tool.key}.title`)}
                    </h3>
                )}
                <span className={`flex-shrink-0 text-[9px] font-extrabold bg-amber-500/10 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'} border border-amber-500/20 rounded uppercase tracking-widest leading-none select-none ${compact ? 'px-1.5 py-0.5' : 'px-2 py-1'}`}>
                    Beta
                </span>
            </div>

            {compact ? (
                <p className="relative mt-3 text-[13px] leading-relaxed text-[var(--text-secondary)]" style={CLAMP_2}>
                    {t(`studio.hub.cards.${tool.key}.desc`)}
                </p>
            ) : (
                <>
                    <div className="relative mt-4 space-y-1.5">
                        <h3 className={`font-black tracking-tight leading-tight text-[var(--text-primary)] ${big ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                            {t(`studio.hub.cards.${tool.key}.title`)}
                        </h3>
                        <p className={`text-sm leading-relaxed text-[var(--text-secondary)] ${big ? 'max-w-[52ch]' : ''}`}>
                            {t(`studio.hub.cards.${tool.key}.desc`)}
                        </p>
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
            <div className={`relative mt-auto flex items-end justify-between gap-3 ${compact ? 'pt-4' : 'pt-5 mt-6 border-t border-[var(--border-primary)]'}`}>
                <span className={`min-w-0 font-bold uppercase tracking-[0.12em] leading-snug text-[var(--text-tertiary)] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                    {t(`studio.hub.meta.${tool.key}`)}
                </span>
                <span className={`inline-flex items-center gap-1.5 flex-shrink-0 font-black uppercase tracking-wider ${accentText} ${compact ? 'text-[11px]' : 'text-xs'}`}>
                    {t('studio.hub.open')}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </span>
            </div>
        </Link>
    );
}
