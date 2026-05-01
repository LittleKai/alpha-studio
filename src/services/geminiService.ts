import type { GeneratedContent } from '../types';
import { getStudioSettings } from './studioService';

// ─────────────────────────────────────────────────────────────────────
// Gemini SDK Proxy — calls Backend to keep keys secure
// ─────────────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('alpha_studio_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export type StudioModel = 'gemini-2.5-flash-image' | 'gemini-3.0-pro-image' | 'veo-2.0-generate-001';

export const STUDIO_MODELS: { id: StudioModel; nameKey: string; descKey: string; badge: string }[] = [
  {
    id: 'gemini-2.5-flash-image',
    nameKey: 'studio.model.flashName',
    descKey: 'studio.model.flashDesc',
    badge: 'Nano Banana',
  },
  {
    id: 'gemini-3.0-pro-image',
    nameKey: 'studio.model.proName',
    descKey: 'studio.model.proDesc',
    badge: 'Nano Banana Pro',
  },
];

export async function editImage(
  prompt: string,
  imageParts: { base64: string; mimeType: string }[],
  maskBase64: string | null,
  model: StudioModel = 'gemini-2.5-flash-image',
  _onProgress?: (text: string) => void,
): Promise<GeneratedContent> {
  try {
    const res = await fetch(`${API_URL}/gemini/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        model,
        prompt,
        imageParts,
        maskBase64,
        useVideoKey: model.startsWith('veo')
      })
    });

    const data = await res.json();
    if (!data.success) {
       throw new Error(data.message);
    }

    return data.data;
  } catch (error: any) {
    console.error('Error calling Gemini Backend API:', error);
    return Promise.reject(new Error(error.message || 'Lỗi không xác định khi gọi Gemini API.'));
  }
}
