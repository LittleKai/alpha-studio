/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CDN_BASE_URL?: string;
  /** Một tài khoản Cloudinary (cách cũ) — vẫn dùng được, được ghép vào đầu danh sách xoay vòng */
  readonly VITE_CLOUDINARY_CLOUD_NAME?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET?: string;
  /** Nhiều tài khoản Cloudinary, ngăn cách bằng dấu phẩy, khớp cặp theo thứ tự */
  readonly VITE_CLOUDINARY_CLOUD_NAMES?: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESETS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

