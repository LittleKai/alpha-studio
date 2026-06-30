import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { useAuth } from '../auth/context';
import { useTheme } from '../theme/context';
import type { FeaturedStudent } from '../types';
import Login from '../components/ui/Login';
import { getFeaturedCourses, Course } from '../services/courseService';
import { getPartners } from '../services/partnerService';
import type { Partner } from '../services/partnerService';
import { getFeaturedStudents } from '../services/featuredStudentsService';
import { motion } from 'framer-motion';
import Reveal, { RevealItem } from '../components/motion/Reveal';
import HoverSpring from '../components/motion/HoverSpring';
import TextReveal from '../components/motion/TextReveal';
import { ToolShowcaseCard } from '../components/studio/ToolShowcaseCard';



// Category to style mapping (Neon Terminal / Restrained strategy)
const categoryGradients: Record<string, string> = {
    'ai-basic': 'bg-green-950/40 text-green-400 border border-green-500/20',
    'ai-advanced': 'bg-purple-950/40 text-purple-400 border border-purple-500/20',
    'ai-studio': 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20',
    'ai-creative': 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
};

// Category to icon mapping
const categoryIcons: Record<string, string> = {
    'ai-basic': '📚',
    'ai-advanced': '💎',
    'ai-studio': '🎬',
    'ai-creative': '✨'
};

// Level to translation key mapping
const levelKeys: Record<string, string> = {
    'beginner': 'courseCatalog.levels.beginner',
    'intermediate': 'courseCatalog.levels.intermediate',
    'advanced': 'courseCatalog.levels.advanced'
};

