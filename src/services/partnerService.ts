const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface SocialLinks {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
}

export interface Partner {
    _id: string;
    slug: string;
    companyName: string;
    description: LocalizedString;
    logo: string;
    website: string;
    email: string;
    phone: string;
    address: string;
    partnerType: 'technology' | 'education' | 'enterprise' | 'startup' | 'government' | 'other';
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    order: number;
    socialLinks: SocialLinks;
    services: string[];
    backgroundImage: string;
    keyProjects: Array<{
        image: string;
        description: LocalizedString;
    }>;
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PartnerInput {
    companyName: string;
    description?: LocalizedString;
    logo?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    partnerType?: string;
    status?: string;
    featured?: boolean;
    order?: number;
    socialLinks?: SocialLinks;
    services?: string[];
    backgroundImage?: string;
    keyProjects?: Array<{
        image: string;
        description: LocalizedString;
    }>;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface PartnerListResponse {
    success: boolean;
    data: Partner[];
    pagination: PaginationInfo;
}

export interface PartnerResponse {
    success: boolean;
    message?: string;
    data: Partner;
}

export interface PartnerQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    partnerType?: string;
    status?: string;
    featured?: boolean;
    sort?: string;
}

// Helper function to get auth headers
const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('alpha_studio_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

// Get all partners with filters and pagination
export const getPartners = async (params: PartnerQueryParams = {}): Promise<PartnerListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.partnerType) queryParams.append('partnerType', params.partnerType);
    if (params.status) queryParams.append('status', params.status);
    if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_URL}/partners?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch partners');
    }

    return response.json();
};

// Get single partner by ID or slug
export const getPartnerById = async (idOrSlug: string): Promise<PartnerResponse> => {
    const response = await fetch(`${API_URL}/partners/${idOrSlug}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch partner');
    }

    return response.json();
};

// Alias for getPartnerById - explicitly named for slug-based lookups
export const getPartnerBySlug = getPartnerById;

// Create new partner
export const createPartner = async (data: PartnerInput): Promise<PartnerResponse> => {
    const response = await fetch(`${API_URL}/partners`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create partner');
    }

    return response.json();
};

// Update partner
export const updatePartner = async (id: string, data: Partial<PartnerInput>): Promise<PartnerResponse> => {
    const response = await fetch(`${API_URL}/partners/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update partner');
    }

    return response.json();
};

// Delete partner
export const deletePartner = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/partners/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete partner');
    }

    return response.json();
};

// Publish partner
export const publishPartner = async (id: string): Promise<PartnerResponse> => {
    const response = await fetch(`${API_URL}/partners/${id}/publish`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish partner');
    }

    return response.json();
};

// Unpublish partner
export const unpublishPartner = async (id: string): Promise<PartnerResponse> => {
    const response = await fetch(`${API_URL}/partners/${id}/unpublish`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unpublish partner');
    }

    return response.json();
};

// Get partner stats
export const getPartnerStats = async (): Promise<{
    totalPartners: number;
    publishedPartners: number;
    draftPartners: number;
    archivedPartners: number;
    featuredPartners: number;
    byType: Record<string, number>;
}> => {
    const response = await fetch(`${API_URL}/partners/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch partner stats');
    }

    const result = await response.json();
    return result.data;
};
