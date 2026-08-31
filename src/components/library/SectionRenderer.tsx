import { Link } from 'react-router-dom';
import type { LibrarySection } from '../../services/eventLibraryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';
import RichHtml from './RichHtml';

/**
 * Bảng màu xoay vòng cho các section, giúp các khối tiêu đề phân biệt rõ ràng và trực quan.
 */
export const SECTION_PALETTES = [
    {
        name: 'violet',
        accent: '#8b5cf6',
        badgeBg: 'bg-violet-500/15 dark:bg-violet-500/25',
        badgeText: 'text-violet-700 dark:text-violet-200',
        badgeBorder: 'border-violet-500/30 dark:border-violet-400/50',
        title: 'text-violet-700 dark:text-violet-300',
        cardBorder: 'hover:border-violet-500/50 dark:hover:border-violet-400/60',
        stepBg: 'bg-violet-500/10 dark:bg-violet-500/20',
        stepBorder: 'border-violet-500/25 dark:border-violet-400/40',
        stepBadge: 'bg-violet-500 text-white',
        stepTitle: 'text-violet-700 dark:text-violet-200',
        tagBg: 'bg-violet-500/10 dark:bg-violet-500/20',
        tagBorder: 'border-violet-500/30 dark:border-violet-400/40',
        tagText: 'text-violet-700 dark:text-violet-200',
        metricValue: 'text-violet-700 dark:text-violet-200',
    },
    {
        name: 'sky',
        accent: '#0ea5e9',
        badgeBg: 'bg-sky-500/15 dark:bg-sky-500/25',
        badgeText: 'text-sky-700 dark:text-sky-200',
        badgeBorder: 'border-sky-500/30 dark:border-sky-400/50',
        title: 'text-sky-700 dark:text-sky-300',
        cardBorder: 'hover:border-sky-500/50 dark:hover:border-sky-400/60',
        stepBg: 'bg-sky-500/10 dark:bg-sky-500/20',
        stepBorder: 'border-sky-500/25 dark:border-sky-400/40',
        stepBadge: 'bg-sky-500 text-white',
        stepTitle: 'text-sky-700 dark:text-sky-200',
        tagBg: 'bg-sky-500/10 dark:bg-sky-500/20',
        tagBorder: 'border-sky-500/30 dark:border-sky-400/40',
        tagText: 'text-sky-700 dark:text-sky-200',
        metricValue: 'text-sky-700 dark:text-sky-200',
    },
    {
        name: 'emerald',
        accent: '#10b981',
        badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
        badgeText: 'text-emerald-700 dark:text-emerald-200',
        badgeBorder: 'border-emerald-500/30 dark:border-emerald-400/50',
        title: 'text-emerald-700 dark:text-emerald-300',
        cardBorder: 'hover:border-emerald-500/50 dark:hover:border-emerald-400/60',
        stepBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        stepBorder: 'border-emerald-500/25 dark:border-emerald-400/40',
        stepBadge: 'bg-emerald-500 text-white',
        stepTitle: 'text-emerald-700 dark:text-emerald-200',
        tagBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        tagBorder: 'border-emerald-500/30 dark:border-emerald-400/40',
        tagText: 'text-emerald-700 dark:text-emerald-200',
        metricValue: 'text-emerald-700 dark:text-emerald-200',
    },
    {
        name: 'amber',
        accent: '#f59e0b',
        badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
        badgeText: 'text-amber-800 dark:text-amber-200',
        badgeBorder: 'border-amber-500/30 dark:border-amber-400/50',
        title: 'text-amber-700 dark:text-amber-300',
        cardBorder: 'hover:border-amber-500/50 dark:hover:border-amber-400/60',
        stepBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        stepBorder: 'border-amber-500/25 dark:border-amber-400/40',
        stepBadge: 'bg-amber-500 text-white',
        stepTitle: 'text-amber-800 dark:text-amber-200',
        tagBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        tagBorder: 'border-amber-500/30 dark:border-amber-400/40',
        tagText: 'text-amber-800 dark:text-amber-200',
        metricValue: 'text-amber-800 dark:text-amber-200',
    },
    {
        name: 'rose',
        accent: '#f43f5e',
        badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
        badgeText: 'text-rose-700 dark:text-rose-200',
        badgeBorder: 'border-rose-500/30 dark:border-rose-400/50',
        title: 'text-rose-700 dark:text-rose-300',
        cardBorder: 'hover:border-rose-500/50 dark:hover:border-rose-400/60',
        stepBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        stepBorder: 'border-rose-500/25 dark:border-rose-400/40',
        stepBadge: 'bg-rose-500 text-white',
        stepTitle: 'text-rose-700 dark:text-rose-200',
        tagBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        tagBorder: 'border-rose-500/30 dark:border-rose-400/40',
        tagText: 'text-rose-700 dark:text-rose-200',
        metricValue: 'text-rose-700 dark:text-rose-200',
    },
    {
        name: 'cyan',
        accent: '#06b6d4',
        badgeBg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
        badgeText: 'text-cyan-700 dark:text-cyan-200',
        badgeBorder: 'border-cyan-500/30 dark:border-cyan-400/50',
        title: 'text-cyan-700 dark:text-cyan-300',
        cardBorder: 'hover:border-cyan-500/50 dark:hover:border-cyan-400/60',
        stepBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        stepBorder: 'border-cyan-500/25 dark:border-cyan-400/40',
        stepBadge: 'bg-cyan-500 text-white',
        stepTitle: 'text-cyan-700 dark:text-cyan-200',
        tagBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
        tagBorder: 'border-cyan-500/30 dark:border-cyan-400/40',
        tagText: 'text-cyan-700 dark:text-cyan-200',
        metricValue: 'text-cyan-700 dark:text-cyan-200',
    },
];

