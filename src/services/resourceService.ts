const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface ResourceAuthor {
    _id: string;
    name: string;
    avatar?: string;
}

export interface ResourceFile {
    url: string;
    publicId?: string;
    filename: string;
    format?: string;
    size: number;
    mimeType?: string;
}

export interface PreviewImage {
    url: string;
    publicId?: string;
    caption?: string;
}

export interface Thumbnail {
    url: string;
    publicId?: string;
}

export interface Rating {
    average: number;
    count: number;
}

export interface Resource {
    _id: string;
    slug: string;
    title: LocalizedString;
    description: LocalizedString;
    resourceType: 'template' | 'dataset' | 'design-asset' | 'project-file' | '3d-model' | 'font' | 'other';
    file: ResourceFile;
    thumbnail?: Thumbnail;
    previewImages: PreviewImage[];
    tags: string[];
    compatibleSoftware: string[];
    author: ResourceAuthor;
    likesCount: number;
    bookmarksCount: number;
    downloadsCount: number;
    viewsCount: number;
    commentsCount: number;
    rating: Rating;
    status: 'published' | 'hidden' | 'archived';
    isFeatured: boolean;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
    fileSizeFormatted?: string;
    // User interaction flags
    isLiked?: boolean;
    isBookmarked?: boolean;
    userRating?: number | null;
}

export interface ResourceInput {
    title: LocalizedString;
    description?: LocalizedString;
    resourceType?: string;
    file: ResourceFile;
    thumbnail?: Thumbnail;
    previewImages?: PreviewImage[];
    tags?: string[];
    compatibleSoftware?: string[];
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface ResourceListResponse {
    success: boolean;
    data: Resource[];
    pagination: PaginationInfo;
}

export interface ResourceResponse {
    success: boolean;
    message?: string;
    data: Resource;
}

export interface ResourceQueryParams {
    page?: number;
    limit?: number;
    resourceType?: string;
    tags?: string;
    compatibleSoftware?: string;
    search?: string;
    sort?: string;
    author?: string;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// Get all resources with filters and pagination
export const getResources = async (params: ResourceQueryParams = {}): Promise<ResourceListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.resourceType) queryParams.append('resourceType', params.resourceType);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.compatibleSoftware) queryParams.append('compatibleSoftware', params.compatibleSoftware);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.author) queryParams.append('author', params.author);

    const response = await fetch(`${API_URL}/resources?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch resources');
    }

    return response.json();
};

// Get featured resources
export const getFeaturedResources = async (limit: number = 6): Promise<{ success: boolean; data: Resource[] }> => {
    const response = await fetch(`${API_URL}/resources/featured?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch featured resources');
    }

    return response.json();
};

// Get user's created resources
export const getMyResources = async (params: { page?: number; limit?: number; status?: string } = {}): Promise<ResourceListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_URL}/resources/my/created?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch your resources');
    }

    return response.json();
};

// Get user's bookmarked resources
export const getBookmarkedResources = async (params: { page?: number; limit?: number } = {}): Promise<ResourceListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/resources/my/bookmarked?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookmarked resources');
    }

    return response.json();
};

// Get single resource by slug
export const getResourceBySlug = async (slug: string): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources/${slug}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch resource');
    }

    return response.json();
};

// Create new resource
export const createResource = async (data: ResourceInput): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create resource');
    }

    return response.json();
};

// Update resource
export const updateResource = async (id: string, data: Partial<ResourceInput>): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update resource');
    }

    return response.json();
};

// Delete resource
export const deleteResource = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/resources/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete resource');
    }

    return response.json();
};

// Toggle like on resource
export const toggleResourceLike = async (id: string): Promise<{ success: boolean; data: { liked: boolean; likesCount: number } }> => {
    const response = await fetch(`${API_URL}/resources/${id}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like resource');
    }

    return response.json();
};

// Toggle bookmark on resource
export const toggleResourceBookmark = async (id: string): Promise<{ success: boolean; data: { bookmarked: boolean; bookmarksCount: number } }> => {
    const response = await fetch(`${API_URL}/resources/${id}/bookmark`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bookmark resource');
    }

    return response.json();
};

// Track download and get file info
export const downloadResource = async (id: string): Promise<{ success: boolean; data: { downloadsCount: number; file: ResourceFile } }> => {
    const response = await fetch(`${API_URL}/resources/${id}/download`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download resource');
    }

    return response.json();
};

// Rate resource
export const rateResource = async (id: string, score: number): Promise<{ success: boolean; data: { userRating: number; rating: Rating } }> => {
    const response = await fetch(`${API_URL}/resources/${id}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to rate resource');
    }

    return response.json();
};

// Hide resource (mod/admin)
export const hideResource = async (id: string, reason?: string): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources/${id}/hide`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to hide resource');
    }

    return response.json();
};

// Unhide resource (mod/admin)
export const unhideResource = async (id: string): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources/${id}/unhide`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unhide resource');
    }

    return response.json();
};

// Toggle featured (admin)
export const toggleResourceFeatured = async (id: string): Promise<ResourceResponse> => {
    const response = await fetch(`${API_URL}/resources/${id}/feature`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to feature resource');
    }

    return response.json();
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Max file size constant (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
