const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface PromptAuthor {
    _id: string;
    name: string;
    avatar?: string;
}

export interface ExampleImage {
    type: 'input' | 'output';
    url: string;
    publicId?: string;
    caption?: string;
}

export interface PromptContent {
    label: string;
    content: string;
}

export interface Rating {
    average: number;
    count: number;
}

export interface Prompt {
    _id: string;
    slug: string;
    title: LocalizedString;
    description: LocalizedString;
    promptContent: string; // Legacy single prompt
    promptContents: PromptContent[]; // Multiple prompts support
    notes: string; // Additional notes
    category: 'image-generation' | 'text-generation' | 'code' | 'workflow' | 'other';
    platform: 'midjourney' | 'stable-diffusion' | 'dalle' | 'comfyui' | 'chatgpt' | 'claude' | 'other';
    exampleImages: ExampleImage[];
    tags: string[];
    author: PromptAuthor;
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
    // User interaction flags
    isLiked?: boolean;
    isBookmarked?: boolean;
    userRating?: number | null;
}

export interface PromptInput {
    title: LocalizedString;
    description?: LocalizedString;
    promptContent?: string; // Legacy single prompt
    promptContents?: PromptContent[]; // Multiple prompts support
    notes?: string; // Additional notes
    category?: string;
    platform?: string;
    exampleImages?: ExampleImage[];
    tags?: string[];
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface PromptListResponse {
    success: boolean;
    data: Prompt[];
    pagination: PaginationInfo;
}

export interface PromptResponse {
    success: boolean;
    message?: string;
    data: Prompt;
}

export interface PromptQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    platform?: string;
    tags?: string;
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

// Get all prompts with filters and pagination
export const getPrompts = async (params: PromptQueryParams = {}): Promise<PromptListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.tags) queryParams.append('tags', params.tags);
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.author) queryParams.append('author', params.author);

    const response = await fetch(`${API_URL}/prompts?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch prompts');
    }

    return response.json();
};

// Get featured prompts
export const getFeaturedPrompts = async (limit: number = 6): Promise<{ success: boolean; data: Prompt[] }> => {
    const response = await fetch(`${API_URL}/prompts/featured?limit=${limit}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch featured prompts');
    }

    return response.json();
};

// Get user's created prompts
export const getMyPrompts = async (params: { page?: number; limit?: number; status?: string } = {}): Promise<PromptListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);

    const response = await fetch(`${API_URL}/prompts/my/created?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch your prompts');
    }

    return response.json();
};

// Get user's bookmarked prompts
export const getBookmarkedPrompts = async (params: { page?: number; limit?: number } = {}): Promise<PromptListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_URL}/prompts/my/bookmarked?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch bookmarked prompts');
    }

    return response.json();
};

// Get single prompt by slug
export const getPromptBySlug = async (slug: string): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts/${slug}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch prompt');
    }

    return response.json();
};

// Create new prompt
export const createPrompt = async (data: PromptInput): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create prompt');
    }

    return response.json();
};

// Update prompt
export const updatePrompt = async (id: string, data: Partial<PromptInput>): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update prompt');
    }

    return response.json();
};

// Delete prompt
export const deletePrompt = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/prompts/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete prompt');
    }

    return response.json();
};

// Toggle like on prompt
export const togglePromptLike = async (id: string): Promise<{ success: boolean; data: { liked: boolean; likesCount: number } }> => {
    const response = await fetch(`${API_URL}/prompts/${id}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like prompt');
    }

    return response.json();
};

// Toggle bookmark on prompt
export const togglePromptBookmark = async (id: string): Promise<{ success: boolean; data: { bookmarked: boolean; bookmarksCount: number } }> => {
    const response = await fetch(`${API_URL}/prompts/${id}/bookmark`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bookmark prompt');
    }

    return response.json();
};

// Track download and get prompt content
export const downloadPrompt = async (id: string): Promise<{ success: boolean; data: { downloadsCount: number; promptContent: string } }> => {
    const response = await fetch(`${API_URL}/prompts/${id}/download`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download prompt');
    }

    return response.json();
};

// Rate prompt
export const ratePrompt = async (id: string, score: number): Promise<{ success: boolean; data: { userRating: number; rating: Rating } }> => {
    const response = await fetch(`${API_URL}/prompts/${id}/rate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ score })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to rate prompt');
    }

    return response.json();
};

// Hide prompt (mod/admin)
export const hidePrompt = async (id: string, reason?: string): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts/${id}/hide`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to hide prompt');
    }

    return response.json();
};

// Unhide prompt (mod/admin)
export const unhidePrompt = async (id: string): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts/${id}/unhide`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unhide prompt');
    }

    return response.json();
};

// Toggle featured (admin)
export const togglePromptFeatured = async (id: string): Promise<PromptResponse> => {
    const response = await fetch(`${API_URL}/prompts/${id}/feature`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to feature prompt');
    }

    return response.json();
};
