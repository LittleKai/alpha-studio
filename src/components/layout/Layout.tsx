import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { useTheme } from '../../theme/context';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import Login from '../ui/Login';
import FloatingChat from '../chat/FloatingChat';
import Liquid2D from '../ui/Liquid2D';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="sparkle"
  >
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.259 15.285L6 14.25Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
    ></path>
  </svg>
);

interface LayoutProps {
    children: React.ReactNode;
    showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
    const { t } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
    const { theme } = useTheme();

    const bgColors = theme === 'dark' 
        ? ["#0B2545", "#0077B6", "#00B4D8"]
        : ["#005F73", "#0A9396", "#94D2BD"];
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const navigateToProtectedPage = (path: string) => {
        if (isAuthenticated) {
            navigate(path);
        } else {
            setPendingNavigation(path);
            setShowLoginDialog(true);
        }
    };

    const handleLoginSuccess = () => {
        setShowLoginDialog(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
            setPendingNavigation(null);
        }
    };

    const handleCloseLogin = () => {
        setShowLoginDialog(false);
        setPendingNavigation(null);
    };

    // Event listener for opening login from other components
    React.useEffect(() => {
        const openLogin = () => setShowLoginDialog(true);
        document.addEventListener('openLoginModal', openLogin);
        return () => document.removeEventListener('openLoginModal', openLogin);
    }, []);

    const isStudioPage = location.pathname.startsWith('/studio');
    // const isServerPage = location.pathname === '/server';
    const isWorkflowPage = location.pathname.startsWith('/workflow');
    const isAboutPage = location.pathname.startsWith('/about');
    const isServicesPage = location.pathname.startsWith('/services');
    const isNewsPage = location.pathname.startsWith('/news');

    if (!showNav || isWorkflowPage) {
        return <>{children}</>;
    }

