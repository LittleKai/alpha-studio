import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { cdnImage, videoBasePath } from '../../services/cloudinaryAssets';

/**
 * Nền video hero: phát nối tiếp bảy clip của một bộ Event Creative City.
 * Bộ tối dùng look Neon Night, bộ sáng dùng look Storyboard sống.
 *
 * Chỉ hai clip được giữ trong DOM (clip đang chiếu + clip kế tiếp) nên trang
 * không tải cả bộ ~30MB ngay khi mở. Clip kế tiếp được nạp trong lúc clip hiện
 * tại đang chạy và bắt đầu sớm hơn một nhịp để hai lớp kịp chồng mờ vào nhau.
 */

const CLIP_COUNT = 7;
const CROSSFADE_MS = 900;
/** Bắt đầu clip kế tiếp trước khi clip hiện tại kết thúc, tính bằng giây. */
const HANDOFF_LEAD_S = 1;

/**
 * Cùng bộ clip với scroll-scrub ở /event-creative-city nhưng khác chất lượng:
 * landing dùng mặc định `LANDING_QUALITY` (bản 1080p trên Cloudinary), còn trang
 * xem thử tự truyền `PREVIEW_QUALITY` để lấy file local. Ảnh `still` (fallback
 * reduced-motion) là scene mở đầu của mỗi look, cũng theo `LANDING_QUALITY`.
 */
const VIDEO_SETS = {
    dark: {
        basePath: videoBasePath('neon'),
        still: cdnImage('event-creative-city/01-event-gate', { sizing: 'w_1600' }),
    },
    light: {
        basePath: videoBasePath('living-storyboard'),
        still: cdnImage('event-creative-city/concepts/living-storyboard/01-creative-desk', { sizing: 'w_1600' }),
    },
} as const;

interface HeroCinemaVideoProps {
    /** Đổi theme phải kèm `key={theme}` ở phía cha để reset chuỗi phát. */
    theme: 'light' | 'dark';
    /** Nhận index clip đang chiếu (0-6) để đồng bộ với rail hành trình. */
    onClipChange?: (index: number) => void;
    stillAlt: string;
}

const HeroCinemaVideo: React.FC<HeroCinemaVideoProps> = ({ theme, onClipChange, stillAlt }) => {
    const set = VIDEO_SETS[theme];

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
    const frontRef = useRef<0 | 1>(0);
    const switchingRef = useRef(false);
    const inViewRef = useRef(true);

    const [clips, setClips] = useState<[number, number]>([0, 1]);
    const [front, setFront] = useState<0 | 1>(0);
    const [ready, setReady] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(motionQuery.matches);
        sync();
        motionQuery.addEventListener('change', sync);
        return () => motionQuery.removeEventListener('change', sync);
    }, []);

    useEffect(() => {
        onClipChange?.(clips[front]);
    }, [clips, front, onClipChange]);

    const advance = useCallback(() => {
        if (switchingRef.current) return;
        switchingRef.current = true;

        const nextSlot: 0 | 1 = frontRef.current === 0 ? 1 : 0;
        const nextVideo = videoRefs.current[nextSlot];
        if (nextVideo) {
            nextVideo.currentTime = 0;
            void nextVideo.play().catch(() => { /* autoplay bị chặn — lớp poster vẫn giữ nền */ });
        }

        frontRef.current = nextSlot;
        setFront(nextSlot);
    }, []);

    // Sau khi chồng mờ xong: dừng lớp phía sau và nạp clip kế tiếp vào đó.
    useEffect(() => {
        if (reduceMotion) return;

        const backSlot: 0 | 1 = front === 0 ? 1 : 0;
        const timer = window.setTimeout(() => {
            videoRefs.current[backSlot]?.pause();
            setClips((previous) => {
                const next: [number, number] = [previous[0], previous[1]];
                next[backSlot] = (previous[front] + 1) % CLIP_COUNT;
                return next;
            });
            switchingRef.current = false;
        }, CROSSFADE_MS);

        return () => window.clearTimeout(timer);
    }, [front, reduceMotion]);

    // Ngoài viewport thì dừng hẳn để không tốn CPU/băng thông khi người dùng đã cuộn qua.
    useEffect(() => {
        if (reduceMotion) return;
        const node = containerRef.current;
        if (!node) return;

        const observer = new IntersectionObserver(([entry]) => {
            inViewRef.current = entry.isIntersecting;
            const video = videoRefs.current[frontRef.current];
            if (!video) return;
            if (entry.isIntersecting) {
                void video.play().catch(() => { /* autoplay bị chặn */ });
            } else {
                video.pause();
            }
        }, { threshold: 0.05 });

        observer.observe(node);
        return () => observer.disconnect();
    }, [reduceMotion]);

    const handleCanPlay = (slot: 0 | 1) => (event: React.SyntheticEvent<HTMLVideoElement>) => {
        setReady(true);
        const video = event.currentTarget;
        if (slot === frontRef.current && video.paused && inViewRef.current) {
            void video.play().catch(() => { /* autoplay bị chặn */ });
        }
    };

    const handleTimeUpdate = (slot: 0 | 1) => (event: React.SyntheticEvent<HTMLVideoElement>) => {
        if (slot !== frontRef.current) return;
        const video = event.currentTarget;
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        if (video.duration - video.currentTime <= HANDOFF_LEAD_S) advance();
    };

    if (reduceMotion) {
        return (
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img src={set.still} alt={stillAlt} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {([0, 1] as const).map((slot) => (
                <video
                    key={`${slot}-${clips[slot]}`}
                    ref={(element) => { videoRefs.current[slot] = element; }}
                    src={`${set.basePath}/L${clips[slot]}.mp4`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        opacity: ready && slot === front ? 1 : 0,
                        transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        willChange: 'opacity',
                    }}
                    muted
                    playsInline
                    preload="auto"
                    tabIndex={-1}
                    onCanPlay={handleCanPlay(slot)}
                    onTimeUpdate={handleTimeUpdate(slot)}
                    onEnded={() => { if (slot === frontRef.current) advance(); }}
                />
            ))}
        </div>
    );
};

export default memo(HeroCinemaVideo);
