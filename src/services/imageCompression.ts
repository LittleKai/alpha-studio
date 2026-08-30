// Image Compression Service
// Resize + nén ảnh theo loại upload trước khi gửi lên Cloudinary hoặc B2.
//
// Mặc định xuất WebP: nhỏ hơn JPEG ~25-35% ở cùng chất lượng cảm nhận và vẫn
// giữ alpha nên thay được cả PNG. Trình duyệt không encode được WebP
// (Safari < 14) sẽ rơi về `format` của preset.

export type ImageUploadType =
  | 'avatar'
  | 'logo'
  | 'cover'
  | 'content'
  | 'featured_work'
  | 'reference'
  | 'attachment'
  | 'general';

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeKB: number;
  quality: number;
  /** Định dạng dự phòng khi trình duyệt không encode được WebP. */
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

// Compression presets for different upload types
const COMPRESSION_PRESETS: Record<ImageUploadType, CompressionOptions> = {
  // Avatar user/instructor — hiển thị tối đa ~96px, 400px là dư gấp đôi cho màn retina
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    maxSizeKB: 120,
    quality: 0.85,
    format: 'image/jpeg',
  },
  // Logo partner — cần alpha, WebP giữ được; fallback PNG
  logo: {
    maxWidth: 600,
    maxHeight: 600,
    maxSizeKB: 200,
    quality: 0.9,
    format: 'image/png',
  },
  // Ảnh bìa bài viết / thumbnail khoá học / cover thư viện — hiển thị tối đa w_1400
  cover: {
    maxWidth: 1600,
    maxHeight: 1600,
    maxSizeKB: 350,
    quality: 0.85,
    format: 'image/jpeg',
  },
  // Ảnh chèn trong bài (TinyMCE, gallery section) — hiển thị tối đa w_480..w_880
  content: {
    maxWidth: 1280,
    maxHeight: 1280,
    maxSizeKB: 250,
    quality: 0.85,
    format: 'image/jpeg',
  },
  featured_work: {
    maxWidth: 1200,
    maxHeight: 1200,
    maxSizeKB: 300,
    quality: 0.88,
    format: 'image/jpeg',
  },
  // Ảnh tham chiếu gửi cho AI (Gemini/Flow) — giữ chi tiết, chỉ chặn kích thước vô lý
  reference: {
    maxWidth: 1920,
    maxHeight: 1920,
    maxSizeKB: 900,
    quality: 0.9,
    format: 'image/jpeg',
  },
  attachment: {
    maxWidth: 1920,
    maxHeight: 1920,
    maxSizeKB: 600,
    quality: 0.88,
    format: 'image/jpeg',
  },
  general: {
    maxWidth: 1920,
    maxHeight: 1920,
    maxSizeKB: 700,
    quality: 0.88,
    format: 'image/jpeg',
  },
};

/** Trình duyệt encode được WebP qua canvas hay không (dò một lần rồi nhớ). */
let webpEncodeSupport: boolean | null = null;

export function canEncodeWebp(): boolean {
  if (webpEncodeSupport !== null) return webpEncodeSupport;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    webpEncodeSupport = canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    webpEncodeSupport = false;
  }
  return webpEncodeSupport;
}

export interface CompressImageOptions {
  /**
   * Giữ nguyên định dạng gốc thay vì chuyển WebP — chỉ resize + nén lại.
   * Dùng cho ảnh sẽ đi tiếp vào một hệ thống bên thứ ba mà ta không kiểm soát
   * được khả năng đọc WebP (ví dụ ảnh tham chiếu paste vào Google Flow).
   */
  keepFormat?: boolean;
}

/** Định dạng đích: WebP nếu encode được, không thì fallback của preset. */
function resolveOutputFormat(
  options: CompressionOptions,
  sourceType?: string,
  keepFormat?: boolean
): string {
  if (keepFormat && sourceType) return sourceType;
  return canEncodeWebp() ? 'image/webp' : options.format;
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let newWidth = width;
  let newHeight = height;

  // Scale down if larger than max dimensions
  if (width > maxWidth || height > maxHeight) {
    const widthRatio = maxWidth / width;
    const heightRatio = maxHeight / height;
    const ratio = Math.min(widthRatio, heightRatio);

    newWidth = Math.floor(width * ratio);
    newHeight = Math.floor(height * ratio);
  }

  return { width: newWidth, height: newHeight };
}

