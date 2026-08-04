import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/ui/SEOHead';
import './CoLoaSpiralPage.css';

/**
 * Trang demo scroll-scrub: cuộn điều khiển thời gian của một chuỗi 7 clip đã được
 * khoá khung ở mối nối (khung cuối clip i ≡ khung đầu clip i+1), nên cả chuỗi chạy
 * như MỘT cú máy liên tục xuyên qua không gian trưng bày.
 *
 * Khác EventCreativeCityPage (crossfade 7 ảnh tĩnh): ở đây camera thật sự di chuyển,
 * cuộn chỉ kéo trục thời gian.
 */

type SpiralScene = {
    id: string;
    /** Số thứ tự clip trong chuỗi — quyết định tên file L{n}.mp4 */
    clip: number;
    zone: string;
    title: string;
    body: string;
    tags?: string[];
    alt: string;
    align: 'left' | 'right';
    /** Số màn hình cuộn dành cho cảnh này. Cao = camera đọng lâu hơn. */
    scroll: number;
};

const scenes: SpiralScene[] = [
    {
        id: 'overview',
        clip: 0,
        zone: 'Tổng quan',
        title: 'Một vòng xoắn, chín lớp thành.',
        body: 'Toàn bộ không gian trưng bày mở ra như một mô hình kiến trúc — trước khi bạn bước vào bên trong.',
        tags: ['Cổ Loa', 'The Living Spiral'],
        alt: 'Toàn cảnh gian trưng bày Cổ Loa nhìn từ trên cao, mái được cắt bỏ',
        align: 'left',
        scroll: 1.1,
    },
    {
        id: 'gate',
        clip: 1,
        zone: 'Cổng vào',
        title: 'Bước qua vòng xoắn đầu tiên.',
        body: 'Hai khối núi gỗ ôm lấy lối đi, dẫn thẳng vào lõi của câu chuyện.',
        tags: ['Cổng chính', 'Sảnh đón'],
        alt: 'Cổng vào gian trưng bày với biển hiệu phát sáng và hai khối núi gỗ',
        align: 'left',
        scroll: 1.3,
    },
    {
        id: 'spiral',
        clip: 2,
        zone: 'Lõi xoắn ốc',
        title: 'Hoa văn trống đồng, dệt bằng ánh sáng.',
        body: 'Những dải lụa mờ in hoa văn trống đồng đứng trong hồ nước tĩnh, xoay quanh một tâm duy nhất.',
        tags: ['Trình chiếu', 'Mặt nước phản chiếu'],
        alt: 'Lõi trưng bày trung tâm với các dải lụa in hoa văn trống đồng trong hồ nước',
        align: 'right',
        scroll: 1.5,
    },
    {
        id: 'heritage',
        clip: 3,
        zone: 'Di sản kiến trúc',
        title: 'Chín lớp thành, kể bằng hiện vật.',
        body: 'Trống đồng, mũi tên đồng, bản đồ cổ — đặt dọc theo bức tường cong uốn như đường thành.',
        tags: ['Hiện vật gốc', 'Bản đồ cổ'],
        alt: 'Tường di sản kiến trúc với tủ trưng bày trống đồng, mũi tên đồng và bản đồ cổ',
        align: 'left',
        scroll: 1.4,
    },
    {
        id: 'craft',
        clip: 4,
        zone: 'Sảnh nghề',
        title: 'Nơi di sản được chạm vào.',
        body: 'Bàn thư pháp, màn hình tương tác, đĩa trình chiếu bằng đồng — khách không chỉ xem, họ tham gia.',
        tags: ['Thư pháp', 'Tương tác'],
        alt: 'Sảnh nghề với bàn thư pháp, màn hình bản đồ và các đĩa trình chiếu bằng đồng',
        align: 'right',
        scroll: 1.4,
    },
    {
        id: 'garden',
        clip: 5,
        zone: 'Cảnh quan',
        title: 'Một khoảng thở giữa lịch sử.',
        body: 'Núi rêu, sương thấp và tre — không gian nghệ thuật đương đại đối thoại với quá khứ.',
        tags: ['Sắp đặt', 'Nghệ thuật đương đại'],
        alt: 'Không gian cảnh quan với núi rêu, sương mù thấp, tre và tranh treo tường',
        align: 'left',
        scroll: 1.3,
    },
    {
        id: 'stage',
        clip: 6,
        zone: 'Sân khấu',
        title: 'Vòng xoắn khép lại tại đây.',
        body: 'Sân khấu mở cho toạ đàm, chiếu phim và lễ khai mạc — điểm kết của hành trình.',
        tags: ['Toạ đàm', 'Sự kiện'],
        alt: 'Sân khấu với màn hình cong chiếu bản đồ Cổ Loa và các ghế đôn gỗ',
        align: 'right',
        scroll: 1.7,
    },
];

