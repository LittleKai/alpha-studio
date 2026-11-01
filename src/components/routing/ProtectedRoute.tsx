import React, { Suspense, lazy, useState } from 'react';
import { useAuth } from '../../auth/context';
import { useTranslation } from '../../i18n/context';
import PageLoader from '../ui/PageLoader';

const Login = lazy(() => import('../ui/Login'));

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const { t } = useTranslation();
    // Open the dialog automatically the first time a guest lands here.
    const [showLoginDialog, setShowLoginDialog] = useState(true);

    if (isLoading) {
        return <PageLoader fullScreen />;
    }

    if (!isAuthenticated) {
        return (
            <>
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t('common.authRequired.title')}</h2>
                        <p className="text-[var(--text-secondary)]">{t('common.authRequired.message')}</p>
                        <button
                            onClick={() => setShowLoginDialog(true)}
                            className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all"
                        >
                            {t('common.authRequired.signIn')}
                        </button>
                    </div>
                </div>
                {showLoginDialog && (
                    <Suspense fallback={null}>
                        <Login
                            onLoginSuccess={() => setShowLoginDialog(false)}
                            onClose={() => setShowLoginDialog(false)}
                        />
                    </Suspense>
                )}
            </>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
