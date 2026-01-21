const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface Transaction {
    _id: string;
    userId: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    transactionCode: string;
    paymentMethod: 'bank_transfer' | 'momo' | 'vnpay';
    description: string;
    processedAt: string | null;
    failedReason: string | null;
    formattedAmount: string;
    createdAt: string;
    updatedAt: string;
}

export interface BankInfo {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branch: string;
}

export interface PaymentRequest {
    transaction: {
        _id: string;
        transactionCode: string;
        amount: number;
        status: string;
        paymentMethod: string;
        createdAt: string;
    };
    bankInfo: BankInfo;
    transferContent: string;
    expiresIn: string;
}

export interface TransactionListResponse {
    success: boolean;
    data: Transaction[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

export interface PaymentResponse<T> {
    success: boolean;
    message?: string;
    data: T;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

// Helper function to get headers
const getHeaders = (includeAuth: boolean = true): HeadersInit => {
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

/**
 * Get payment history for current user
 */
export const getPaymentHistory = async (
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'completed' | 'failed'
): Promise<TransactionListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    if (status) {
        params.append('status', status);
    }

    const response = await fetch(`${API_URL}/payment/history?${params.toString()}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch payment history');
    }

    return response.json();
};

/**
 * Create a new payment request (top-up)
 */
export const createPaymentRequest = async (
    amount: number,
    paymentMethod: 'bank_transfer' | 'momo' | 'vnpay' = 'bank_transfer'
): Promise<PaymentRequest> => {
    const response = await fetch(`${API_URL}/payment/create`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ amount, paymentMethod }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment request');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Check transaction status
 */
export const checkTransactionStatus = async (transactionId: string): Promise<Transaction> => {
    const response = await fetch(`${API_URL}/payment/status/${transactionId}`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to check transaction status');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Get bank account information
 */
export const getBankInfo = async (): Promise<BankInfo> => {
    const response = await fetch(`${API_URL}/payment/bank-info`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get bank info');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Format amount as VND currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};

/**
 * Format date for display
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
