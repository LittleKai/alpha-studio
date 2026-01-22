const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface CreditPackage {
    id: string;
    credits: number;
    price: number;
    label: string;
    bonus?: string;
    popular?: boolean;
}

export interface Transaction {
    _id: string;
    userId: string;
    amount: number;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transactionCode: string;
    paymentMethod: 'bank_transfer' | 'momo' | 'vnpay';
    description: string;
    processedAt: string | null;
    failedReason: string | null;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BankInfo {
    bankId: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface CreatePaymentResponse {
    transaction: {
        _id: string;
        transactionCode: string;
        amount: number;
        credits: number;
        status: string;
        expiresAt: string;
        createdAt: string;
    };
    bankInfo: BankInfo;
    qrCodeUrl: string;
    transferContent: string;
}

export interface TransactionListResponse {
    success: boolean;
    data: Transaction[];
    pendingCount: number;
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
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
 * Get available credit packages
 */
export const getCreditPackages = async (): Promise<CreditPackage[]> => {
    const response = await fetch(`${API_URL}/payment/pricing`, {
        method: 'GET',
        headers: getHeaders(false),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch credit packages');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Create a new payment request
 */
export const createPaymentRequest = async (packageId: string): Promise<CreatePaymentResponse> => {
    const response = await fetch(`${API_URL}/payment/create`, {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify({ packageId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment request');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Cancel a pending transaction
 */
export const cancelTransaction = async (transactionId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/payment/cancel/${transactionId}`, {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel transaction');
    }
};

/**
 * Get payment history for current user
 */
export const getPaymentHistory = async (
    page: number = 1,
    limit: number = 20,
    status?: 'pending' | 'completed' | 'failed' | 'cancelled'
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
 * Get pending transactions
 */
export const getPendingTransactions = async (): Promise<Transaction[]> => {
    const response = await fetch(`${API_URL}/payment/pending`, {
        method: 'GET',
        headers: getHeaders(),
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch pending transactions');
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
        headers: getHeaders(false),
    });

    if (!response.ok) {
        throw new Error('Failed to get bank info');
    }

    const result = await response.json();
    return result.data;
};

/**
 * Format amount as VND currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
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
