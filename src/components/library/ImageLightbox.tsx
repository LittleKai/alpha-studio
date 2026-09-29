import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/context';

interface ImageLightboxProps {
    src: string;
    images?: string[];
    initialIndex?: number;
    onClose: () => void;
}

export default function ImageLightbox({ src, images, initialIndex = 0, onClose }: ImageLightboxProps) {
    const { t } = useTranslation();
    const imageList = images?.length ? images : [src];
    const [currentIndex, setCurrentIndex] = useState(() => Math.min(initialIndex, imageList.length - 1));

    useEffect(() => {
        setCurrentIndex(Math.min(initialIndex, imageList.length - 1));
    }, [initialIndex, imageList.length, src]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (imageList.length > 1 && e.key === 'ArrowLeft') {
                setCurrentIndex(index => (index > 0 ? index - 1 : imageList.length - 1));
            }
            if (imageList.length > 1 && e.key === 'ArrowRight') {
                setCurrentIndex(index => (index < imageList.length - 1 ? index + 1 : 0));
            }
        };
        window.addEventListener('keydown', onKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [imageList.length, onClose]);

    const currentSrc = imageList[currentIndex] || src;
    const canNavigate = imageList.length > 1;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
            {canNavigate && (
                <button
                    type="button"
                    aria-label={t('landing.services.previousImage')}
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index => (index > 0 ? index - 1 : imageList.length - 1));
                    }}
                    className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/80"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" aria-hidden="true">
                        <path d="m15 18-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}

            <img
                src={fullSize(currentSrc)}
                alt=""
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />

            {canNavigate && (
                <button
                    type="button"
                    aria-label={t('landing.services.nextImage')}
                    onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index => (index < imageList.length - 1 ? index + 1 : 0));
                    }}
                    className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white/80"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" aria-hidden="true">
                        <path d="m9 18 6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            )}

            {canNavigate && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-sm text-white/80" aria-live="polite">
                    {currentIndex + 1} / {imageList.length}
                </div>
            )}
        </div>
    );
}

function fullSize(src: string): string {
    return src.replace(/(\/upload\/[^/]*?)w_\d+/, '$1w_1600');
}
