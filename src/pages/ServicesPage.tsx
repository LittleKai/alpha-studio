import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { getArticles, type Article } from '../services/articleService';
import { getServiceCategories, type ServiceCategory } from '../services/serviceCategoryService';
import { localizedText } from '../utils/localized';
import { cdnFromUrl } from '../services/cloudinaryAssets';

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

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <SEOHead
                title={language === 'vi' ? 'Dịch Vụ & Sản Phẩm — Alpha Studio' : 'Services & Products — Alpha Studio'}
                description={language === 'vi'
                    ? 'Khám phá các dịch vụ và sản phẩm AI từ Alpha Studio — giải pháp AI sáng tạo cho doanh nghiệp và cá nhân.'
                    : 'Explore AI services and products from Alpha Studio — creative AI solutions for businesses and individuals.'}
                path="/services"
            />
            {/* Hero Section */}
            <section className="relative py-20 px-6 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-[var(--accent-primary)]/10" />
                <div className="relative max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] mb-4">
                        {t('landing.services.heroTitle')}
                    </h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        {t('landing.services.heroDescription')}
                    </p>
                </div>
            </section>

            {/* Chips phân mục */}
            {categories.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 pb-8">
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button
                            onClick={() => selectCategory('')}
                            aria-pressed={!catSlug}
                            className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${!catSlug
                                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)]'
                                : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)]'}`}
                        >
                            {t('landing.services.allCategories')}
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat._id}
                                onClick={() => selectCategory(cat.slug)}
                                aria-pressed={catSlug === cat.slug}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all ${catSlug === cat.slug
                                    ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)]'
                                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-primary)] hover:border-[var(--accent-primary)]'}`}
                            >
                                {cat.icon && <span className="mr-1.5" aria-hidden="true">{cat.icon}</span>}
                                {localizedText(cat.title, language)}
                            </button>
                        ))}
                    </div>

                    {activeCategory && localizedText(activeCategory.description, language) && (
                        <p className="mt-6 text-center text-[var(--text-secondary)] max-w-2xl mx-auto">
                            {localizedText(activeCategory.description, language)}
                        </p>
                    )}
                </section>
            )}

            {/* Articles Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
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
                        {articles.map((article) => (
                            <Link
                                key={article._id}
                                to={`/services/${article.slug}`}
                                className="group bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden hover:border-[var(--accent-primary)] transition-all hover:-translate-y-1"
                            >
                                {article.thumbnail && (
                                    <div className="aspect-video overflow-hidden">
                                        <img
                                            src={cdnFromUrl(article.thumbnail, 'w_640')}
                                            alt={localizedText(article.title, language)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                        {localizedText(article.title, language)}
                                    </h3>
                                    {localizedText(article.excerpt, language) && (
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-3">
                                            {localizedText(article.excerpt, language)}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                                        <span>{new Date(article.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}</span>
                                        <span className="text-[var(--accent-primary)] font-medium">
                                            {t('landing.services.readMore')} →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
