import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { getArticles, type Article } from '../services/articleService';
import { getServiceCategories, type ServiceCategory } from '../services/serviceCategoryService';
import { localizedText } from '../utils/localized';
import { cdnFromUrl } from '../services/cloudinaryAssets';

/** Tông màu theo `accent` của phân mục — cùng bảng với SECTION_PALETTES. */
const ACCENT_TONES: Record<string, { text: string; border: string; bg: string; dot: string }> = {
    violet: { text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-500/40', bg: 'bg-violet-500/10', dot: 'bg-violet-500' },
    sky: { text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-500/40', bg: 'bg-sky-500/10', dot: 'bg-sky-500' },
    emerald: { text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
    amber: { text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-500/40', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
    rose: { text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-500/40', bg: 'bg-rose-500/10', dot: 'bg-rose-500' }
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
            <section className="relative overflow-hidden border-b border-[var(--border-primary)]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-sky-500/10" />
                <div
                    aria-hidden="true"
                    className="absolute -top-24 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full blur-3xl opacity-20 bg-[var(--accent-primary)]"
                />
                <div className="relative max-w-7xl mx-auto px-6 py-16 md:py-20">
                    <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tight">
                        {t('landing.services.heroTitle')}
                    </h1>
                    <p className="mt-4 max-w-2xl text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
                        {t('landing.services.heroDescription')}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                        <span className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[var(--accent-primary)] tabular-nums">{articles.length}</span>
                            <span className="text-[var(--text-tertiary)]">{t('landing.services.projects')}</span>
                        </span>
                        <span className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-[var(--accent-primary)] tabular-nums">{categories.length}</span>
                            <span className="text-[var(--text-tertiary)]">{t('landing.services.categoryCount')}</span>
                        </span>
                        {totalImages > 0 && (
                            <span className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-[var(--accent-primary)] tabular-nums">{totalImages}</span>
                                <span className="text-[var(--text-tertiary)]">{t('landing.services.imageCount')}</span>
                            </span>
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
                                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)]'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)]'}`}
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
                                        ? `${tone.bg} ${tone.text} ${tone.border}`
                                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)]'}`}
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
                    <section className={`rounded-3xl border ${toneOf(activeCategory.accent).border} ${toneOf(activeCategory.accent).bg} overflow-hidden`}>
                        <div className="grid md:grid-cols-3 gap-0">
                            {activeCategory.coverImage && (
                                <div className="md:col-span-1 aspect-video md:aspect-auto md:min-h-[200px] overflow-hidden">
                                    <img
                                        src={cdnFromUrl(activeCategory.coverImage, 'w_640')}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                            <div className={`${activeCategory.coverImage ? 'md:col-span-2' : 'md:col-span-3'} p-6 md:p-8 flex flex-col justify-center gap-3`}>
                                <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${toneOf(activeCategory.accent).text}`}>
                                    {activeCategory.icon && <span aria-hidden="true">{activeCategory.icon}</span>}
                                    {localizedText(activeCategory.title, language)}
                                </h2>
                                {localizedText(activeCategory.description, language) && (
                                    <p className="text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                                        {localizedText(activeCategory.description, language)}
                                    </p>
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
                                                <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-bold border backdrop-blur-md bg-[var(--bg-card)]/85 ${tone.border} ${tone.text}`}>
                                                    {article.serviceCategory.icon && (
                                                        <span className="mr-1" aria-hidden="true">{article.serviceCategory.icon}</span>
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