    const closeMobile = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] relative overflow-x-clip">
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
                <Liquid2D
                    mouseForce={8}
                    cursorSize={150}
                    colors={bgColors}
                    speed={0.4}
                />
            </div>
            <div className="relative z-10 flex flex-col flex-1">
            {/* Global Navigation */}
            <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border-primary)]">
                <div className="w-full px-4 md:px-6 py-1 md:py-1.5 lg:py-2 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <img src="/alpha-logo-animated.svg" alt="Alpha Studio" className="h-7 w-7 md:h-8 md:w-8 xl:h-9 xl:w-9 rounded-xl object-contain group-hover:rotate-12 transition-transform" />
                        <div className="flex md:hidden lg:flex flex-col">
                            <span className="text-lg xl:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none">ALPHA STUDIO</span>
                            <span className="text-[9px] xl:text-[10px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">AI Academy</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center md:gap-3 lg:gap-3 xl:gap-7 2xl:gap-10 text-[12px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase md:tracking-normal lg:tracking-wide xl:tracking-wider 2xl:tracking-widest">
                        <Link to="/" className={`whitespace-nowrap transition-colors ${location.pathname === '/' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.academy')}
                        </Link>
                        <Link to="/about" className={`whitespace-nowrap transition-colors ${isAboutPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.about')}
                        </Link>
                        <Link to="/news" className={`whitespace-nowrap transition-colors ${isNewsPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.news')}
                        </Link>
                        <Link to="/services" className={`whitespace-nowrap transition-colors ${isServicesPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.services')}
                        </Link>
                        {!isStudioPage && (
                            <Link to="/studio" className="whitespace-nowrap border px-2 py-0.5 lg:px-2.5 lg:py-0.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[var(--accent-shadow)] text-[var(--accent-primary)] border-[var(--accent-primary)]/35 hover:bg-[var(--accent-primary)]/14 hover:border-[var(--accent-primary)]">
                                {t('landing.nav.enterStudio')}
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3 md:gap-2 lg:gap-3 xl:gap-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />

                        {/* Desktop Account */}
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-2 lg:gap-3">
                                {!isWorkflowPage && (
                                    <button
                                        onClick={() => navigateToProtectedPage('/workflow')}
                                        className="hidden md:block whitespace-nowrap border px-2 py-0.5 lg:px-2.5 lg:py-0.5 rounded-lg text-[12px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase md:tracking-normal lg:tracking-wide xl:tracking-wider 2xl:tracking-widest text-[var(--accent-primary)] border-[var(--accent-primary)]/35 hover:bg-[var(--accent-primary)]/14 hover:border-[var(--accent-primary)] hover:scale-105 hover:shadow-[var(--accent-shadow)] transition-all duration-200"
                                    >
                                        {t('landing.nav.connect')}
                                    </button>
                                )}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 py-1.5 md:px-2 lg:px-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors">
                                        {user?.avatar ? (
                                            <img src={cdnFromUrl(user.avatar, 'w_128')} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <span className="hidden lg:block text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">{user?.name || 'User'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 mt-2.5 user-dropdown-card opacity-0 translate-y-2 scale-95 origin-top-right group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 transition-all duration-300 z-50 pointer-events-none group-hover:pointer-events-auto">
                                        <div className="user-info-header">
                                            <div className="flex items-center gap-3">
                                                {user?.avatar ? (
                                                    <img src={cdnFromUrl(user.avatar, 'w_128')} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/20" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-[var(--accent-primary)]/20">
                                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight">{user?.name || 'User'}</p>
                                                    <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-extrabold uppercase tracking-wider">{user?.role}</span>
                                                <Link to="/wallet" className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-yellow-400/10 border border-yellow-400/30 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold hover:bg-yellow-400/20 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
                                                    {(user?.balance || 0).toLocaleString()} Credits
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="separator" />
                                        <ul className="list">
                                            <li>
                                                <Link to="/my-courses" className="element">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                    <span className="label">{t('myCourses.title')}</span>
                                                </Link>
                                            </li>
                                            <li>
                                                <Link to="/profile" className="element">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                                    <span className="label">{t('landing.nav.profile') || 'Profile'}</span>
                                                </Link>
                                            </li>
                                            {(user?.role === 'admin' || user?.role === 'mod') && (
                                                <li>
                                                    <Link to="/admin/courses" className="element">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
                                                        <span className="label">{t('admin.courses.title')}</span>
                                                    </Link>
                                                </li>
                                            )}
                                            {(user?.role === 'admin' || user?.role === 'mod') && (
                                                <li>
                                                    <Link to="/admin" className="element">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                                                        <span className="label">{t('admin.management.title') || 'Quản lý hệ thống'}</span>
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                        <div className="separator" />
                                        <ul className="list logout-list">
                                            <li>
                                                <button onClick={handleLogout} className="element delete">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" /></svg>
                                                    <span className="label">{t('login.logout') || 'Sign Out'}</span>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2 lg:gap-3">
                                {!isWorkflowPage && (
                                    <button
                                        onClick={() => navigateToProtectedPage('/workflow')}
                                        className="hidden md:block whitespace-nowrap border px-2 py-0.5 lg:px-2.5 lg:py-0.5 rounded-lg text-[12px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase md:tracking-normal lg:tracking-wide xl:tracking-wider 2xl:tracking-widest text-[var(--accent-primary)] border-[var(--accent-primary)]/35 hover:bg-[var(--accent-primary)]/14 hover:border-[var(--accent-primary)] hover:scale-105 hover:shadow-[var(--accent-shadow)] transition-all duration-200"
                                    >
                                        {t('landing.nav.connect')}
                                    </button>
                                )}
                                <button onClick={() => setShowLoginDialog(true)} className="md:py-1 md:px-2.5 lg:py-1.5 lg:px-4 bg-[var(--accent-primary)] text-[var(--text-on-accent)] md:text-xs lg:text-sm font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all whitespace-nowrap">
                                    {t('login.button') || 'Sign In'}
                                </button>
                            </div>
                        )}

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        >
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-backdrop" onClick={closeMobile} />
                    <div className="absolute right-0 top-0 h-full w-80 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-y-auto flex flex-col justify-between animate-slide-in-right z-50">
                        <div className="flex-1 flex flex-col">
                            {/* Close button */}
                            <div className="flex items-center justify-between py-4 px-1 border-b border-[var(--border-primary)]">
                                <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Menu</span>
                                <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Nav Links */}
                            <div className="py-4 px-1 space-y-1.5 flex-1">
                                <Link 
                                    onClick={closeMobile} 
                                    to="/" 
                                    className={`mean-bird-button relative flex items-center justify-between px-4 py-3 rounded-xl text-[14.5px] font-semibold transition-all duration-200 ${
                                        location.pathname === '/' 
                                            ? 'active' 
                                            : 'text-[var(--text-primary)]'
                                    }`}
                                >
                                    <div className="dots_border"></div>
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 0 001 1m-6 0h6" />
                                        </svg>
                                        <span>{t('landing.nav.academy')}</span>
                                    </span>
                                    <SparkleIcon />
                                </Link>

                                <Link 
                                    onClick={closeMobile} 
                                    to="/about" 
                                    className={`mean-bird-button relative flex items-center justify-between px-4 py-3 rounded-xl text-[14.5px] font-semibold transition-all duration-200 ${
                                        isAboutPage 
                                            ? 'active' 
                                            : 'text-[var(--text-primary)]'
                                    }`}
                                >
                                    <div className="dots_border"></div>
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{t('landing.nav.about')}</span>
                                    </span>
                                    <SparkleIcon />
                                </Link>

                                <Link 
                                    onClick={closeMobile} 
                                    to="/news" 
                                    className={`mean-bird-button relative flex items-center justify-between px-4 py-3 rounded-xl text-[14.5px] font-semibold transition-all duration-200 ${
                                        isNewsPage 
                                            ? 'active' 
                                            : 'text-[var(--text-primary)]'
                                    }`}
                                >
                                    <div className="dots_border"></div>
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                        </svg>
                                        <span>{t('landing.nav.news')}</span>
                                    </span>
                                    <SparkleIcon />
                                </Link>

                                <Link 
                                    onClick={closeMobile} 
                                    to="/services" 
                                    className={`mean-bird-button relative flex items-center justify-between px-4 py-3 rounded-xl text-[14.5px] font-semibold transition-all duration-200 ${
                                        isServicesPage 
                                            ? 'active' 
                                            : 'text-[var(--text-primary)]'
                                    }`}
                                >
                                    <div className="dots_border"></div>
                                    <span className="relative z-10 flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span>{t('landing.nav.services')}</span>
                                    </span>
                                    <SparkleIcon />
                                </Link>

                                {!isStudioPage && (
                                    <Link 
                                        onClick={closeMobile} 
                                        to="/studio" 
                                        className="mean-bird-button relative flex items-center justify-between px-4 py-3 rounded-xl text-[14.5px] font-semibold transition-all duration-200 text-[var(--text-primary)]"
                                    >
                                        <div className="dots_border"></div>
                                        <span className="relative z-10 flex items-center gap-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>{t('landing.nav.enterStudio')}</span>
                                        </span>
                                        <SparkleIcon />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Mobile Account */}
                        <div className="border-t border-[var(--border-primary)] py-4 px-1 bg-[var(--bg-secondary)]">
                            {isAuthenticated ? (
                                <div className="space-y-1">
                                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-4 mb-3 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            {user?.avatar ? (
                                                <img src={cdnFromUrl(user.avatar, 'w_128')} alt={user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[var(--accent-primary)]/20" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold ring-2 ring-[var(--accent-primary)]/20">
                                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-[var(--text-primary)] truncate leading-tight">{user?.name || 'User'}</p>
                                                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                                            <span className="px-2.5 py-0.5 rounded-md bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-extrabold uppercase tracking-wider">{user?.role}</span>
                                        </div>
                                    </div>

                                    {!isWorkflowPage && (
                                        <button 
                                            onClick={() => { navigateToProtectedPage('/workflow'); closeMobile(); }} 
                                            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-[var(--accent-primary)] bg-[var(--accent-primary)]/8 hover:bg-[var(--accent-primary)]/15 transition-all duration-200 hover:translate-x-1 w-full text-left"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span>{t('landing.nav.connect')}</span>
                                        </button>
                                    )}

                                    <Link 
                                        onClick={closeMobile} 
                                        to="/my-courses" 
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-x-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                        </svg>
                                        <span>{t('myCourses.title')}</span>
                                    </Link>

                                    <Link 
                                        onClick={closeMobile} 
                                        to="/wallet" 
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 hover:bg-yellow-400/20 transition-all duration-200 hover:translate-x-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                        </svg>
                                        <span>{(user?.balance || 0).toLocaleString()} Credits</span>
                                    </Link>

                                    <Link 
                                        onClick={closeMobile} 
                                        to="/profile" 
                                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-x-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        <span>{t('landing.nav.profile') || 'Profile'}</span>
                                    </Link>

                                    {(user?.role === 'admin' || user?.role === 'mod') && (
                                        <>
                                            <Link 
                                                onClick={closeMobile} 
                                                to="/admin/courses" 
                                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-x-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5 8.084V13a1 1 0 001.25.962L10 15.216l3.75-1.254A1 1 0 0015 13V8.083l2.394-.962a1 1 0 000-1.84l-7-3zM5 9.704l5 2.143 5-2.143V13l-5 1.667L5 13V9.704z" />
                                                </svg>
                                                <span>{t('admin.courses.title')}</span>
                                            </Link>
                                            <Link 
                                                onClick={closeMobile} 
                                                to="/admin" 
                                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-x-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.533 1.533 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                                                </svg>
                                                <span>{t('admin.management.title') || 'Quản lý hệ thống'}</span>
                                            </Link>
                                        </>
                                    )}

                                    <button 
                                        onClick={() => { handleLogout(); closeMobile(); }} 
                                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-xl text-[14.5px] font-semibold text-red-500 hover:bg-red-500/10 transition-all duration-200 hover:translate-x-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{t('login.logout') || 'Sign Out'}</span>
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { setShowLoginDialog(true); closeMobile(); }} 
                                    className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>{t('login.button') || 'Sign In'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Login Dialog */}
            {showLoginDialog && (
                <Login onLoginSuccess={handleLoginSuccess} onClose={handleCloseLogin} />
            )}

            <FloatingChat />
            </div>
        </div>
    );
};

export default Layout;
