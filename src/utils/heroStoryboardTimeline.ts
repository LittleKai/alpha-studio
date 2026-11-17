/**
 * Timeline 7 chặng tốc độ cao (~2.5s/chặng) cho cảnh Three.js 3D Isometric Hero nền tối.
 *
 * Đồng bộ trực tiếp `chapterIndex` (0..6) với `JOURNEY_KEYS` trong `LandingHero.tsx`:
 * 0: Cổng vào sáng tạo (Bàn vẽ kỹ thuật, bậc thang Ziggurat & đường ống sáng S-curve)
 * 1: Bóc tách brief (Bảng moodboard 3D & đĩa vật liệu vellum nổi)
 * 2: Định hình concept (Hàng vòm kiến trúc Extrude 3D dọc đại lộ)
 * 3: Dựng storyboard (Dãy trụ màn hình Storyboard 3D hướng tâm)
 * 4: Kế hoạch sản xuất (Tách rời 5 cụm kỹ thuật theo trục Y: CAD, Khán đài+FOH, Sàn+Catwalk+Cánh gà, Màn LED+Loa J-Array, Giàn mái Box-Truss)
 * 5: Visual & ánh sáng (Khóa khít cơ khí 5 tầng & quét laser hiệu chuẩn)
 * 6: Showtime (Đại cảnh sân khấu 3D hoàn chỉnh + 14 chùm đèn volumetric + khán đài sáng)
 */

export const STORYBOARD_CHAPTER_DURATIONS = [2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 3.5] as const;

export const TOTAL_STORYBOARD_DURATION_S = STORYBOARD_CHAPTER_DURATIONS.reduce(
    (sum, d) => sum + d,
    0,
);

const COS_30 = 0.8660254037844386;
const SIN_30 = 0.5;

export interface IsoPoint2D {
    x: number;
    y: number;
}

export function isoProject(wx: number, wy: number, wz = 0): IsoPoint2D {
    return {
        x: (wx - wy) * COS_30,
        y: (wx + wy) * SIN_30 - wz,
    };
}

export function clamp01(value: number): number {
    if (value <= 0) return 0;
    if (value >= 1) return 1;
    return value;
}

export function smoothstep01(t: number): number {
    const x = clamp01(t);
    return x * x * (3 - 2 * x);
}

export function smootherstep01(t: number): number {
    const x = clamp01(t);
    return x * x * x * (x * (x * 6 - 15) + 10);
}

export function easeOutExpo01(t: number): number {
    const x = clamp01(t);
    return x >= 1 ? 1 : 1 - Math.pow(2, -8 * x);
}

export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
}

/**
 * Thử lại nạp module động khi Vite dev server đang re-bundle `.vite/deps` (trả 504 tạm thời)
 * hoặc mạng chập chờn tức thời, tránh rơi sớm về ảnh tĩnh `fallbackStill`.
 */
export async function loadWithTransientRetry<T>(
    loader: () => Promise<T>,
    maxAttempts = 3,
    delayMs = 400,
): Promise<T> {
    let lastError: unknown;
    const attempts = Math.max(1, maxAttempts);
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await loader();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    throw lastError;
}

function envelope(
    chapterFloat: number,
    enterStart: number,
    enterEnd: number,
    exitStart: number,
    exitEnd: number,
): number {
    const fadeIn = easeOutExpo01((chapterFloat - enterStart) / Math.max(0.001, enterEnd - enterStart));
    const fadeOut = 1 - smootherstep01((chapterFloat - exitStart) / Math.max(0.001, exitEnd - exitStart));
    return clamp01(fadeIn * fadeOut);
}

export interface Camera3DKeyframe {
    /** Điểm nhìn (lookAt) trong không gian 3D thế giới (trục Z chạy dọc đại lộ từ tiền cảnh +Z về sân khấu -Z). */
    targetX: number;
    targetY: number;
    targetZ: number;
    /** Hệ số phóng đại OrthographicCamera. */
    zoom: number;
    /** Góc xoay phương vị (radian, chuẩn isometric = PI / 4 ≈ 0.7854). */
    azimuth: number;
    /** Góc ngẩng (radian, chuẩn isometric ≈ 0.6155). */
    elevation: number;
}

const CAMERA_3D_KEYFRAMES: readonly Camera3DKeyframe[] = [
    // 0: Cổng vào sáng tạo — cận cảnh bàn vẽ kiến trúc, Ziggurat, quạt mẫu màu & Cổng Sáng Tạo
    { targetX: 0.12, targetY: 0.58, targetZ: 6.05, zoom: 1.24, azimuth: 0.48, elevation: 0.54 },
    // 1: Bóc tách brief — lướt qua 6 khay Moodboard vật liệu xếp ly, lam đồng & thẻ màu nổi
    { targetX: 0.05, targetY: 0.72, targetZ: 3.35, zoom: 1.18, azimuth: 0.45, elevation: 0.52 },
    // 2: Định hình concept — tiến xuyên dãy 5 Cổng Vòm Concept & Cổng Chào LED vát kim cương
    { targetX: 0.0, targetY: 1.05, targetZ: 2.15, zoom: 1.12, azimuth: 0.42, elevation: 0.50 },
    // 3: Dựng storyboard — mở rộng vòng 6 bảng phác thảo Storyboard ôm lấy lòng chảo khán đài cố định trên bàn
    { targetX: 0.0, targetY: 1.32, targetZ: -2.35, zoom: 0.93, azimuth: 0.42, elevation: 0.49 },
    // 4: Kế hoạch sản xuất — góc quét kỹ thuật mặt bằng sân khấu cố định, xòe cánh âm học & hạ tời giàn Truss
    { targetX: 0.0, targetY: 1.68, targetZ: -3.15, zoom: 0.88, azimuth: -0.14, elevation: 0.53 },
    // 5: Visual & ánh sáng — khóa cữ giàn Truss/Loa J-Array, bật màn LED cong & dàn nghệ sĩ vào nhịp
    { targetX: 0.0, targetY: 1.54, targetZ: -3.15, zoom: 0.96, azimuth: 0.34, elevation: 0.47 },
    // 6: Showtime — đại cảnh nhạc hội 3/4 thu trọn ban nhạc chuyển động, khán giả vẫy lightstick, FOH & pháo lạnh
    { targetX: 0.0, targetY: 1.48, targetZ: -2.95, zoom: 0.94, azimuth: -0.36, elevation: 0.47 },
];