const LandingPage: React.FC = () => {
    const { t, language } = useTranslation();
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Login dialog state (for content CTAs)
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    // Scroll indicator state
    const [showScrollIndicator, setShowScrollIndicator] = useState(true);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);
            if (currentScrollY > window.innerHeight * 0.5) {
                setShowScrollIndicator(false);
            } else {
                setShowScrollIndicator(true);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Courses state
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    // Partners state
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);

    // Featured students state
    const [featuredStudents, setFeaturedStudents] = useState<FeaturedStudent[]>([]);
    const [studentsLoading, setStudentsLoading] = useState(true);

    // Fetch featured courses
    useEffect(() => {
        const loadCourses = async () => {
            try {
                setCoursesLoading(true);
                setCoursesError(null);
                const response = await getFeaturedCourses(6);
                setCourses(response.data);
            } catch (err) {
                console.error('Failed to fetch courses:', err);
                setCoursesError(err instanceof Error ? err.message : 'Failed to load courses');
            } finally {
                setCoursesLoading(false);
            }
        };
        loadCourses();
    }, []);

    // Fetch featured partners
    useEffect(() => {
        const loadPartners = async () => {
            try {
                setPartnersLoading(true);
                const response = await getPartners({ featured: true, status: 'published', limit: 10, sort: 'order' });
                setPartners(response.data);
            } catch (err) {
                console.error('Failed to fetch partners:', err);
            } finally {
                setPartnersLoading(false);
            }
        };
        loadPartners();
    }, []);

    // Fetch featured students
    useEffect(() => {
        const loadStudents = async () => {
            try {
                setStudentsLoading(true);
                const data = await getFeaturedStudents();
                setFeaturedStudents(data);
            } catch (err) {
                console.error('Failed to fetch featured students:', err);
            } finally {
                setStudentsLoading(false);
            }
        };
        loadStudents();
    }, []);

    // Helper to get localized text
    const getLocalizedText = (text: { vi: string; en: string }) => {
        return language === 'vi' ? text.vi : text.en;
    };

    // Format price in credits
    const formatPrice = (price: number) => {
        if (price === 0) return t('landing.courses.free');
        return `${price.toLocaleString()} Credits`;
    };

    const handleLoginSuccess = () => {
        setShowLoginDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleCloseLoginDialog = () => {
        setShowLoginDialog(false);
        setPendingNavigation(null);
    };

    const navigateToProtectedPage = (path: string) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            setPendingNavigation(path);
            setShowLoginDialog(true);
        }
    };

    const desc = language === 'vi'
        ? 'Học AI thực chiến cùng Alpha Studio. Khóa học AI sáng tạo, công cụ AI Studio chuyên nghiệp, và cộng đồng freelancer hàng đầu Việt Nam.'
        : 'Master AI with Alpha Studio. Creative AI courses, professional AI Studio tools, and Vietnam\'s top freelancer community.';

    const landingJsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                name: 'Alpha Studio',
                url: 'https://giaiphapsangtao.com',
                logo: {
                    '@type': 'ImageObject',
                    url: 'https://giaiphapsangtao.com/alpha-logo-2.png'
                }
            },
            {
                '@type': 'WebSite',
                name: 'Alpha Studio',
                url: 'https://giaiphapsangtao.com',
                potentialAction: {
                    '@type': 'SearchAction',
                    target: {
                        '@type': 'EntryPoint',
                        urlTemplate: 'https://giaiphapsangtao.com/courses?search={search_term_string}'
                    },
                    'query-input': 'required name=search_term_string'
                }
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Alpha Studio — AI Academy & Training Hub"
                description={desc}
                path="/"
                jsonLd={landingJsonLd}
            />
            {/* Hero Section - Event Gate Redesign based on image.png */}
            {/* Responsive Hero Background — 5 aspect ratios for all media */}
            <style dangerouslySetInnerHTML={{__html: `
                /* ── Mobile portrait (< 480px) → 9:16 ── */
                :root {
                    --hero-bg: url('/images/hero-gate-9x16.webp?v=2');
                }
                /* ── Large phone / small tablet portrait (480–767px) → 4:5 ── */
                @media (min-width: 480px) {
                    :root { --hero-bg: url('/images/hero-gate-4x5.webp?v=2'); }
                }
                /* ── Tablet portrait / landscape (768–1023px) → 1:1 ── */
                @media (min-width: 768px) {
                    :root { --hero-bg: url('/images/hero-gate-1x1.webp?v=2'); }
                }
                /* ── Laptop & Desktop (1024px+) → 16:9 ── */
                @media (min-width: 1024px) {
                    :root { --hero-bg: url('/images/hero-gate-16x9.webp?v=2'); }
                }
                /* ── Ultrawide / large desktop (1600px+) → 21:9 ── */
                @media (min-width: 1600px) {
                    :root { --hero-bg: url('/images/hero-gate-21x9.webp?v=2'); }
                }
            `}} />
            <section 
                className="relative w-full min-h-[100dvh] flex items-center justify-center px-6 overflow-hidden border-b border-[var(--border-primary)] transition-colors duration-300"
                style={{
                    backgroundImage: 'var(--hero-bg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                {/* Theme-aware darkening overlay */}
                <div className={`absolute inset-0 transition-opacity duration-300 -z-10 ${
                    theme === 'dark' 
                        ? 'bg-gradient-to-b from-[#07111f]/85 via-[#07111f]/65 to-[#07111f]/90' 
                        : 'bg-white/10'
                }`} />

                {/* Central Floating Glassmorphic Card */}
                <Reveal staggerChildren={0.12} delay={0.05} className="z-10 w-full max-w-[800px] mx-auto px-6 py-10 md:py-14 text-center rounded-[20px] border border-white/15 bg-gradient-to-br from-slate-950/70 via-slate-950/50 to-indigo-950/20 backdrop-blur-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.18)] flex flex-col items-center justify-center space-y-6 md:space-y-8">
                    <RevealItem tag="h1" y={15} className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.15] tracking-tight text-white uppercase select-none">
                        <TextReveal text={t('landing.hero.title1')} delay={0.05} /> <br />
                        <span className="text-white font-black">
                            <TextReveal text={t('landing.hero.title2')} delay={0.25} />
                        </span>
                    </RevealItem>

                    <RevealItem tag="p" y={15} className="text-sm md:text-base lg:text-lg font-medium leading-relaxed text-white max-w-[65ch] mx-auto">
                        {t('landing.hero.subtitle')}
                    </RevealItem>

                    <RevealItem y={15} className="flex flex-wrap justify-center gap-5 pt-2 w-full">
                        <HoverSpring scale={1.03} y={-2} className="inline-block">
                            <button 
                                onClick={() => navigate('/studio')} 
                                className="py-3 px-8 font-black text-xs md:text-sm rounded-full bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-[var(--bg-primary)] tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-lg shadow-cyan-500/20"
                            >
                                {t('landing.hero.exploreStudio')}
                            </button>
                        </HoverSpring>
                        <HoverSpring scale={1.03} y={-2} className="inline-block">
                            <button 
                                onClick={() => navigateToProtectedPage('/server')} 
                                className="py-3 px-8 font-black text-xs md:text-sm rounded-full border border-white/35 hover:border-white hover:bg-white/10 text-white tracking-wider uppercase transition-all duration-300 cursor-pointer"
                            >
                                {t('landing.hero.gpuServer')}
                            </button>
                        </HoverSpring>
                    </RevealItem>
                </Reveal>

                {/* Bottom Scroll Indicator - Sticky fade linked to scroll position */}
                {showScrollIndicator && (
                    <div 
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 select-none z-10 hidden md:flex hover:opacity-100 transition-opacity duration-300"
                        style={{
                            opacity: Math.max(0, 0.8 - (scrollY / (window.innerHeight * 0.5)) * 0.8),
                            pointerEvents: scrollY > 50 ? 'none' : 'auto'
                        }}
                    >
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes scroll-dot-slide {
                                0% { transform: translateY(0); opacity: 0; }
                                20% { opacity: 1; }
                                80% { opacity: 1; }
                                100% { transform: translateY(14px); opacity: 0; }
                            }
                            .scroll-mouse-glow {
                                box-shadow: 0 0 15px rgba(97, 232, 255, 0.15), inset 0 0 5px rgba(255, 255, 255, 0.15);
                                background: rgba(7, 17, 31, 0.4);
                                backdrop-filter: blur(6px);
                            }
                        `}} />
                        <div className="w-6 h-10 md:w-7 md:h-12 rounded-full border-2 border-white/30 flex justify-center p-1.5 scroll-mouse-glow transition-all duration-300 hover:border-[var(--accent-primary)]/50">
                            <div 
                                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[var(--accent-primary)]"
                                style={{ animation: 'scroll-dot-slide 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite' }}
                            />
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-white tracking-[0.25em] md:tracking-[0.35em] uppercase text-center drop-shadow-md">
                            {t('landing.hero.scrollDown')}
                        </span>
                    </div>
                )}
            </section>

            {/* Featured Courses Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="flex justify-between items-end mb-16">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.courses.title')}</h2>
                            <p className="text-[var(--text-secondary)]">{t('landing.courses.subtitle')}</p>
                        </div>
                        <div className="hidden md:block">
                            <Link to="/courses" className="text-[11px] font-bold text-[var(--accent-primary)] border-b border-[var(--accent-primary)] pb-1 cursor-pointer hover:opacity-80 transition-opacity">
                                {t('landing.courses.viewAll')}
                            </Link>
                        </div>
                    </Reveal>

                    {/* Loading State */}
                    {coursesLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                <p className="text-[var(--text-secondary)]">{t('landing.courses.loading')}</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {coursesError && !coursesLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <p className="text-red-400">{t('landing.courses.error')}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="py-2 px-4 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* No Courses State */}
                    {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="flex items-center justify-center py-20">
                            <p className="text-[var(--text-secondary)]">{t('landing.courses.noCourses')}</p>
                        </div>
                    )}

                    {/* Courses Grid */}
                    {!coursesLoading && !coursesError && courses.length > 0 && (
                        <Reveal staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <RevealItem key={course._id}>
                                    <HoverSpring scale={1.02} y={-6} className="h-full">
                                        <Link
                                            to={`/courses/${course.slug}`}
                                            className="group glass-card rounded-xl overflow-hidden hover:bg-[var(--bg-card)] transition-all duration-500 cursor-pointer relative flex flex-col h-full"
                                        >
                                            {/* Thumbnail */}
                                            {course.thumbnail ? (
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={getLocalizedText(course.title)}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-60"></div>
                                                    {/* Level Badge */}
                                                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[var(--bg-tertiary)]/80 backdrop-blur-sm border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--accent-primary)]">
                                                        {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                                                    </span>
                                                    {/* Price Badge */}
                                                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-[11px] font-black">
                                                        {course.discount > 0 ? formatPrice(course.finalPrice) : formatPrice(course.price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className={`relative h-48 ${categoryGradients[course.category] || 'bg-slate-900 border-b border-[var(--border-primary)]'} flex items-center justify-center`}>
                                                    <span className="text-6xl">{categoryIcons[course.category] || '📚'}</span>
                                                    {/* Level Badge */}
                                                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-white">
                                                        {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                                                    </span>
                                                    {/* Price Badge */}
                                                    <span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white text-[var(--accent-primary)] text-[11px] font-black">
                                                        {course.discount > 0 ? formatPrice(course.finalPrice) : formatPrice(course.price)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="p-6 flex flex-col flex-grow">
                                                <div className="space-y-3 flex-grow">
                                                    <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors line-clamp-2">
                                                        {getLocalizedText(course.title)}
                                                    </h3>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                                        {getLocalizedText(course.description)}
                                                    </p>
                                                </div>

                                                <div className="mt-4">
                                                    <span className="w-full py-2.5 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all flex items-center justify-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                        </svg>
                                                        {t('landing.course.startLearning')}
                                                    </span>
                                                </div>

                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-[var(--border-primary)] text-[11px] font-bold text-[var(--text-tertiary)]">
                                                    <div className="flex gap-4">
                                                        <span>⏱ {course.duration} {t('landing.course.hours')}</span>
                                                        <span>📚 {course.totalLessons} {t('landing.course.lessons')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {course.rating > 0 ? (
                                                            <span className="flex items-center gap-1 text-yellow-400">
                                                                ⭐ {course.rating.toFixed(1)}
                                                                <span className="text-[var(--text-tertiary)]">({course.reviewCount})</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-[var(--text-tertiary)]">⭐ —</span>
                                                        )}
                                                        <span>👥 {course.enrolledCount} {t('landing.courses.enrolled')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </HoverSpring>
                                </RevealItem>
                            ))}
                        </Reveal>
                    )}

                    {/* Mobile View All Link */}
                    <div className="md:hidden mt-8 text-center">
                        <Link to="/courses" className="py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-sm font-bold text-[var(--accent-primary)]">
                            {t('landing.courses.viewAll')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Tools Showcase Section */}
            <section className="py-10 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-primary)]/5 rounded-full blur-[160px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-[var(--text-primary)]">
                            {t('landing.toolsShowcase.title')}
                        </h2>
                        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                            {t('landing.toolsShowcase.subtitle')}
                        </p>
                    </Reveal>

                    <Reveal staggerChildren={0.12} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Alpha CRM Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="crm-card"
                                onClick={() => navigate('/studio/crm/subscription')}
                                logo={<img src="/crm-logo.png" alt="Alpha CRM" />}
                                previewImage="/crm-preview.png"
                                title={t('landing.toolsShowcase.crm.title')}
                                desc={t('landing.toolsShowcase.crm.desc')}
                                stats={[
                                    { bigText: '100+', regularText: language === 'vi' ? 'Chiến dịch' : 'Campaigns' },
                                    { bigText: '14 Ngày', regularText: language === 'vi' ? 'Dùng thử' : 'Trial' },
                                    { bigText: 'Web/App', regularText: language === 'vi' ? 'Đa nền tảng' : 'Platform' }
                                ]}
                            />
                        </RevealItem>

                        {/* VocabFlip Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="vocab-card"
                                onClick={() => navigate('/studio/vocab')}
                                logo={<img src="/vocab/icons/Icon-192.png" alt="VocabFlip" />}
                                previewImage="/images/vocab/vocab-preview.png"
                                title={t('landing.toolsShowcase.vocab.title')}
                                desc={t('landing.toolsShowcase.vocab.desc')}
                                stats={[
                                    { bigText: 'Smart', regularText: language === 'vi' ? 'Học từ vựng' : 'Study' },
                                    { bigText: 'Win/Apk', regularText: language === 'vi' ? 'Hỗ trợ' : 'Supports' },
                                    { bigText: 'Shared', regularText: language === 'vi' ? 'Thư viện' : 'Library' }
                                ]}
                            />
                        </RevealItem>

                        {/* AI Skills Library Card */}
                        <RevealItem className="h-full">
                            <ToolShowcaseCard
                                cardClass="skills-card"
                                onClick={() => navigate('/studio/skills')}
                                logo={
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-white">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                }
                                previewImage="/skills-preview.png"
                                title={t('landing.toolsShowcase.skills.title')}
                                desc={t('landing.toolsShowcase.skills.desc')}
                                stats={[
                                    { bigText: '20+', regularText: language === 'vi' ? 'Thực chiến' : 'Skills' },
                                    { bigText: 'Daily', regularText: language === 'vi' ? 'Cập nhật' : 'Updates' },
                                    { bigText: 'AI-Gen', regularText: language === 'vi' ? 'Tài nguyên' : 'Resources' }
                                ]}
                            />
                        </RevealItem>
                    </Reveal>
                </div>
            </section>

            {/* Student Showcase Section */}
            <section className="py-10 border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="text-center mb-10 space-y-4">
                        <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.showcase.title')}</h2>
                        <p className="text-[var(--text-secondary)]">{t('landing.showcase.subtitle')}</p>
                    </Reveal>

                    {studentsLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <Reveal staggerChildren={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredStudents.map((student, idx) => (
                                <RevealItem key={idx}>
                                    <Link to={`/users/${student.id}`} className="student-card group">
                                        {/* Contact Button */}
                                        <div 
                                            className="contact-btn" 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (student.socials?.linkedin) {
                                                    window.open(student.socials.linkedin, '_blank');
                                                } else if (student.socials?.facebook) {
                                                    window.open(student.socials.facebook, '_blank');
                                                } else {
                                                    navigate(`/users/${student.id}`);
                                                }
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                                <polyline points="22,6 12,13 2,6"></polyline>
                                            </svg>
                                        </div>

                                        {/* Hired badge */}
                                        {student.hired && (
                                            <div className="hired-badge">
                                                {t('landing.showcase.hired')}
                                            </div>
                                        )}

                                        {/* Profile Pic: Student work image (Main background) */}
                                        <div className="profile-pic">
                                            {(student.backgroundImage || student.work) ? (
                                                <img src={student.backgroundImage || student.work} alt="Work" />
                                            ) : (
                                                <div className="fallback-pic">
                                                    <span>🎨</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Student Avatar: Circular avatar overlay, only visible when hovered */}
                                        <div className="student-avatar-pic">
                                            {student.image ? (
                                                <img src={student.image} alt={student.name} />
                                            ) : (
                                                <div className="avatar-fallback">
                                                    <span>{student.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bottom Slide Up Content */}
                                        <div className="bottom">
                                            <div className="content">
                                                <span className="name">{student.name}</span>
                                                <span className="role-text">{student.role}</span>
                                                <span className="about-me line-clamp-2">
                                                    {student.bio || (language === 'vi' ? 'Học viên tiêu biểu tại Alpha Studio với nhiều tác phẩm xuất sắc.' : 'Featured student at Alpha Studio with outstanding works.')}
                                                </span>
                                                {/* Skills tags */}
                                                {student.skills && student.skills.length > 0 && (
                                                    <div className="skills-container">
                                                        {student.skills.slice(0, 3).map((skill, sIdx) => (
                                                            <span key={sIdx} className="skill-tag">{skill}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="bottom-bottom">
                                                <button className="view-profile-btn">
                                                    {t('landing.showcase.viewProfile')}
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </RevealItem>
                            ))}
                        </Reveal>
                    )}

                    <Reveal y={20} delay={0.1} className="mt-12 text-center">
                        <HoverSpring scale={1.05} y={-2} className="inline-block">
                            <button onClick={() => navigateToProtectedPage('/workflow')} className="liquid-cta-hover py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]">
                                {t('landing.showcase.cta')}
                            </button>
                        </HoverSpring>
                    </Reveal>
                </div>
            </section>

            {/* Strategic Partners Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                        <Reveal y={20} className="w-full md:w-1/3 space-y-4 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">{t('landing.partners.title')}</h2>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                {t('landing.partners.subtitle')}
                            </p>
                            <button onClick={() => navigateToProtectedPage('/workflow')} className="text-[var(--accent-primary)] text-sm font-bold inline-flex items-center gap-2 hover:underline">
                                {t('landing.partners.join')} →
                            </button>
                        </Reveal>
                        <div className="w-full md:w-2/3">
                            {partnersLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                                </div>
                            ) : partners.length === 0 ? (
                                <div className="text-center py-12 text-[var(--text-tertiary)] text-sm">
                                    {language === 'vi' ? 'Chưa có đối tác nào' : 'No partners yet'}
                                </div>
                            ) : (
                                <Reveal staggerChildren={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {partners.map((partner) => (
                                        <RevealItem key={partner._id}>
                                            <HoverSpring scale={1.05} y={-4}>
                                                <Link
                                                    to={`/partners/${partner.slug}`}
                                                    className="relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 block"
                                                >
                                                    <div className="absolute inset-0">
                                                        <img src={partner.backgroundImage || partner.logo || "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop"} alt={partner.companyName} className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
                                                    </div>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]/50 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                                            {partner.logo && partner.logo.startsWith('http') ? (
                                                                <img src={partner.logo} alt={partner.companyName} className="w-full h-full object-contain p-1" />
                                                            ) : (
                                                                <span className="text-2xl">{partner.logo || '🤝'}</span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors line-clamp-2">{partner.companyName}</span>
                                                    </div>
                                                </Link>
                                            </HoverSpring>
                                        </RevealItem>
                                    ))}
                                </Reveal>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="py-10">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <Reveal staggerChildren={0.12} className="space-y-6">
                        <RevealItem tag="h2" y={20} className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            {t('landing.features.title')} <span className="text-[var(--accent-primary)]">{t('landing.features.highlight')}</span>
                        </RevealItem>
                        <RevealItem tag="p" y={20} className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            {t('landing.features.description')}
                        </RevealItem>
                        <RevealItem tag="ul" y={20} className="space-y-4">
                            {[
                                t('landing.features.item1'),
                                t('landing.features.item2'),
                                t('landing.features.item3'),
                                t('landing.features.item4')
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-[var(--text-primary)] font-bold">
                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] text-xs">✓</div>
                                    {item}
                                </li>
                            ))}
                        </RevealItem>
                        <RevealItem y={20}>
                            <HoverSpring scale={1.05} y={-2} className="inline-block">
                                <button onClick={() => navigateToProtectedPage('/workflow')} className="liquid-cta-hover py-4 px-10 glass-card rounded-2xl text-[var(--accent-primary)] font-black hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all duration-300">
                                    {t('landing.features.cta')}
                                </button>
                            </HoverSpring>
                        </RevealItem>
                    </Reveal>
                    <Reveal y={30} scale={0.95} className="relative">
                        <div className="aspect-square glass-card rounded-[40px] flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {[1, 2, 3, 4].map(i => (
                                    <motion.div 
                                        key={i} 
                                        whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                                        className={`h-40 rounded-3xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] flex items-center justify-center text-4xl cursor-pointer hover:bg-[var(--accent-primary)]/10 transition-colors`}
                                    >
                                        {i === 1 ? '🎨' : i === 2 ? '📂' : i === 3 ? '⚙️' : '💻'}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent-primary)] rounded-full blur-[60px] opacity-30"></div>
                    </Reveal>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/alpha-logo-animated.svg" alt="Alpha Studio" className="h-8 w-8 rounded-lg object-contain" />
                        <span className="text-sm font-bold text-[var(--text-primary)] tracking-widest">ALPHA STUDIO ACADEMY</span>
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest">
                        © 2026 {t('landing.footer.copyright')}
                    </p>
                </div>
            </footer>

            {/* Login Dialog */}
            {showLoginDialog && (
                <Login onLoginSuccess={handleLoginSuccess} onClose={handleCloseLoginDialog} />
            )}
        </>
    );
};

export default LandingPage;
