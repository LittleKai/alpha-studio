import { useTranslation } from '../../i18n/context';
import type { EventLibraryItem } from '../../services/eventLibraryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

/** Màu nhãn riêng cho từng loại nội dung, để 7 tab phân biệt được ngay trên card. */
const TYPE_STYLES: Record<string, string> = {
    case_study: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
    prompt: 'bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30',
    workflow: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
    skill: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
    template: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    report: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    playbook: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
};

/**
 * Badge đặt ĐÈ LÊN ảnh bìa cần nền đục riêng: nền mờ `/15` của TYPE_STYLES đọc
 * được trên nền card nhưng biến mất trên ảnh — tối trên ảnh tối, nhạt trên ảnh
 * sáng. Ở đây giữ màu chữ để vẫn phân biệt loại, còn nền thì luôn là đen mờ.
 */
const ON_IMAGE_TEXT: Record<string, string> = {
    case_study: 'text-violet-300',
    prompt: 'text-fuchsia-300',
    workflow: 'text-sky-300',
    skill: 'text-cyan-300',
    template: 'text-amber-300',
    report: 'text-emerald-300',
    playbook: 'text-rose-300',
};

const ON_IMAGE_BASE = 'bg-black/60 border-white/20 backdrop-blur-sm';

export function localized(text: { vi: string; en: string } | undefined, language: string): string {
    if (!text) return '';
    // Nội dung do người dùng đăng thường chỉ có một ngôn ngữ — luôn có bản dự phòng
    return language === 'vi' ? (text.vi || text.en) : (text.en || text.vi);
}

/**
 * Nhãn NGUỒN nội dung — của Alpha Studio hay do cộng đồng đăng.
 *
 * Cố tình không dùng dấu tick: đây không phải cấp xác thực dữ liệu. Xác thực là
 * trường `verification` riêng, có bộ lọc riêng ở sidebar; một mục của Alpha
 * Studio vẫn có thể là `unverified`.
 */
function OriginBadge({ item, onImage = false }: { item: EventLibraryItem; onImage?: boolean }) {
    const { t } = useTranslation();
    if (item.ownership === 'platform') {
        return (
            <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${onImage
                ? `${ON_IMAGE_BASE} text-white`
                : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/25'}`}>
                {t('eventLibrary.origins.platform')}
            </span>
        );
    }
    return (
        <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${onImage
            ? `${ON_IMAGE_BASE} text-white`
            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-primary)]'}`}>
            {item.visibility === 'private'
                ? t('eventLibrary.origins.private')
                : t('eventLibrary.origins.community')}
        </span>
    );
}

