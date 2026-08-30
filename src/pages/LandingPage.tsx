import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import StudioToolTile, { STUDIO_TOOLS } from '../components/studio/StudioToolTile';
import LandingHero from '../components/landing/LandingHero';
import ConnectBento from '../components/landing/ConnectBento';
import { fetchWithRetry } from '../services/apiRetry';
import { AssetQuality, cdnFromUrl, setLandingQuality } from '../services/cloudinaryAssets';
import { localizedText } from '../utils/localized';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Category to style mapping (Neon Terminal / Restrained strategy)
const categoryGradients: Record<string, string> = {
    'ai-basic': 'bg-green-950/40 text-green-400 border border-green-500/20',
    'ai-advanced': 'bg-purple-950/40 text-purple-400 border border-purple-500/20',
    'ai-studio': 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20',
    'ai-creative': 'bg-orange-950/40 text-orange-400 border border-orange-500/20'
};

// Level to translation key mapping
const levelKeys: Record<string, string> = {
    'beginner': 'courseCatalog.levels.beginner',
    'intermediate': 'courseCatalog.levels.intermediate',
    'advanced': 'courseCatalog.levels.advanced'
};

const levelBadgeStyles: Record<string, { bg: string; text: string; border: string }> = {
    'beginner': { bg: '#065f46', text: '#6ee7b7', border: '#34d399' },
    'intermediate': { bg: '#78350f', text: '#fcd34d', border: '#f59e0b' },
    'advanced': { bg: '#881337', text: '#fda4af', border: '#f43f5e' },
};

// ─── Inline icons (thay cho emoji để đồng nhất với màu chữ) ──────────
type IconProps = { className?: string };

