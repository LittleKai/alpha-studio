import React, { Suspense, lazy, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, useParams, Outlet, Link } from 'react-router-dom';
// Routing Components (keep these non-lazy as they're small and used everywhere)
import { ProtectedRoute } from './components/routing';
import { Layout } from './components/layout';
import { useAuth } from './auth/context';
import { trackPageView } from './services/analyticsService';
import SEOHead from './components/ui/SEOHead';
import PageLoader from './components/ui/PageLoader';
import { useTranslation } from './i18n/context';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const StudentPage = lazy(() => import('./pages/StudentPage'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));

// Lazy load heavy components
const StudioTool = lazy(() => import('./components/studio/StudioTool'));
const StudioHub = lazy(() => import('./components/studio/StudioHub'));
const WorkflowDashboard = lazy(() => import('./components/dashboard/WorkflowDashboard'));
const AIServerConnect = lazy(() => import('./components/dashboard/AIServerConnect'));
const CourseManagement = lazy(() => import('./components/admin/CourseManagement'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProfileViewPage = lazy(() => import('./pages/ProfileViewPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const MyCoursesPage = lazy(() => import('./pages/MyCoursesPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AboutDetailPage = lazy(() => import('./pages/AboutDetailPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const ServicesDetailPage = lazy(() => import('./pages/ServicesDetailPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const VocabPage = lazy(() => import('./pages/VocabPage'));
const VietYakuPage = lazy(() => import('./pages/VietYakuPage'));
const CrmPage = lazy(() => import('./pages/CrmPage'));
const CrmSubscriptionPage = lazy(() => import('./pages/CrmSubscriptionPage'));
const SkillsPage = lazy(() => import('./pages/SkillsPage'));
const SkillDetailPage = lazy(() => import('./pages/SkillDetailPage'));
const EventLibraryPage = lazy(() => import('./pages/EventLibraryPage'));
const EventLibraryItemPage = lazy(() => import('./pages/EventLibraryItemPage'));
const LedStudioPage = lazy(() => import('./pages/LedStudioPage'));

/**
 * Layout routes keep the header, animated background and chat widget mounted
 * across navigations; only the page area suspends while its chunk loads.
 */
const MainLayout: React.FC = () => (
    <Layout>
        <Suspense fallback={<PageLoader />}>
            <Outlet />
        </Suspense>
    </Layout>
);

const BareLayout: React.FC = () => (
    <Layout showNav={false}>
        <Suspense fallback={<PageLoader fullScreen />}>
            <Outlet />
        </Suspense>
    </Layout>
);

/** Pages that render their own chrome (no shared Layout). */
const Standalone: React.FC = () => (
    <Suspense fallback={<PageLoader fullScreen />}>
        <Outlet />
    </Suspense>
);

const StudioGeneratePage: React.FC = () => {
    const navigate = useNavigate();
    return <StudioTool mode="generate" onBack={() => navigate('/studio#studio-tools')} />;
};

const StudioEditPage: React.FC = () => {
    const navigate = useNavigate();
    return <StudioTool mode="edit" onBack={() => navigate('/studio#studio-tools')} />;
};

const WorkflowPage: React.FC = () => {
    const navigate = useNavigate();
    // WorkflowDashboard has its own sidebar, no Layout needed
    return <WorkflowDashboard onBack={() => navigate('/')} />;
};

const AdminCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    return <CourseManagement onBack={() => navigate('/')} />;
};

const SkillLegacyRedirect: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    return <Navigate to={slug ? `/studio/ai-skills/${slug}` : '/studio/ai-skills'} replace />;
};

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <>
            <SEOHead title="404 Not Found" description="Page not found" path="/404" noindex />
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-black text-[var(--accent-primary)]">404</h1>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('common.notFound.title')}</h2>
                    <p className="text-[var(--text-secondary)]">{t('common.notFound.message')}</p>
                    <Link
                        to="/"
                        className="inline-block py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        {t('common.notFound.goHome')}
                    </Link>
                </div>
            </div>
        </>
    );
};

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

/**
 * Sends one pageview beacon per route change (admin traffic dashboard).
 * Waits for auth to resolve so logged-in views are attributed, and de-dupes by
 * path so logging in mid-page does not count the page twice.
 */
const PageViewTracker: React.FC = () => {
    const { pathname } = useLocation();
    const { user, isLoading } = useAuth();
    const lastTracked = useRef<string | null>(null);

    useEffect(() => {
        if (isLoading || lastTracked.current === pathname) return;
        lastTracked.current = pathname;
        trackPageView(pathname, user?._id);
    }, [pathname, isLoading, user?._id]);

    return null;
};

const App: React.FC = () => {
    return (
        <Suspense fallback={<PageLoader fullScreen />}>
            <ScrollToTop />
            <PageViewTracker />
            <Routes>
                <Route element={<MainLayout />}>
                    {/* Public Routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/courses" element={<CoursesPage />} />
                    <Route path="/courses/:slug" element={<CoursePage />} />
                    <Route path="/students/:id" element={<StudentPage />} />
                    <Route path="/partners/:id" element={<PartnerPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/about/:slug" element={<AboutDetailPage />} />
                    <Route path="/news" element={<NewsPage />} />
                    <Route path="/news/:slug" element={<NewsDetailPage />} />
                    <Route path="/services" element={<ServicesPage />} />
                    <Route path="/services/:slug" element={<ServicesDetailPage />} />

                    {/* Studio hub + tool sub-routes — public, auth enforced per-use inside each tool */}
                    <Route path="/studio" element={<StudioHub />} />
                    <Route path="/studio/generate" element={<StudioGeneratePage />} />
                    <Route path="/studio/edit" element={<StudioEditPage />} />
                    <Route path="/studio/vocab" element={<VocabPage />} />
                    <Route path="/studio/crm" element={<CrmPage />} />
                    <Route path="/studio/crm/subscription" element={<ProtectedRoute><CrmSubscriptionPage /></ProtectedRoute>} />
                    <Route path="/studio/vietyaku" element={<VietYakuPage />} />
                    <Route path="/studio/event-library" element={<EventLibraryPage />} />
                    <Route path="/studio/event-library/:slug" element={<EventLibraryItemPage />} />

                    {/* AI Skills Routes */}
                    <Route path="/studio/ai-skills" element={<SkillsPage />} />
                    <Route path="/studio/ai-skills/:slug" element={<SkillDetailPage />} />

                    {/* Protected Routes (require login) */}
                    <Route path="/server" element={<ProtectedRoute><AIServerConnect /></ProtectedRoute>} />
                    <Route path="/my-courses" element={<ProtectedRoute><MyCoursesPage /></ProtectedRoute>} />
                    <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
                    <Route path="/admin/courses" element={<ProtectedRoute><AdminCoursesPage /></ProtectedRoute>} />

                    {/* 404 - Catch all */}
                    <Route path="*" element={<NotFoundPage />} />
                </Route>

                <Route element={<BareLayout />}>
                    <Route path="/studio/led-studio" element={<LedStudioPage />} />
                </Route>

                <Route element={<Standalone />}>
                    <Route path="/workflow" element={<ProtectedRoute><WorkflowPage /></ProtectedRoute>} />
                    <Route path="/workflow/projects/:id" element={<ProtectedRoute><WorkflowPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/profile/view" element={<ProtectedRoute><ProfileViewPage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                    <Route path="/users/:id" element={<UserProfilePage />} />
                </Route>

                {/* Legacy redirects */}
                <Route path="/studio/skills" element={<Navigate to="/studio/ai-skills" replace />} />
                <Route path="/studio/skills/:slug" element={<SkillLegacyRedirect />} />
                <Route path="/vocab" element={<Navigate to="/studio/vocab" replace />} />
            </Routes>
        </Suspense>
    );
};

export default App;
