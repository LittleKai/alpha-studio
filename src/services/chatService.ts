const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('alpha_studio_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function jsonHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', ...getAuthHeaders() };
}

export interface ChatMessage {
    role: 'user' | 'model' | 'system';
    content: string;
}

export interface ChatResponse {
    success: boolean;
    message?: string;
    data?: {
        text: string;
    };
}

export async function sendChatMessage(messages: ChatMessage[]): Promise<string> {
    try {
        const response = await fetch(`${API_URL}/chat/generate`, {
            method: 'POST',
            headers: jsonHeaders(),
            body: JSON.stringify({ messages }),
        });

        const data: ChatResponse = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Lỗi giao tiếp với AI API');
        }

        return data.data?.text || '';
    } catch (error: any) {
        console.error('sendChatMessage Error:', error);
        throw new Error(error.message || 'Lỗi không xác định khi kết nối với AI');
    }
}