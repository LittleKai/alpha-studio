import { describe, expect, it } from 'vitest';
import { formatArticleDate } from './articleDate';

describe('formatArticleDate', () => {
    it('returns null for a missing or invalid article date', () => {
        expect(formatArticleDate(null, 'vi')).toBeNull();
        expect(formatArticleDate('', 'en')).toBeNull();
        expect(formatArticleDate('not-a-date', 'en')).toBeNull();
    });

    it('formats a valid article date in the active language', () => {
        expect(formatArticleDate('2026-10-15T00:00:00.000Z', 'en')).toBe('October 15, 2026');
        expect(formatArticleDate('2026-10-15T00:00:00.000Z', 'vi')).toBe('15 tháng 10, 2026');
    });
});
