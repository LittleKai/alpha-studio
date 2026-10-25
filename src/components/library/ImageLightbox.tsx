import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/context';

interface ImageLightboxProps {
    src: string;
    images?: string[];
    initialIndex?: number;
    onClose: () => void;
}

export default function ImageLightbox({ src, images, initialIndex = 0, onClose }: ImageLightboxProps) {
    const { t } = useTranslation();
    const imageList = useMemo(() => (images?.length ? images : [src]), [images, src]);
    const [currentIndex, setCurrentIndex] = useState(() => Math.min(initialIndex, imageList.length - 1));
    const currentSrc = imageList[currentIndex] || src;
    const [isLoading, setIsLoading] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        setCurrentIndex(Math.min(initialIndex, imageList.length - 1));
    }, [initialIndex, imageList.length, src]);

    useEffect(() => {
        setIsLoading(true);
        setIsZoomed(false);
    }, [currentSrc]);

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

    // Tải trước ảnh kế bên để thao tác next/previous không phải chờ một request
    // mới bắt đầu sau khi người dùng đã bấm nút.
    useEffect(() => {
        const adjacentIndexes = [currentIndex - 1, currentIndex + 1].filter(
            index => index >= 0 && index < imageList.length
        );
        adjacentIndexes.forEach(index => {
            const image = new Image();
            image.decoding = 'async';
            image.src = fullSize(imageList[index]);
        });
    }, [currentIndex, imageList]);

    const canNavigate = imageList.length > 1;

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
        >
            <button
                type="button"
                aria-label={t('common.close')}
                onClick={onClose}
                className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white focus:outline-none focus:ring-2 focus:ring-white/80"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6" aria-hidden="true">
                    <path d="m6 6 12 12M6 18 18 6" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
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

            <div
                key={currentSrc}
                className={`relative ${isZoomed ? 'h-full w-full overflow-auto' : 'flex min-h-[180px] min-w-[180px] max-w-full items-center justify-center'}`}
                aria-busy={isLoading}
            >
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center" role="status">
                        <span className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                        <span className="sr-only">{t('landing.services.loadingImage')}</span>
                    </div>
                )}
                <button
                    type="button"
                    aria-label={t(isZoomed ? 'landing.services.zoomOut' : 'landing.services.zoomIn')}
                    aria-pressed={isZoomed}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsZoomed(zoomed => !zoomed);
                    }}
                    className={`${isZoomed ? 'block mx-auto cursor-zoom-out' : 'flex max-w-full items-center justify-center cursor-zoom-in'} rounded-lg focus:outline-none focus:ring-2 focus:ring-white/80`}
                >
                    <img
                        src={fullSize(currentSrc)}
                        alt=""
                        loading="eager"
                        decoding="async"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                        className={`${isZoomed ? 'max-w-none' : 'max-w-full max-h-[calc(100dvh-2rem)]'} object-contain rounded-lg shadow-2xl transition-opacity duration-150 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    />
                </button>
            </div>

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
