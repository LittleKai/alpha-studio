import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import Login from '../ui/Login';
import FloatingChat from '../chat/FloatingChat';

interface LayoutProps {
    children: React.ReactNode;
    showNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNav = true }) => {
    const { t } = useTranslation();
    const { isAuthenticated, user, logout } = useAuth();
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

    const isStudioPage = location.pathname === '/studio';
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
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Global Navigation */}
            <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border-primary)]">
                <div className="w-full px-4 md:px-6 py-2 md:py-3 lg:py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <img src="/alpha-logo.png" alt="Alpha Studio" className="h-8 w-8 md:h-9 md:w-9 xl:h-10 xl:w-10 rounded-xl object-contain group-hover:rotate-12 transition-transform" />
                        <div className="flex md:hidden lg:flex flex-col">
                            <span className="text-lg xl:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none">ALPHA STUDIO</span>
                            <span className="text-[9px] xl:text-[10px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">AI Academy</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center md:gap-3 lg:gap-3 xl:gap-7 2xl:gap-10 text-[12px] xl:text-[13px] 2xl:text-[14px] font-extrabold uppercase md:tracking-normal lg:tracking-wide xl:tracking-wider 2xl:tracking-widest">
                        <Link to="/about" className={`whitespace-nowrap transition-colors ${isAboutPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.about')}
                        </Link>
                        <Link to="/" className={`whitespace-nowrap transition-colors ${location.pathname === '/' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.academy')}
                        </Link>
                        <Link to="/news" className={`whitespace-nowrap transition-colors ${isNewsPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.news')}
                        </Link>
                        <Link to="/services" className={`whitespace-nowrap transition-colors ${isServicesPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.services')}
                        </Link>
                        <button onClick={() => navigateToProtectedPage('/workflow')} className={`whitespace-nowrap border md:px-3 md:py-1 lg:px-4 lg:py-1.5 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-[0_0_14px_rgba(168,85,247,0.4)] ${isWorkflowPage ? 'bg-purple-500/15 text-purple-400 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.25)]' : 'text-purple-400 border-purple-400/30 hover:bg-purple-500/10 hover:border-purple-400/60'}`}>
                            {t('landing.nav.connect')}
                        </button>
                        {/* Tạm ẩn theo yêu cầu
                        <button onClick={() => navigateToProtectedPage('/server')} className={`whitespace-nowrap border md:px-3 md:py-1 lg:px-4 lg:py-1.5 rounded-full transition-all duration-200 hover:scale-105 hover:shadow-[var(--accent-shadow)] ${isServerPage ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)] shadow-[var(--accent-shadow)]' : 'text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)]'}`}>
                            {t('landing.nav.aiCloud')}
                        </button>
                        */}
                    </div>

                    <div className="flex items-center md:gap-2 lg:gap-3 xl:gap-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />

                        {/* Desktop Account */}
                        {isAuthenticated ? (
                            <div className="hidden md:flex items-center gap-2 lg:gap-3">
                                {!isStudioPage && (
                                    <Link to="/studio" className="hidden lg:block lg:py-1.5 lg:px-3 xl:py-2 xl:px-5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] lg:text-xs xl:text-sm font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all whitespace-nowrap">
                                        {t('landing.nav.enterStudio')}
                                    </Link>
                                )}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 py-2 md:px-2 lg:px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors">
                                        {user?.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
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
                                            <div className="mt-2 flex items-center gap-2 flex-wrap">
                                                <span className="px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-[10px] font-bold uppercase">{user?.role}</span>
                                                <Link to="/wallet" className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/60 text-yellow-600 text-xs font-bold hover:bg-yellow-400/30 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
                                                    {(user?.balance || 0).toLocaleString()} Credits
                                                </Link>
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
                            <button onClick={() => setShowLoginDialog(true)} className="hidden md:block md:py-2 md:px-3 lg:py-2.5 lg:px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] md:text-xs lg:text-sm font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all whitespace-nowrap">
                                {t('login.button') || 'Sign In'}
                            </button>
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
                    <div className="absolute inset-0 bg-black/50" onClick={closeMobile} />
                    <div className="absolute right-0 top-0 h-full w-72 bg-[var(--bg-card)] border-l border-[var(--border-primary)] shadow-2xl overflow-y-auto">
                        {/* Close button */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-widest">Menu</span>
                            <button onClick={closeMobile} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-primary)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Nav Links */}
                        <div className="p-4 space-y-1">
                            <Link onClick={closeMobile} to="/about" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isAboutPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.about')}
                            </Link>
                            <Link onClick={closeMobile} to="/" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${location.pathname === '/' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.academy')}
                            </Link>
                            <Link onClick={closeMobile} to="/news" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isNewsPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.news')}
                            </Link>
                            <Link onClick={closeMobile} to="/services" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isServicesPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.services')}
                            </Link>
                            <button onClick={() => { navigateToProtectedPage('/workflow'); closeMobile(); }} className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors border ${isWorkflowPage ? 'bg-purple-500/15 text-purple-400 border-purple-400/60' : 'text-purple-400 border-purple-400/30 bg-purple-500/5 hover:bg-purple-500/12 hover:border-purple-400/50'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/></svg>
                                {t('landing.nav.connect')}
                            </button>
                            {/* Tạm ẩn theo yêu cầu
                            <button onClick={() => { navigateToProtectedPage('/server'); closeMobile(); }} className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-colors border ${isServerPage ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border-[var(--accent-primary)]/60' : 'text-[var(--accent-primary)] border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 hover:bg-[var(--accent-primary)]/12 hover:border-[var(--accent-primary)]/50'}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1a1 1 0 11-2 0 1 1 0 012 0zM2 13a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zm14 1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd"/></svg>
                                {t('landing.nav.aiCloud')}
                            </button>
                            */}
                        </div>

                        {/* Mobile Account */}
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
                                    <Link onClick={closeMobile} to="/studio" className="block px-4 py-2.5 rounded-lg text-sm font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors">
                                        {t('landing.nav.enterStudio')}
                                    </Link>
                                    <Link onClick={closeMobile} to="/my-courses" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                        {t('myCourses.title')}
                                    </Link>
                                    <Link onClick={closeMobile} to="/wallet" className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/></svg>
                                        {t('workflow.wallet.title')} · {(user?.balance || 0).toLocaleString()} Credits
                                    </Link>
                                    <Link onClick={closeMobile} to="/profile" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                        {t('landing.nav.profile') || 'Profile'}
                                    </Link>
                                    {(user?.role === 'admin' || user?.role === 'mod') && (
                                        <>
                                            <Link onClick={closeMobile} to="/admin/courses" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                                {t('admin.courses.title')}
                                            </Link>
                                            <Link onClick={closeMobile} to="/admin" className="block px-4 py-2.5 rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
                                                {t('admin.management.title') || 'Quản lý hệ thống'}
                                            </Link>
                                        </>
                                    )}
                                    <button onClick={() => { handleLogout(); closeMobile(); }} className="w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                        {t('login.logout') || 'Sign Out'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => { setShowLoginDialog(true); closeMobile(); }} className="block w-full text-center py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl">
                                    {t('login.button') || 'Sign In'}
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
    );
};

export default Layout;
