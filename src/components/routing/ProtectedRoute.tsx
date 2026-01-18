import React, { useState } from 'react';
import { useAuth } from '../../auth/context';
import Login from '../ui/Login';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const [showLoginDialog, setShowLoginDialog] = useState(false);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    <p className="text-[var(--text-secondary)]">Loading...</p>
                </div>
            </div>
        );
    }

    // Show login dialog if not authenticated
    if (!isAuthenticated) {
        if (!showLoginDialog) {
            setShowLoginDialog(true);
        }

        return (
            <>
                <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Authentication Required</h2>
                        <p className="text-[var(--text-secondary)]">Please sign in to access this page.</p>
                        <button
                            onClick={() => setShowLoginDialog(true)}
                            className="py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
                {showLoginDialog && (
                    <Login
                        onLoginSuccess={() => {
                            setShowLoginDialog(false);
                            // After login, user will see the protected content
                        }}
                        onClose={() => {
                            setShowLoginDialog(false);
                            // Redirect to home if user closes login without authenticating
                        }}
                    />
                )}
            </>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;