/**
 * Màu xoay vòng cho các nhóm bullet. Ba nhóm quen thuộc của ngành —
 * điểm mạnh / thách thức / khuyến nghị — nhờ đó phân biệt được bằng màu chứ
 * không chỉ bằng tiêu đề.
 */
const GROUP_TONES = [
    { bar: 'bg-emerald-500', title: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
    { bar: 'bg-amber-500', title: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
    { bar: 'bg-sky-500', title: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
    { bar: 'bg-rose-500', title: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
];

/**
 * Khối rỗng (người đăng thêm rồi bỏ trống) không được render thành thẻ trơ chỉ
 * có tiêu đề — bỏ qua hẳn.
 */
export function isSectionEmpty(section: LibrarySection): boolean {
    switch (section.kind) {
        case 'richText': return !section.html?.trim();
        case 'keyValue': return !section.rows?.some(r => r.label.trim() || r.value.trim());
        case 'metrics': return !section.metrics?.some(m => m.value.trim() || m.label.trim());
        case 'bulletGroups': return !section.groups?.some(g => g.title.trim() || g.items.some(i => i.trim()));
        case 'steps': return !section.steps?.some(s => s.title.trim() || s.desc.trim());
        case 'quote': return !section.quote?.trim();
        case 'gallery': return !section.images?.length;
        case 'linkedItems': return !section.links?.some(l => l.slug.trim());
    }
}

/**
 * Render một khối thân bài trên trang chi tiết. Đối xứng với `SectionEditor` —
 * thêm `kind` mới phải sửa cả hai file.
 */
export default function SectionRenderer({ section, index }: { section: LibrarySection; index: number }) {
    const palette = SECTION_PALETTES[index % SECTION_PALETTES.length];

    const heading = section.title && (
        <h2 className="flex items-center gap-2.5 text-xl font-bold mb-4">
            <span
                className={`inline-flex w-7 h-7 shrink-0 rounded-lg items-center justify-center text-sm font-extrabold tabular-nums border ${palette.badgeBg} ${palette.badgeText} ${palette.badgeBorder}`}
            >
                {index + 1}
            </span>
            <span className={palette.title}>
                {section.title}
            </span>
        </h2>
    );

    const body = () => {
        switch (section.kind) {
            case 'richText':
                return section.html
                    ? (
                        <RichHtml
                            html={section.html}
                            className="text-[var(--text-primary)] leading-relaxed [&_h1]:text-violet-600 [&_h1]:dark:text-violet-400 [&_h2]:text-indigo-600 [&_h2]:dark:text-indigo-400 [&_h3]:text-sky-600 [&_h3]:dark:text-sky-400 [&_h4]:text-teal-600 [&_h4]:dark:text-teal-400"
                        />
                    )
                    : null;

            case 'keyValue':
                return (
                    <div className="divide-y divide-[var(--border-primary)]">
                        {(section.rows || []).map((row, i) => (
                            <div
                                key={i}
                                // Không dùng margin âm: dòng rộng hơn khung cha thì nền sọc
                                // tràn ra ngoài panel và tạo thanh cuộn ngang bên trong thẻ
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2.5 px-3 rounded-lg transition-colors"
                                style={i % 2 === 1 ? { backgroundColor: `${palette.accent}0d` } : undefined}
                            >
                                <span className={`text-[15px] font-semibold ${palette.title}`}>{row.label}</span>
                                <span className="sm:col-span-2 text-[15px] text-[var(--text-primary)]">{row.value}</span>
                            </div>
                        ))}
                    </div>
                );

            case 'metrics':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {(section.metrics || []).map((metric, i) => (
                            <div
                                key={i}
                                className={`rounded-xl border p-3.5 transition-all ${palette.stepBg} ${palette.stepBorder}`}
                            >
                                <div className={`text-xl font-extrabold truncate ${palette.metricValue}`}>{metric.value}</div>
                                <div className="text-xs text-[var(--text-secondary)] font-medium truncate mt-0.5">{metric.label}</div>
                                {metric.note && (
                                    <div className={`text-[11px] mt-1 truncate font-medium ${palette.tagText}`}>{metric.note}</div>
                                )}
                            </div>
                        ))}
                    </div>
                );

            case 'bulletGroups':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(section.groups || []).map((group, i) => {
                            const tone = GROUP_TONES[i % GROUP_TONES.length];
                            return (
                                <div key={i} className="relative rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4 pl-5 overflow-hidden shadow-sm">
                                    <span className={`absolute left-0 inset-y-0 w-1.5 ${tone.bar}`} aria-hidden="true" />
                                    {group.title && (
                                        <h3 className={`text-base font-bold mb-2.5 ${tone.title}`}>{group.title}</h3>
                                    )}
                                    <ul className="space-y-1.5">
                                        {group.items.map((item, j) => (
                                            <li key={j} className="flex items-start gap-2 text-[15px] text-[var(--text-secondary)] leading-relaxed">
                                                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${tone.dot}`} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'steps':
                return (
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                        {(section.steps || []).map((step, i) => (
                            <div
                                key={i}
                                className={`flex-1 min-w-[160px] rounded-xl border p-3.5 ${palette.stepBg} ${palette.stepBorder} transition-all`}
                            >
                                <span
                                    className={`inline-flex w-6 h-6 rounded-lg items-center justify-center text-[11px] font-bold mb-2 shadow-sm ${palette.stepBadge}`}
                                >
                                    {i + 1}
                                </span>
                                <div className={`text-base font-bold mb-1 ${palette.stepTitle}`}>{step.title}</div>
                                {step.desc && (
                                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</div>
                                )}
                            </div>
                        ))}
                    </div>
                );

            case 'quote':
                return (
                    <blockquote
                        className="rounded-xl border-l-4 bg-[var(--bg-secondary)] p-4 shadow-sm"
                        style={{ borderLeftColor: palette.accent }}
                    >
                        <p className="text-lg italic font-medium text-[var(--text-primary)] leading-relaxed">“{section.quote}”</p>
                        {section.quoteBy && (
                            <footer className={`text-sm mt-2 font-semibold ${palette.title}`}>— {section.quoteBy}</footer>
                        )}
                    </blockquote>
                );

            case 'gallery':
                return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(section.images || []).map((url, i) => (
                            <img
                                key={i}
                                src={cdnFromUrl(url, 'w_480')}
                                alt=""
                                loading="lazy"
                                className="w-full h-28 object-cover rounded-lg border border-[var(--border-primary)]"
                            />
                        ))}
                    </div>
                );

            case 'linkedItems':
                return (
                    <div className="flex flex-wrap gap-2">
                        {(section.links || []).filter(link => link.slug).map((link, i) => (
                            <Link
                                key={i}
                                to={`/studio/event-library/${link.slug}`}
                                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all hover:scale-[1.02] shadow-sm ${palette.tagBg} ${palette.tagBorder} ${palette.tagText}`}
                            >
                                {link.label || link.slug} →
                            </Link>
                        ))}
                    </div>
                );
        }
    };

    if (isSectionEmpty(section)) return null;

    const content = body();
    if (!content) return null;

    return (
        <div className={`bg-[var(--bg-card)] border border-[var(--border-primary)] ${palette.cardBorder} rounded-2xl p-6 transition-colors shadow-sm`}>
            {heading}
            {content}
        </div>
    );
}
