import React, { useEffect, useRef } from 'react';

interface Liquid2DProps {
    colors?: string[];
    mouseForce?: number;
    cursorSize?: number;
    speed?: number;
    className?: string;
    style?: React.CSSProperties;
}

interface Blob {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    targetRadius: number;
    color: string;
    pulseSpeed: number;
    pulseTime: number;
}

export const Liquid2D: React.FC<Liquid2DProps> = ({
    colors = ['#61e8ff', '#8b7dff', '#000000'],
    mouseForce = 15,
    cursorSize = 150,
    speed = 1.0,
    className = '',
    style = {},
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false });
    const blobsRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | null>(null);
    const isVisibleRef = useRef(true);

    // Helper to generate a pastel/vibrant hex into standard format
    const initBlobs = (width: number, height: number, colorList: string[]) => {
        const numBlobs = Math.max(6, colorList.length * 2);
        const blobs: Blob[] = [];

        for (let i = 0; i < numBlobs; i++) {
            const color = colorList[i % colorList.length];
            const baseRadius = Math.min(width, height) * (0.25 + Math.random() * 0.15);
            blobs.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8 * speed,
                vy: (Math.random() - 0.5) * 0.8 * speed,
                radius: baseRadius,
                targetRadius: baseRadius,
                color,
                pulseSpeed: 0.003 + Math.random() * 0.007,
                pulseTime: Math.random() * Math.PI * 2,
            });
        }
        blobsRef.current = blobs;
    };

    // Join so a new array with the same colors does not restart the animation.
    const colorKey = colors.join(',');

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const context = canvas.getContext('2d');
        if (!context) return;
        const ctx: CanvasRenderingContext2D = context;

        const colorList = colorKey.split(',');
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        // The canvas is blurred by 80px, so a low-resolution backing store looks
        // identical while cutting per-frame fill work by an order of magnitude.
        const RENDER_SCALE = 0.35;
        // Physics is tuned per 60fps tick; drawing is capped at ~30fps.
        const TICK_MS = 1000 / 60;
        const FRAME_MS = 1000 / 30;
        const size = { width: 0, height: 0, left: 0, top: 0 };
        let lastFrame = 0;

        const stop = () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        };
        const start = () => {
            if (reduceMotion) {
                draw();
                return;
            }
            if (!animationFrameRef.current && isVisibleRef.current && !document.hidden) {
                lastFrame = 0;
                animationFrameRef.current = requestAnimationFrame(loop);
            }
        };

        // Observe visibility to save CPU cycles
        const intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isVisibleRef.current = entry.isIntersecting;
                    if (entry.isIntersecting) start();
                    else stop();
                });
            },
            { threshold: 0.01 }
        );
        intersectionObserver.observe(container);

        const handleVisibility = () => (document.hidden ? stop() : start());
        document.addEventListener('visibilitychange', handleVisibility);

        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            size.width = rect.width;
            size.height = rect.height;
            size.left = rect.left;
            size.top = rect.top;
            const scale = Math.min(window.devicePixelRatio || 1, 2) * RENDER_SCALE;
            canvas.width = Math.max(1, Math.round(rect.width * scale));
            canvas.height = Math.max(1, Math.round(rect.height * scale));
            ctx.setTransform(scale, 0, 0, scale, 0, 0);
            canvas.style.width = `${rect.width}px`;
            canvas.style.height = `${rect.height}px`;

            if (blobsRef.current.length === 0) {
                initBlobs(rect.width, rect.height, colorList);
            } else {
                blobsRef.current.forEach((blob, i) => {
                    blob.color = colorList[i % colorList.length];
                    blob.x = Math.min(blob.x, rect.width);
                    blob.y = Math.min(blob.y, rect.height);
                    blob.targetRadius = Math.min(rect.width, rect.height) * (0.25 + Math.random() * 0.15);
                });
            }
            if (reduceMotion) draw();
        };

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        resizeObserver.observe(container);
        resizeCanvas();

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.targetX = e.clientX - size.left;
            mouseRef.current.targetY = e.clientY - size.top;
            mouseRef.current.active = true;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                mouseRef.current.targetX = e.touches[0].clientX - size.left;
                mouseRef.current.targetY = e.touches[0].clientY - size.top;
                mouseRef.current.active = true;
            }
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        if (!reduceMotion) {
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
            window.addEventListener('touchmove', handleTouchMove, { passive: true });
            container.addEventListener('mouseleave', handleMouseLeave, { passive: true });
            window.addEventListener('touchend', handleMouseLeave, { passive: true });
        }

        function step() {
            const { width, height } = size;
            const mouse = mouseRef.current;
            if (mouse.active) {
                if (mouse.x === -1000) {
                    mouse.x = mouse.targetX;
                    mouse.y = mouse.targetY;
                } else {
                    mouse.x += (mouse.targetX - mouse.x) * 0.08;
                    mouse.y += (mouse.targetY - mouse.y) * 0.08;
                }
            } else {
                mouse.x = -1000;
                mouse.y = -1000;
            }

            blobsRef.current.forEach((blob) => {
                // Natural slow movement
                blob.x += blob.vx;
                blob.y += blob.vy;

                // Subtle breathing animation
                blob.pulseTime += blob.pulseSpeed;
                const currentRadius = blob.targetRadius * (1 + Math.sin(blob.pulseTime) * 0.1);
                blob.radius += (currentRadius - blob.radius) * 0.03;

                // Mouse interaction physics
                if (mouse.active) {
                    const dx = blob.x - mouse.x;
                    const dy = blob.y - mouse.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < cursorSize && dist > 1) {
                        // Push force proportional to distance
                        const force = (1 - dist / cursorSize) * mouseForce * 0.03;
                        blob.vx += (dx / dist) * force;
                        blob.vy += (dy / dist) * force;
                    }
                }

                // Apply deceleration and speed limits
                const currentSpeed = Math.hypot(blob.vx, blob.vy);
                const maxSpeed = 2.5 * speed;
                const minSpeed = 0.2 * speed;

                if (currentSpeed > maxSpeed) {
                    blob.vx = (blob.vx / currentSpeed) * maxSpeed;
                    blob.vy = (blob.vy / currentSpeed) * maxSpeed;
                } else if (currentSpeed < minSpeed && currentSpeed > 0.01) {
                    blob.vx = (blob.vx / currentSpeed) * minSpeed;
                    blob.vy = (blob.vy / currentSpeed) * minSpeed;
                }

                // Add subtle randomness and friction to revert velocity to average
                blob.vx += ((Math.random() - 0.5) * 0.02 - blob.vx * 0.015) * speed;
                blob.vy += ((Math.random() - 0.5) * 0.02 - blob.vy * 0.015) * speed;

                // Soft boundary check (bounce off edges)
                const margin = blob.radius * 0.15;
                if (blob.x - blob.radius < -margin) {
                    blob.x = -margin + blob.radius;
                    blob.vx = Math.abs(blob.vx) * 0.7;
                } else if (blob.x + blob.radius > width + margin) {
                    blob.x = width + margin - blob.radius;
                    blob.vx = -Math.abs(blob.vx) * 0.7;
                }

                if (blob.y - blob.radius < -margin) {
                    blob.y = -margin + blob.radius;
                    blob.vy = Math.abs(blob.vy) * 0.7;
                } else if (blob.y + blob.radius > height + margin) {
                    blob.y = height + margin - blob.radius;
                    blob.vy = -Math.abs(blob.vy) * 0.7;
                }
            });
        }

        function draw() {
            const { width, height } = size;
            if (width === 0 || height === 0) return;
            ctx.clearRect(0, 0, width, height);
            blobsRef.current.forEach((blob) => {
                const grad = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.radius);
                grad.addColorStop(0, blob.color);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        function loop(now: number) {
            animationFrameRef.current = requestAnimationFrame(loop);
            if (!lastFrame) lastFrame = now - FRAME_MS;
            const elapsed = now - lastFrame;
            if (elapsed < FRAME_MS - 1) return;
            lastFrame = now;
            // Keep motion speed independent of the frame cap; clamp after long pauses.
            const ticks = Math.min(4, Math.max(1, Math.round(elapsed / TICK_MS)));
            for (let i = 0; i < ticks; i++) step();
            draw();
        }

        start();

        return () => {
            stop();
            resizeObserver.disconnect();
            intersectionObserver.disconnect();
            document.removeEventListener('visibilitychange', handleVisibility);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('touchend', handleMouseLeave);
        };
    }, [colorKey, mouseForce, cursorSize, speed]);

    const defaultStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
    };

    return (
        <div ref={containerRef} className={`liquid-2d-container ${className}`} style={defaultStyle}>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    filter: 'blur(80px) saturate(1.4) contrast(1.15)',
                    opacity: 0.85,
                }}
            />
        </div>
    );
};

export default Liquid2D;
