import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import ThemeSwitcher from '../ui/ThemeSwitcher';
import LanguageSwitcher from '../ui/LanguageSwitcher';

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

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const isStudioPage = location.pathname === '/studio';
    const isServerPage = location.pathname === '/server';
    const isWorkflowPage = location.pathname === '/workflow';
    const isAboutPage = location.pathname.startsWith('/about');
    const isServicesPage = location.pathname.startsWith('/services');

    if (!showNav || isWorkflowPage) {
        return <>{children}</>;
    }

    const closeMobile = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
            {/* Global Navigation */}
            <nav className="sticky top-0 z-50 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 cursor-pointer group">
                        <img src="/alpha-logo.png" alt="Alpha Studio" className="h-10 w-10 rounded-xl object-contain group-hover:rotate-12 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] leading-none">ALPHA STUDIO</span>
                            <span className="text-[10px] text-[var(--accent-primary)] font-bold tracking-widest uppercase">AI Academy</span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10 text-[14px] font-extrabold uppercase tracking-widest">
                        <Link to="/about" className={`transition-colors ${isAboutPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.about')}
                        </Link>
                        <Link to="/" className={`transition-colors ${location.pathname === '/' ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.academy')}
                        </Link>
                        <Link to="/workflow" className={`transition-colors ${isWorkflowPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.connect')}
                        </Link>
                        <Link to="/server" className={`border px-4 py-1.5 rounded-full transition-all ${isServerPage ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] border-[var(--accent-primary)]' : 'text-[var(--accent-primary)] border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)] hover:text-[var(--text-on-accent)]'}`}>
                            {t('landing.nav.aiCloud')}
                        </Link>
                        <Link to="/services" className={`transition-colors ${isServicesPage ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--accent-primary)]'}`}>
                            {t('landing.nav.services')}
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />
                        <ThemeSwitcher />

                        {/* Desktop Account */}
                        {isAuthenticated ? (
                            <div className="hidden lg:flex items-center gap-3">
                                {!isStudioPage && (
                                    <Link to="/studio" className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all">
                                        {t('landing.nav.enterStudio')}
                                    </Link>
                                )}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 py-2 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm font-medium text-[var(--text-primary)] max-w-[100px] truncate">{user?.name || 'User'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-56 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                        <div className="px-4 py-3 border-b border-[var(--border-primary)]">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
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
                            <Link to="/" className="hidden lg:block py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all">
                                {t('login.button') || 'Sign In'}
                            </Link>
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
                            <Link onClick={closeMobile} to="/workflow" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isWorkflowPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.connect')}
                            </Link>
                            <Link onClick={closeMobile} to="/server" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isServerPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.aiCloud')}
                            </Link>
                            <Link onClick={closeMobile} to="/services" className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors ${isServicesPage ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'}`}>
                                {t('landing.nav.services')}
                            </Link>
                        </div>

                        {/* Mobile Account */}
                        <div className="border-t border-[var(--border-primary)] p-4">
                            {isAuthenticated ? (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                                        </div>
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
                                <Link onClick={closeMobile} to="/" className="block w-full text-center py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl">
                                    {t('login.button') || 'Sign In'}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
};

export default Layout;
