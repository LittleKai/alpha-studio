// Cloudinary Upload Service
// Tài khoản đọc từ `cloudinaryAccounts.ts` — một hoặc nhiều, xoay vòng để chia tải.
// Env: VITE_CLOUDINARY_CLOUD_NAMES + VITE_CLOUDINARY_UPLOAD_PRESETS (hoặc cặp số ít cũ).

import { compressImage, type ImageUploadType } from './imageCompression';
import { CLOUDINARY_ACCOUNTS, accountsToTry } from './cloudinaryAccounts';

export interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  url: string;
  error?: {
    message: string;
  };
}

export interface UploadResult {
  success: boolean;
  url: string;
  publicId: string;
  width: number;
  height: number;
  error?: string;
}

/**
 * Upload một file ảnh lên Cloudinary với compression tự động
 * @param file - File ảnh cần upload
 * @param folder - Thư mục lưu trữ (optional)
 * @param uploadType - Loại upload để xác định mức nén phù hợp (optional)
 * @returns Promise với kết quả upload
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string,
  uploadType: ImageUploadType = 'general'
): Promise<UploadResult> {
  if (!CLOUDINARY_ACCOUNTS.length) {
    return {
      success: false,
      url: '',
      publicId: '',
      width: 0,
      height: 0,
      error: 'Cloudinary cloud name not configured',
    };
  }

  try {
    // Resize + chuyển WebP theo loại upload trước khi gửi lên Cloudinary
    const processedFile = await compressImage(file, uploadType);

    // Tài khoản bốc ngẫu nhiên trước; hỏng (hết hạn mức, lỗi mạng) thì thử tài khoản kế
    let lastError = 'Unknown error occurred';
    for (const account of accountsToTry()) {
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('upload_preset', account.uploadPreset);
      if (folder) {
        formData.append('folder', folder);
      }

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${account.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const data: CloudinaryResponse = await response.json();

        if (data.error) {
          lastError = data.error.message;
          continue;
        }

        return {
          success: true,
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
        };
      } catch (err) {
        lastError = err instanceof Error ? err.message : lastError;
      }
    }

    return {
      success: false,
      url: '',
      publicId: '',
      width: 0,
      height: 0,
      error: lastError,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      url: '',
      publicId: '',
      width: 0,
      height: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload ảnh từ Base64 data URL lên Cloudinary
 * @param dataUrl - Base64 data URL của ảnh
 * @param filename - Tên file (optional)
 * @param folder - Thư mục lưu trữ (optional)
 * @param uploadType - Loại upload để xác định mức nén phù hợp (optional)
 * @returns Promise với kết quả upload
 */
export async function uploadBase64ToCloudinary(
  dataUrl: string,
  filename: string = 'image.png',
  folder?: string,
  uploadType?: ImageUploadType
): Promise<UploadResult> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], filename, { type: blob.type });
    return uploadToCloudinary(file, folder, uploadType);
  } catch (error) {
    console.error('Base64 to Cloudinary upload error:', error);
    return {
      success: false,
      url: '',
      publicId: '',
      width: 0,
      height: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload nhiều ảnh lên Cloudinary
 * @param files - Mảng các file ảnh
 * @param folder - Thư mục lưu trữ (optional)
 * @param uploadType - Loại upload để xác định mức nén phù hợp (optional)
 * @returns Promise với mảng kết quả upload
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder?: string,
  uploadType?: ImageUploadType
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadToCloudinary(file, folder, uploadType))
  );
  return results;
}

// Re-export ImageUploadType for convenience
export type { ImageUploadType } from './imageCompression';

/**
 * Upload an image file (simplified wrapper)
 * @param file - Image file to upload
 * @returns Promise with url and publicId
 */
export async function uploadImage(
  file: File,
  uploadType: ImageUploadType = 'content'
): Promise<{ url: string; publicId: string }> {
  const result = await uploadToCloudinary(file, 'prompts', uploadType);
  if (!result.success) {
    throw new Error(result.error || 'Failed to upload image');
  }
  return { url: result.url, publicId: result.publicId };
}

/**
 * Upload a generic file to Cloudinary (raw upload)
 * @param file - File to upload
 * @param onProgress - Progress callback (optional)
 * @returns Promise with url and publicId
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  // Upload có thanh tiến độ nên dùng XHR — chỉ bốc một tài khoản, không thử vòng
  const account = accountsToTry()[0];
  if (!account) {
    throw new Error('Cloudinary cloud name not configured');
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', account.uploadPreset);
    formData.append('folder', 'resources');

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          if (data.error) {
            reject(new Error(data.error.message));
          } else {
            resolve({
              url: data.secure_url,
              publicId: data.public_id
            });
          }
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      // Use auto resource type to handle any file type
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${account.cloudName}/auto/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

/**
 * Tạo URL với transformation cho Cloudinary
 * @param url - URL gốc của ảnh
 * @param options - Các tùy chọn transformation
 * @returns URL đã transform
 */
export function getTransformedUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'jpg' | 'png';
  }
): string {
  if (!url.includes('cloudinary.com')) return url;

  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);

  if (transformations.length === 0) return url;

  const transformation = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformation}/`);
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
