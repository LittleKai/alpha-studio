import { describe, expect, it } from 'vitest';
import { createDeterministicAvatar } from './dicebearCore';

describe('createDeterministicAvatar', () => {
    it('generates deterministic SVG avatars for glass, shape-grid, and initials styles', () => {
        for (const styleName of ['glass', 'shape-grid', 'initials'] as const) {
            const first = createDeterministicAvatar({ seed: 'alpha@example.com', styleName });
            const second = createDeterministicAvatar({ seed: 'alpha@example.com', styleName });
            expect(first.svg).toBe(second.svg);
            expect(first.backgroundHex).toMatch(/^#[0-9a-f]{6}$/i);
            expect(first.foregroundHex).toMatch(/^#[0-9a-f]{6}$/i);
            expect(first.toDataUri()).toMatch(/^data:image\/svg\+xml;utf8,/);
        }
    });
});