export interface DarkStoryboardFrame {
    cycleTimeS: number;
    chapterIndex: number;
    chapterProgress: number;
    chapterFloat: number;

    camera3d: Camera3DKeyframe;

    briefLineDraw: number;
    briefPadPresence: number;
    moodboardPresence: number;
    archesPresence: number;
    storyboardPresence: number;
    cadBlueprintPresence: number;
    venuePresence: number;
    /** Hệ số bung 5 cụm cấu kiện theo trục Y ở Chặng 5 (0 = khóa khít, 1 = bung tối đa). */
    explodedSpread: number;
    calibrationSweep: number;
    showtimeIntensity: number;
    finaleBackdropPresence: number;
}

export function evaluateDarkStoryboardFrame(elapsedSeconds: number): DarkStoryboardFrame {
    const safeElapsed = Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0;
    const cycleTimeS = ((safeElapsed % TOTAL_STORYBOARD_DURATION_S) + TOTAL_STORYBOARD_DURATION_S) % TOTAL_STORYBOARD_DURATION_S;

    let acc = 0;
    let chapterIndex = 0;
    let chapterProgress = 0;

    for (let i = 0; i < STORYBOARD_CHAPTER_DURATIONS.length; i++) {
        const dur = STORYBOARD_CHAPTER_DURATIONS[i];
        if (cycleTimeS < acc + dur || i === STORYBOARD_CHAPTER_DURATIONS.length - 1) {
            chapterIndex = i;
            chapterProgress = clamp01((cycleTimeS - acc) / dur);
            break;
        }
        acc += dur;
    }

    const chapterFloat = chapterIndex + chapterProgress;

    const camCurr = CAMERA_3D_KEYFRAMES[chapterIndex];
    const camNext = CAMERA_3D_KEYFRAMES[(chapterIndex + 1) % CAMERA_3D_KEYFRAMES.length];
    const camBlendWindow = chapterIndex === 6
        ? smootherstep01((chapterProgress - 0.66) / 0.34)
        : smootherstep01(chapterProgress);

    const camera3d: Camera3DKeyframe = {
        targetX: lerp(camCurr.targetX, camNext.targetX, camBlendWindow),
        targetY: lerp(camCurr.targetY, camNext.targetY, camBlendWindow),
        targetZ: lerp(camCurr.targetZ, camNext.targetZ, camBlendWindow),
        zoom: lerp(camCurr.zoom, camNext.zoom, camBlendWindow),
        azimuth: lerp(camCurr.azimuth, camNext.azimuth, camBlendWindow),
        elevation: lerp(camCurr.elevation, camNext.elevation, camBlendWindow),
    };

    const drawIn = easeOutExpo01(chapterFloat / 0.62);
    const resetOut = 1 - smootherstep01((chapterFloat - 6.72) / 0.26);
    const briefLineDraw = clamp01(drawIn * resetOut);

    const briefPadPresence = clamp01(
        Math.max(
            1 - smootherstep01((chapterFloat - 2.25) / 0.85),
            smootherstep01((chapterFloat - 6.80) / 0.20),
        ),
    );

    const moodboardPresence = envelope(chapterFloat, 0.62, 1.15, 2.75, 3.45);
    const archesPresence = envelope(chapterFloat, 1.62, 2.15, 3.55, 4.15);
    const storyboardPresence = envelope(chapterFloat, 2.62, 3.15, 3.82, 4.35);

    const cadBlueprintPresence = clamp01(0.45 + 0.55 * envelope(chapterFloat, 2.3, 3.2, 6.72, 6.99));
    const venuePresence = clamp01(0.32 + 0.68 * envelope(chapterFloat, 2.75, 3.55, 6.72, 6.99));

    // Bung 5 cụm kỹ thuật theo trục Y ở Chương 4 (05/07 Kế hoạch sản xuất), khóa khít ở Chương 5 (06/07).
    const explodeUp = easeOutExpo01((chapterFloat - 3.72) / 0.45);
    const lockDown = 1 - smootherstep01((chapterFloat - 4.82) / 0.44);
    const explodedSpread = clamp01(explodeUp * lockDown);

    const calibrationSweep = envelope(chapterFloat, 4.84, 5.14, 6.05, 6.45);
    const showtimeIntensity = envelope(chapterFloat, 5.08, 5.65, 6.72, 6.98);
    const finaleBackdropPresence = envelope(chapterFloat, 5.4, 6.0, 6.72, 6.98);

    return {
        cycleTimeS,
        chapterIndex,
        chapterProgress,
        chapterFloat,
        camera3d,
        briefLineDraw,
        briefPadPresence,
        moodboardPresence,
        archesPresence,
        storyboardPresence,
        cadBlueprintPresence,
        venuePresence,
        explodedSpread,
        calibrationSweep,
        showtimeIntensity,
        finaleBackdropPresence,
    };
}
