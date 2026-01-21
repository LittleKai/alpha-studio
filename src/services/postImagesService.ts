// PostImages.org API Service
// API Documentation: https://postimages.org/

const POSTIMAGES_API_KEY = import.meta.env.VITE_POSTIMAGES_API_KEY || '6215403c2a92a7201bf1c93e33523343';
const POSTIMAGES_UPLOAD_URL = 'https://postimages.org/json/rr';

export interface PostImagesResponse {
  status: 'OK' | 'error';
  url?: string;
  direct_link?: string;
  thumb?: {
    url: string;
  };
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url: string;
  directLink: string;
  thumbnailUrl: string;
  error?: string;
}

/**
 * Upload một file ảnh lên PostImages.org
 * @param file - File ảnh cần upload
 * @returns Promise với kết quả upload
 */
export async function uploadToPostImages(file: File): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', POSTIMAGES_API_KEY);
    formData.append('format', 'json');

    const response = await fetch(POSTIMAGES_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostImagesResponse = await response.json();

    if (data.status === 'OK' && data.url) {
      return {
        success: true,
        url: data.url,
        directLink: data.direct_link || data.url,
        thumbnailUrl: data.thumb?.url || data.url,
      };
    } else {
      return {
        success: false,
        url: '',
        directLink: '',
        thumbnailUrl: '',
        error: data.error || 'Upload failed',
      };
    }
  } catch (error) {
    console.error('PostImages upload error:', error);
    return {
      success: false,
      url: '',
      directLink: '',
      thumbnailUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload ảnh từ Base64 data URL lên PostImages.org
 * @param dataUrl - Base64 data URL của ảnh
 * @param filename - Tên file (optional)
 * @returns Promise với kết quả upload
 */
export async function uploadBase64ToPostImages(
  dataUrl: string,
  filename: string = 'image.png'
): Promise<UploadResult> {
  try {
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });

    return uploadToPostImages(file);
  } catch (error) {
    console.error('Base64 to PostImages upload error:', error);
    return {
      success: false,
      url: '',
      directLink: '',
      thumbnailUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload nhiều ảnh lên PostImages.org
 * @param files - Mảng các file ảnh
 * @returns Promise với mảng kết quả upload
 */
export async function uploadMultipleToPostImages(files: File[]): Promise<UploadResult[]> {
  const results = await Promise.all(files.map(file => uploadToPostImages(file)));
  return results;
}

/**
 * Kiểm tra URL có phải là ảnh hợp lệ hay không
 * @param url - URL cần kiểm tra
 * @returns Promise<boolean>
 */
export async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return contentType ? contentType.startsWith('image/') : false;
  } catch {
    // If HEAD fails, try loading as image
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}

/**
 * Load ảnh từ URL và trả về data URL
 * @param url - URL của ảnh
 * @returns Promise với data URL
 */
export async function loadImageFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}