const SCENE_COUNT = scenes.length;
const TOTAL_SCROLL = scenes.reduce((sum, scene) => sum + scene.scroll, 0);

/** Mốc bắt đầu (theo đơn vị "tỉ lệ toàn trang") của từng cảnh — dùng để đổi progress → (clip, t). */
const sceneOffsets = (() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const scene of scenes) {
        offsets.push(acc / TOTAL_SCROLL);
        acc += scene.scroll;
    }
    offsets.push(1);
    return offsets;
})();

const clipSrc = (clip: number, mobile: boolean) => `/co-loa/vid/L${clip}${mobile ? '-m' : ''}.mp4`;
const stillSrc = (clip: number) => `/co-loa/still-${clip}.jpg`;

/** Chỉ gắn <video> cho cảnh đang xem ±1; ngoài ngưỡng này thẻ được tháo, giải phóng bộ giải mã. */
const KEEP_RADIUS = 1;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const CoLoaSpiralPage: React.FC = () => {
    const worldRef = useRef<HTMLElement>(null);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
    const frameRequestRef = useRef<number | null>(null);
    const seekingRef = useRef<boolean[]>([]);
    /** currentTime mong muốn nhưng bị hoãn vì decoder đang seek — gộp seek, tránh dồn hàng đợi. */
    const pendingSeekRef = useRef<(number | null)[]>([]);
    const blobUrlsRef = useRef<(string | null)[]>([]);
    const loadingRef = useRef<boolean[]>([]);
    const unmountedRef = useRef(false);
    const primedRef = useRef(false);

    const [progress, setProgress] = useState(0);
    const [painted, setPainted] = useState<boolean[]>(() => scenes.map(() => false));
    /** Chỉ có giá trị ở clip nào phải rơi về blob; null = đang dùng URL trực tiếp. */
    const [blobFallback, setBlobFallback] = useState<(string | null)[]>(() => scenes.map(() => null));
    const [isMobile, setIsMobile] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    // Vị trí liên tục trong chuỗi: phần nguyên = clip đang chạy, phần lẻ = tiến độ trong clip
    const position = useMemo(() => {
        for (let i = 0; i < SCENE_COUNT; i += 1) {
            const start = sceneOffsets[i];
            const end = sceneOffsets[i + 1];
            if (progress < end || i === SCENE_COUNT - 1) {
                return i + clamp((progress - start) / Math.max(1e-6, end - start));
            }
        }
        return 0;
    }, [progress]);

    const activeIndex = Math.min(SCENE_COUNT - 1, Math.floor(position));

    useEffect(() => {
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const mobileQuery = window.matchMedia('(max-width: 860px), (pointer: coarse)');
        const sync = () => {
            setReduceMotion(motionQuery.matches);
            setIsMobile(mobileQuery.matches);
        };
        sync();
        motionQuery.addEventListener('change', sync);
        mobileQuery.addEventListener('change', sync);
        return () => {
            motionQuery.removeEventListener('change', sync);
            mobileQuery.removeEventListener('change', sync);
        };
    }, []);

    /**
     * Nguồn của clip `index`: mặc định là URL trực tiếp, chỉ đổi sang blob khi phát hiện
     * host không seek được. Dùng URL trực tiếp thì trình duyệt tải dần theo HTTP range —
     * video dùng được sau vài trăm KB thay vì phải chờ trọn ~5MB như đường blob.
     */
    const videoSrc = useCallback(
        (index: number) => blobFallback[index] ?? clipSrc(scenes[index].clip, isMobile),
        [blobFallback, isMobile],
    );

    /**
     * Chuyển clip `index` sang blob. Blob luôn seek được kể cả khi host không phục vụ
     * HTTP range — đó là chốt chặn cuối, vì mất khả năng seek là scrub chết hoàn toàn.
     */
    const fallbackToBlob = useCallback((index: number) => {
        if (blobUrlsRef.current[index] || loadingRef.current[index]) return;
        loadingRef.current[index] = true;
        fetch(clipSrc(scenes[index].clip, isMobile))
            .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
            .then((blob) => {
                if (unmountedRef.current) return;
                const url = URL.createObjectURL(blob);
                blobUrlsRef.current[index] = url;
                setBlobFallback((prev) => {
                    if (prev[index]) return prev;
                    const next = [...prev];
                    next[index] = url;
                    return next;
                });
            })
            .catch(() => {
                // Tải hỏng → giữ nguyên poster still, trang vẫn đọc được
            })
            .finally(() => {
                // Luôn hạ cờ, kể cả khi hỏng — nếu không lần sau sẽ bỏ qua clip này
                loadingRef.current[index] = false;
            });
    }, [isMobile]);

    /**
     * Ngay khi biết metadata: nếu `seekable` không phủ hết thời lượng thì host không trả
     * byte-range, mọi lệnh seek sẽ bị kẹp về 0 và video đứng hình. Rơi về blob ngay.
     */
    const checkSeekable = useCallback((index: number, el: HTMLVideoElement) => {
        if (blobFallback[index]) return;
        const ok = el.seekable.length > 0
            && Number.isFinite(el.duration)
            && el.seekable.end(el.seekable.length - 1) >= el.duration - 0.5;
        if (!ok) fallbackToBlob(index);
    }, [blobFallback, fallbackToBlob]);

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
            blobUrlsRef.current.forEach((url) => { if (url) URL.revokeObjectURL(url); });
            blobUrlsRef.current = [];
            loadingRef.current = [];
        };
    }, []);

    const applyScrub = useCallback(() => {
        frameRequestRef.current = null;
        const root = worldRef.current;
        if (!root) return;

        const rect = root.getBoundingClientRect();
        const scrollableHeight = Math.max(1, rect.height - window.innerHeight);
        const nextProgress = clamp(-rect.top / scrollableHeight);
        setProgress(nextProgress);

        if (reduceMotion) return;

        // Chỉ scrub clip đang hiển thị; clip lân cận giữ nguyên để không tốn công seek
        let index = 0;
        for (let i = 0; i < SCENE_COUNT; i += 1) {
            if (nextProgress < sceneOffsets[i + 1] || i === SCENE_COUNT - 1) { index = i; break; }
        }
        const start = sceneOffsets[index];
        const end = sceneOffsets[index + 1];
        const local = clamp((nextProgress - start) / Math.max(1e-6, end - start));

        const video = videoRefs.current[index];
        if (!video || !video.duration || Number.isNaN(video.duration)) return;

        const target = local * video.duration;
        if (seekingRef.current[index]) {
            // Decoder còn bận: ghi đè mục tiêu thay vì xếp thêm seek — chống đơ khi vuốt nhanh
            pendingSeekRef.current[index] = target;
            return;
        }
        if (Math.abs(video.currentTime - target) < 0.012) return;
        seekingRef.current[index] = true;
        video.currentTime = target;
    }, [reduceMotion]);

    useEffect(() => {
        const queue = () => {
            if (frameRequestRef.current === null) {
                frameRequestRef.current = window.requestAnimationFrame(applyScrub);
            }
        };
        queue();
        window.addEventListener('scroll', queue, { passive: true });
        window.addEventListener('resize', queue);
        return () => {
            window.removeEventListener('scroll', queue);
            window.removeEventListener('resize', queue);
            if (frameRequestRef.current !== null) {
                window.cancelAnimationFrame(frameRequestRef.current);
                // Bắt buộc trả về null: ref này vừa là id vừa là cờ "đã có rAF đang chờ".
                // Bỏ sót bước này thì sau mount đôi của StrictMode, queue() luôn thấy ref
                // khác null và không bao giờ lên lịch nữa — cuộn ngừng hẳn tác dụng.
                frameRequestRef.current = null;
            }
        };
    }, [applyScrub]);

    // iOS Safari không vẽ khung đã seek nếu video chưa từng được play — mồi một lần khi chạm.
    useEffect(() => {
        if (reduceMotion) return;
        const prime = () => {
            if (primedRef.current) return;
            primedRef.current = true;
            videoRefs.current.forEach((video) => {
                if (!video) return;
                const promise = video.play();
                if (promise && typeof promise.then === 'function') {
                    promise.then(() => video.pause()).catch(() => { /* bị chặn autoplay — bỏ qua */ });
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
    }, [reduceMotion, blobFallback]);

    // Đặt sẵn clip lân cận vào đúng khung giáp ranh trước khi tới lượt nó hiện ra.
    // Nếu không, lúc đổi lớp clip mới có thể còn đang ở thời điểm cũ (do người xem
    // cuộn qua lại quanh mối nối) và loé lên một khung sai trước khi kịp seek.
    useEffect(() => {
        if (reduceMotion) return;
        const next = videoRefs.current[activeIndex + 1];
        if (next && next.duration && !seekingRef.current[activeIndex + 1] && next.currentTime > 0.02) {
            next.currentTime = 0;
        }
        const prev = videoRefs.current[activeIndex - 1];
        if (prev && prev.duration && !seekingRef.current[activeIndex - 1]) {
            const last = prev.duration - 0.04;
            if (Math.abs(prev.currentTime - last) > 0.02) prev.currentTime = last;
        }
    }, [activeIndex, reduceMotion, blobFallback]);

    /** Hạ poster của cảnh `index` — chỉ khi video đã thực sự vẽ được khung đầu. */
    const markPainted = useCallback((index: number) => {
        setPainted((prev) => {
            if (prev[index]) return prev;
            const next = [...prev];
            next[index] = true;
            return next;
        });
    }, []);

    // Cảnh ra ngoài cửa sổ ±1 bị tháo thẻ <video>; trả poster của nó về hiện, nếu không
    // lần mount lại sẽ có một nhịp poster đã ẩn mà video mới chưa vẽ → loé đen.
    // Phải làm ở effect theo activeIndex, KHÔNG làm trong ref callback: ref inline bị
    // React gỡ/gắn lại mỗi lần render, nên đặt state ở đó sẽ đá qua đá lại vô hạn với
    // markPainted (lỗi "Maximum update depth exceeded").
    useEffect(() => {
        setPainted((prev) => {
            let changed = false;
            const next = prev.map((wasPainted, i) => {
                if (wasPainted && Math.abs(i - activeIndex) > KEEP_RADIUS) {
                    changed = true;
                    return false;
                }
                return wasPainted;
            });
            return changed ? next : prev;
        });
    }, [activeIndex]);

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

    const jumpToScene = (index: number) => {
        const root = worldRef.current;
        if (!root) return;
        const rootTop = window.scrollY + root.getBoundingClientRect().top;
        const scrollableHeight = Math.max(1, root.offsetHeight - window.innerHeight);
        // Nhắm vào giữa cảnh để copy hiện rõ ngay khi tới nơi
        const mid = (sceneOffsets[index] + sceneOffsets[index + 1]) / 2;
        window.scrollTo({ top: rootTop + mid * scrollableHeight, behavior: 'smooth' });
    };

    return (
        <main className="cls-page">
            <SEOHead
                title="Cổ Loa — The Living Spiral | Alpha Studio"
                description="Hành trình cuộn qua không gian trưng bày Cổ Loa: từ cổng vào, lõi xoắn ốc, tường di sản đến sân khấu đối thoại kết thúc."
                path="/co-loa-living-spiral"
            />

            <header className="cls-header">
                <Link className="cls-brand" to="/" aria-label="Về trang chủ Alpha Studio">
                    <img src="/alpha-symbol-only.png" alt="" />
                    <span>
                        <strong>ALPHA STUDIO</strong>
                        <small>CỔ LOA · THE LIVING SPIRAL</small>
                    </span>
                </Link>

                <nav aria-label="Điều hướng">
                    <Link to="/">Trang chủ</Link>
                    <Link to="/event-creative-city">Event Creative City</Link>
                    <Link className="cls-header-cta" to="/studio">Khám phá Studio</Link>
                </nav>
            </header>

            <section
                ref={worldRef}
                className="cls-world"
                aria-label="Hành trình qua không gian trưng bày Cổ Loa"
                style={{ '--cls-scroll-total': TOTAL_SCROLL } as React.CSSProperties}
            >
                <div className="cls-sticky">
                    <div className="cls-stage">
                        {scenes.map((scene, index) => {
                            const isActive = index === activeIndex;
                            return (
                                <div
                                    key={scene.id}
                                    className="cls-layer"
                                    style={{ opacity: isActive ? 1 : 0, zIndex: isActive ? 2 : 1 }}
                                    aria-hidden={!isActive}
                                >
                                    <img
                                        className="cls-still"
                                        src={stillSrc(scene.clip)}
                                        alt={isActive ? scene.alt : ''}
                                        loading={index < 2 ? 'eager' : 'lazy'}
                                        fetchPriority={index === 0 ? 'high' : 'auto'}
                                        /* Poster giữ nguyên cho tới khi video vẽ được khung đầu —
                                           bỏ sớm sẽ thấy khoảng đen trên iOS Safari */
                                        style={{ opacity: painted[index] ? 0 : 1 }}
                                    />
                                    {/* Chỉ gắn <video> cho cảnh đang xem ±1: mỗi thẻ preload="auto"
                                        là một luồng tải, gắn cả 7 sẽ kéo toàn bộ ~31MB ngay lập tức. */}
                                    {!reduceMotion && Math.abs(index - activeIndex) <= KEEP_RADIUS && (
                                        <video
                                            key={videoSrc(index)}
                                            ref={(el) => {
                                                videoRefs.current[index] = el;
                                                if (!el) return;
                                                // Video có thể đã đủ dữ liệu TRƯỚC khi React gắn
                                                // onLoadedData (bộ nhớ đệm HTTP trả về tức thì). Khi đó
                                                // sự kiện không bao giờ bắn và poster che video vĩnh viễn
                                                // — nên kiểm tra readyState ngay lúc gắn ref.
                                                if (el.readyState >= 2) markPainted(index);
                                            }}
                                            className="cls-video"
                                            src={videoSrc(index)}
                                            muted
                                            playsInline
                                            preload="auto"
                                            aria-hidden="true"
                                            tabIndex={-1}
                                            onLoadedMetadata={(e) => checkSeekable(index, e.currentTarget)}
                                            onLoadedData={() => markPainted(index)}
                                            onCanPlay={() => markPainted(index)}
                                            onSeeked={() => { markPainted(index); handleSeeked(index); }}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        <div className="cls-scrim" aria-hidden="true" />
                    </div>

                    <div className={`cls-copy-shell cls-copy-shell--${scenes[activeIndex].align}`}>
                        <div className="cls-copy" key={scenes[activeIndex].id}>
                            <div className="cls-eyebrow">
                                <span>{String(activeIndex).padStart(2, '0')}</span>
                                {scenes[activeIndex].zone}
                            </div>
                            <h1>{scenes[activeIndex].title}</h1>
                            <p>{scenes[activeIndex].body}</p>
                            {scenes[activeIndex].tags && (
                                <div className="cls-tags" aria-label="Chủ đề">
                                    {scenes[activeIndex].tags?.map((tag) => <span key={tag}>{tag}</span>)}
                                </div>
                            )}
                            {activeIndex === SCENE_COUNT - 1 && (
                                <div className="cls-actions">
                                    <Link className="cls-primary-action" to="/services">
                                        Liên hệ tư vấn thiết kế
                                        <span aria-hidden="true">↗</span>
                                    </Link>
                                    <Link className="cls-secondary-action" to="/event-creative-city">
                                        Xem Event Creative City
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="cls-route-rail" aria-label="Các khu vực trong hành trình">
                        <div className="cls-route-line" aria-hidden="true">
                            <span style={{ height: `${progress * 100}%` }} />
                        </div>
                        {scenes.map((scene, index) => (
                            <button
                                key={scene.id}
                                type="button"
                                className={index === activeIndex ? 'is-active' : ''}
                                onClick={() => jumpToScene(index)}
                                aria-label={`Đi đến ${scene.zone}`}
                                aria-current={index === activeIndex ? 'step' : undefined}
                            >
                                <span className="cls-route-dot" />
                                <span className="cls-route-label">{scene.zone}</span>
                            </button>
                        ))}
                    </aside>

                    {activeIndex === 0 && (
                        <div className="cls-scroll-cue" aria-hidden="true">
                            <span>Cuộn để bước vào</span>
                            <i />
                        </div>
                    )}

                    <div className="cls-progress" aria-hidden="true">
                        <span style={{ transform: `scaleX(${progress})` }} />
                    </div>
                </div>
            </section>
        </main>
    );
};

export default CoLoaSpiralPage;
