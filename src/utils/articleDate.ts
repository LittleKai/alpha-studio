export type ArticleLanguage = 'vi' | 'en';

/** Returns a localized date, or null when an article has no usable timestamp. */
export function formatArticleDate(
    value: string | Date | null | undefined,
    language: ArticleLanguage
): string | null {
    if (!value) return null;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}
