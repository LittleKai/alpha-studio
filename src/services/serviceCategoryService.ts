import { fetchWithRetry, parseErrorMessage } from './apiRetry';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

/** Tên bảng màu, khớp `SECTION_PALETTES` trong components/library/SectionRenderer.tsx */
export const SERVICE_ACCENTS = ['violet', 'sky', 'emerald', 'amber', 'rose'] as const;
export type ServiceAccent = typeof SERVICE_ACCENTS[number];

/**
 * Phân mục của trang /services — admin/mod tự tạo, không hard-code, để thêm
 * dịch vụ mới không phải deploy lại frontend.
 */
export interface ServiceCategory {
    _id: string;
    title: { vi: string; en: string };
    slug: string;
    description: { vi: string; en: string };
    coverImage: string;
    icon: string;
    accent: ServiceAccent;
    order: number;
    status: 'published' | 'hidden';
    createdAt: string;
    updatedAt: string;
}

export interface ServiceCategoryFormData {
    title: { vi: string; en: string };
    description: { vi: string; en: string };
    coverImage: string;
    icon: string;
    accent: ServiceAccent;
    order: number;
    status: 'published' | 'hidden';
}

// Public: phân mục đang hiển thị
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
    const res = await fetchWithRetry(`${API_URL}/service-categories`, { headers: getHeaders() });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to fetch service categories'));
    const json = await res.json();
    return json.data as ServiceCategory[];
};

// Admin: gồm cả phân mục đang ẩn
export const getAdminServiceCategories = async (): Promise<ServiceCategory[]> => {
    const res = await fetch(`${API_URL}/service-categories/admin/list`, { headers: getHeaders() });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch service categories');
    return json.data as ServiceCategory[];
};

export const createServiceCategory = async (data: ServiceCategoryFormData) => {
    const res = await fetch(`${API_URL}/service-categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create service category');
    return json;
};

export const updateServiceCategory = async (id: string, data: Partial<ServiceCategoryFormData>) => {
    const res = await fetch(`${API_URL}/service-categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update service category');
    return json;
};

export const deleteServiceCategory = async (id: string) => {
    const res = await fetch(`${API_URL}/service-categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete service category');
    return json;
};
