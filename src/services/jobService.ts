const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface Job {
    _id: string;
    title: LocalizedString;
    description: LocalizedString;
    requirements: LocalizedString;
    benefits: LocalizedString;
    location: string;
    salary: {
        min: number;
        max: number;
        currency: string;
        negotiable: boolean;
    };
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
    experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'lead';
    category: 'engineering' | 'design' | 'marketing' | 'operations' | 'hr' | 'finance' | 'other';
    skills: string[];
    status: 'draft' | 'published' | 'closed';
    applicationDeadline: string | null;
    applicationCount: number;
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    publishedAt: string | null;
    closedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface JobInput {
    title: LocalizedString;
    description?: LocalizedString;
    requirements?: LocalizedString;
    benefits?: LocalizedString;
    location?: string;
    salary?: {
        min?: number;
        max?: number;
        currency?: string;
        negotiable?: boolean;
    };
    jobType?: string;
    experienceLevel?: string;
    category?: string;
    skills?: string[];
    status?: string;
    applicationDeadline?: string;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface JobListResponse {
    success: boolean;
    data: Job[];
    pagination: PaginationInfo;
}

export interface JobResponse {
    success: boolean;
    message?: string;
    data: Job;
}

export interface JobQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    jobType?: string;
    experienceLevel?: string;
    status?: string;
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

// Get all jobs with filters and pagination
export const getJobs = async (params: JobQueryParams = {}): Promise<JobListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.category) queryParams.append('category', params.category);
    if (params.jobType) queryParams.append('jobType', params.jobType);
    if (params.experienceLevel) queryParams.append('experienceLevel', params.experienceLevel);
    if (params.status) queryParams.append('status', params.status);
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(`${API_URL}/jobs?${queryParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch jobs');
    }

    return response.json();
};

// Get single job by ID
export const getJobById = async (id: string): Promise<JobResponse> => {
    const response = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch job');
    }

    return response.json();
};

// Create new job
export const createJob = async (data: JobInput): Promise<JobResponse> => {
    const response = await fetch(`${API_URL}/jobs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job');
    }

    return response.json();
};

// Update job
export const updateJob = async (id: string, data: Partial<JobInput>): Promise<JobResponse> => {
    const response = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update job');
    }

    return response.json();
};

// Delete job
export const deleteJob = async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete job');
    }

    return response.json();
};

// Publish job
export const publishJob = async (id: string): Promise<JobResponse> => {
    const response = await fetch(`${API_URL}/jobs/${id}/publish`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish job');
    }

    return response.json();
};

// Close job
export const closeJob = async (id: string): Promise<JobResponse> => {
    const response = await fetch(`${API_URL}/jobs/${id}/close`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to close job');
    }

    return response.json();
};

// Get job stats
export const getJobStats = async (): Promise<{
    totalJobs: number;
    publishedJobs: number;
    draftJobs: number;
    closedJobs: number;
    totalApplications: number;
    byCategory: Record<string, number>;
    byJobType: Record<string, number>;
}> => {
    const response = await fetch(`${API_URL}/jobs/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch job stats');
    }

    const result = await response.json();
    return result.data;
};
