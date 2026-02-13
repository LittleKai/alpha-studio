import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import type { FeaturedStudent } from '../types';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import Login from '../components/ui/Login';
import { getFeaturedCourses, Course } from '../services/courseService';
import { getPartners } from '../services/partnerService';
import type { Partner } from '../services/partnerService';

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

// Featured students data
const featuredStudents: FeaturedStudent[] = [
    {
        id: "s1",
        name: "Minh Thu",
        role: "Event Director",
        image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1519671482502-9759101d4561?w=800&h=600&fit=crop",
        hired: true,
        bio: "Minh Thu has 5 years of experience in the event industry. After the AI course, she applied Midjourney to reduce concept development time by 70%. Her style leans towards elegance, sophistication and natural lighting. Currently working at a Global Agency.",
        skills: ["Midjourney", "Event Planning", "Concept Art", "Luxury Design"],
        gallery: [
            "https://images.unsplash.com/photo-1519671482502-9759101d4561?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#", linkedin: "#" }
    },
    {
        id: "s2",
        name: "Quang Huy",
        role: "3D Artist",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop",
        hired: true,
        bio: "Huy is a talented 3D Artist. He combines Blender and Stable Diffusion to create surreal virtual stages. His works are highly appreciated for feasibility and Futurist aesthetics. He specializes in EDM music stages and Tech Shows.",
        skills: ["Blender", "Stable Diffusion", "Unreal Engine", "Cyberpunk Style"],
        gallery: [
            "https://images.unsplash.com/photo-1563089145-599997674d42?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#" }
    },
    {
        id: "s3",
        name: "Lan Anh",
        role: "Concept Artist",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=600&fit=crop",
        hired: false,
        bio: "Lan Anh is a final-year Graphic Design student. She joined Alpha Studio to enhance AI skills and is looking for internship opportunities at Creative Agencies. Her style is creative, artistic and colorful.",
        skills: ["Photoshop", "AI Generative Fill", "Illustration", "Digital Painting"],
        gallery: [
            "https://images.unsplash.com/photo-1561489413-985b06da5bee?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    },
    {
        id: "s4",
        name: "Hoang Nam",
        role: "VFX Supervisor",
        image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=800&h=600&fit=crop",
        hired: true,
        bio: "Nam specializes in cinematic VFX and video mapping. With extensive knowledge of Runway and Luma, he creates stunning background videos for events.",
        skills: ["Runway Gen-2", "After Effects", "VFX", "Projection Mapping"],
        gallery: [
            "https://images.unsplash.com/photo-1614726365723-49cfae92782f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    },
    {
        id: "s5",
        name: "Thao My",
        role: "AI Fashion Design",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1537832816519-0439d612e4e6?w=800&h=600&fit=crop",
        hired: false,
        bio: "My combines AI to design performance costumes and PG outfits for events. Her designs are always unique and aligned with event concepts.",
        skills: ["Stable Diffusion", "Fashion Design", "Pattern Making"],
        gallery: [
            "https://images.unsplash.com/photo-1537832816519-0439d612e4e6?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1490481651871-32d2e76f897d?w=800&h=600&fit=crop"
        ],
        socials: { facebook: "#" }
    },
    {
        id: "s6",
        name: "Duc Anh",
        role: "Game Environment",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        work: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
        hired: true,
        bio: "Duc Anh transitioned from Game to Virtual Events. He uses Unreal Engine and AI to create Metaverse spaces for online events.",
        skills: ["Unreal Engine", "Environment Design", "Metaverse"],
        gallery: [
            "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop",
            "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&h=600&fit=crop"
        ],
        socials: { linkedin: "#" }
    }
];


const LandingPage: React.FC = () => {
    const { t, language } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();

    // Login dialog state
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Courses state
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState<string | null>(null);

    // Partners state
    const [partners, setPartners] = useState<Partner[]>([]);
    const [partnersLoading, setPartnersLoading] = useState(true);

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

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-4 py-2 md:px-6 md:py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <img src="/alpha-logo.png" alt="Alpha Studio" className="h-8 w-8 md:h-10 md:w-10 rounded-xl object-contain group-hover:rotate-12 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-lg md:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none">ALPHA STUDIO</span>
                            <span className="text-[10px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">AI Academy</span>
                        </div>
                    </Link>

                    <div className="hidden md:flex items-center gap-10 text-[14px] font-extrabold uppercase tracking-widest">
                        <Link to="/about" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.about')}</Link>
                        <Link to="/" className="text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.academy')}</Link>
                        <button onClick={() => navigateToProtectedPage('/workflow')} className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.connect')}</button>
                        <button onClick={() => navigateToProtectedPage('/server')} className="text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-4 py-1.5 rounded-full hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)] transition-all">{t('landing.nav.aiCloud')}</button>
                        <Link to="/services" className="text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">{t('landing.nav.services')}</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />
                        {isAuthenticated ? (
                            <div className="hidden lg:flex items-center gap-3">
                                <button onClick={() => navigate('/studio')} className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all">
                                    {t('landing.nav.enterStudio')}
                                </button>
                                <div className="relative group">
                                    <button className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">{user?.name || 'User'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                                            <div className="flex items-center gap-3">
                                                {user?.avatar ? (
                                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
                                                    <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold uppercase">{user?.role}</span>
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            <Link to="/my-courses" className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                {t('myCourses.title')}
                                            </Link>
                                            <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                {t('landing.nav.profile') || 'Profile'}
                                            </Link>
                                            {(user?.role === 'admin' || user?.role === 'mod') && (
                                                <Link to="/admin/courses" className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                    {t('admin.courses.title')}
                                                </Link>
                                            )}
                                            {(user?.role === 'admin' || user?.role === 'mod') && (
                                                <Link to="/admin" className="w-full text-left px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                                    {t('admin.management.title') || 'Quản lý hệ thống'}
                                                </Link>
                                            )}
                                        </div>
                                        <div className="border-t border-[var(--border-primary)] pt-1">
                                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                                {t('login.logout') || 'Sign Out'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowLoginDialog(true)} className="hidden lg:block py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all">
                                {t('login.button') || 'Sign In'}
                            </button>
                        )}

                        {/* Mobile Hamburger */}
                        <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    <div className="absolute right-0 top-0 h-full w-72 bg-[var(--bg-card)] border-l border-[var(--border-primary)] shadow-2xl overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-1">
                            <Link onClick={() => setMobileMenuOpen(false)} to="/about" className="block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                {t('landing.nav.about')}
                            </Link>
                            <Link onClick={() => setMobileMenuOpen(false)} to="/" className="block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                {t('landing.nav.academy')}
                            </Link>
                            <button onClick={() => { navigateToProtectedPage('/workflow'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                {t('landing.nav.connect')}
                            </button>
                            <button onClick={() => { navigateToProtectedPage('/server'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                {t('landing.nav.aiCloud')}
                            </button>
                            <Link onClick={() => setMobileMenuOpen(false)} to="/services" className="block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                {t('landing.nav.services')}
                            </Link>
                        </div>
                        <div className="border-t border-[var(--border-primary)] p-4">
                            {isAuthenticated ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
                                            <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { navigate('/studio'); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors">
                                        {t('landing.nav.enterStudio')}
                                    </button>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/my-courses" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                        {t('myCourses.title')}
                                    </Link>
                                    <Link onClick={() => setMobileMenuOpen(false)} to="/profile" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                        {t('landing.nav.profile') || 'Profile'}
                                    </Link>
                                    {(user?.role === 'admin' || user?.role === 'mod') && (
                                        <>
                                            <Link onClick={() => setMobileMenuOpen(false)} to="/admin/courses" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                                {t('admin.courses.title')}
                                            </Link>
                                            <Link onClick={() => setMobileMenuOpen(false)} to="/admin" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                                {t('admin.management.title') || 'Quản lý hệ thống'}
                                            </Link>
                                        </>
                                    )}
                                    <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        {t('login.logout') || 'Sign Out'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => { setShowLoginDialog(true); setMobileMenuOpen(false); }} className="block w-full text-center py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl">
                                    {t('login.button') || 'Sign In'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                            <span>👥 {course.enrolledCount} {t('landing.courses.enrolled')}</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredStudents.map((student, idx) => (
                            <Link to={`/students/${student.id}`} key={idx} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-2 transition-transform duration-500 cursor-pointer">
                                <div className="relative aspect-[4/3] overflow-hidden">
                                    <img src={student.work} alt="Work" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] to-transparent opacity-90"></div>
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={student.image} alt={student.name} className="w-10 h-10 rounded-full border-2 border-[var(--accent-primary)] object-cover" />
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
        </div>
    );
};

export default LandingPage;
