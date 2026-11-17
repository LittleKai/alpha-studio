import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AssetQuality, cdnImage, videoBasePath } from '../../services/cloudinaryAssets';
import HeroDarkStoryboardThree from './HeroDarkStoryboardThree';

/**
 * Nền hero theo theme:
 * - `dark`: sa bàn 3D Isometric (`hero-dark-diorama.glb` dựng & bake Cycles AO từ Blender 5.3,
 *   tích hợp kho thiết bị/nghệ sĩ CC0 của `led-stage-studio`, Selective HDR Bloom, đèn 3 khớp Pan/Tilt,
 *   màn LED cong GLSL & pháo điện lạnh Cold Spark qua 7 chặng ~2.5s/chặng).
 * - `light`: chuỗi bảy clip Storyboard sống (`living-storyboard`), chỉ giữ hai `<video>`
 *   trong DOM (đang chiếu + kế tiếp) để chồng mờ mượt mà không tải cả bộ ngay từ đầu.
 */

const CLIP_COUNT = 7;
const CROSSFADE_MS = 900;
/** Bắt đầu clip kế tiếp trước khi clip hiện tại kết thúc, tính bằng giây. */
const HANDOFF_LEAD_S = 1;

interface HeroCinemaVideoProps {
    /** Đổi theme phải kèm `key={theme}` ở phía cha để reset chuỗi phát. */
    theme: 'light' | 'dark';
    /** Nhận index clip đang chiếu (0-6) để đồng bộ với rail hành trình. */
    onClipChange?: (index: number) => void;
    stillAlt: string;
    quality?: AssetQuality;
}

interface LightStoryboardVideoProps {
    basePath: string;
    still: string;
    onClipChange?: (index: number) => void;
    stillAlt: string;
    reduceMotion: boolean;
}

const LightStoryboardVideo: React.FC<LightStoryboardVideoProps> = ({
    basePath,
    still,
    onClipChange,
    stillAlt,
    reduceMotion,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null]);
    const frontRef = useRef<0 | 1>(0);
    const switchingRef = useRef(false);
    const inViewRef = useRef(true);

    const [clips, setClips] = useState<[number, number]>([0, 1]);
    const [front, setFront] = useState<0 | 1>(0);
    const [ready, setReady] = useState(false);

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
                <img src={still} alt={stillAlt} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div ref={containerRef} className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            {([0, 1] as const).map((slot) => (
                <video
                    key={`${slot}-${clips[slot]}`}
                    ref={(element) => { videoRefs.current[slot] = element; }}
                    src={`${basePath}/L${clips[slot]}.mp4`}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        opacity: ready && slot === front ? 1 : 0,
                        transition: `opacity ${CROSSFADE_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        willChange: 'opacity',
                    }}
                    muted
                    playsInline
                    preload={slot === front ? 'auto' : 'metadata'}
                    tabIndex={-1}
                    onCanPlay={handleCanPlay(slot)}
                    onTimeUpdate={handleTimeUpdate(slot)}
                    onEnded={() => { if (slot === frontRef.current) advance(); }}
                />
            ))}
        </div>
    );
};

const HeroCinemaVideo: React.FC<HeroCinemaVideoProps> = ({ theme, onClipChange, stillAlt, quality }) => {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(motionQuery.matches);
        sync();
        motionQuery.addEventListener('change', sync);
        return () => motionQuery.removeEventListener('change', sync);
    }, []);

    if (theme === 'dark') {
        return (
            <HeroDarkStoryboardThree
                onClipChange={onClipChange}
                stillAlt={stillAlt}
                quality={quality}
                reduceMotion={reduceMotion}
                fallbackStill={cdnImage('event-creative-city/01-event-gate', { sizing: 'w_1600', quality })}
            />
        );
    }

    return (
        <LightStoryboardVideo
            basePath={videoBasePath('living-storyboard', quality)}
            still={cdnImage('event-creative-city/concepts/living-storyboard/01-creative-desk', { sizing: 'w_1600', quality })}
            onClipChange={onClipChange}
            stillAlt={stillAlt}
            reduceMotion={reduceMotion}
        />
    );
};

export default memo(HeroCinemaVideo);
