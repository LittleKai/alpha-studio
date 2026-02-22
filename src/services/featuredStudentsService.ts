import type { FeaturedStudent } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

export interface AdminFeaturedStudent {
    _id: string;
    userId: string;
    name: string;
    avatar: string | null;
    email: string;
    role: string;
    label: string;
    hired: boolean;
    order: number;
    hasFeaturedWork: boolean;
}

// Public — for landing page
export const getFeaturedStudents = async (): Promise<FeaturedStudent[]> => {
    const res = await fetch(`${API_URL}/featured-students`);
    const data = await res.json();
    return data.success ? data.data : [];
};

// Admin — full list with user details
export const getAdminFeaturedStudents = async (): Promise<AdminFeaturedStudent[]> => {
    const res = await fetch(`${API_URL}/featured-students/admin`, { headers: getAuthHeaders() });
    const data = await res.json();
    return data.success ? data.data : [];
};

export const addFeaturedStudent = async (userId: string): Promise<{ success: boolean; message: string; data?: AdminFeaturedStudent }> => {
    const res = await fetch(`${API_URL}/featured-students`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId })
    });
    return res.json();
};

export const updateFeaturedStudent = async (userId: string, updates: { label?: string; hired?: boolean }): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/featured-students/${userId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
    });
    return res.json();
};

export const reorderFeaturedStudents = async (orderedIds: string[]): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/featured-students/reorder/save`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderedIds })
    });
    return res.json();
};

export const removeFeaturedStudent = async (userId: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_URL}/featured-students/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return res.json();
};