function TypeBadge({ itemType, onImage = false }: { itemType: string; onImage?: boolean }) {
    const { t } = useTranslation();
    const style = onImage
        ? `${ON_IMAGE_BASE} ${ON_IMAGE_TEXT[itemType] || ON_IMAGE_TEXT.case_study}`
        : (TYPE_STYLES[itemType] || TYPE_STYLES.case_study);
    return (
        <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${style}`}>
            {t('eventLibrary.types.' + itemType)}
        </span>
    );
}

/** Dải 4 chỉ số ngắn ở chân card (reach, ngân sách, số slide…). */
function MetricRow({ metrics }: { metrics: EventLibraryItem['metrics'] }) {
    const { t } = useTranslation();
    if (!metrics.length) return null;
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 border-t border-[var(--border-primary)]">
            {metrics.slice(0, 4).map((metric, idx) => (
                <div key={`${metric.label}-${idx}`} className="min-w-0">
                    <div className="text-base font-bold text-violet-600 dark:text-violet-400 truncate">{metric.value}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {t('eventLibrary.metrics.' + metric.label, metric.label)}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface CardProps {
    item: EventLibraryItem;
    accent: string;
    onOpen: (item: EventLibraryItem) => void;
    onDownload: (item: EventLibraryItem) => void;
}

export function EventLibraryGridCard({ item, accent, onOpen, onDownload }: CardProps) {
    const { t, language } = useTranslation();
    const title = localized(item.title, language);
    const summary = localized(item.summary, language);

    return (
        <div
            onClick={() => onOpen(item)}
            className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(124,92,255,0.12)] transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden"
            style={{ ['--card-accent' as string]: accent }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
        >
            {/* Ảnh bìa — nền gradient thay thế khi mục chưa có ảnh */}
            <div className="relative h-40 overflow-hidden bg-[var(--bg-secondary)]">
                {item.coverImage ? (
                    <img
                        src={cdnFromUrl(item.coverImage, 'w_640')}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{ background: `linear-gradient(135deg, ${accent}33, transparent 70%)` }}
                    />
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <TypeBadge itemType={item.itemType} onImage />
                </div>
                <div className="absolute bottom-3 left-3">
                    <OriginBadge item={item} onImage />
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-violet-500 dark:group-hover:text-violet-400 mb-1.5 line-clamp-2 transition-colors">
                    {title}
                </h3>
                <p className="text-[15px] text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed flex-1">
                    {summary}
                </p>

                {(item.category || item.industries.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {item.category && (
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                                {t('eventLibrary.categories.' + item.category, item.category)}
                            </span>
                        )}
                        {item.industries.slice(0, 2).map(industry => (
                            <span
                                key={industry}
                                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                            >
                                {t('eventLibrary.industries.' + industry, industry)}
                            </span>
                        ))}
                    </div>
                )}

                <MetricRow metrics={item.metrics} />

                <div className="flex items-center gap-2 pt-3 mt-auto border-t border-[var(--border-primary)]">
                    <button
                        onClick={e => { e.stopPropagation(); onOpen(item); }}
                        style={{ backgroundColor: accent }}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 cursor-pointer focus:outline-none"
                    >
                        {t('eventLibrary.actions.viewDetail')}
                    </button>
                    {item.attachments.length > 0 && (
                        <button
                            onClick={e => { e.stopPropagation(); onDownload(item); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer focus:outline-none"
                        >
                            {t('eventLibrary.actions.download')}
                        </button>
                    )}
                    <span className="text-[10px] text-[var(--text-tertiary)] shrink-0">
                        {item.stats.views} {t('eventLibrary.metrics.views')}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function EventLibraryListRow({ item, accent, onOpen, onDownload }: CardProps) {
    const { t, language } = useTranslation();
    const title = localized(item.title, language);
    const summary = localized(item.summary, language);

    return (
        <div
            onClick={() => onOpen(item)}
            className="group bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border-primary)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer"
            onMouseEnter={e => { e.currentTarget.style.borderColor = accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ''; }}
        >
            {item.coverImage && (
                <img
                    src={cdnFromUrl(item.coverImage, 'w_320')}
                    alt=""
                    loading="lazy"
                    className="w-full md:w-32 h-24 md:h-20 object-cover rounded-lg shrink-0"
                />
            )}

            <div className="flex-1 space-y-2 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <TypeBadge itemType={item.itemType} />
                    <OriginBadge item={item} />
                    {item.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                            {t('eventLibrary.categories.' + item.category, item.category)}
                        </span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-violet-500 dark:group-hover:text-violet-400 truncate transition-colors">{title}</h3>
                <p className="text-[15px] text-[var(--text-tertiary)] line-clamp-2 leading-relaxed">{summary}</p>
            </div>

            <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[var(--border-primary)]">
                <button
                    onClick={e => { e.stopPropagation(); onOpen(item); }}
                    style={{ backgroundColor: accent }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 cursor-pointer focus:outline-none"
                >
                    {t('eventLibrary.actions.viewDetail')}
                </button>
                {item.attachments.length > 0 && (
                    <button
                        onClick={e => { e.stopPropagation(); onDownload(item); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer focus:outline-none"
                    >
                        {t('eventLibrary.actions.download')}
                    </button>
                )}
            </div>
        </div>
    );
}