const IconBook: React.FC<IconProps> = ({ className = 'h-3.5 w-3.5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
);

const IconClock: React.FC<IconProps> = ({ className = 'h-3.5 w-3.5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
);

const IconStar: React.FC<IconProps> = ({ className = 'h-3.5 w-3.5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.35 6.19 20.4 7.3 13.93 2.6 9.35l6.5-.95L12 2.5z" />
    </svg>
);

const IconUsers: React.FC<IconProps> = ({ className = 'h-3.5 w-3.5' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" /><circle cx="9" cy="7" r="3.5" /><path d="M22 20v-1.5a4 4 0 0 0-3-3.87" /><path d="M16.5 3.75a4 4 0 0 1 0 7" />
    </svg>
);

const IconSparkles: React.FC<IconProps> = ({ className = 'h-8 w-8' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" />
    </svg>
);

const IconArrow: React.FC<IconProps> = ({ className = 'h-4 w-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
    </svg>
);

const IconCheck: React.FC<IconProps> = ({ className = 'h-3 w-3' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 13 4 4L19 7" />
    </svg>
);

// ─── Section heading (eyebrow + title + optional action) ─────────────
interface SectionHeadingProps {
    eyebrow: string;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, subtitle, action }) => (
    <Reveal y={20} className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-3 max-w-[62ch]">
            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
                <span className="w-6 h-px bg-[var(--accent-primary)]" aria-hidden="true" />
                {eyebrow}
            </span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
            {subtitle && <p className="text-[var(--text-secondary)] leading-relaxed">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
    </Reveal>
);

// ─── Courses Slider Section (Split Layout) ───────────────────────────
interface CoursesSliderProps {
    courses: Course[];
    t: (key: string) => string;
    getLocalizedText: (text: { vi: string; en: string }) => string;
    formatPrice: (price: number) => string;
}

const CARD_WIDTH = 320;
const CARD_GAP = 24;

const CoursesSliderSection: React.FC<CoursesSliderProps> = ({
    courses, t, getLocalizedText, formatPrice
}) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [dragConstraintRight, setDragConstraintRight] = useState(0);

    const totalCards = courses.length;
    const maxIndex = Math.max(0, totalCards - 1);

    // Calculate drag constraint based on container width
    useEffect(() => {
        const updateConstraint = () => {
            if (sliderRef.current) {
                const containerWidth = sliderRef.current.parentElement?.clientWidth || 0;
                const totalSliderWidth = totalCards * (CARD_WIDTH + CARD_GAP) - CARD_GAP;
                setDragConstraintRight(Math.max(0, totalSliderWidth - containerWidth));
            }
        };
        updateConstraint();
        window.addEventListener('resize', updateConstraint);
        return () => window.removeEventListener('resize', updateConstraint);
    }, [totalCards]);

    const goTo = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(index, maxIndex));
        setActiveIndex(clamped);
    }, [maxIndex]);

    const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
        const threshold = CARD_WIDTH / 3;
        const velocity = info.velocity.x;
        if (info.offset.x < -threshold || velocity < -200) {
            goTo(activeIndex + 1);
        } else if (info.offset.x > threshold || velocity > 200) {
            goTo(activeIndex - 1);
        }
    }, [activeIndex, goTo]);

    const sliderX = -(activeIndex * (CARD_WIDTH + CARD_GAP));

    return (
        <div className="relative">
            {/* Background Banner Image — full-bleed, flush to the viewport's left edge
                (left: 50% - 50vw breaks out of the centered container). Extends right to
                ~half of the first card (424px = 200 ml + 40 arrow + 12 gap + 12 track pad
                + 160 half card) and starts slightly above the cards. Bottom overshoots so
                the section's overflow-hidden clips it exactly at the section bottom edge.
                On mobile it spans the full viewport width to keep the image proportions. */}
            <div
                className="block absolute z-0 overflow-hidden left-[calc(50%-50vw)] w-screen md:w-[calc(50vw-50%+424px)]"
                style={{
                    top: '-24px',
                    bottom: '-160px',
                    WebkitMaskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
                    maskImage: 'linear-gradient(to right, black 60%, transparent 100%)',
                }}
            >
                <picture>
                    <source
                        type="image/webp"
                        srcSet="https://res.cloudinary.com/dzchj4ysj/image/upload/v1783019388/landing/course-consulting.webp"
                    />
                    <img
                        src="https://res.cloudinary.com/dzchj4ysj/image/upload/v1783019391/landing/course-consulting-jpg.jpg"
                        alt="Course consulting"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        style={{
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
                            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
                        }}
                    />
                </picture>
            </div>

            {/* Main slider content — pushed right on desktop to leave room for banner + left arrow */}
            <div className="md:ml-[200px] relative z-[1]">
                {/* Arrow + Track + Arrow row */}
                <div className="flex items-center gap-3">
                    {/* Left Arrow — always rendered for layout, visibility toggled */}
                    <button
                        onClick={() => goTo(activeIndex - 1)}
                        className={`flex-shrink-0 w-10 h-10 rounded-full bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-primary)] text-[var(--text-primary)] items-center justify-center hover:bg-[var(--bg-card)]/90 hover:border-[var(--accent-primary)] transition-all cursor-pointer hidden md:flex ${
                            activeIndex <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                        aria-label="Previous"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Slider Track — visible rail background */}
                    <div className="courses-slider-track flex-1 min-w-0 overflow-hidden rounded-2xl" style={{ padding: '12px' }}>
                        <motion.div
                            ref={sliderRef}
                            className="flex cursor-grab active:cursor-grabbing"
                            style={{ gap: `${CARD_GAP}px` }}
                            drag="x"
                            dragConstraints={{ left: -dragConstraintRight, right: 0 }}
                            dragElastic={0.1}
                            onDragEnd={handleDragEnd}
                            animate={{ x: sliderX }}
                            transition={{
                                type: 'tween',
                                ease: [0.16, 1, 0.3, 1],
                                duration: 0.5
                            }}
                        >
                            {courses.map((course) => {
                                return (
                                    <Link
                                        key={course._id}
                                        to={`/courses/${course.slug}`}
                                        className="courses-slider-card flex-shrink-0 flex flex-col rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all duration-400"
                                        style={{ width: `${CARD_WIDTH}px` }}
                                        draggable={false}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative h-44 overflow-hidden">
                                            {course.thumbnail ? (
                                                <img
                                                    src={cdnFromUrl(course.thumbnail, 'w_640')}
                                                    alt={getLocalizedText(course.title)}
                                                    className="w-full h-full object-cover"
                                                    draggable={false}
                                                />
                                            ) : (
                                                <div className={`w-full h-full ${categoryGradients[course.category] || 'bg-slate-900'} flex items-center justify-center`}>
                                                    <IconSparkles className="h-10 w-10" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 to-transparent" />
                                            {/* Level Badge */}
                                            {(() => {
                                                const style = levelBadgeStyles[course.level] || levelBadgeStyles['beginner'];
                                                return (
                                                    <span
                                                        className="absolute top-3 left-3 px-2.5 py-1 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-widest shadow-md"
                                                        style={{
                                                            backgroundColor: style.bg,
                                                            color: style.text,
                                                            border: `2px solid ${style.border}`,
                                                        }}
                                                    >
                                                        {t(levelKeys[course.level] || 'courseCatalog.levels.beginner')}
                                                    </span>
                                                );
                                            })()}
                                            {/* Price Badge */}
                                            <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-[11px] font-black">
                                                {course.discount > 0 ? formatPrice(course.finalPrice) : formatPrice(course.price)}
                                            </span>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 flex flex-col flex-grow">
                                            <div className="space-y-2 flex-grow">
                                                <h3 className="text-base font-bold text-[var(--text-primary)] line-clamp-2 leading-snug">
                                                    {getLocalizedText(course.title)}
                                                </h3>
                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                                                    {getLocalizedText(course.description)}
                                                </p>
                                            </div>

                                            <div className="mt-3">
                                                <span className="w-full py-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-xs border border-[var(--accent-primary)]/20 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all flex items-center justify-center gap-1.5">
                                                    {t('landing.course.startLearning')}
                                                    <IconArrow className="h-3.5 w-3.5" />
                                                </span>
                                            </div>

                                            {/* Stats row */}
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-primary)] text-[10px] font-bold text-[var(--text-tertiary)]">
                                                <div className="flex gap-3">
                                                    <span className="inline-flex items-center gap-1"><IconBook className="h-3 w-3" /> {course.totalLessons} {t('landing.course.lessons')}</span>
                                                    <span className="inline-flex items-center gap-1"><IconClock className="h-3 w-3" /> {course.duration} {t('landing.course.hours')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 text-yellow-400">
                                                        <IconStar className="h-3 w-3" /> {course.rating > 0 ? course.rating.toFixed(1) : '—'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1"><IconUsers className="h-3 w-3" /> {course.enrolledCount}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </motion.div>
                    </div>

                    {/* Right Arrow — always rendered for layout, visibility toggled */}
                    <button
                        onClick={() => goTo(activeIndex + 1)}
                        className={`flex-shrink-0 w-10 h-10 rounded-full bg-[var(--bg-card)] backdrop-blur-md border border-[var(--border-primary)] text-[var(--text-primary)] items-center justify-center hover:bg-[var(--bg-card)]/90 hover:border-[var(--accent-primary)] transition-all cursor-pointer hidden md:flex ${
                            activeIndex >= maxIndex ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                        aria-label="Next"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Bottom row: Dots + Swipe hint */}
                <div className="flex items-center justify-center mt-5">
                    {/* Dot Indicators */}
                    <div className="flex gap-2.5 justify-center">
                        {courses.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === activeIndex
                                        ? 'w-7 h-3 bg-[var(--accent-primary)] shadow-[0_0_8px_var(--accent-primary)]'
                                        : 'w-3 h-3 bg-[var(--text-tertiary)] hover:bg-[var(--text-secondary)]'
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
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
    const loadCourses = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

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

    // Video / Asset Quality state
    const [videoQuality, setVideoQuality] = useState<AssetQuality>('high');

    // Fetch public system settings (video quality, etc.)
    useEffect(() => {
        const loadPublicSettings = async () => {
            try {
                const res = await fetchWithRetry(`${API_URL}/settings/public`);
                const data = await res.json();
                if (data.success && data.data?.landingVideoQuality) {
                    const q: AssetQuality = data.data.landingVideoQuality === 'standard' ? 'standard' : 'high';
                    setVideoQuality(q);
                    setLandingQuality(q);
                }
            } catch (err) {
                console.warn('Failed to load public settings, using default high quality:', err);
            }
        };
        loadPublicSettings();
    }, []);

    // Helper to get localized text
    const getLocalizedText = (text: { vi: string; en: string }) => localizedText(text, language);

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

    const navigateToProtectedPage = useCallback((path: string) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            setPendingNavigation(path);
            setShowLoginDialog(true);
        }
    }, [isAuthenticated, navigate]);

    const goToStudio = useCallback(() => navigate('/studio'), [navigate]);
    const goToGpuServer = useCallback(() => navigateToProtectedPage('/server'), [navigateToProtectedPage]);

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

    const footerColumns = [
        {
            title: t('landing.footer.exploreTitle'),
            links: [
                { label: t('landing.nav.academy'), to: '/courses' },
                { label: t('landing.nav.enterStudio'), to: '/studio' },
                { label: t('landing.nav.aiCloud'), to: '/server' },
            ],
        },
        {
            title: t('landing.footer.toolsTitle'),
            links: [
                { label: t('landing.toolsShowcase.crm.title'), to: '/studio/crm/subscription' },
                { label: t('landing.toolsShowcase.vocab.title'), to: '/studio/vocab' },
                { label: t('landing.toolsShowcase.skills.title'), to: '/studio/ai-skills' },
            ],
        },
        {
            title: t('landing.footer.companyTitle'),
            links: [
                { label: t('landing.nav.about'), to: '/about' },
                { label: t('landing.nav.services'), to: '/services' },
                { label: t('landing.nav.news'), to: '/news' },
            ],
        },
    ];

    return (
        <>
            <SEOHead
                title="Alpha Studio — AI Academy & Training Hub"
                description={desc}
                path="/"
                jsonLd={landingJsonLd}
            />

            <LandingHero
                stats={{ courses: courses.length, students: featuredStudents.length, partners: partners.length }}
                onExploreStudio={goToStudio}
                onOpenGpuServer={goToGpuServer}
                quality={videoQuality}
            />

            {/* Featured Courses Section */}
            <section className="py-20 border-t border-[var(--border-primary)] relative overflow-hidden bg-[var(--bg-tertiary)]">
                <div className="container mx-auto px-6">
                    <SectionHeading
                        eyebrow={t('landing.sections.coursesEyebrow')}
                        title={t('landing.courses.title')}
                        subtitle={t('landing.courses.subtitle')}
                        action={(
                            <HoverSpring scale={1.04} y={-2} className="inline-block">
                                <Link
                                    to="/courses"
                                    className="inline-flex items-center gap-2 py-3 px-7 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card-alpha)] backdrop-blur-sm hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]"
                                >
                                    {t('landing.courses.viewAll')}
                                    <IconArrow />
                                </Link>
                            </HoverSpring>
                        )}
                    />

                    {/* Loading State */}
                    {coursesLoading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden">
                                    <div className="h-44 bg-[var(--bg-tertiary)] animate-pulse" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-4 w-3/4 rounded bg-[var(--bg-tertiary)] animate-pulse" />
                                        <div className="h-3 w-full rounded bg-[var(--bg-tertiary)] animate-pulse" />
                                        <div className="h-3 w-2/3 rounded bg-[var(--bg-tertiary)] animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Error State */}
                    {coursesError && !coursesLoading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="text-center space-y-4">
                                <p className="text-[var(--text-error)]">{t('landing.courses.error')}</p>
                                <button
                                    onClick={loadCourses}
                                    className="py-2 px-4 rounded-xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold text-sm hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all"
                                >
                                    {t('common.retry')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* No Courses State */}
                    {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-[var(--border-secondary)] py-16 text-center text-[var(--text-secondary)]">
                            {t('landing.courses.noCourses')}
                        </div>
                    )}

                    {/* Split Layout: Left Banner + Right Slider */}
                    {!coursesLoading && !coursesError && courses.length > 0 && (
                        <CoursesSliderSection
                            courses={courses}
                            t={t}
                            getLocalizedText={getLocalizedText}
                            formatPrice={formatPrice}
                        />
                    )}
                </div>
            </section>

            {/* Tools Showcase Section — cùng ngôn ngữ thiết kế với hub /studio */}
            <section className="py-20 bg-[var(--bg-primary)] border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-primary)]/5 rounded-full blur-[160px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <SectionHeading
                        eyebrow={t('landing.sections.toolsEyebrow')}
                        title={t('landing.toolsShowcase.title')}
                        subtitle={t('landing.toolsShowcase.subtitle')}
                        action={(
                            <HoverSpring scale={1.05} y={-2} className="inline-block">
                                <button
                                    onClick={goToStudio}
                                    className="liquid-cta-hover inline-flex items-center gap-2 py-3 px-7 rounded-full border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]"
                                >
                                    {t('landing.toolsShowcase.explore')}
                                    <IconArrow />
                                </button>
                            </HoverSpring>
                        )}
                    />

                    <Reveal staggerChildren={0.12} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {STUDIO_TOOLS.map((tool) => (
                            <RevealItem key={tool.key}>
                                <StudioToolTile tool={tool} variant="compact" />
                            </RevealItem>
                        ))}
                    </Reveal>

                    {/* Dải dẫn về hub /studio — nơi có đủ cả công cụ sắp ra mắt */}
                    <Reveal y={24} className="mt-4">
                        <button
                            onClick={goToStudio}
                            className="group w-full flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 text-left rounded-2xl border border-dashed border-[var(--border-secondary)] bg-[var(--bg-card)] px-6 py-5 transition-colors duration-300 hover:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                        >
                            <span className="inline-flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--accent-primary)]">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h6v6H4zM14 6h6v6h-6zM4 16h6v4H4zM14 16h6v4h-6z" />
                                </svg>
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-base font-black tracking-tight text-[var(--text-primary)]">
                                    {t('landing.toolsShowcase.hubTitle')}
                                </span>
                                <span className="mt-1 block text-sm leading-relaxed text-[var(--text-secondary)]">
                                    {t('landing.toolsShowcase.hubDesc')}
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 flex-shrink-0 text-xs font-black uppercase tracking-wider text-[var(--accent-primary)]">
                                {t('landing.toolsShowcase.explore')}
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </span>
                        </button>
                    </Reveal>
                </div>
            </section>

            {/* Alpha Connect Section */}
            <section className="py-20 border-t border-[var(--border-primary)]">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <Reveal staggerChildren={0.12} className="space-y-6">
                        <RevealItem y={20}>
                            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
                                <span className="w-6 h-px bg-[var(--accent-primary)]" aria-hidden="true" />
                                {t('landing.sections.connectEyebrow')}
                            </span>
                        </RevealItem>
                        <RevealItem tag="h2" y={20} className="text-3xl md:text-5xl font-black tracking-tight text-[var(--text-primary)]">
                            {t('landing.features.title')} <span className="text-[var(--accent-primary)]">{t('landing.features.highlight')}</span>
                        </RevealItem>
                        <RevealItem tag="p" y={20} className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-[62ch]">
                            {t('landing.features.description')}
                        </RevealItem>
                        <RevealItem tag="ul" y={20} className="divide-y divide-[var(--border-primary)] border-y border-[var(--border-primary)]">
                            {[
                                t('landing.features.item1'),
                                t('landing.features.item2'),
                                t('landing.features.item3'),
                                t('landing.features.item4')
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 py-3.5 text-[var(--text-primary)] font-bold">
                                    <span className="w-6 h-6 flex-shrink-0 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center text-[var(--accent-primary)]">
                                        <IconCheck />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </RevealItem>
                        <RevealItem y={20}>
                            <HoverSpring scale={1.04} y={-2} className="inline-block">
                                <button
                                    onClick={() => navigateToProtectedPage('/workflow')}
                                    className="inline-flex items-center gap-2 py-3.5 px-8 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-black text-sm tracking-wide uppercase shadow-[0_12px_32px_var(--accent-shadow)] hover:bg-[var(--accent-primary-hover)] transition-all duration-300 active:scale-[0.98]"
                                >
                                    {t('landing.features.cta')}
                                    <IconArrow />
                                </button>
                            </HoverSpring>
                        </RevealItem>
                    </Reveal>

                    <Reveal y={30} className="relative">
                        <ConnectBento quality={videoQuality} />
                        <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-[var(--accent-primary)] rounded-full blur-[80px] opacity-25 -z-10" aria-hidden="true" />
                    </Reveal>
                </div>
            </section>

            {/* Student Showcase Section */}
            <section className="py-20 border-t border-[var(--border-primary)] relative overflow-hidden bg-[var(--bg-tertiary)]">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-secondary)]/10 rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <SectionHeading
                        eyebrow={t('landing.sections.showcaseEyebrow')}
                        title={t('landing.showcase.title')}
                        subtitle={t('landing.showcase.subtitle')}
                        action={(
                            <HoverSpring scale={1.05} y={-2} className="inline-block">
                                <button
                                    onClick={() => navigateToProtectedPage('/workflow')}
                                    className="liquid-cta-hover inline-flex items-center gap-2 py-3 px-7 rounded-full border border-[var(--border-secondary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all duration-300 text-sm font-bold text-[var(--accent-primary)]"
                                >
                                    {t('landing.showcase.cta')}
                                    <IconArrow />
                                </button>
                            </HoverSpring>
                        )}
                    />

                    {studentsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-[320px] rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] animate-pulse" />
                            ))}
                        </div>
                    ) : featuredStudents.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--border-secondary)] py-16 text-center text-[var(--text-secondary)]">
                            {language === 'vi' ? 'Chưa có học viên tiêu biểu' : 'No featured students yet'}
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
                                                <img src={cdnFromUrl(student.backgroundImage || student.work, "w_640")} alt="Work" />
                                            ) : (
                                                <div className="fallback-pic">
                                                    <IconSparkles className="h-10 w-10" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Student Avatar: Circular avatar overlay, only visible when hovered */}
                                        <div className="student-avatar-pic">
                                            {student.image ? (
                                                <img src={cdnFromUrl(student.image, 'w_256')} alt={student.name} />
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
                </div>
            </section>

            {/* Strategic Partners Section */}
            <section className="py-20 bg-[var(--bg-primary)] border-t border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-10 md:gap-14">
                        <Reveal y={20} className="w-full md:w-1/3 space-y-4">
                            <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
                                <span className="w-6 h-px bg-[var(--accent-primary)]" aria-hidden="true" />
                                {t('landing.sections.partnersEyebrow')}
                            </span>
                            <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">{t('landing.partners.title')}</h2>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                {t('landing.partners.subtitle')}
                            </p>
                            <button
                                onClick={() => navigateToProtectedPage('/workflow')}
                                className="text-[var(--accent-primary)] text-sm font-bold inline-flex items-center gap-2 hover:underline"
                            >
                                {t('landing.partners.join')}
                                <IconArrow />
                            </button>
                        </Reveal>
                        <div className="w-full md:w-2/3">
                            {partnersLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6" aria-busy="true">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <div key={i} className="aspect-square rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] animate-pulse" />
                                    ))}
                                </div>
                            ) : partners.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-[var(--border-secondary)] py-16 text-center text-[var(--text-tertiary)] text-sm">
                                    {language === 'vi' ? 'Chưa có đối tác nào' : 'No partners yet'}
                                </div>
                            ) : (
                                <Reveal staggerChildren={0.08} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {partners.map((partner) => (
                                        <RevealItem key={partner._id}>
                                            <HoverSpring scale={1.05} y={-4}>
                                                <Link
                                                    to={`/partners/${partner.slug}`}
                                                    className="relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 block bg-[var(--bg-card)]"
                                                >
                                                    <div className="absolute inset-0">
                                                        {(partner.backgroundImage || partner.logo?.startsWith('http')) ? (
                                                            <img
                                                                src={cdnFromUrl(partner.backgroundImage || partner.logo, "w_640")}
                                                                alt=""
                                                                className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-secondary)]/10" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent"></div>
                                                    </div>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                                                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)]/50 backdrop-blur-md flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300 overflow-hidden">
                                                            {partner.logo && partner.logo.startsWith('http') ? (
                                                                <img src={cdnFromUrl(partner.logo, 'w_320')} alt={partner.companyName} className="w-full h-full object-contain p-1" />
                                                            ) : (
                                                                <span className="text-sm font-black text-[var(--accent-primary)]">
                                                                    {partner.companyName.charAt(0).toUpperCase()}
                                                                </span>
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

            {/* Footer */}
            <footer className="pt-16 pb-10 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] mt-auto">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12">
                        <div className="space-y-4 lg:pr-8">
                            <div className="flex items-center gap-2">
                                <img src="/alpha-logo-animated.svg" alt="Alpha Studio" className="h-8 w-8 rounded-lg object-contain" />
                                <span className="text-sm font-bold text-[var(--text-primary)] tracking-widest">ALPHA STUDIO</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[38ch]">
                                {t('landing.footer.tagline')}
                            </p>
                        </div>

                        {footerColumns.map((column) => (
                            <nav key={column.title} aria-label={column.title} className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-tertiary)]">{column.title}</h3>
                                <ul className="space-y-2.5">
                                    {column.links.map((link) => (
                                        <li key={link.to}>
                                            <Link
                                                to={link.to}
                                                className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-center md:text-left">
                            © 2026 {t('landing.footer.copyright')}
                        </p>
                        <Link
                            to="/event-creative-city"
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)] hover:underline"
                        >
                            {t('landing.footer.eventCity')}
                        </Link>
                    </div>
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
