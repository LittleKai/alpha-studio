import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getArticleBySlug, type Article } from '../services/articleService';
import SEOHead from '../components/ui/SEOHead';
import { localizedText } from '../utils/localized';
import { cdnFromUrl } from '../services/cloudinaryAssets';
import SectionRenderer, { isSectionEmpty } from '../components/library/SectionRenderer';

export default function ServicesDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (!slug) return;
            try {
                setLoading(true);
                const res = await getArticleBySlug(slug);
                setArticle(res.data);
            } catch (error) {
                console.error('Failed to load service article:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('landing.services.notFound')}</h2>
                    <button
                        onClick={() => navigate('/services')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('landing.services.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    const visibleSections = (article.sections || []).filter(s => !isSectionEmpty(s));

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <SEOHead
                title={localizedText(article.title, language)}
                description={localizedText(article.excerpt, language)}
                ogImage={article.thumbnail}
                ogType="article"
                path={`/services/${slug}`}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: localizedText(article.title, language),
                    description: localizedText(article.excerpt, language),
                    image: article.thumbnail || 'https://giaiphapsangtao.com/alpha-logo-2.png',
                    url: `https://giaiphapsangtao.com/services/${slug}`,
                    author: { '@type': 'Organization', name: 'Alpha Studio' },
                    publisher: {
                        '@type': 'Organization',
                        name: 'Alpha Studio',
                        logo: { '@type': 'ImageObject', url: 'https://giaiphapsangtao.com/alpha-logo-2.png' }
                    }
                }}
            />
            <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/services')}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors mb-8"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    {t('landing.services.backToList')}
                </button>

                {/* Thumbnail */}
                {article.thumbnail && (
                    <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                        <img
                            src={cdnFromUrl(article.thumbnail, 'w_1400')}
                            alt={localizedText(article.title, language)}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Title & Meta */}
                <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-4">
                    {localizedText(article.title, language)}
                </h1>

                <div className="flex items-center gap-4 text-sm text-[var(--text-tertiary)] mb-8 pb-8 border-b border-[var(--border-primary)]">
                    {article.author && (
                        <span className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {article.author.name?.charAt(0).toUpperCase()}
                            </div>
                            {article.author.name}
                        </span>
                    )}
                    <span>{new Date(article.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    {article.serviceCategory && (
                        <Link
                            to={`/services?cat=${article.serviceCategory.slug}`}
                            className="px-3 py-1 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                            {article.serviceCategory.icon && (
                                <span className="mr-1.5" aria-hidden="true">{article.serviceCategory.icon}</span>
                            )}
                            {localizedText(article.serviceCategory.title, language)}
                        </Link>
                    )}
                </div>

                {/* Khối thân bài có cấu trúc (bài dịch vụ) */}
                {visibleSections.length > 0 && (
                    <div className="space-y-6 mb-8">
                        {visibleSections.map((section, idx) => (
                            <SectionRenderer key={idx} section={section} index={idx} />
                        ))}
                    </div>
                )}

                {/* Content */}
                <div
                    className="tinymce-content max-w-none text-[var(--text-primary)] leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: localizedText(article.content, language) }}
                />

                {/* Tags */}
                {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-[var(--border-primary)]">
                        {article.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </article>
        </div>
    );
}
