import { GoogleGenAI, Modality } from '@google/genai';
import type { GeneratedContent } from '../types';

// ─────────────────────────────────────────────────────────────────────
// Gemini SDK — used by AI Studio → Edit tab for mask / multi-image /
// storyboard editing. Regular Image/Video generation uses the Flow
// pipeline via studioService instead.
// ─────────────────────────────────────────────────────────────────────

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('[GeminiService] VITE_GEMINI_API_KEY not set — Edit tab will fail.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const handleApiError = (error: unknown): Promise<never> => {
  console.error('Error calling Gemini API:', error);
  if (error instanceof Error) {
    let msg = error.message;
    try {
      const maybeJson = msg.substring(msg.indexOf('{'));
      const parsed = JSON.parse(maybeJson);
      if (parsed.error?.message) {
        if (parsed.error.status === 'RESOURCE_EXHAUSTED') {
          msg = 'Đã vượt quota Gemini. Vui lòng đợi vài phút rồi thử lại.';
        } else if (parsed.error.code === 500 || parsed.error.status === 'UNKNOWN') {
          msg = 'Gemini gặp lỗi tạm thời. Thử lại sau ít phút.';
        } else {
          msg = parsed.error.message;
        }
      }
    } catch {
      // not JSON — keep original
    }
    return Promise.reject(new Error(msg));
  }
  return Promise.reject(new Error('Lỗi không xác định khi gọi Gemini API.'));
};

export type StudioModel = 'gemini-2.5-flash-image' | 'gemini-3.0-pro-image';

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
  if (!ai) {
    return Promise.reject(
      new Error('VITE_GEMINI_API_KEY chưa cấu hình. Không thể dùng Edit tab.'),
    );
  }

  try {
    let fullPrompt = prompt;
    const parts: any[] = [];

    if (maskBase64) {
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
    }

    // Primary image first
    if (imageParts.length > 0) {
      parts.push({
        inlineData: { data: imageParts[0].base64, mimeType: imageParts[0].mimeType },
      });
    }
    // Mask applies to primary image
    if (maskBase64) {
      parts.push({ inlineData: { data: maskBase64, mimeType: 'image/png' } });
    }
    // Remaining images
    if (imageParts.length > 1) {
      for (const img of imageParts.slice(1)) {
        parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } });
      }
    }
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const result: GeneratedContent = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;
    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) result.text = (result.text ? result.text + '\n' : '') + part.text;
        else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!result.imageUrl) {
      const finishReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      let errorMessage = 'Model không trả về ảnh. Thử prompt hoặc ảnh khác.';
      if (finishReason === 'SAFETY') {
        const blocked = safetyRatings?.filter((r) => r.blocked).map((r) => r.category).join(', ');
        errorMessage = `Yêu cầu bị chặn bởi kiểm duyệt an toàn (${blocked || 'Unknown'}). Chỉnh lại prompt/ảnh.`;
      }
      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    return handleApiError(error);
  }
}
