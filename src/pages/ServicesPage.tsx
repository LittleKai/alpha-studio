import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getArticles, type Article } from '../services/articleService';

export default function ServicesPage() {
    const { t, language } = useTranslation();
    const [articles, setArticles] = useState<Article[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const res = await getArticles('services', 1, 50);
                setArticles(res.data);
            } catch (error) {
                console.error('Failed to load services articles:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
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

            {/* Articles Grid */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                    </div>
                ) : articles.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[var(--text-secondary)]">{t('landing.services.noArticles')}</p>
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
                                            src={article.thumbnail}
                                            alt={article.title[language]}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                                        {article.title[language]}
                                    </h3>
                                    {article.excerpt[language] && (
                                        <p className="text-sm text-[var(--text-secondary)] line-clamp-3 mb-3">
                                            {article.excerpt[language]}
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
