import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import StudioBackNav from '../components/studio/StudioBackNav';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { useAuth } from '../auth/context';
import { localized, EventLibraryGridCard } from '../components/library/EventLibraryCard';
import ImageLightbox from '../components/library/ImageLightbox';
import RichHtml from '../components/library/RichHtml';
import SectionRenderer, { isSectionEmpty, SECTION_PALETTES } from '../components/library/SectionRenderer';
import { cdnFromUrl } from '../services/cloudinaryAssets';
import LibraryEngagement from '../components/library/LibraryEngagement';
import {
    getLibraryItem, markLibraryItemUsed, updateLibraryItem, deleteLibraryItem,
    PRO_MIN_LIFETIME_CREDITS,
    type EventLibraryItem, type LibraryAccess, type LibraryReview
} from '../services/eventLibraryService';

const ACCENT = '#7c5cff';

// Tông cho từng dòng/nhóm ở cột phải — trước đây mọi giá trị đều một màu tím
const TONES = {
    violet: '#8b5cf6',
    sky: '#0ea5e9',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    cyan: '#06b6d4'
};

/** Một dòng thuộc tính trong hộp thông tin bên phải. */
function MetaRow({ label, value, tone = ACCENT }: { label: string; value: string; tone?: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-[var(--border-primary)] last:border-b-0">
            <span className="text-sm text-[var(--text-tertiary)] shrink-0">{label}</span>
            <span className="text-sm font-semibold text-right" style={{ color: tone }}>{value}</span>
        </div>
    );
}

/** Thẻ phân loại — mỗi nhóm (ngành / mục tiêu / KPI / tag) một tông riêng. */
function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
    return (
        <span
            className="text-xs px-2 py-1 rounded border font-medium"
            style={{ backgroundColor: `${tone}12`, borderColor: `${tone}33`, color: tone }}
        >
            {children}
        </span>
    );
}

/**
 * Thay chỗ của thân bài khi mục ở cấp `pro` mà người xem chưa đủ credit tích
 * luỹ. Backend đã cắt nội dung trước khi trả về — panel này chỉ giải thích lý
 * do và chỉ đường nạp credit.
 */
function ProLockPanel({ access }: { access: LibraryAccess }) {
    const { t } = useTranslation();
    const required = access.requiredCredits || PRO_MIN_LIFETIME_CREDITS;

    return (
        <div
            className="rounded-2xl border p-8 text-center"
            style={{ backgroundColor: `${ACCENT}0d`, borderColor: `${ACCENT}40` }}
        >
            <div
                className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: `${ACCENT}1f` }}
            >
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={ACCENT} strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">
                {t('eventLibrary.locked.title')}
            </h2>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                {t('eventLibrary.locked.desc').replace('{credits}', String(required))}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-3">
                {t('eventLibrary.locked.progress')
                    .replace('{current}', String(access.lifetimeCredits))
                    .replace('{credits}', String(required))}
            </p>
            <Link
                to="/wallet"
                style={{ backgroundColor: ACCENT }}
                className="inline-block mt-5 px-5 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all"
            >
                {t('eventLibrary.locked.topUp')}
            </Link>
        </div>
    );
}

