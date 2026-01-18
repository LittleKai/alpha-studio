import React from 'react';
import { useAuth } from '../../auth/context';
import ProtectedRoute from './ProtectedRoute';

interface AdminRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'mod')[];
}

const AdminRoute: React.FC<AdminRouteProps> = ({
    children,
    allowedRoles = ['admin', 'mod']
}) => {
    // ProtectedRoute handles auth loading and login flow
    return (
        <ProtectedRoute>
            <AdminCheck allowedRoles={allowedRoles}>
                {children}
            </AdminCheck>
        </ProtectedRoute>
    );
};

// Separate component to check admin role after authentication
const AdminCheck: React.FC<{ children: React.ReactNode; allowedRoles: ('admin' | 'mod')[] }> = ({
    children,
    allowedRoles
}) => {
    const { user, isLoading } = useAuth();

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

    // Check if user has required role
    if (!user || !allowedRoles.includes(user.role as 'admin' | 'mod')) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center space-y-4 max-w-md mx-auto p-8">
                    <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Access Denied</h2>
                    <p className="text-[var(--text-secondary)]">
                        You don't have permission to access this page.
                        This area is restricted to administrators only.
                    </p>
                    <a
                        href="/"
                        className="inline-block py-2.5 px-6 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all"
                    >
                        Go to Home
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
