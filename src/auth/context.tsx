import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types
export interface User {
    _id: string;
    email: string;
    name: string;
    role: 'student' | 'partner' | 'mod' | 'admin';
    avatar: string | null;
    backgroundImage: string | null;
    balance: number;
    subscription: {
        plan: 'free' | 'basic' | 'pro' | 'enterprise';
        apiQuota: number;
        expiresAt: string | null;
    };
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string;
    // Extended profile fields
    bio?: string;
    skills?: string[];
    phone?: string;
    location?: string;
    birthDate?: string;
    showBirthDate?: boolean;
    socials?: {
        facebook?: string;
        linkedin?: string;
        github?: string;
        custom?: { label: string; url: string }[];
    };
    featuredWorks?: {
        image: string;
        title: string;
        description: string;
    }[];
    attachments?: {
        url: string;
        filename: string;
        type: string;
        size: number;
    }[];
    preferences?: {
        interiorTwoStepConfirm?: boolean;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
}

interface ProfileUpdateData {
    name?: string;
    avatar?: string;
    backgroundImage?: string;
    bio?: string;
    skills?: string[];
    phone?: string;
    location?: string;
    birthDate?: string;
    showBirthDate?: boolean;
    socials?: {
        facebook?: string;
        linkedin?: string;
        github?: string;
        custom?: { label: string; url: string }[];
    };
    featuredWorks?: {
        image: string;
        title: string;
        description: string;
    }[];
    attachments?: {
        url: string;
        filename: string;
        type: string;
        size: number;
    }[];
    preferences?: {
        interiorTwoStepConfirm?: boolean;
    };
}

interface AuthContextType extends AuthState {
    login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
    register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
    updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; message: string }>;
    refreshUser: () => Promise<void>;
}

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Context
const AuthContext = createContext<AuthContextType | null>(null);

// Storage keys
const TOKEN_KEY = 'alpha_studio_token';
const USER_KEY = 'alpha_studio_user';
const VOCAB_TOKEN_KEY = 'vocabflip_auth_token';

const clearAuthStorage = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(VOCAB_TOKEN_KEY);
};

// Initialize state synchronously from localStorage (no loading delay)
const getInitialState = (): AuthState => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
        try {
            return {
                user: JSON.parse(storedUser),
                token: storedToken,
                isAuthenticated: true,
                isLoading: false
            };
        } catch {
            clearAuthStorage();
        }
    }
    return { user: null, token: null, isAuthenticated: false, isLoading: false };
};

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>(getInitialState);

    // Verify token in background (does NOT block render)
    useEffect(() => {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (!storedToken || !storedUser) return;

        const verifyToken = async () => {
            try {
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${storedToken}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (localStorage.getItem(TOKEN_KEY) !== storedToken) return;

                    localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
                    setState(prev => (
                        prev.token === storedToken
                            ? { ...prev, user: data.data.user }
                            : prev
                    ));
                } else {
                    // Token expired/invalid — silent logout
                    if (localStorage.getItem(TOKEN_KEY) !== storedToken) return;

                    clearAuthStorage();
                    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
                }
            } catch {
                // Network error — keep cached data, don't logout
            }
        };

        verifyToken();
    }, []);

    // Login
    const login = useCallback(async (credentials: LoginCredentials) => {
        try {
            clearAuthStorage();
            setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
            const normalizedCredentials = {
                ...credentials,
                email: credentials.email.trim()
            };

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(normalizedCredentials),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(TOKEN_KEY, data.data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

                setState({
                    user: data.data.user,
                    token: data.data.token,
                    isAuthenticated: true,
                    isLoading: false
                });

                return { success: true, message: 'Login successful' };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }, []);

    // Register
    const register = useCallback(async (registerData: RegisterData) => {
        try {
            clearAuthStorage();
            setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
            const normalizedRegisterData = {
                ...registerData,
                email: registerData.email.trim()
            };

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(normalizedRegisterData),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(TOKEN_KEY, data.data.token);
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));

                setState({
                    user: data.data.user,
                    token: data.data.token,
                    isAuthenticated: true,
                    isLoading: false
                });

                return { success: true, message: 'Registration successful' };
            } else {
                return { success: false, message: data.message || 'Registration failed' };
            }
        } catch {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            if (state.token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.token}`
                    },
                    credentials: 'include'
                });
            }
        } catch {
            // Ignore logout API errors
        } finally {
            clearAuthStorage();

            setState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false
            });
        }
    }, [state.token]);

    // Update profile
    const updateProfile = useCallback(async (profileData: ProfileUpdateData) => {
        if (!state.token) {
            return { success: false, message: 'Not authenticated' };
        }

        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify(profileData),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
                setState(prev => ({
                    ...prev,
                    user: data.data.user
                }));
                return { success: true, message: 'Profile updated' };
            } else {
                return { success: false, message: data.message || 'Update failed' };
            }
        } catch {
            return { success: false, message: 'Network error. Please try again.' };
        }
    }, [state.token]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        if (!state.token) return;

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
                setState(prev => ({
                    ...prev,
                    user: data.data.user
                }));
            }
        } catch {
            // Ignore refresh errors
        }
    }, [state.token]);

    return (
        <AuthContext.Provider value={{
            ...state,
            login,
            register,
            logout,
            updateProfile,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
