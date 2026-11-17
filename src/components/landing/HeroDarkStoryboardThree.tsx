import React, { useEffect, useRef, useState } from 'react';
import type { AssetQuality } from '../../services/cloudinaryAssets';
import {
    TOTAL_STORYBOARD_DURATION_S,
    loadWithTransientRetry,
} from '../../utils/heroStoryboardTimeline';

interface HeroDarkStoryboardThreeProps {
    onClipChange?: (index: number) => void;
    stillAlt: string;
    quality?: AssetQuality;
    reduceMotion: boolean;
    fallbackStill: string;
}

const HeroDarkStoryboardThree: React.FC<HeroDarkStoryboardThreeProps> = ({
    onClipChange,
    stillAlt,
    quality,
    reduceMotion,
    fallbackStill,
}) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const onClipChangeRef = useRef(onClipChange);
    onClipChangeRef.current = onClipChange;

    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        let disposed = false;
        const abort = new AbortController();
        const cleanups: (() => void)[] = [];
        const cleanup = () => {
            for (const release of cleanups.splice(0).reverse()) release();
        };

        (async () => {
            // Nhường 1 microtask để lượt mount nháp của React 19 StrictMode tự hủy trước khi tạo WebGLContext.
            await Promise.resolve();
            if (disposed || !hostRef.current) return;

            try {
                const [
                    THREE,
                    { UnrealBloomPass },
                    { createThreeDarkStoryboardScene },
                ] = await loadWithTransientRetry(
                    () => Promise.all([
                        import('three'),
                        import('three/addons/postprocessing/UnrealBloomPass.js'),
                        import('./threeDarkStoryboardScene'),
                    ]),
                    3,
                    400,
                );
                if (disposed || !hostRef.current) return;

                const container = hostRef.current;
                const dprCap = quality === 'high' ? 1.5 : 1.35;
                const dpr = Math.min(window.devicePixelRatio || 1, dprCap);

                const initW = Math.max(1, container.clientWidth);
                const initH = Math.max(1, container.clientHeight);

                // Bộ đệm HDR HalfFloatType + Selective Bloom tích hợp (`renderer.setEffects` chuẩn Three.js r187)
                // giữ nguyên khử răng cưa MSAA phần cứng mà chỉ làm phát sáng vùng HDR > ngưỡng 0.88.
                const renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    alpha: false,
                    stencil: false,
                    outputBufferType: THREE.HalfFloatType,
                });
                cleanups.push(() => {
                    renderer.setAnimationLoop(null);
                    renderer.setEffects(null);
                    renderer.dispose();
                    renderer.forceContextLoss();
                    renderer.domElement.remove();
                });
                renderer.setPixelRatio(dpr);
                renderer.toneMapping = THREE.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 0.96;
                renderer.setSize(initW, initH, false);

                const bloomPass = new UnrealBloomPass(
                    new THREE.Vector2(initW, initH),
                    0.35,
                    0.35,
                    0.90,
                );
                cleanups.push(() => bloomPass.dispose());
                renderer.setEffects([bloomPass]);

                const sceneCtrl = await createThreeDarkStoryboardScene(renderer, abort.signal);
                if (disposed || !hostRef.current) {
                    sceneCtrl.dispose();
                    cleanup();
                    return;
                }

                cleanups.push(() => sceneCtrl.dispose());

                const canvas = renderer.domElement;
                canvas.style.display = 'block';
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.setAttribute('aria-hidden', 'true');
                container.appendChild(canvas);

                sceneCtrl.resize(initW, initH);

                const applyResize = () => {
                    if (disposed || !hostRef.current) return;
                    const w = Math.max(1, hostRef.current.clientWidth);
                    const h = Math.max(1, hostRef.current.clientHeight);
                    renderer.setSize(w, h, false);
                    sceneCtrl.resize(w, h);
                    if (reduceMotion) {
                        sceneCtrl.updateAndRender(TOTAL_STORYBOARD_DURATION_S - 1.6);
                    }
                };

                const resizeObserver = new ResizeObserver(applyResize);
                cleanups.push(() => resizeObserver.disconnect());
                resizeObserver.observe(container);

                let intersectionObserver: IntersectionObserver | null = null;
                let onVisibilityChange: (() => void) | null = null;
                let onPointerMove: ((e: PointerEvent) => void) | null = null;
                cleanups.push(() => {
                    intersectionObserver?.disconnect();
                    if (onVisibilityChange) document.removeEventListener('visibilitychange', onVisibilityChange);
                    if (onPointerMove) window.removeEventListener('pointermove', onPointerMove);
                });

                if (reduceMotion) {
                    const ch = sceneCtrl.updateAndRender(TOTAL_STORYBOARD_DURATION_S - 1.6);
                    onClipChangeRef.current?.(ch);
                } else {
                    let elapsedSeconds = 0;
                    let lastTickMs = performance.now();
                    let lastChapter = -1;
                    let inView = true;
                    let running = false;

                    const initialCh = sceneCtrl.updateAndRender(0);
                    lastChapter = initialCh;
                    onClipChangeRef.current?.(initialCh);

                    const tick = (nowMs: number) => {
                        const dt = Math.min(0.1, Math.max(0, (nowMs - lastTickMs) / 1000));
                        lastTickMs = nowMs;
                        elapsedSeconds += dt;
                        const ch = sceneCtrl.updateAndRender(elapsedSeconds);
                        if (ch !== lastChapter) {
                            lastChapter = ch;
                            onClipChangeRef.current?.(ch);
                        }
                    };

                    const syncLoop = () => {
                        if (disposed) return;
                        const shouldRun = inView && !document.hidden;
                        if (shouldRun && !running) {
                            running = true;
                            lastTickMs = performance.now();
                            renderer.setAnimationLoop(tick);
                        } else if (!shouldRun && running) {
                            running = false;
                            renderer.setAnimationLoop(null);
                        }
                    };

                    intersectionObserver = new IntersectionObserver(
                        ([entry]) => {
                            inView = entry.isIntersecting;
                            syncLoop();
                        },
                        { threshold: 0.05 },
                    );
                    intersectionObserver.observe(container);

                    onVisibilityChange = () => syncLoop();
                    document.addEventListener('visibilitychange', onVisibilityChange);

                    onPointerMove = (event: PointerEvent) => {
                        if (!inView || document.hidden) return;
                        const nx = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
                        const ny = (event.clientY / Math.max(1, window.innerHeight)) * 2 - 1;
                        sceneCtrl.setPointerNormalized(nx, ny);
                    };
                    window.addEventListener('pointermove', onPointerMove, { passive: true });

                    syncLoop();
                }

                setReady(true);
            } catch {
                cleanup();
                if (!disposed) setFailed(true);
            }
        })();

        return () => {
            disposed = true;
            abort.abort();
            cleanup();
        };
    }, [quality, reduceMotion]);

    if (failed) {
        return (
            <div className="absolute inset-0 z-0 overflow-hidden">
                <img src={fallbackStill} alt={stillAlt} className="w-full h-full object-cover" />
            </div>
        );
    }

    return (
        <div
            ref={hostRef}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#060d1a]"
            aria-hidden="true"
            style={{
                opacity: ready ? 1 : 0,
                transition: 'opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        />
    );
};

export default HeroDarkStoryboardThree;
