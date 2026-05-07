const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('alpha_studio_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function jsonHeaders(): Record<string, string> {
    return { 'Content-Type': 'application/json', ...getAuthHeaders() };
}

export interface ChatMessage {
    _id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    updatedAt?: string;
}

interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export async function fetchChatHistory(limit = 50): Promise<ChatMessage[]> {
    const response = await fetch(`${API_URL}/chat/history?limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    const data: ApiResponse<ChatMessage[]> = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Lỗi tải lịch sử chat');
    }
    return data.data || [];
}

export async function sendChatMessage(content: string): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
}> {
    const response = await fetch(`${API_URL}/chat/send`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ content }),
    });
    const data: ApiResponse<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> =
        await response.json();
    if (!response.ok || !data.success || !data.data?.assistantMessage) {
        throw new Error(data.message || 'Lỗi gửi tin nhắn');
    }
    return data.data;
}

export async function clearChatHistory(): Promise<void> {
    const response = await fetch(`${API_URL}/chat/history`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    const data: ApiResponse<unknown> = await response.json();
    if (!response.ok || !data.success) {
        throw new Error(data.message || 'Lỗi xóa lịch sử chat');
    }
}
