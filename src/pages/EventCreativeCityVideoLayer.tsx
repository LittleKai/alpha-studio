import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface EventCreativeCityVideoLayerProps {
    basePath: string;
    posters: string[];
    alts: string[];
    progress: number;
    activeIndex: number;
}

const KEEP_RADIUS = 1;
const SEAM_BLEND = 0.02;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * Scrub bảy clip độc lập bằng scroll. Mỗi seam trộn khoảng 160ms (2% của clip 8s)
 * vì cuối clip trước và đầu clip sau cùng tham chiếu một ảnh local nhưng không pixel-identical.
 */
const EventCreativeCityVideoLayer: React.FC<EventCreativeCityVideoLayerProps> = ({
    basePath,
    posters,
    alts,
    progress,
    activeIndex,
}) => {
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const seekingRef = useRef<boolean[]>([]);
    const pendingSeekRef = useRef<(number | null)[]>([]);
    const blobUrlsRef = useRef<(string | null)[]>([]);
    const loadingRef = useRef<boolean[]>([]);
    const unmountedRef = useRef(false);
    const primedRef = useRef(false);

    const [painted, setPainted] = useState<boolean[]>(() => posters.map(() => false));
    const [blobFallback, setBlobFallback] = useState<(string | null)[]>(() => posters.map(() => null));
    const [reduceMotion, setReduceMotion] = useState(false);

    const directSrc = useCallback((index: number) => `${basePath}/L${index}.mp4`, [basePath]);
    const videoSrc = useCallback(
        (index: number) => blobFallback[index] ?? directSrc(index),
        [blobFallback, directSrc],
    );

    const position = clamp(progress) * posters.length;
    const localProgress = clamp(position - activeIndex);

    const layerOpacities = useMemo(() => posters.map((_, index) => {
        if (index === activeIndex) {
            if (activeIndex === posters.length - 1 || localProgress <= 1 - SEAM_BLEND) return 1;
            return 1 - ((localProgress - (1 - SEAM_BLEND)) / SEAM_BLEND);
        }
        if (index === activeIndex + 1 && localProgress > 1 - SEAM_BLEND) {
            return (localProgress - (1 - SEAM_BLEND)) / SEAM_BLEND;
        }
        return 0;
    }), [activeIndex, localProgress, posters]);

    const fallbackToBlob = useCallback((index: number) => {
        if (blobUrlsRef.current[index] || loadingRef.current[index]) return;
        loadingRef.current[index] = true;
        fetch(directSrc(index))
            .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
            .then((blob) => {
                if (unmountedRef.current) return;
                const url = URL.createObjectURL(blob);
                blobUrlsRef.current[index] = url;
                setBlobFallback((previous) => {
                    if (previous[index]) return previous;
                    const next = [...previous];
                    next[index] = url;
                    return next;
                });
            })
            .catch(() => {
                // Poster local vẫn giữ trang đọc được nếu video tải hỏng.
            })
            .finally(() => {
                loadingRef.current[index] = false;
            });
    }, [directSrc]);

    const checkSeekable = useCallback((index: number, element: HTMLVideoElement) => {
        if (blobFallback[index]) return;
        const canSeek = element.seekable.length > 0
            && Number.isFinite(element.duration)
            && element.seekable.end(element.seekable.length - 1) >= element.duration - 0.5;
        if (!canSeek) fallbackToBlob(index);
    }, [blobFallback, fallbackToBlob]);

    const markPainted = useCallback((index: number) => {
        setPainted((previous) => {
            if (previous[index]) return previous;
            const next = [...previous];
            next[index] = true;
            return next;
        });
    }, []);

    const seekTo = useCallback((index: number, target: number) => {
        const video = videoRefs.current[index];
        if (!video || !video.duration || Number.isNaN(video.duration)) return;
        const boundedTarget = Math.min(Math.max(0, target), Math.max(0, video.duration - 0.001));
        if (seekingRef.current[index]) {
            pendingSeekRef.current[index] = boundedTarget;
            return;
        }
        if (Math.abs(video.currentTime - boundedTarget) < 0.012) return;
        seekingRef.current[index] = true;
        video.currentTime = boundedTarget;
    }, []);

    const handleSeeked = useCallback((index: number) => {
        seekingRef.current[index] = false;
        const pending = pendingSeekRef.current[index];
        const video = videoRefs.current[index];
        if (pending === null || pending === undefined || !video) return;
        pendingSeekRef.current[index] = null;
        if (Math.abs(video.currentTime - pending) < 0.012) return;
        seekingRef.current[index] = true;
        video.currentTime = pending;
    }, []);

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(motionQuery.matches);
        sync();
        motionQuery.addEventListener('change', sync);
        return () => motionQuery.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
            blobUrlsRef.current.forEach((url) => { if (url) URL.revokeObjectURL(url); });
            blobUrlsRef.current = [];
            loadingRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (reduceMotion) return;
        const video = videoRefs.current[activeIndex];
        if (!video || !video.duration || Number.isNaN(video.duration)) return;
        seekTo(activeIndex, localProgress * video.duration);
    }, [activeIndex, blobFallback, localProgress, reduceMotion, seekTo]);

    useEffect(() => {
        if (reduceMotion) return;
        const next = videoRefs.current[activeIndex + 1];
        if (next && next.duration && !seekingRef.current[activeIndex + 1] && next.currentTime > 0.02) {
            next.currentTime = 0;
        }
        const previous = videoRefs.current[activeIndex - 1];
        if (previous && previous.duration && !seekingRef.current[activeIndex - 1]) {
            const last = previous.duration - 0.04;
            if (Math.abs(previous.currentTime - last) > 0.02) previous.currentTime = last;
        }
    }, [activeIndex, blobFallback, reduceMotion]);

    useEffect(() => {
        setPainted((previous) => {
            let changed = false;
            const next = previous.map((wasPainted, index) => {
                if (wasPainted && Math.abs(index - activeIndex) > KEEP_RADIUS) {
                    changed = true;
                    return false;
                }
                return wasPainted;
            });
            return changed ? next : previous;
        });
    }, [activeIndex]);

    useEffect(() => {
        if (reduceMotion) return;
        const prime = () => {
            if (primedRef.current) return;
            primedRef.current = true;
            videoRefs.current.forEach((video) => {
                if (!video) return;
                const play = video.play();
                if (play && typeof play.then === 'function') {
                    play.then(() => video.pause()).catch(() => { /* autoplay bị chặn */ });
                } else {
                    video.pause();
                }
            });
        };
        window.addEventListener('touchstart', prime, { passive: true, once: true });
        window.addEventListener('pointerdown', prime, { once: true });
        return () => {
            window.removeEventListener('touchstart', prime);
            window.removeEventListener('pointerdown', prime);
        };
    }, [blobFallback, reduceMotion]);

    return (
        <div className="ecc-video-stack" aria-hidden="true">
            {posters.map((poster, index) => (
                <div
                    key={poster}
                    className="ecc-video-layer"
                    style={{
                        opacity: reduceMotion ? (index === activeIndex ? 1 : 0) : layerOpacities[index],
                        zIndex: index === activeIndex + 1 ? 2 : 1,
                    }}
                >
                    {!reduceMotion && Math.abs(index - activeIndex) <= KEEP_RADIUS && (
                        <video
                            key={videoSrc(index)}
                            ref={(element) => {
                                videoRefs.current[index] = element;
                                if (element?.readyState && element.readyState >= 2) markPainted(index);
                            }}
                            className="ecc-scene-video"
                            src={videoSrc(index)}
                            muted
                            playsInline
                            preload="auto"
                            tabIndex={-1}
                            onLoadedMetadata={(event) => checkSeekable(index, event.currentTarget)}
                            onLoadedData={() => markPainted(index)}
                            onCanPlay={() => markPainted(index)}
                            onSeeked={() => {
                                markPainted(index);
                                handleSeeked(index);
                            }}
                        />
                    )}
                    <img
                        className="ecc-video-poster"
                        src={poster}
                        alt={index === activeIndex ? alts[index] : ''}
                        style={{ opacity: reduceMotion || !painted[index] ? 1 : 0 }}
                    />
                </div>
            ))}
        </div>
    );
};

export default EventCreativeCityVideoLayer;
