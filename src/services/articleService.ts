import { fetchWithRetry, parseErrorMessage } from './apiRetry';
import type { LibrarySection } from './eventLibraryService';
import type { ServiceCategory } from './serviceCategoryService';

/**
 * Kind khối cho phép trong bài dịch vụ — khớp `SERVICE_SECTION_KINDS` ở backend
 * (server/utils/contentSections.js). Bài dịch vụ chỉ cần vài khối giới thiệu,
 * không dùng đủ 8 kind như thư viện sự kiện.
 */
export const SERVICE_SECTION_KINDS = ['richText', 'bulletGroups', 'steps', 'gallery'] as const;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

const getHeaders = (): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/** Tệp tham khảo tải về của bài dịch vụ (.skp, .html…) — lưu trên B2. */
export interface ArticleAttachment {
    name: string;
    url: string;
    fileKey?: string;
    size?: string;
    mime?: string;
}

export interface Article {
    _id: string;
    title: { vi: string; en: string };
    slug: string;
    excerpt: { vi: string; en: string };
    content: { vi: string; en: string };
    thumbnail: string;
    category: 'about' | 'services' | 'news';
    status: 'draft' | 'published' | 'archived';
    author: { _id: string; name: string; avatar: string | null } | null;
    order: number;
    isFeatured: boolean;
    tags: string[];
    // Chỉ có ở bài category 'services'
    serviceCategory: ServiceCategory | null;
    sections: LibrarySection[];
    attachments: ArticleAttachment[];
    createdAt: string;
    updatedAt: string;
}

export interface ArticleFormData {
    title: { vi: string; en: string };
    excerpt: { vi: string; en: string };
    content: { vi: string; en: string };
    thumbnail: string;
    category: 'about' | 'services' | 'news';
    tags: string[];
    order: number;
    isFeatured: boolean;
    serviceCategory?: string | null;
    sections?: LibrarySection[];
    attachments?: ArticleAttachment[];
}

// Public: Get published articles by category
export const getArticles = async (
    category?: string,
    page = 1,
    limit = 20,
    search?: string,
    serviceCategory?: string
) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (serviceCategory) params.append('serviceCategory', serviceCategory);
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);

    const res = await fetchWithRetry(`${API_URL}/articles?${params}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to fetch articles'));
    return res.json();
};

// Public: Get single article by slug
export const getArticleBySlug = async (slug: string) => {
    const res = await fetchWithRetry(`${API_URL}/articles/${slug}`, {
        headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, 'Article not found'));
    return res.json();
};

// Admin: Get all articles (including drafts)
export const getAdminArticles = async (
    category?: string,
    status?: string,
    page = 1,
    limit = 20,
    search?: string
) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (search) params.append('search', search);

    const res = await fetch(`${API_URL}/articles/admin/list?${params}`, {
        headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch articles');
    return json;
};

// Admin: Create article
export const createArticle = async (data: ArticleFormData) => {
    const res = await fetch(`${API_URL}/articles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create article');
    return json;
};

// Admin: Update article
export const updateArticle = async (id: string, data: Partial<ArticleFormData>) => {
    const res = await fetch(`${API_URL}/articles/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update article');
    return json;
};

// Admin: Delete article
export const deleteArticle = async (id: string) => {
    const res = await fetch(`${API_URL}/articles/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete article');
    return json;
};

// Admin: Publish article
export const publishArticle = async (id: string) => {
    const res = await fetch(`${API_URL}/articles/${id}/publish`, {
        method: 'PATCH',
        headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to publish article');
    return json;
};

// Admin: Unpublish article
export const unpublishArticle = async (id: string) => {
    const res = await fetch(`${API_URL}/articles/${id}/unpublish`, {
        method: 'PATCH',
        headers: getHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to unpublish article');
    return json;
};
