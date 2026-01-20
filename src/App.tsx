import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './auth/context';

// Routing Components (keep these non-lazy as they're small and used everywhere)
import { ProtectedRoute } from './components/routing';
import { Layout } from './components/layout';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const StudentPage = lazy(() => import('./pages/StudentPage'));
const PartnerPage = lazy(() => import('./pages/PartnerPage'));

// Lazy load heavy components
const StudioTool = lazy(() => import('./components/studio/StudioTool'));
const WorkflowDashboard = lazy(() => import('./components/dashboard/WorkflowDashboard'));
const AIServerConnect = lazy(() => import('./components/dashboard/AIServerConnect'));
const CourseManagement = lazy(() => import('./components/admin/CourseManagement'));

// Loading spinner component
const LoadingSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
            <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
    </div>
);

// Wrapper components that add navigation handlers and Layout
const StudioPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <StudioTool onBack={() => navigate('/')} />
            </Suspense>
        </Layout>
    );
};

const WorkflowPage: React.FC = () => {
    const navigate = useNavigate();
    // WorkflowDashboard has its own sidebar, no Layout needed
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <WorkflowDashboard onBack={() => navigate('/')} />
        </Suspense>
    );
};

const ServerPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <AIServerConnect onBack={() => navigate('/')} />
            </Suspense>
        </Layout>
    );
};

// Course detail page with layout
const CourseDetailPage: React.FC = () => {
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <CoursePage />
            </Suspense>
        </Layout>
    );
};

// Student detail page with layout
const StudentDetailPage: React.FC = () => {
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <StudentPage />
            </Suspense>
        </Layout>
    );
};

// Partner detail page with layout
const PartnerDetailPage: React.FC = () => {
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <PartnerPage />
            </Suspense>
        </Layout>
    );
};

// Admin Course Management Page
const AdminCoursesPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <Suspense fallback={<LoadingSpinner />}>
                <CourseManagement onBack={() => navigate('/')} />
            </Suspense>
        </Layout>
    );
};

// 404 Not Found Page
const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    return (
        <Layout>
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-6xl font-black text-[var(--accent-primary)]">404</h1>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Page Not Found</h2>
                    <p className="text-[var(--text-secondary)]">The page you are looking for does not exist.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:scale-105 transition-all"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </Layout>
    );
};

const App: React.FC = () => {
    const { isLoading: authLoading } = useAuth();

    // Show loading spinner while checking auth
    if (authLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/courses/:slug" element={<CourseDetailPage />} />
                <Route path="/students/:id" element={<StudentDetailPage />} />
                <Route path="/partners/:id" element={<PartnerDetailPage />} />

                {/* Protected Routes (require login) */}
                <Route
                    path="/studio"
                    element={
                        <ProtectedRoute>
                            <StudioPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/workflow"
                    element={
                        <ProtectedRoute>
                            <WorkflowPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/server"
                    element={
                        <ProtectedRoute>
                            <ServerPage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Routes */}
                <Route
                    path="/admin/courses"
                    element={
                        <ProtectedRoute>
                            <AdminCoursesPage />
                        </ProtectedRoute>
                    }
                />

                {/* 404 - Catch all */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </Suspense>
    );
};

export default App;
