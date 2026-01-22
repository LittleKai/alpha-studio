const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

// Helper function to get headers
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

// Types
export interface AdminUser {
    _id: string;
    email: string;
    name: string;
    role: 'student' | 'partner' | 'mod' | 'admin';
    avatar: string | null;
    balance: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminTransaction {
    _id: string;
    userId: { _id: string; name: string; email: string } | null;
    type: 'topup' | 'spend' | 'refund' | 'manual_topup' | 'bonus';
    amount: number;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'timeout';
    transactionCode: string;
    paymentMethod: string;
    serviceType: string | null;
    description: string;
    processedBy: { _id: string; name: string; email: string } | null;
    adminNote: string | null;
    processedAt: string | null;
    createdAt: string;
}

export interface WebhookLog {
    _id: string;
    source: string;
    payload: any;
    parsedData: {
        transactionCode: string | null;
        amount: number;
        description: string;
        bankTransactionId: string;
        when: string;
    };
    status: 'received' | 'processing' | 'matched' | 'unmatched' | 'error' | 'ignored';
    matchedTransactionId: AdminTransaction | null;
    matchedUserId: { _id: string; name: string; email: string } | null;
    errorMessage: string | null;
    processingNotes: string | null;
    createdAt: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// API Functions

/**
 * Get all users with pagination and search
 */
export const getUsers = async (
    page: number = 1,
    limit: number = 20,
    search: string = '',
    role?: string
): Promise<PaginatedResponse<AdminUser>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (role) params.append('role', role);

    const response = await fetch(`${API_URL}/admin/users?${params}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }

    return response.json();
};

/**
 * Get user details by ID
 */
export const getUserDetails = async (userId: string): Promise<{
    success: boolean;
    data: {
        user: AdminUser;
        stats: {
            totalTopup: number;
            totalSpent: number;
            transactionCount: number;
        };
    };
}> => {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user details');
    }

    return response.json();
};

/**
 * Get user's transaction history
 */
export const getUserTransactions = async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    type?: string,
    status?: string
): Promise<PaginatedResponse<AdminTransaction>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (type) params.append('type', type);
    if (status) params.append('status', status);

    const response = await fetch(`${API_URL}/admin/users/${userId}/transactions?${params}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user transactions');
    }

    return response.json();
};

/**
 * Manual top-up for a user
 */
export const manualTopup = async (
    userId: string,
    credits: number,
    note: string
): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/topup`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ credits, note }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to top up');
    }

    return response.json();
};

/**
 * Get all transactions with filters
 */
export const getAllTransactions = async (params: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    serviceType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}): Promise<PaginatedResponse<AdminTransaction> & { stats: any[] }> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value) searchParams.append(key, value.toString());
    });

    const response = await fetch(`${API_URL}/admin/transactions?${searchParams}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch transactions');
    }

    return response.json();
};

/**
 * Process a pending transaction (approve/reject)
 */
export const processTransaction = async (
    transactionId: string,
    action: 'approve' | 'reject',
    note?: string
): Promise<{ success: boolean; message: string; data: AdminTransaction }> => {
    const response = await fetch(`${API_URL}/admin/transactions/${transactionId}/process`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ action, note }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process transaction');
    }

    return response.json();
};

/**
 * Get webhook logs
 */
export const getWebhookLogs = async (
    page: number = 1,
    limit: number = 50,
    source?: string,
    status?: string
): Promise<PaginatedResponse<WebhookLog>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });
    if (source) params.append('source', source);
    if (status) params.append('status', status);

    const response = await fetch(`${API_URL}/admin/webhook-logs?${params}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch webhook logs');
    }

    return response.json();
};

/**
 * Get webhook log detail
 */
export const getWebhookLogDetail = async (logId: string): Promise<{
    success: boolean;
    data: WebhookLog;
}> => {
    const response = await fetch(`${API_URL}/admin/webhook-logs/${logId}`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch webhook log');
    }

    return response.json();
};

/**
 * Reprocess a webhook log
 */
export const reprocessWebhook = async (logId: string): Promise<{
    success: boolean;
    message: string;
    data: any;
}> => {
    const response = await fetch(`${API_URL}/admin/webhook-logs/${logId}/reprocess`, {
        method: 'POST',
        headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reprocess webhook');
    }

    return response.json();
};

/**
 * Assign a user to an unmatched webhook (credits will be added automatically)
 */
export const assignWebhookToUser = async (
    logId: string,
    userId: string,
    note?: string
): Promise<{
    success: boolean;
    message: string;
    data: { log: WebhookLog; transaction: AdminTransaction; newBalance: number };
}> => {
    const response = await fetch(`${API_URL}/admin/webhook-logs/${logId}/assign-user`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId, note }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign webhook to user');
    }

    return response.json();
};

/**
 * Ignore (cancel) an unmatched webhook
 */
export const ignoreWebhook = async (
    logId: string,
    note?: string
): Promise<{
    success: boolean;
    message: string;
    data: WebhookLog;
}> => {
    const response = await fetch(`${API_URL}/admin/webhook-logs/${logId}/ignore`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ note }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to ignore webhook');
    }

    return response.json();
};

/**
 * Get admin dashboard stats
 */
export const getAdminStats = async (): Promise<{
    success: boolean;
    data: {
        totalUsers: number;
        totalTransactions: number;
        pendingTransactions: number;
        todayTransactions: number;
        recentWebhooks: number;
        transactionsByType: { _id: string; count: number }[];
    };
}> => {
    const response = await fetch(`${API_URL}/admin/stats`, {
        headers: getHeaders(),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch stats');
    }

    return response.json();
};

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(dateString));
};
