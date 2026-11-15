import { describe, expect, it } from 'vitest';
import {
    buildArticleSlugUrl,
    normalizeArticleViewCount,
    sumArticleViews,
} from './articleService';

describe('articleService view helpers', () => {
    it('builds detail endpoint URL with optional trackView query param', () => {
        expect(buildArticleSlugUrl('https://api.example.com/api', 'duong hoa')).toBe(
            'https://api.example.com/api/articles/duong%20hoa'
        );
        expect(buildArticleSlugUrl('https://api.example.com/api', 'duong-hoa', true)).toBe(
            'https://api.example.com/api/articles/duong-hoa?trackView=1'
        );
    });

    it('normalizes missing, negative, or fractional view counts to non-negative integers', () => {
        expect(normalizeArticleViewCount(undefined)).toBe(0);
        expect(normalizeArticleViewCount(-5)).toBe(0);
        expect(normalizeArticleViewCount(Number.NaN)).toBe(0);
        expect(normalizeArticleViewCount(12.9)).toBe(12);
    });

    it('sums article view counts safely across a list', () => {
        expect(sumArticleViews([{ viewCount: 10 }, {}, { viewCount: -3 }, { viewCount: 25 }])).toBe(35);
    });
});
