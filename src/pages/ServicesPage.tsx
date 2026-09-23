import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { getArticles, type Article } from '../services/articleService';
import { getServiceCategories, type ServiceCategory } from '../services/serviceCategoryService';
import { localizedText } from '../utils/localized';
import { cdnFromUrl } from '../services/cloudinaryAssets';

/** Tông màu theo `accent` của phân mục — chữ trắng khi nền có màu (theo yêu cầu UI). */
const ACCENT_TONES: Record<string, {
    activeBg: string;
    activeText: string;
    activeBorder: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    tagBg: string;
    tagText: string;
    tagBorder: string;
    glow: string;
    gradient: string;
}> = {
    violet: {
        activeBg: 'bg-violet-600',
        activeText: 'text-white',
        activeBorder: 'border-violet-600',
        badgeBg: 'bg-violet-600',
        badgeText: 'text-white',
        badgeBorder: 'border-violet-400/40',
        tagBg: 'bg-violet-500/15',
        tagText: 'text-violet-600 dark:text-violet-300',
        tagBorder: 'border-violet-500/30',
        glow: 'rgba(139, 92, 246, 0.2)',
        gradient: 'from-violet-600 to-indigo-600'
    },
    sky: {
        activeBg: 'bg-sky-600',
        activeText: 'text-white',
        activeBorder: 'border-sky-600',
        badgeBg: 'bg-sky-600',
        badgeText: 'text-white',
        badgeBorder: 'border-sky-400/40',
        tagBg: 'bg-sky-500/15',
        tagText: 'text-sky-600 dark:text-sky-300',
        tagBorder: 'border-sky-500/30',
        glow: 'rgba(14, 165, 233, 0.2)',
        gradient: 'from-sky-600 to-blue-600'
    },
    emerald: {
        activeBg: 'bg-emerald-600',
        activeText: 'text-white',
        activeBorder: 'border-emerald-600',
        badgeBg: 'bg-emerald-600',
        badgeText: 'text-white',
        badgeBorder: 'border-emerald-400/40',
        tagBg: 'bg-emerald-500/15',
        tagText: 'text-emerald-600 dark:text-emerald-300',
        tagBorder: 'border-emerald-500/30',
        glow: 'rgba(16, 185, 129, 0.2)',
        gradient: 'from-emerald-600 to-teal-600'
    },
    amber: {
        activeBg: 'bg-amber-600',
        activeText: 'text-white',
        activeBorder: 'border-amber-600',
        badgeBg: 'bg-amber-600',
        badgeText: 'text-white',
        badgeBorder: 'border-amber-400/40',
        tagBg: 'bg-amber-500/15',
        tagText: 'text-amber-700 dark:text-amber-300',
        tagBorder: 'border-amber-500/30',
        glow: 'rgba(245, 158, 11, 0.2)',
        gradient: 'from-amber-600 to-orange-600'
    },
    rose: {
        activeBg: 'bg-rose-600',
        activeText: 'text-white',
        activeBorder: 'border-rose-600',
        badgeBg: 'bg-rose-600',
        badgeText: 'text-white',
        badgeBorder: 'border-rose-400/40',
        tagBg: 'bg-rose-500/15',
        tagText: 'text-rose-600 dark:text-rose-300',
        tagBorder: 'border-rose-500/30',
        glow: 'rgba(244, 63, 94, 0.2)',
        gradient: 'from-rose-600 to-pink-600'
    }
};

const toneOf = (accent?: string) => ACCENT_TONES[accent || 'violet'] || ACCENT_TONES.violet;

/** Số ảnh của một bài — cộng dồn các khối gallery. */
function countImages(article: Article): number {
    return (article.sections || []).reduce(
        (n, s) => n + (s.kind === 'gallery' ? (s.images?.length || 0) : 0),
        0
    );
}

