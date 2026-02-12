import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getArticleBySlug, type Article } from '../services/articleService';

export default function AboutDetailPage() {
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
                console.error('Failed to load article:', error);
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
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('landing.about.notFound')}</h2>
                    <button
                        onClick={() => navigate('/about')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('landing.about.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Back button */}
                <button
                    onClick={() => navigate('/about')}
                    className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors mb-8"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    {t('landing.about.backToList')}
                </button>

                {/* Thumbnail */}
                {article.thumbnail && (
                    <div className="aspect-video rounded-2xl overflow-hidden mb-8">
                        <img
                            src={article.thumbnail}
                            alt={article.title[language]}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Title & Meta */}
                <h1 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-4">
                    {article.title[language]}
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
                </div>

                {/* Content */}
                <div
                    className="prose prose-lg max-w-none text-[var(--text-primary)] leading-relaxed
                        [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto
                        [&_a]:text-[var(--accent-primary)] [&_a]:underline
                        [&_h1]:text-[var(--text-primary)] [&_h2]:text-[var(--text-primary)] [&_h3]:text-[var(--text-primary)]
                        [&_p]:text-[var(--text-primary)] [&_li]:text-[var(--text-primary)]
                        [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--accent-primary)] [&_blockquote]:pl-4 [&_blockquote]:italic
                        [&_table]:w-full [&_th]:bg-[var(--bg-secondary)] [&_th]:p-2 [&_td]:p-2 [&_td]:border [&_td]:border-[var(--border-primary)]"
                    dangerouslySetInnerHTML={{ __html: article.content[language] || '' }}
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