export default function EventLibraryItemPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { user } = useAuth();

    const [item, setItem] = useState<EventLibraryItem | null>(null);
    const [related, setRelated] = useState<EventLibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [busy, setBusy] = useState(false);
    const [me, setMe] = useState({ liked: false, score: 0, comment: '' });
    const [preview, setPreview] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState('');
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [reviews, setReviews] = useState<LibraryReview[]>([]);
    const [access, setAccess] = useState<LibraryAccess>({
        level: 'public', unlocked: true,
        requiredCredits: PRO_MIN_LIFETIME_CREDITS, lifetimeCredits: 0
    });

    useEffect(() => {
        if (!slug) return;
        let cancelled = false;
        setLoading(true);
        setNotFound(false);
        getLibraryItem(slug)
            .then(res => {
                if (cancelled) return;
                setItem(res.item);
                setRelated(res.related);
                setMe(res.me);
                setReviews(res.reviews);
                setAccess(res.access);
                // `ScrollToTop` trong App.tsx chạy ngay khi đổi route, lúc trang còn
                // rỗng; chiều cao chỉ tăng sau khi dữ liệu về nên phải đưa lại về
                // đầu — nếu không, bấm liên kết ở cuối bài sẽ rơi vào vùng trống.
                window.scrollTo(0, 0);
            })
            .catch(() => { if (!cancelled) setNotFound(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [slug]);

    const canManage = !!item && !!user
        && (user.role === 'admin' || (!!item.owner && item.owner === user._id));

    // Tô sáng mục đang đọc trong mục lục — cùng cách làm với trang chi tiết skill
    useEffect(() => {
        const onScroll = () => {
            // Đo theo khung nhìn, không dùng offsetTop: khối nằm trong nhiều lớp
            // bọc nên offsetTop không phải toạ độ so với trang
            let current = '';
            document.querySelectorAll<HTMLElement>('[data-toc-anchor]').forEach(el => {
                if (el.getBoundingClientRect().top <= 200) current = el.id;
            });
            setActiveSection(current);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [item]);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
    };

    /**
     * Bấm vào ảnh bất kỳ trong phần nội dung thì mở xem phóng to. Bắt theo kiểu
     * uỷ quyền vì ảnh trong thân bài nằm trong chuỗi HTML của TinyMCE, không gắn
     * được onClick cho từng thẻ.
     */
    const openPreview = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'IMG') return;
        const src = (target as HTMLImageElement).currentSrc || (target as HTMLImageElement).src;
        if (src) setPreview(src);
    };

    // Sửa nội dung dùng lại bộ đăng ở /workflow — mở tab mới, form nạp sẵn mục này.
    const handleEdit = () => {
        if (!item) return;
        window.open(`/workflow?view=library&edit=${encodeURIComponent(item.slug)}`, '_blank', 'noopener');
    };

    const handleToggleVisibility = async () => {
        if (!item) return;
        const next = item.visibility === 'public' ? 'private' : 'public';
        setBusy(true);
        try {
            const updated = await updateLibraryItem(item._id, { visibility: next });
            setItem(updated);
        } catch (err) {
            console.error('Toggle library visibility error:', err);
        } finally {
            setBusy(false);
        }
    };

    const confirmDelete = async () => {
        if (!item) return;
        setDeleting(true);
        try {
            await deleteLibraryItem(item._id);
            navigate('/studio/event-library');
        } catch (err) {
            console.error('Delete library item error:', err);
            setShowDelete(false);
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div
                    className="w-12 h-12 border-4 rounded-full animate-spin"
                    style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }}
                />
            </div>
        );
    }

    if (notFound || !item) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <StudioBackNav to="/studio/event-library" label={t('eventLibrary.detail.backToLibrary')} />
                <div className="max-w-2xl mx-auto px-6 py-32 text-center">
                    <h1 className="text-2xl font-bold mb-3">{t('eventLibrary.detail.notFound')}</h1>
                    <Link
                        to="/studio/event-library"
                        style={{ backgroundColor: ACCENT }}
                        className="inline-block px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all"
                    >
                        {t('eventLibrary.detail.backToLibrary')}
                    </Link>
                </div>
            </div>
        );
    }

    const title = localized(item.title, language);
    const summary = localized(item.summary, language);
    const content = localized(item.content, language);
    const locked = !access.unlocked;

    // Khối rỗng bị ẩn khi render nên phải lọc trước, để mục lục khớp đúng thứ tự
    // đánh số và màu của khối trên trang
    const visibleSections = locked ? [] : (item.sections || []).filter(s => !isSectionEmpty(s));
    const tocEntries = [
        ...visibleSections.map((section, idx) => ({
            id: `sec-${idx}`,
            label: section.title || t('eventLibrary.sectionKinds.' + section.kind, section.kind),
            color: SECTION_PALETTES[idx % SECTION_PALETTES.length].accent
        })),
        ...(!locked && content ? [{ id: 'free-content', label: t('eventLibrary.detail.content'), color: TONES.violet }] : []),
        ...(!locked && item.attachments.length > 0
            ? [{ id: 'attachments', label: t('eventLibrary.detail.attachments'), color: TONES.sky }]
            : [])
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
            <SEOHead title={title} description={summary} path={`/studio/event-library/${item.slug}`} />
            <StudioBackNav to="/studio/event-library" label={t('eventLibrary.detail.backToLibrary')} />

            {/* pt-16: chừa chỗ cho cụm nút quay lại nổi ở góc trên trái */}
            <div className="max-w-6xl mx-auto px-6 pt-16 pb-12">
                {item.coverImage && (
                    <img
                        onClick={openPreview}
                        src={cdnFromUrl(item.coverImage, 'w_1400')}
                        alt=""
                        className="w-full h-56 md:h-72 object-cover rounded-2xl border border-[var(--border-primary)] mb-6 cursor-zoom-in"
                    />
                )}

                {item.gallery?.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6" onClick={openPreview}>
                        {item.gallery.map((url, idx) => (
                            <img
                                key={idx}
                                src={cdnFromUrl(url, 'w_320')}
                                alt=""
                                loading="lazy"
                                className="w-full h-16 sm:h-20 object-cover rounded-lg border border-[var(--border-primary)] cursor-zoom-in"
                            />
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                        className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase"
                        style={{ backgroundColor: `${ACCENT}1a`, borderColor: `${ACCENT}40`, color: ACCENT }}
                    >
                        {t('eventLibrary.types.' + item.itemType)}
                    </span>
                    {item.accessLevel === 'pro' && (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                            {t('eventLibrary.accessLevels.pro')}
                        </span>
                    )}
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                        {item.ownership === 'platform'
                            ? t('eventLibrary.origins.platform')
                            : item.visibility === 'private'
                                ? t('eventLibrary.origins.private')
                                : t('eventLibrary.origins.community')}
                    </span>
                </div>

                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-600 dark:from-violet-400 dark:via-indigo-300 dark:to-sky-400 bg-clip-text text-transparent">
                    {title}
                </h1>
                {summary && <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-8">{summary}</p>}

                {/* Thông tin + Phân loại: hàng ngang dưới mô tả, không còn nằm ở cột bên */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-start">
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm">
                        <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                            <span className="w-1.5 h-4 rounded-full bg-violet-500" />
                            {t('eventLibrary.detail.info')}
                        </h2>
                        <MetaRow
                            label={t('eventLibrary.category')}
                            value={t('eventLibrary.categories.' + item.category, item.category)}
                            tone={TONES.violet}
                        />
                        <MetaRow
                            label={t('eventLibrary.depth')}
                            value={t('eventLibrary.depths.' + item.depth, item.depth)}
                            tone={TONES.sky}
                        />
                        {item.budgetTier && (
                            <MetaRow
                                label={t('eventLibrary.budget')}
                                value={t('eventLibrary.budgetTiers.' + item.budgetTier, item.budgetTier)}
                                tone={TONES.amber}
                            />
                        )}
                        {item.authorName && (
                            <MetaRow
                                label={t('eventLibrary.detail.author')}
                                value={item.authorName}
                                tone={TONES.emerald}
                            />
                        )}
                        {item.sourceName && (
                            <MetaRow
                                label={t('eventLibrary.detail.source')}
                                value={item.sourceName}
                                tone={TONES.cyan}
                            />
                        )}
                        <MetaRow
                            label={t('eventLibrary.metrics.views')}
                            value={String(item.stats.views)}
                            tone={TONES.rose}
                        />
                    </div>

                    {(item.industries.length > 0 || item.objectives.length > 0 || item.kpis.length > 0 || item.tags.length > 0) && (
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm">
                            <h2 className="text-base font-bold mb-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
                                {t('eventLibrary.detail.classification')}
                            </h2>
                            <div className="flex flex-wrap gap-1.5">
                                {item.industries.map(v => (
                                    <Chip key={`i-${v}`} tone={TONES.sky}>{t('eventLibrary.industries.' + v, v)}</Chip>
                                ))}
                                {item.objectives.map(v => (
                                    <Chip key={`o-${v}`} tone={TONES.emerald}>{t('eventLibrary.objectives.' + v, v)}</Chip>
                                ))}
                                {item.kpis.map(v => (
                                    <Chip key={`k-${v}`} tone={TONES.amber}>{t('eventLibrary.kpis.' + v, v)}</Chip>
                                ))}
                                {item.tags.map(v => (
                                    <Chip key={`t-${v}`} tone={TONES.rose}>#{v}</Chip>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar dính theo khi cuộn — cột này cao hơn màn hình nên tự cuộn
                        bên trong, nếu không phần dưới sẽ không bao giờ với tới được */}
                    <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 library-sidebar">
                        {/* Mục lục — cùng kiểu "Jump To" của /studio/ai-skills */}
                        {tocEntries.length > 0 && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 shadow-sm select-none">
                                <h2 className="text-xs font-bold uppercase tracking-wider px-3 pb-2 mb-2 border-b border-[var(--border-primary)]/50 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                    <span className="w-1.5 h-3.5 rounded-full bg-violet-500" />
                                    {t('eventLibrary.detail.toc')}
                                </h2>
                                <nav className="flex flex-col gap-1 text-sm font-semibold">
                                    {tocEntries.map(entry => (
                                        <button
                                            key={entry.id}
                                            onClick={() => scrollToSection(entry.id)}
                                            className="w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer hover:bg-[var(--bg-secondary)]"
                                            style={activeSection === entry.id
                                                ? { color: entry.color, backgroundColor: `${entry.color}14` }
                                                : { color: 'var(--text-secondary)' }}
                                        >
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="truncate">{entry.label}</span>
                                            </span>
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        )}

                        <LibraryEngagement
                            item={item}
                            initialScore={me.score}
                            initialComment={me.comment}
                            initialReviews={reviews}
                        />

                        {canManage && (
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-2 shadow-sm">
                                <h2 className="text-base font-bold mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <span className="w-1.5 h-4 rounded-full bg-amber-500" />
                                    {t('eventLibrary.detail.manage')}
                                </h2>
                                <button
                                    onClick={handleEdit}
                                    style={{ backgroundColor: ACCENT }}
                                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-all cursor-pointer"
                                >
                                    {t('eventLibrary.detail.edit')}
                                </button>
                                {item.ownership === 'user' && (
                                    <button
                                        onClick={handleToggleVisibility}
                                        disabled={busy}
                                        className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {item.visibility === 'public'
                                            ? t('eventLibrary.detail.makePrivate')
                                             : t('eventLibrary.detail.makePublic')}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowDelete(true)}
                                    disabled={busy || deleting}
                                    className="w-full px-3 py-2 rounded-lg text-sm font-semibold bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {t('eventLibrary.detail.delete')}
                                </button>
                            </div>
                        )}
                    </aside>

                    <div className="lg:col-span-2 min-w-0 space-y-8 [&_img]:cursor-zoom-in" onClick={openPreview}>
                        {item.metrics.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {item.metrics.map((metric, idx) => (
                                    <div
                                        key={`${metric.label}-${idx}`}
                                        className="border rounded-xl p-4 transition-all"
                                        style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}33` }}
                                    >
                                        <div className="text-2xl font-extrabold truncate" style={{ color: ACCENT }}>{metric.value}</div>
                                        <div className="text-xs text-[var(--text-tertiary)] font-medium truncate mt-0.5">
                                            {t('eventLibrary.metrics.' + metric.label, metric.label)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {locked ? (
                            <ProLockPanel access={access} />
                        ) : (
                            <>
                            {visibleSections.map((section, idx) => (
                                <div key={idx} id={`sec-${idx}`} data-toc-anchor className="scroll-mt-24">
                                    <SectionRenderer section={section} index={idx} />
                                </div>
                            ))}

                            {content ? (
                                <div id="free-content" data-toc-anchor className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                        <span className="w-1.5 h-5 rounded-full bg-violet-500" />
                                        {t('eventLibrary.detail.content')}
                                    </h2>
                                    <RichHtml
                                        html={content}
                                        className="text-[var(--text-primary)] leading-relaxed [&_h1]:text-violet-600 [&_h1]:dark:text-violet-400 [&_h2]:text-indigo-600 [&_h2]:dark:text-indigo-400 [&_h3]:text-sky-600 [&_h3]:dark:text-sky-400 [&_h4]:text-teal-600 [&_h4]:dark:text-teal-400"
                                    />
                                </div>
                            ) : item.sections?.length ? null : (
                                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 text-base text-[var(--text-secondary)]">
                                    {t('eventLibrary.detail.noContent')}
                                </div>
                            )}

                            {item.attachments.length > 0 && (
                                <div id="attachments" data-toc-anchor className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
                                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                        <span className="w-1.5 h-5 rounded-full bg-sky-500" />
                                        {t('eventLibrary.detail.attachments')}
                                    </h2>
                                    <div className="space-y-2">
                                        {item.attachments.map((attachment, idx) => (
                                            <a
                                                key={`${attachment.url}-${idx}`}
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => markLibraryItemUsed(item.slug)}
                                                className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors"
                                            >
                                                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                                                    {attachment.name}
                                                </span>
                                                <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                                                    {attachment.size || t('eventLibrary.actions.download')}
                                                </span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                            </>
                        )}
                    </div>

                </div>

                {related.length > 0 && (
                    <div className="mt-14">
                        <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                            <span className="w-1.5 h-5 rounded-full bg-violet-500" />
                            {t('eventLibrary.detail.related')}
                        </h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map(rel => (
                                <EventLibraryGridCard
                                    key={rel._id}
                                    item={rel}
                                    accent={ACCENT}
                                    onOpen={next => navigate(`/studio/event-library/${next.slug}`)}
                                    onDownload={next => {
                                        const attachment = next.attachments[0];
                                        if (!attachment?.url) return;
                                        markLibraryItemUsed(next.slug);
                                        window.open(attachment.url, '_blank', 'noopener');
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {preview && <ImageLightbox src={preview} onClose={() => setPreview(null)} />}

            {showDelete && (
                <DeleteConfirmModal
                    mode="code"
                    deleting={deleting}
                    itemName={localized(item.title, language)}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDelete(false)}
                />
            )}
        </div>
    );
}
