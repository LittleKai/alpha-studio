import { describe, expect, it, vi } from 'vitest';
import {
    STORYBOARD_CHAPTER_DURATIONS,
    TOTAL_STORYBOARD_DURATION_S,
    evaluateDarkStoryboardFrame,
    isoProject,
    loadWithTransientRetry,
} from './heroStoryboardTimeline';

describe('heroStoryboardTimeline', () => {
    it('uses fast ~2.5s chapter pacing (~18.5s full 7-step cycle) and consistent isometric projection', () => {
        expect(STORYBOARD_CHAPTER_DURATIONS).toHaveLength(7);
        expect(STORYBOARD_CHAPTER_DURATIONS[0]).toBe(2.5);
        expect(TOTAL_STORYBOARD_DURATION_S).toBeLessThanOrEqual(19);

        const origin = isoProject(0, 0, 0);
        expect(origin).toEqual({ x: 0, y: 0 });

        const right = isoProject(100, 0, 0);
        const left = isoProject(0, 100, 0);
        expect(right.x).toBeGreaterThan(0);
        expect(left.x).toBeLessThan(0);
        expect(right.y).toBeCloseTo(left.y, 6);
    });

    it('maps all 7 chapters in order and wraps camera3d smoothly back to chapter 0', () => {
        let cursor = 0;
        for (let expectedChapter = 0; expectedChapter < 7; expectedChapter++) {
            const mid = evaluateDarkStoryboardFrame(cursor + STORYBOARD_CHAPTER_DURATIONS[expectedChapter] * 0.5);
            expect(mid.chapterIndex).toBe(expectedChapter);
            expect(mid.chapterProgress).toBeCloseTo(0.5, 5);
            cursor += STORYBOARD_CHAPTER_DURATIONS[expectedChapter];
        }

        const start = evaluateDarkStoryboardFrame(0);
        const showtime = evaluateDarkStoryboardFrame(TOTAL_STORYBOARD_DURATION_S - 1.6);
        const wrapped = evaluateDarkStoryboardFrame(TOTAL_STORYBOARD_DURATION_S);
        expect(start.camera3d.targetZ).toBeGreaterThan(5.0);
        expect(showtime.camera3d.targetZ).toBeLessThan(-2.5);
        expect(wrapped.chapterIndex).toBe(0);
        expect(wrapped.camera3d.targetX).toBeCloseTo(start.camera3d.targetX, 5);
        expect(wrapped.camera3d.targetY).toBeCloseTo(start.camera3d.targetY, 5);
        expect(wrapped.camera3d.targetZ).toBeCloseTo(start.camera3d.targetZ, 5);
        expect(wrapped.camera3d.zoom).toBeCloseTo(start.camera3d.zoom, 5);
    });

    it('separates 3D production strata along Y in chapter 4 (step5) and locks them in chapters 5-6', () => {
        let tChapter4 = 0;
        for (let i = 0; i < 4; i++) tChapter4 += STORYBOARD_CHAPTER_DURATIONS[i];

        const exploded = evaluateDarkStoryboardFrame(tChapter4 + STORYBOARD_CHAPTER_DURATIONS[4] * 0.55);
        expect(exploded.chapterIndex).toBe(4);
        expect(exploded.explodedSpread).toBeGreaterThan(0.95);
        expect(exploded.venuePresence).toBeGreaterThan(0.95);

        const assembled = evaluateDarkStoryboardFrame(
            tChapter4 + STORYBOARD_CHAPTER_DURATIONS[4] + STORYBOARD_CHAPTER_DURATIONS[5] * 0.75,
        );
        expect(assembled.chapterIndex).toBe(5);
        expect(assembled.explodedSpread).toBeLessThan(0.05);
        expect(assembled.venuePresence).toBeGreaterThan(0.95);

        const showtime = evaluateDarkStoryboardFrame(TOTAL_STORYBOARD_DURATION_S - 1.6);
        expect(showtime.chapterIndex).toBe(6);
        expect(showtime.explodedSpread).toBe(0);
        expect(showtime.showtimeIntensity).toBeGreaterThan(0.95);
        expect(showtime.finaleBackdropPresence).toBeGreaterThan(0.95);
    });

    it('handles negative or non-finite timestamps safely', () => {
        const neg = evaluateDarkStoryboardFrame(-1.2);
        expect(neg.chapterIndex).toBe(6);
        expect(Number.isFinite(neg.camera3d.zoom)).toBe(true);

        const nanFrame = evaluateDarkStoryboardFrame(Number.NaN);
        expect(nanFrame.chapterIndex).toBe(0);
        expect(nanFrame.cycleTimeS).toBe(0);
    });

    it('retries transient dynamic import failures (e.g. Vite 504 Outdated Optimize Dep) before succeeding', async () => {
        const loader = vi
            .fn<() => Promise<string>>()
            .mockRejectedValueOnce(new TypeError('Failed to fetch dynamically imported module'))
            .mockResolvedValueOnce('three-loaded');

        const result = await loadWithTransientRetry(loader, 2, 5);
        expect(result).toBe('three-loaded');
        expect(loader).toHaveBeenCalledTimes(2);
    });
});
