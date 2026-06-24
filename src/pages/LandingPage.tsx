import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import { useAuth } from '../auth/context';
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
import LiquidEther from '../components/ui/LiquidEther';



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
    const navigate = useNavigate();

    // Login dialog state (for content CTAs)
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

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
            {/* Hero Section */}
            <section className="relative py-10 flex flex-col items-center justify-center text-center px-6 overflow-hidden">
                {/* Fluid Interactive Canvas Background */}
                <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none">
                    <LiquidEther 
                        colors={['#61e8ff', '#8b7dff', '#000000']} 
                        mouseForce={15} 
                        cursorSize={100}
                    />
                </div>
                <motion.div 
                    animate={{ y: [0, -20, 0], x: [0, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -z-10"
                ></motion.div>
                <motion.div 
                    animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10"
                ></motion.div>

                <Reveal staggerChildren={0.15} delay={0.1} className="max-w-4xl space-y-10">
                    <RevealItem y={15}>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                            <span className="premium-blinking-dot"></span>
                            <span className="text-xs font-bold text-[var(--accent-primary)]">{t('landing.hero.badge')}</span>
                        </div>
                    </RevealItem>

                    <RevealItem tag="h1" y={25} className="text-5xl md:text-8xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight">
                        <TextReveal text={t('landing.hero.title1')} delay={0.1} /> <br />
                        <span className="text-gradient">
                            <TextReveal text={t('landing.hero.title2')} delay={0.4} />
                        </span>
                    </RevealItem>

                    <RevealItem tag="p" y={25} className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                        {t('landing.hero.subtitle')}
                    </RevealItem>

                    <RevealItem y={25} className="flex flex-wrap justify-center gap-5 pt-6">
                        <HoverSpring scale={1.05} y={-3} className="inline-block">
                            <button onClick={() => navigate('/studio')} className="liquid-cta-hover py-4 px-12 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-black rounded-2xl shadow-xl hover:bg-[var(--accent-secondary)] transition-all duration-300">
                                {t('landing.hero.exploreStudio')}
                            </button>
                        </HoverSpring>
                        <HoverSpring scale={1.05} y={-3} className="inline-block">
                            <button onClick={() => navigateToProtectedPage('/server')} className="liquid-cta-hover py-4 px-12 glass-card text-[var(--text-primary)] font-black rounded-2xl hover:border-[var(--accent-primary)] transition-all duration-300">
                                {t('landing.hero.gpuServer')}
                            </button>
                        </HoverSpring>
                    </RevealItem>
                </Reveal>
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
            <section className="py-16 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] relative overflow-hidden">
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
                            <HoverSpring scale={1.03} y={-6} className="h-full">
                                <div
                                    onClick={() => navigate('/studio/crm/subscription')}
                                    className="group glass-card rounded-xl p-6 border border-[var(--border-primary)] hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
                                >
                                    <div>
                                        <div className="p-2 rounded-lg mb-4 w-10 h-10 flex items-center justify-center bg-slate-900 border border-[var(--border-primary)] group-hover:scale-105 transition-transform duration-300">
                                            <img src="/crm-logo.png" alt="Alpha CRM" className="w-full h-full object-contain drop-shadow-sm rounded" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)] group-hover:text-emerald-400 transition-colors">
                                            {t('landing.toolsShowcase.crm.title')}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('landing.toolsShowcase.crm.desc')}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:gap-3 transition-all duration-300">
                                        {t('landing.toolsShowcase.explore')}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </HoverSpring>
                        </RevealItem>

                        {/* VocabFlip Card */}
                        <RevealItem className="h-full">
                            <HoverSpring scale={1.03} y={-6} className="h-full">
                                <div
                                    onClick={() => navigate('/studio/vocab')}
                                    className="group glass-card rounded-xl p-6 border border-[var(--border-primary)] hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
                                >
                                    <div>
                                        <div className="p-2 rounded-lg mb-4 w-10 h-10 flex items-center justify-center bg-slate-900 border border-[var(--border-primary)] group-hover:scale-105 transition-transform duration-300">
                                            <img src="/vocab/icons/Icon-192.png" alt="VocabFlip" className="w-full h-full object-contain drop-shadow-sm rounded" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)] group-hover:text-rose-400 transition-colors">
                                            {t('landing.toolsShowcase.vocab.title')}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('landing.toolsShowcase.vocab.desc')}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-sm font-bold text-rose-400 group-hover:gap-3 transition-all duration-300">
                                        {t('landing.toolsShowcase.explore')}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </HoverSpring>
                        </RevealItem>

                        {/* AI Skills Library Card */}
                        <RevealItem className="h-full">
                            <HoverSpring scale={1.03} y={-6} className="h-full">
                                <div
                                    onClick={() => navigate('/studio/skills')}
                                    className="group glass-card rounded-xl p-6 border border-[var(--border-primary)] hover:border-[var(--accent-primary)]/40 hover:shadow-[0_0_15px_rgba(97,232,255,0.15)] transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
                                >
                                    <div>
                                        <div className="p-2 rounded-lg mb-4 w-10 h-10 flex items-center justify-center bg-slate-900 border border-[var(--border-primary)] group-hover:scale-105 transition-transform duration-300">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-[var(--accent-primary)]">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                            {t('landing.toolsShowcase.skills.title')}
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('landing.toolsShowcase.skills.desc')}
                                        </p>
                                    </div>
                                    <div className="mt-8 flex items-center gap-2 text-sm font-bold text-[var(--accent-primary)] group-hover:gap-3 transition-all duration-300">
                                        {t('landing.toolsShowcase.explore')}
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </div>
                                </div>
                            </HoverSpring>
                        </RevealItem>
                    </Reveal>
                </div>
            </section>

            {/* Student Showcase Section */}
            <section className="py-16 border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <Reveal y={20} className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">{t('landing.showcase.title')}</h2>
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
                                    <HoverSpring scale={1.02} y={-6} className="h-full">
                                        <Link to={`/users/${student.id}`} className="glass-card rounded-2xl overflow-hidden group hover:shadow-[0_10px_20px_rgba(0,0,0,0.15)] transition-all duration-500 cursor-pointer block h-full">
                                            <div className="relative aspect-[4/3] overflow-hidden">
                                                {(student.backgroundImage || student.work) ? (
                                                    <img src={student.backgroundImage || student.work} alt="Work" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-950 border border-[var(--border-primary)] transition-transform duration-700 group-hover:scale-110" />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-90"></div>
                                                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {student.image ? (
                                                            <img src={student.image} alt={student.name} className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)] object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div className="text-left">
                                                            <h4 className="text-[var(--text-primary)] font-bold text-sm">{student.name}</h4>
                                                            <p className="text-[10px] text-[var(--accent-primary)] uppercase tracking-wide">{student.role}</p>
                                                        </div>
                                                    </div>
                                                    {student.hired && (
                                                        <span className="bg-green-500/20 text-green-400 text-[9px] font-black px-2 py-1 rounded-full border border-green-500/30 uppercase tracking-wider">
                                                            {t('landing.showcase.hired')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    </HoverSpring>
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
            <section className="py-16">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <Reveal staggerChildren={0.12} className="space-y-8">
                        <RevealItem tag="h2" y={20} className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            {t('landing.features.title')} <span className="text-gradient">{t('landing.features.highlight')}</span>
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
            <footer className="py-16 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] mt-auto">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <img src="/alpha-logo.png" alt="Alpha Studio" className="h-8 w-8 rounded-lg object-contain" />
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
