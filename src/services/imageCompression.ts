// Image Compression Service
// Compresses images based on upload type before sending to Cloudinary

export type ImageUploadType = 'avatar' | 'featured_work' | 'logo' | 'attachment' | 'general';

export interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  maxSizeKB: number;
  quality: number;
  format: 'image/jpeg' | 'image/png' | 'image/webp';
}

// Compression presets for different upload types
const COMPRESSION_PRESETS: Record<ImageUploadType, CompressionOptions> = {
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    maxSizeKB: 150,
    quality: 0.85,
    format: 'image/jpeg',
  },
  featured_work: {
    maxWidth: 1200,
    maxHeight: 800,
    maxSizeKB: 500,
    quality: 0.9,
    format: 'image/jpeg',
  },
  logo: {
    maxWidth: 600,
    maxHeight: 600,
    maxSizeKB: 300,
    quality: 0.92,
    format: 'image/png',
  },
  attachment: {
    maxWidth: 1920,
    maxHeight: 1080,
    maxSizeKB: 800,
    quality: 0.88,
    format: 'image/jpeg',
  },
  general: {
    maxWidth: 1920,
    maxHeight: 1920,
    maxSizeKB: 1024,
    quality: 0.9,
    format: 'image/jpeg',
  },
};

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
  options: CompressionOptions
): Promise<Blob> {
  const maxSizeBytes = options.maxSizeKB * 1024;
  let quality = options.quality;
  let blob = await canvasToBlob(canvas, options.format, quality);

  // Progressively reduce quality until size target is met
  while (blob.size > maxSizeBytes && quality > 0.1) {
    quality -= 0.05;
    blob = await canvasToBlob(canvas, options.format, quality);
  }

  // If still too large and format is PNG, try converting to JPEG
  if (blob.size > maxSizeBytes && options.format === 'image/png') {
    quality = options.quality;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);

    while (blob.size > maxSizeBytes && quality > 0.1) {
      quality -= 0.05;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }
  }

  return blob;
}

/**
 * Compress an image file based on upload type
 * @param file - Original image file
 * @param uploadType - Type of upload to determine compression settings
 * @returns Promise with compressed File
 */
export async function compressImage(
  file: File,
  uploadType: ImageUploadType = 'general'
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

  // Check if compression is needed
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB <= options.maxSizeKB) {
    // Still resize if dimensions exceed limits
    try {
      const img = await loadImage(file);
      if (img.width <= options.maxWidth && img.height <= options.maxHeight) {
        return file; // No compression needed
      }
    } catch {
      return file;
    }
  }

  try {
    const img = await loadImage(file);

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
    const blob = await compressWithTargetSize(canvas, options);

    // Generate new filename with correct extension
    const extension = blob.type === 'image/png' ? '.png' :
                      blob.type === 'image/webp' ? '.webp' : '.jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const newFileName = `${baseName}_compressed${extension}`;

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
  const fileSizeKB = file.size / 1024;

  return fileSizeKB > options.maxSizeKB;
}
