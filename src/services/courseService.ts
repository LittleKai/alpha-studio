const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface LocalizedString {
    vi: string;
    en: string;
}

export interface LessonDocument {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface Lesson {
    lessonId: string;
    title: LocalizedString;
    duration: number;
    type: 'video' | 'text' | 'quiz' | 'assignment';
    content: string;
    videoUrl: string;
    documents: LessonDocument[];
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
    slug: string;
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

// Get single course by ID or slug
export const getCourseById = async (idOrSlug: string): Promise<Course> => {
    const response = await fetch(`${API_URL}/courses/${idOrSlug}`, {
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

// Alias for getCourseById - explicitly named for slug-based lookups
export const getCourseBySlug = getCourseById;

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

// Get featured/popular courses for landing page
export const getFeaturedCourses = async (limit: number = 6): Promise<CourseListResponse> => {
    return getCourses({
        status: 'published',
        limit,
        sort: '-enrolledCount' // Sort by most enrolled
    });
};

// ================== ENROLLMENT TYPES & API ==================

export interface LessonProgress {
    lessonId: string;
    completed: boolean;
    completedAt: string | null;
    watchedDuration: number;
    lastPosition: number;
}

export interface CurrentLesson {
    moduleId: string;
    lessonId: string;
}

export interface Enrollment {
    _id: string;
    user: string;
    course: Course;
    enrolledAt: string;
    progress: number;
    completedLessons: LessonProgress[];
    currentLesson: CurrentLesson;
    status: 'active' | 'completed' | 'expired';
    completedAt: string | null;
    lastAccessedAt: string;
    paymentStatus: 'pending' | 'paid' | 'free';
}

export interface EnrollmentProgress {
    progress: number;
    completedLessons: LessonProgress[];
    currentLesson: CurrentLesson;
    status: string;
    lastAccessedAt: string;
}

// Get my enrolled courses
export const getMyEnrolledCourses = async (): Promise<Enrollment[]> => {
    const response = await fetch(`${API_URL}/enrollments/my-courses`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch enrolled courses');
    }

    const result = await response.json();
    return result.data;
};

// Check if enrolled in a course
export const checkEnrollment = async (courseId: string): Promise<{ enrolled: boolean; data: Enrollment | null }> => {
    const response = await fetch(`${API_URL}/enrollments/check/${courseId}`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check enrollment');
    }

    return response.json();
};

// Enroll in a course
export const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
    const response = await fetch(`${API_URL}/enrollments/${courseId}`, {
        method: 'POST',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to enroll in course');
    }

    const result = await response.json();
    return result.data;
};

// Get enrollment progress
export const getEnrollmentProgress = async (courseId: string): Promise<EnrollmentProgress> => {
    const response = await fetch(`${API_URL}/enrollments/${courseId}/progress`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch progress');
    }

    const result = await response.json();
    return result.data;
};

// Update lesson progress
export const updateLessonProgress = async (
    courseId: string,
    data: {
        lessonId: string;
        moduleId?: string;
        completed?: boolean;
        watchedDuration?: number;
        lastPosition?: number;
    }
): Promise<EnrollmentProgress> => {
    const response = await fetch(`${API_URL}/enrollments/${courseId}/progress`, {
        method: 'PUT',
        headers: getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update progress');
    }

    const result = await response.json();
    return result.data;
};

// Unenroll from a course
export const unenrollFromCourse = async (courseId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/enrollments/${courseId}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to unenroll');
    }
};

// ================== REVIEW TYPES & API ==================

export interface ReviewUser {
    _id: string;
    name: string;
    avatar?: string;
}

export interface Review {
    _id: string;
    user: ReviewUser;
    course: string;
    rating: number;
    comment: string;
    reply?: {
        content: string;
        repliedAt: string;
        repliedBy?: ReviewUser;
    };
    isVerifiedPurchase: boolean;
    helpful: {
        count: number;
        users: string[];
    };
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    updatedAt: string;
}

export interface ReviewsResponse {
    success: boolean;
    data: Review[];
    ratingDistribution: Record<number, number>;
    pagination: PaginationInfo;
}

// Get reviews for a course
export const getCourseReviews = async (
    courseId: string,
    params?: { page?: number; limit?: number; sort?: string }
): Promise<ReviewsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sort) queryParams.append('sort', params.sort);

    const url = `${API_URL}/reviews/course/${courseId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch reviews');
    }

    return response.json();
};

// Get my review for a course
export const getMyReview = async (courseId: string): Promise<Review | null> => {
    const response = await fetch(`${API_URL}/reviews/my-review/${courseId}`, {
        method: 'GET',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch review');
    }

    const result = await response.json();
    return result.data;
};

// Create a review
export const createReview = async (courseId: string, data: { rating: number; comment: string }): Promise<Review> => {
    const response = await fetch(`${API_URL}/reviews/${courseId}`, {
        method: 'POST',
        headers: getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create review');
    }

    const result = await response.json();
    return result.data;
};

// Update a review
export const updateReview = async (reviewId: string, data: { rating?: number; comment?: string }): Promise<Review> => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: getHeaders(true),
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update review');
    }

    const result = await response.json();
    return result.data;
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete review');
    }
};

// Mark review as helpful
export const markReviewHelpful = async (reviewId: string): Promise<{ helpfulCount: number; isHelpful: boolean }> => {
    const response = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: getHeaders(true),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to mark review');
    }

    const result = await response.json();
    return result.data;
};
