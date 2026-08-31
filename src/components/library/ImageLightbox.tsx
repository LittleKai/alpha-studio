import { useEffect } from 'react';

/**
 * Xem ảnh phóng to. Bấm vào bất kỳ đâu (kể cả chính tấm ảnh) hoặc nhấn Esc là
 * đóng — không có nút đóng riêng vì cả lớp phủ đều là vùng đóng.
 */
export default function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        // Khoá cuộn nền khi đang xem ảnh
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
            <img
                src={fullSize(src)}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
        </div>
    );
}

/**
 * Ảnh hiển thị trên trang đã bị Cloudinary thu nhỏ theo chỗ đặt (`w_320`,
 * `w_640`…). Xem phóng to thì lấy bản rộng hơn; URL ngoài Cloudinary giữ nguyên.
 */
function fullSize(src: string): string {
    return src.replace(/(\/upload\/[^/]*?)w_\d+/, '$1w_1600');
}
