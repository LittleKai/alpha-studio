const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- TYPES ---

export interface CrmProduct {
    id: string;
    name: string;
    type: 'plan' | 'addon';
    priceVnd: number;
    priceCredits: number;
    description: string;
    features?: string[];
    creditsIncluded?: number;
}

export interface CrmSubscription {
    _id: string;
    userId: any; // User ID or populated user object
    status: 'inactive' | 'active' | 'expired';
    periodStart: string;
    periodEnd: string;
    includedAiLimit: number;
    includedAiUsed: number;
    extraAiRemaining: number;
    autoRenew: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CrmQuota {
    success: boolean;
    data: {
        subscriptionStatus: string;
        periodEnd: string;
        includedAiLimit: number;
        includedAiUsed: number;
        extraAiRemaining: number;
        totalAiRemaining: number;
        hasQuota: boolean;
    };
}

export interface CrmBillingOrder {
    _id: string;
    userId: any;
    productId: string;
    productType: 'plan' | 'addon';
    amount: number;
    credits: number;
    paymentMethod: 'credits' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transactionCode: string;
    description: string;
    qrCodeUrl?: string;
    transferContent?: string;
    fulfilledAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CrmDevice {
    _id: string;
    userId: any;
    machineGuid: string;
    displayName: string;
    status: 'active' | 'disabled';
    lastSeenAt: string;
    lastIp: string;
    appVersion?: string;
    agentVersion?: string;
    pairedMobileUserIds: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CrmAiUsageLog {
    _id: string;
    userId: any;
    subscriptionId: string;
    requestType: string;
    provider: string;
    model?: string;
    status: 'succeeded' | 'failed';
    quotaBucket: string;
    tokens?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
    errorMessage?: string;
    createdAt: string;
}

export interface CrmReleaseInfo {
    version: string;
    windowsInstallerUrl: string;
    androidApkUrl: string;
    releaseNotes?: string;
    sha256?: string;
    publishedAt: string;
}

// --- HELPERS ---

/**
 * Format amount as VND currency
 */
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

const getAuthToken = (): string | null => {
    return localStorage.getItem('alpha_studio_token');
};

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

// --- API ACTIONS ---

/**
 * Fetch CRM product catalog
 */
export const getCrmCatalog = async (): Promise<{ plans: CrmProduct[]; addons: CrmProduct[] }> => {
    const res = await fetch(`${API_URL}/crm/catalog`, {
        method: 'GET',
        headers: getHeaders(false),
    });

    if (!res.ok) {
        throw new Error('Failed to fetch CRM Catalog');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch current user subscription
 */
export const getCrmSubscription = async (): Promise<CrmSubscription | null> => {
    const res = await fetch(`${API_URL}/crm/subscription/me`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Failed to fetch CRM Subscription');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch current user quota details
 */
export const getCrmQuota = async (): Promise<CrmQuota['data']> => {
    const res = await fetch(`${API_URL}/crm/quota`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to fetch CRM quota');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Create CRM billing order / checkout
 */
export const createCrmCheckout = async (payload: {
    productId: string;
    paymentMethod: 'credits' | 'bank_transfer';
}): Promise<{ order: CrmBillingOrder; qrCodeUrl?: string; bankInfo?: any }> => {
    const res = await fetch(`${API_URL}/crm/billing/checkout`, {
        method: 'POST',
        headers: getHeaders(true),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to create checkout');
    }

    const json = await res.json();
    return json.data;
};

/**
 * List CRM billing orders for current user
 */
export const listCrmBillingOrders = async (): Promise<CrmBillingOrder[]> => {
    const res = await fetch(`${API_URL}/crm/billing/orders`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to list billing orders');
    }

    const json = await res.json();
    return json.data;
};

/**
 * List CRM devices paired with current user
 */
export const listCrmDevices = async (): Promise<CrmDevice[]> => {
    const res = await fetch(`${API_URL}/crm/devices`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to list devices');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Fetch latest CRM app release
 */
export const getLatestCrmRelease = async (): Promise<CrmReleaseInfo> => {
    const res = await fetch(`${API_URL}/crm/releases/latest`, {
        method: 'GET',
        headers: getHeaders(false),
    });

    if (!res.ok) {
        throw new Error('Failed to fetch latest release metadata');
    }

    const json = await res.json();
    return json.data;
};

// --- ADMIN API ACTIONS ---

/**
 * Admin: List all CRM subscriptions
 */
export const listCrmAdminSubscriptions = async (params?: {
    status?: string;
    email?: string;
}): Promise<CrmSubscription[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.email) query.append('email', params.email);

    const res = await fetch(`${API_URL}/crm/admin/subscriptions?${query.toString()}`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to list CRM admin subscriptions');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Admin: List all CRM devices
 */
export const listCrmAdminDevices = async (): Promise<CrmDevice[]> => {
    const res = await fetch(`${API_URL}/crm/admin/devices`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to list CRM admin devices');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Admin: Disable a specific CRM device
 */
export const disableCrmAdminDevice = async (deviceId: string): Promise<CrmDevice> => {
    const res = await fetch(`${API_URL}/crm/admin/devices/${deviceId}/disable`, {
        method: 'PATCH',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to disable CRM device');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Admin: List all CRM billing orders
 */
export const listCrmAdminBillingOrders = async (): Promise<CrmBillingOrder[]> => {
    const res = await fetch(`${API_URL}/crm/admin/billing/orders`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to list CRM admin billing orders');
    }

    const json = await res.json();
    return json.data;
};

/**
 * Admin: Approve a manual pending bank transfer CRM billing order
 */
export const approveCrmAdminBillingOrder = async (orderId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/crm/admin/billing/orders/${orderId}/approve`, {
        method: 'POST',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to approve billing order');
    }
};

/**
 * Admin: Fetch CRM AI Usage logs
 */
export const listCrmAdminAiUsage = async (userId?: string): Promise<CrmAiUsageLog[]> => {
    const query = new URLSearchParams();
    if (userId) query.append('userId', userId);

    const res = await fetch(`${API_URL}/crm/admin/ai/usage?${query.toString()}`, {
        method: 'GET',
        headers: getHeaders(true),
    });

    if (!res.ok) {
        throw new Error('Failed to fetch CRM AI usage logs');
    }

    const json = await res.json();
    return json.data;
};
