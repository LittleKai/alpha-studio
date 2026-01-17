const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface Lesson {
    lessonId: string;
    title: LocalizedString;
    duration: number;
    type: 'video' | 'text' | 'quiz' | 'assignment';
    content: string;
    order: number;
}

export interface Module {
    moduleId: string;
    title: LocalizedString;
    lessons: Lesson[];
}

export interface Instructor {
    name: string;
    avatar: string;
    bio: string;
}

export interface LearningOutcome {
    vi: string;
    en: string;
}

export interface Course {
    _id: string;
    title: LocalizedString;
    description: LocalizedString;
    category: 'ai-basic' | 'ai-advanced' | 'ai-studio' | 'ai-creative';
    thumbnail: string;
    duration: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    price: number;
    discount: number;
    status: 'draft' | 'published' | 'archived';
    instructor: Instructor;
    modules: Module[];
    enrolledCount: number;
    rating: number;
    reviewCount: number;
    tags: string[];
    prerequisites: string[];
    learningOutcomes: LearningOutcome[];
    createdBy?: {
        _id: string;
        name: string;
        email: string;
    };
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    finalPrice: number;
    totalLessons: number;
}

export interface CourseInput {
    title: LocalizedString;
    description?: LocalizedString;
    category: string;
    thumbnail?: string;
    duration?: number;
    level?: string;
    price?: number;
    discount?: number;
    status?: string;
    instructor?: Partial<Instructor>;
    modules?: Module[];
    tags?: string[];
    prerequisites?: string[];
    learningOutcomes?: LearningOutcome[];
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface CourseListResponse {
    success: boolean;
    data: Course[];
    pagination: PaginationInfo;
}

export interface CourseResponse {
    success: boolean;
    message?: string;
    data: Course;
}

export interface CourseStatsResponse {
    success: boolean;
    data: {
        totalCourses: number;
        publishedCourses: number;
        draftCourses: number;
        archivedCourses: number;
        totalEnrollments: number;
        averageRating: number | string;
        byCategory: Record<string, number>;
    };
}

export interface CourseQueryParams {
    page?: number;
    limit?: number;
    category?: string;
    level?: string;
    status?: string;
    search?: string;
    sort?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

// Helper function to get headers
const getHeaders = (includeAuth: boolean = false): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (includeAuth) {
        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    return headers;
};

// Get all courses with filtering and pagination
export const getCourses = async (params?: CourseQueryParams): Promise<CourseListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.level) queryParams.append('level', params.level);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${API_URL}/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(true), // Include auth to see all courses (admin)
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch courses');
    }

    return response.json();
};

// Get single course by ID
export const getCourseById = async (id: string): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch course');
    }

    const result = await response.json();
    return result.data;
};

// Create a new course
export const createCourse = async (data: CourseInput): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses`, {
        method: 'POST',
        headers: getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create course');
    }

    const result = await response.json();
    return result.data;
};

// Update a course
export const updateCourse = async (id: string, data: Partial<CourseInput>): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update course');
    }

    const result = await response.json();
    return result.data;
};

// Delete a course
export const deleteCourse = async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/courses/${id}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete course');
    }
};

// Publish a course
export const publishCourse = async (id: string): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${id}/publish`, {
        method: 'PATCH',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to publish course');
    }

    const result = await response.json();
    return result.data;
};

// Unpublish a course
export const unpublishCourse = async (id: string): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${id}/unpublish`, {
        method: 'PATCH',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unpublish course');
    }

    const result = await response.json();
    return result.data;
};

// Archive a course
export const archiveCourse = async (id: string): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${id}/archive`, {
        method: 'PATCH',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to archive course');
    }

    const result = await response.json();
    return result.data;
};

// Get course statistics
export const getCourseStats = async (): Promise<CourseStatsResponse['data']> => {
    const response = await fetch(`${API_URL}/courses/stats`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch course statistics');
    }

    const result = await response.json();
    return result.data;
};
