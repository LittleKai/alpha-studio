import { GoogleGenAI, Modality } from "@google/genai";
import type { GeneratedContent } from '../types';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.warn("API_KEY environment variable is not set. AI features will not work.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const handleApiError = (error: unknown): Promise<any> => {
  console.error("Error calling Gemini API:", error);
  if (error instanceof Error) {
    let errorMessage = error.message;
    try {
      // Attempt to parse a potential JSON error message from the API
      const potentialJson = errorMessage.substring(errorMessage.indexOf('{'));
      const parsedError = JSON.parse(potentialJson);
      if (parsedError.error && parsedError.error.message) {
        if (parsedError.error.status === 'RESOURCE_EXHAUSTED') {
          errorMessage = "You've likely exceeded the request limit. Please wait a moment before trying again.";
        } else if (parsedError.error.code === 500 || parsedError.error.status === 'UNKNOWN') {
          errorMessage = "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
        } else {
          errorMessage = parsedError.error.message;
        }
      }
    } catch {
      // Not a JSON error, use original message
    }
    return Promise.reject(new Error(errorMessage));
  }
  return Promise.reject(new Error("An unknown error occurred while communicating with the API."));
};

export async function editImage(
  prompt: string,
  imageParts: { base64: string; mimeType: string }[],
  maskBase64: string | null
): Promise<GeneratedContent> {
  if (!ai) {
    return Promise.reject(new Error("API key not configured. Please set VITE_GEMINI_API_KEY in .env.local"));
  }

  try {
    let fullPrompt = prompt;
    const parts: any[] = [];

    // If a mask is provided, the prompt needs to be modified to instruct the model
    // on how to use it.
    if (maskBase64) {
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
    }

    // Add image parts first, as this is a more robust order for image editing models.
    // The primary image is always the first one.
    if (imageParts.length > 0) {
      parts.push({
        inlineData: { data: imageParts[0].base64, mimeType: imageParts[0].mimeType },
      });
    }

    // The mask, if it exists, must follow the image it applies to.
    if (maskBase64) {
      parts.push({
        inlineData: { data: maskBase64, mimeType: 'image/png' },
      });
    }

    // Add any remaining images (secondary, tertiary, etc.)
    if (imageParts.length > 1) {
      imageParts.slice(1).forEach(img => {
        parts.push({
          inlineData: { data: img.base64, mimeType: img.mimeType },
        });
      });
    }

    // Add the text prompt as the last part of the request.
    parts.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const result: GeneratedContent = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;

    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        } else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    if (!result.imageUrl) {
      const finishReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      let errorMessage = "The model did not return an image. It might have refused the request. Please try a different image or prompt.";

      if (finishReason === 'SAFETY') {
        const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
        errorMessage = `The request was blocked for safety reasons. Categories: ${blockedCategories || 'Unknown'}. Please modify your prompt or image.`;
      }
      throw new Error(errorMessage);
    }

    return result;

  } catch (error) {
    return handleApiError(error);
  }
}
