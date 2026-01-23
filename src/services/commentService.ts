const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface CommentAuthor {
    _id: string;
    name: string;
    avatar?: string;
}

export interface Comment {
    _id: string;
    targetType: 'prompt' | 'resource';
    targetId: string;
    author: CommentAuthor;
    content: string;
    parentComment: string | null;
    likes: string[];
    likesCount: number;
    status: 'visible' | 'hidden' | 'flagged';
    isEdited: boolean;
    repliesCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export interface CommentListResponse {
    success: boolean;
    data: Comment[];
    pagination: PaginationInfo;
}

export interface CommentResponse {
    success: boolean;
    message?: string;
    data: Comment;
}

export interface CommentQueryParams {
    page?: number;
    limit?: number;
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

// Get comments for a target
export const getComments = async (
    targetType: 'prompt' | 'resource',
    targetId: string,
    params: CommentQueryParams = {}
): Promise<CommentListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await fetch(
        `${API_URL}/comments/${targetType}/${targetId}?${queryParams.toString()}`,
        {
            method: 'GET',
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch comments');
    }

    return response.json();
};

// Get replies for a comment
export const getReplies = async (
    commentId: string,
    params: CommentQueryParams = {}
): Promise<CommentListResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(
        `${API_URL}/comments/replies/${commentId}?${queryParams.toString()}`,
        {
            method: 'GET',
            headers: getAuthHeaders()
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch replies');
    }

    return response.json();
};

// Create a comment
export const createComment = async (
    targetType: 'prompt' | 'resource',
    targetId: string,
    content: string,
    parentComment?: string
): Promise<CommentResponse> => {
    const response = await fetch(
        `${API_URL}/comments/${targetType}/${targetId}`,
        {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ content, parentComment })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create comment');
    }

    return response.json();
};

// Update a comment
export const updateComment = async (
    commentId: string,
    content: string
): Promise<CommentResponse> => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update comment');
    }

    return response.json();
};

// Delete a comment
export const deleteComment = async (
    commentId: string
): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete comment');
    }

    return response.json();
};

// Toggle like on a comment
export const toggleCommentLike = async (
    commentId: string
): Promise<{ success: boolean; data: { liked: boolean; likesCount: number } }> => {
    const response = await fetch(`${API_URL}/comments/${commentId}/like`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to like comment');
    }

    return response.json();
};

// Flag a comment
export const flagComment = async (
    commentId: string
): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_URL}/comments/${commentId}/flag`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to flag comment');
    }

    return response.json();
};

// Moderate a comment (mod/admin only)
export const moderateComment = async (
    commentId: string,
    status: 'visible' | 'hidden'
): Promise<CommentResponse> => {
    const response = await fetch(`${API_URL}/comments/${commentId}/moderate`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to moderate comment');
    }

    return response.json();
};
