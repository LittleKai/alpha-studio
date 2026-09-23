import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { getArticleBySlug, trackArticleDownload, type Article } from '../services/articleService';
import SEOHead from '../components/ui/SEOHead';
import { localizedText } from '../utils/localized';
import { cdnFromUrl } from '../services/cloudinaryAssets';
import SectionRenderer, { isSectionEmpty, SECTION_PALETTES } from '../components/library/SectionRenderer';
import ImageLightbox from '../components/library/ImageLightbox';
import SparkleIcon from '../components/ui/SparkleIcon';
import { CommentSection } from '../components/shared';

/** Màu cho các mục cố định của mục lục (không thuộc bảng xoay vòng của section). */
const FIXED_COLORS = {
    content: '#8b5cf6',
    downloads: '#0ea5e9',
    comments: '#10b981'
};

export default function ServicesDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState('');

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

    // Tô sáng mục đang đọc — đo theo khung nhìn và gom về mỗi frame một lần,
    // cùng cách làm với trang chi tiết thư viện sự kiện và trang chi tiết skill.
    useEffect(() => {
        let frame: number | null = null;
        const measure = () => {
            frame = null;
            let current = '';
            document.querySelectorAll<HTMLElement>('[data-toc-anchor]').forEach(el => {
                if (el.getBoundingClientRect().top <= 200) current = el.id;
            });
            if (current) setActiveSection(current);
        };
        const onScroll = () => {
            if (frame === null) frame = window.requestAnimationFrame(measure);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        measure();
        return () => {
            window.removeEventListener('scroll', onScroll);
            if (frame !== null) window.cancelAnimationFrame(frame);
        };
    }, [loading, article]);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
    };

    /**
     * Bấm vào ảnh bất kỳ trong thân bài thì mở xem phóng to. Bắt theo kiểu uỷ
     * quyền vì ảnh nằm trong khối gallery lẫn trong chuỗi HTML của TinyMCE,
     * không gắn được onClick cho từng thẻ.
     */
    const openPreview = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'IMG') return;
        const img = target as HTMLImageElement;
        const src = img.currentSrc || img.src;
        if (src) setPreview(src);
    };

    const visibleSections = useMemo(
        () => (article?.sections || []).filter(s => !isSectionEmpty(s)),
        [article]
    );

    const body = article ? localizedText(article.content, language) : '';
    const attachments = article?.attachments || [];

    const tocEntries = useMemo(() => [
        ...visibleSections.map((section, idx) => ({
            id: `sec-${idx}`,
            label: section.title || t('landing.services.content'),
            color: SECTION_PALETTES[idx % SECTION_PALETTES.length].accent
        })),
        ...(body ? [{ id: 'article-content', label: t('landing.services.content'), color: FIXED_COLORS.content }] : []),
        ...(attachments.length > 0
            ? [{ id: 'downloads', label: t('landing.services.downloads'), color: FIXED_COLORS.downloads }]
            : []),
        ...(article ? [{ id: 'comments', label: t('landing.services.comments'), color: FIXED_COLORS.comments }] : [])
    ], [visibleSections, body, attachments.length, article, t]);

    // Tổng số ảnh trong bài, hiện ở dải thông tin đầu trang
    const imageCount = useMemo(
        () => visibleSections.reduce((n, s) => n + (s.kind === 'gallery' ? (s.images?.length || 0) : 0), 0),
        [visibleSections]
    );

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
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all cursor-pointer"
                    >
                        {t('landing.services.backToList')}
                    </button>
                </div>
            </div>
        );
    }

    const title = localizedText(article.title, language);
    const excerpt = localizedText(article.excerpt, language);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20">
            <SEOHead
                title={title}
                description={excerpt}
                ogImage={article.thumbnail}
                ogType="article"
                path={`/services/${slug}`}
                jsonLd={{
                    '@context': 'https://schema.org',
                    '@type': 'Article',
                    headline: title,
                    description: excerpt,
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

            {/* Ảnh bìa tràn viền, tiêu đề chồng lên — thay cho khối ảnh 16:9 cũ */}
            <header className="relative">
                {article.thumbnail && (
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={cdnFromUrl(article.thumbnail, 'w_1600')}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/85 to-[var(--bg-primary)]/60" />
                    </div>
                )}
                <div className="relative max-w-7xl mx-auto px-6 pt-8 pb-10">
                    {/* Nút quay lại là khối có viền và nền riêng — trên ảnh bìa
                        thì chữ trơn dễ chìm, người đọc không nhận ra bấm được */}
                    <button
                        onClick={() => navigate('/services')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 mb-8 rounded-xl text-sm font-bold cursor-pointer border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:-translate-x-0.5 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        {t('landing.services.backToList')}
                    </button>

                    <div className="max-w-3xl space-y-4">
                        {article.serviceCategory && (
                            <Link
                                to={`/services?cat=${article.serviceCategory.slug}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 transition-colors"
                            >
                                {article.serviceCategory.icon && (
                                    <span aria-hidden="true">{article.serviceCategory.icon}</span>
                                )}
                                {localizedText(article.serviceCategory.title, language)}
                            </Link>
                        )}

                        <h1 className="text-3xl md:text-5xl font-black leading-tight text-[var(--text-primary)]">
                            {title}
                        </h1>

                        {excerpt && (
                            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed">
                                {excerpt}
                            </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-tertiary)] pt-2">
                            {article.author && (
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                        {article.author.name?.charAt(0).toUpperCase()}
                                    </span>
                                    {article.author.name}
                                </span>
                            )}
                            <span>
                                {new Date(article.createdAt).toLocaleDateString(
                                    language === 'vi' ? 'vi-VN' : 'en-US',
                                    { year: 'numeric', month: 'long', day: 'numeric' }
                                )}
                            </span>
                            {imageCount > 0 && (
                                <span>{imageCount} {t('landing.services.imageCount')}</span>
                            )}
                            {attachments.length > 0 && (
                                <button
                                    onClick={() => scrollToSection('downloads')}
                                    className="text-[var(--accent-primary)] font-semibold hover:underline cursor-pointer"
                                >
                                    {attachments.length} {t('landing.services.downloads').toLowerCase()}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar dính theo khi cuộn — cột này có thể cao hơn màn hình nên
                    tự cuộn bên trong, nếu không phần dưới sẽ không với tới được */}
                <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:overscroll-contain lg:pr-1 detail-sidebar">
                    {tocEntries.length > 0 && (
                        <nav className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-primary)] space-y-3 shadow-md select-none">
                            <h2 className="text-xs font-bold uppercase tracking-wider px-3 pb-2 border-b border-[var(--border-primary)]/50 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                <span className="w-1.5 h-3.5 rounded-full bg-violet-500" />
                                {t('landing.services.toc')}
                            </h2>
                            <div className="flex flex-col gap-1.5 text-sm font-semibold">
                                {tocEntries.map(entry => (
                                    <button
                                        key={entry.id}
                                        onClick={() => scrollToSection(entry.id)}
                                        style={{
                                            '--accent-color': entry.color,
                                            '--accent-tint': `${entry.color}14`
                                        } as React.CSSProperties}
                                        className={`mean-bird-button w-full text-left px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                                            activeSection === entry.id ? 'active font-bold' : 'text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        <span className="truncate min-w-0">{entry.label}</span>
                                        <div className="dots_border"></div>
                                        <SparkleIcon />
                                    </button>
                                ))}
                            </div>
                        </nav>
                    )}

                    {article.tags.length > 0 && (
                        <div className="bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-primary)] shadow-sm">
                            <div className="flex flex-wrap gap-1.5">
                                {article.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/30 dark:border-rose-400/40 text-rose-700 dark:text-rose-200"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>

                <div className="lg:col-span-2 min-w-0 space-y-8 [&_img]:cursor-zoom-in" onClick={openPreview}>
                    {imageCount > 0 && (
                        <p className="text-xs text-[var(--text-tertiary)] italic">
                            {t('landing.services.openImage')}
                        </p>
                    )}

                    {visibleSections.map((section, idx) => (
                        <div
                            key={idx}
                            id={`sec-${idx}`}
                            data-toc-anchor
                            className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                        >
                            <SectionRenderer section={section} index={idx} />
                        </div>
                    ))}

                    {body && (
                        <div
                            id="article-content"
                            data-toc-anchor
                            className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                        >
                            <div
                                className="tinymce-content max-w-none text-[var(--text-primary)] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: body }}
                            />
                        </div>
                    )}

                    {/* Tệp tham khảo — chỉ tài liệu (.skp, .html…); ảnh xem thẳng trong bài */}
                    {attachments.length > 0 && (
                        <div
                            id="downloads"
                            data-toc-anchor
                            className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-sky-600 dark:text-sky-400">
                                    <span className="w-1.5 h-5 rounded-full bg-sky-500" />
                                    {t('landing.services.downloads')}
                                </h2>
                                {(article.downloadCount ?? 0) > 0 && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 tabular-nums">
                                        {article.downloadCount.toLocaleString()} {t('landing.services.downloadCount')}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)] mb-4 pl-3.5">
                                {t('landing.services.downloadsHint')}
                            </p>
                            <div className="space-y-2">
                                {attachments.map((file, idx) => (
                                    <a
                                        key={`${file.url}-${idx}`}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => trackArticleDownload(article._id)}
                                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-sky-500/60 hover:bg-sky-500/5 transition-colors group"
                                    >
                                        <span className="flex items-center gap-3 min-w-0">
                                            <svg className="w-5 h-5 shrink-0 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                            </svg>
                                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                                {file.name || t('landing.services.download')}
                                            </span>
                                        </span>
                                        <span className="text-xs text-[var(--text-tertiary)] shrink-0 group-hover:text-sky-500">
                                            {file.size || t('landing.services.download')}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bình luận cuối bài — dùng lại bộ bình luận của Prompt */}
                    <div
                        id="comments"
                        data-toc-anchor
                        className="scroll-mt-24 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm"
                    >
                        <CommentSection targetType="article" targetId={article._id} />
                    </div>
                </div>
            </div>

            {preview && <ImageLightbox src={preview} onClose={() => setPreview(null)} />}
        </div>
    );
}