export default function ServicesPage() {
    const { t, language } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [articles, setArticles] = useState<Article[]>([]);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const catSlug = searchParams.get('cat') || '';
    const activeCategory = categories.find(c => c.slug === catSlug) || null;

    useEffect(() => {
        getServiceCategories()
            .then(setCategories)
            .catch(err => console.error('Failed to load service categories:', err));
    }, []);

    // Lọc theo id ở backend; chờ có `categories` mới gọi để dịch slug → id.
    useEffect(() => {
        if (catSlug && !activeCategory) return;
        const load = async () => {
            try {
                setLoading(true);
                const res = await getArticles('services', 1, 50, undefined, activeCategory?._id);
                setArticles(res.data);
            } catch (error) {
                console.error('Failed to load services articles:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [catSlug, activeCategory]);

    const selectCategory = (slug: string) => {
        setSearchParams(slug ? { cat: slug } : {}, { replace: true });
    };

    // Tổng số ảnh của toàn bộ bài đang hiển thị — số liệu ở dải hero
    const totalImages = useMemo(
        () => articles.reduce((n, a) => n + countImages(a), 0),
        [articles]
    );

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <SEOHead
                title={language === 'vi' ? 'Dịch Vụ & Sản Phẩm — Alpha Studio' : 'Services & Products — Alpha Studio'}
                description={language === 'vi'
                    ? 'Khám phá các dịch vụ và sản phẩm AI từ Alpha Studio — giải pháp AI sáng tạo cho doanh nghiệp và cá nhân.'
                    : 'Explore AI services and products from Alpha Studio — creative AI solutions for businesses and individuals.'}
                path="/services"
            />

            {/* Hero */}
            <section className="relative overflow-hidden border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-sky-500/10" />
                <div
                    aria-hidden="true"
                    className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-20 bg-[var(--accent-primary)] pointer-events-none"
                />
                <div className="relative max-w-7xl mx-auto px-6 py-14 md:py-20">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-5 rounded-full text-xs font-bold border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                        </svg>
                        <span>{language === 'vi' ? 'Alpha Studio · Giải Pháp & Dịch Vụ AI' : 'Alpha Studio · AI Solutions & Services'}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)]">
                        <span className="bg-gradient-to-r from-violet-600 via-sky-500 to-emerald-500 dark:from-violet-400 dark:via-sky-300 dark:to-emerald-400 bg-clip-text text-transparent">
                            {t('landing.services.heroTitle')}
                        </span>
                    </h1>

                    <p className="mt-4 max-w-2xl text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
                        {t('landing.services.heroDescription')}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3 text-sm">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-violet-500" />
                            <span className="text-lg font-black text-[var(--text-primary)] tabular-nums">{articles.length}</span>
                            <span className="text-[var(--text-secondary)] text-xs font-medium">{t('landing.services.projects')}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-sky-500" />
                            <span className="text-lg font-black text-[var(--text-primary)] tabular-nums">{categories.length}</span>
                            <span className="text-[var(--text-secondary)] text-xs font-medium">{t('landing.services.categoryCount')}</span>
                        </div>
                        {totalImages > 0 && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-sm backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="text-lg font-black text-[var(--text-primary)] tabular-nums">{totalImages}</span>
                                <span className="text-[var(--text-secondary)] text-xs font-medium">{t('landing.services.imageCount')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Thanh lọc phân mục — dính lại khi cuộn để đổi mục không phải lên đầu trang */}
            {categories.length > 0 && (
                <div className="sticky top-16 z-20 bg-[var(--bg-primary)]/85 backdrop-blur-md border-b border-[var(--border-primary)]">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex gap-2 overflow-x-auto detail-sidebar">
                        <button
                            onClick={() => selectCategory('')}
                            aria-pressed={!catSlug}
                            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${!catSlug
                                ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-[var(--accent-primary)]/20'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]'}`}
                        >
                            {t('landing.services.allCategories')}
                        </button>
                        {categories.map(cat => {
                            const tone = toneOf(cat.accent);
                            const on = catSlug === cat.slug;
                            return (
                                <button
                                    key={cat._id}
                                    onClick={() => selectCategory(cat.slug)}
                                    aria-pressed={on}
                                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-all cursor-pointer ${on
                                        ? `${tone.activeBg} ${tone.activeText} ${tone.activeBorder} shadow-md`
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)]'}`}
                                >
                                    {cat.icon && <span className="mr-1.5" aria-hidden="true">{cat.icon}</span>}
                                    {localizedText(cat.title, language)}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
                {/* Dải giới thiệu phân mục đang chọn */}
                {activeCategory && (
                    <section className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md shadow-xl transition-all">
                        {/* Ambient glow */}
                        <div
                            aria-hidden="true"
                            className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
                            style={{ background: toneOf(activeCategory.accent).glow }}
                        />
                        <div
                            aria-hidden="true"
                            className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-15"
                            style={{ background: toneOf(activeCategory.accent).glow }}
                        />

                        {/* Top decorative accent bar */}
                        <div className={`h-1.5 w-full bg-gradient-to-r ${toneOf(activeCategory.accent).gradient}`} />

                        <div className="relative p-6 md:p-8 lg:p-10">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
                                <div className={`${activeCategory.coverImage ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-4`}>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-sm ${toneOf(activeCategory.accent).tagBg} ${toneOf(activeCategory.accent).tagText} ${toneOf(activeCategory.accent).tagBorder}`}>
                                            {activeCategory.icon && <span>{activeCategory.icon}</span>}
                                            <span>{t('landing.services.categoryTag')}</span>
                                        </span>
                                        <span className="text-xs text-[var(--text-tertiary)] font-semibold">
                                            • {articles.length} {t('landing.services.projects')}
                                        </span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                                        {localizedText(activeCategory.title, language)}
                                    </h2>

                                    {localizedText(activeCategory.description, language) && (
                                        <p className="text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                                            {localizedText(activeCategory.description, language)}
                                        </p>
                                    )}

                                    <div className="pt-2">
                                        <button
                                            onClick={() => selectCategory('')}
                                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all cursor-pointer shadow-sm"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            {t('landing.services.clearFilter')}
                                        </button>
                                    </div>
                                </div>

                                {activeCategory.coverImage && (
                                    <div className="lg:col-span-5 xl:col-span-4">
                                        <div className="relative aspect-[16/10] sm:aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden border border-[var(--border-primary)] shadow-md group">
                                            <img
                                                src={cdnFromUrl(activeCategory.coverImage, 'w_800')}
                                                alt={localizedText(activeCategory.title, language)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Lưới bài viết */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[var(--text-secondary)]">
                            {activeCategory ? t('landing.services.categoryEmpty') : t('landing.services.noArticles')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {articles.map(article => {
                            const tone = toneOf(article.serviceCategory?.accent);
                            const images = countImages(article);
                            const files = article.attachments?.length || 0;
                            return (
                                <Link
                                    key={article._id}
                                    to={`/services/${article.slug}`}
                                    className="group flex flex-col bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-[var(--accent-primary)] hover:shadow-xl transition-all hover:-translate-y-1"
                                >
                                    {article.thumbnail && (
                                        <div className="relative aspect-video overflow-hidden">
                                            <img
                                                src={cdnFromUrl(article.thumbnail, 'w_640')}
                                                alt={localizedText(article.title, language)}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                            {article.serviceCategory && (
                                                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md ${tone.badgeBg} ${tone.badgeText} ${tone.badgeBorder} shadow-md`}>
                                                    {article.serviceCategory.icon && (
                                                        <span className="mr-1.5" aria-hidden="true">{article.serviceCategory.icon}</span>
                                                    )}
                                                    {localizedText(article.serviceCategory.title, language)}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="p-5 flex flex-col flex-1 gap-3">
                                        <h3 className="text-lg font-bold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                            {localizedText(article.title, language)}
                                        </h3>
                                        {localizedText(article.excerpt, language) && (
                                            <p className="text-sm text-[var(--text-secondary)] line-clamp-3 flex-1">
                                                {localizedText(article.excerpt, language)}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                                            {images > 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                                    {images} {t('landing.services.imageCount')}
                                                </span>
                                            )}
                                            {files > 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                                    {files} {t('landing.services.downloads').toLowerCase()}
                                                </span>
                                            )}
                                            {(article.downloadCount ?? 0) > 0 && (
                                                <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-semibold tabular-nums">
                                                    ↓ {article.downloadCount.toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-primary)]/60">
                                            <span className="pt-3">
                                                {new Date(article.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                            </span>
                                            <span className="pt-3 text-[var(--accent-primary)] font-bold">
                                                {t('landing.services.readMore')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