/**
 * Convert canvas to blob with specified quality
 */
function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Compress an image with progressive quality reduction to meet size target
 */
async function compressWithTargetSize(
  canvas: HTMLCanvasElement,
  options: CompressionOptions,
  format: string,
  allowFormatSwitch: boolean
): Promise<Blob> {
  const maxSizeBytes = options.maxSizeKB * 1024;
  let quality = options.quality;
  let blob = await canvasToBlob(canvas, format, quality);

  // Progressively reduce quality until size target is met
  while (blob.size > maxSizeBytes && quality > 0.1) {
    quality -= 0.05;
    blob = await canvasToBlob(canvas, format, quality);
  }

  // PNG bỏ qua tham số quality nên vòng lặp trên không giảm được gì —
  // chuyển sang JPEG. Chỉ xảy ra khi trình duyệt không encode được WebP.
  if (allowFormatSwitch && blob.size > maxSizeBytes && format === 'image/png') {
    quality = options.quality;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    while (blob.size > maxSizeBytes && quality > 0.1) {
      quality -= 0.05;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }
  }

  return blob;
}

function extensionForType(mime: string): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

/**
 * Compress an image file based on upload type
 * @param file - Original image file
 * @param uploadType - Type of upload to determine compression settings
 * @returns Promise with compressed File
 */
export async function compressImage(
  file: File,
  uploadType: ImageUploadType = 'general',
  compressOptions: CompressImageOptions = {}
): Promise<File> {
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Skip compression for GIF to preserve animation
  if (file.type === 'image/gif') {
    return file;
  }

  // Skip compression for SVG
  if (file.type === 'image/svg+xml') {
    return file;
  }

  const options = COMPRESSION_PRESETS[uploadType];
  const targetFormat = resolveOutputFormat(options, file.type, compressOptions.keepFormat);

  try {
    const img = await loadImage(file);
    const withinDimensions = img.width <= options.maxWidth && img.height <= options.maxHeight;
    const withinSize = file.size / 1024 <= options.maxSizeKB;

    // Đã đúng định dạng đích, đủ nhỏ và đúng kích thước → không re-encode
    // (encode lại một ảnh lossy đã tối ưu chỉ làm mất thêm chất lượng).
    if (file.type === targetFormat && withinDimensions && withinSize) {
      return file;
    }

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.width,
      img.height,
      options.maxWidth,
      options.maxHeight
    );

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(img, 0, 0, width, height);

    // Compress with target size
    const blob = await compressWithTargetSize(canvas, options, targetFormat, !compressOptions.keepFormat);

    // Không có lợi gì khi bản nén lại to hơn bản gốc (ảnh nhỏ, phẳng, đã tối ưu)
    if (blob.size >= file.size && withinDimensions) {
      return file;
    }

    // Generate new filename with correct extension
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}${extensionForType(blob.type)}`;

    return new File([blob], newFileName, { type: blob.type });
  } catch (error) {
    console.error('Image compression error:', error);
    return file; // Return original file if compression fails
  }
}

/**
 * Get compression info for a file and upload type
 */
export function getCompressionInfo(uploadType: ImageUploadType): {
  maxSize: string;
  maxDimensions: string;
} {
  const options = COMPRESSION_PRESETS[uploadType];
  return {
    maxSize: `${options.maxSizeKB}KB`,
    maxDimensions: `${options.maxWidth}x${options.maxHeight}px`,
  };
}

/**
 * Check if a file needs compression based on upload type
 */
export function needsCompression(file: File, uploadType: ImageUploadType): boolean {
  if (!file.type.startsWith('image/') ||
      file.type === 'image/gif' ||
      file.type === 'image/svg+xml') {
    return false;
  }

  const options = COMPRESSION_PRESETS[uploadType];
  if (file.type !== resolveOutputFormat(options)) return true;

  return file.size / 1024 > options.maxSizeKB;
}
