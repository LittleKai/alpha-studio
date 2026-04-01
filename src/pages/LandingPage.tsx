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

// Category to gradient color mapping
const categoryGradients: Record<string, string> = {
    'ai-basic': 'from-green-600 to-emerald-500',
    'ai-advanced': 'from-purple-600 to-pink-500',
    'ai-studio': 'from-blue-600 to-cyan-500',
    'ai-creative': 'from-orange-500 to-red-500'
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
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-primary)]/10 rounded-full blur-[120px] -z-10"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10"></div>

                <div className="max-w-4xl space-y-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-primary)]"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)]">{t('landing.hero.badge')}</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black text-[var(--text-primary)] leading-[1.1] tracking-tight">
                        {t('landing.hero.title1')} <br />
                        <span className="text-gradient">{t('landing.hero.title2')}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
                        {t('landing.hero.subtitle')}
                    </p>

                    <div className="flex flex-wrap justify-center gap-5 pt-6">
                        <button onClick={() => navigateToProtectedPage('/studio')} className="py-4 px-12 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-black rounded-2xl shadow-xl hover:bg-[var(--accent-secondary)] transition-all">
                            {t('landing.hero.exploreStudio')}
                        </button>
                        <button onClick={() => navigateToProtectedPage('/server')} className="py-4 px-12 glass-card text-[var(--text-primary)] font-black rounded-2xl hover:border-[var(--accent-primary)] transition-all">
                            {t('landing.hero.gpuServer')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Featured Courses Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <div className="flex justify-between items-end mb-16">
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-[var(--text-primary)]">{t('landing.courses.title')}</h2>
                            <p className="text-[var(--text-secondary)]">{t('landing.courses.subtitle')}</p>
                        </div>
                        <div className="hidden md:block">
                            <Link to="/courses" className="text-[11px] font-bold text-[var(--accent-primary)] border-b border-[var(--accent-primary)] pb-1 cursor-pointer hover:opacity-80 transition-opacity">
                                {t('landing.courses.viewAll')}
                            </Link>
                        </div>
                    </div>

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <Link
                                    key={course._id}
                                    to={`/courses/${course.slug}`}
                                    className="group glass-card rounded-[32px] overflow-hidden hover:bg-[var(--bg-card)] transition-all duration-500 cursor-pointer relative flex flex-col h-full"
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
                                        <div className={`relative h-48 bg-gradient-to-br ${categoryGradients[course.category] || 'from-purple-600 to-pink-500'} flex items-center justify-center`}>
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
                            ))}
                        </div>
                    )}

                    {/* Mobile View All Link */}
                    <div className="md:hidden mt-8 text-center">
                        <Link to="/courses" className="py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-sm font-bold text-[var(--accent-primary)]">
                            {t('landing.courses.viewAll')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Student Showcase Section */}
            <section className="py-16 border-t border-[var(--border-primary)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10"></div>
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]">{t('landing.showcase.title')}</h2>
                        <p className="text-[var(--text-secondary)]">{t('landing.showcase.subtitle')}</p>
                    </div>

                    {studentsLoading ? (
                        <div className="flex justify-center py-16">
                            <div className="w-10 h-10 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredStudents.map((student, idx) => (
                                <Link to={`/users/${student.id}`} key={idx} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        {(student.backgroundImage || student.work) ? (
                                            <img src={student.backgroundImage || student.work} alt="Work" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 transition-transform duration-700 group-hover:scale-110" />
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
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center">
                        <button onClick={() => navigateToProtectedPage('/workflow')} className="py-3 px-8 rounded-full border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-all text-sm font-bold text-[var(--accent-primary)]">
                            {t('landing.showcase.cta')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Strategic Partners Section */}
            <section className="py-10 bg-[var(--bg-secondary)]/50 border-y border-[var(--border-primary)]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                        <div className="w-full md:w-1/3 space-y-4 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[var(--text-primary)]">{t('landing.partners.title')}</h2>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                {t('landing.partners.subtitle')}
                            </p>
                            <button onClick={() => navigateToProtectedPage('/workflow')} className="text-[var(--accent-primary)] text-sm font-bold inline-flex items-center gap-2 hover:underline">
                                {t('landing.partners.join')} →
                            </button>
                        </div>
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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {partners.map((partner) => (
                                        <Link
                                            key={partner._id}
                                            to={`/partners/${partner.slug}`}
                                            className="relative group cursor-pointer aspect-square rounded-2xl overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300"
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
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Showcase */}
            <section className="py-16">
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black text-[var(--text-primary)]">
                            {t('landing.features.title')} <span className="text-gradient">{t('landing.features.highlight')}</span>
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed">
                            {t('landing.features.description')}
                        </p>
                        <ul className="space-y-4">
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
                        </ul>
                        <button onClick={() => navigateToProtectedPage('/workflow')} className="py-4 px-10 glass-card rounded-2xl text-[var(--accent-primary)] font-black hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all">
                            {t('landing.features.cta')}
                        </button>
                    </div>
                    <div className="relative">
                        <div className="aspect-square glass-card rounded-[40px] flex items-center justify-center p-12 overflow-hidden shadow-2xl">
                            <div className="grid grid-cols-2 gap-4 w-full">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`h-40 rounded-3xl bg-[var(--bg-tertiary)]/30 border border-[var(--border-primary)] flex items-center justify-center text-4xl animate-pulse`}>
                                        {i === 1 ? '🎨' : i === 2 ? '📂' : i === 3 ? '⚙️' : '💻'}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[var(--accent-primary)] rounded-full blur-[60px] opacity-30"></div>
                    </div>
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
