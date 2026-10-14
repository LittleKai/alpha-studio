export interface LocalizedText {
    vi?: string;
    en?: string;
}

/**
 * Đọc nội dung đa ngôn ngữ do người dùng đăng lên.
 * Tiếng Anh không bắt buộc — thiếu thì trả về bản tiếng Việt (và ngược lại).
 */
export function localizedText(text: LocalizedText | undefined | null, language: string): string {
    if (!text) return '';
    return (language === 'en' ? text.en || text.vi : text.vi || text.en) || '';
}

/** Điền nốt ngôn ngữ còn trống trước khi lưu, để dữ liệu luôn hiển thị được. */
export function fillLocalized(vi: string, en: string): { vi: string; en: string } {
    const v = vi.trim();
    const e = en.trim();
    return { vi: v || e, en: e || v };
}

import type { LibrarySection } from '../services/eventLibraryService';

/** Trả section theo ngôn ngữ, giữ fallback tiếng Việt cho dữ liệu cũ. */
export function localizedSection(section: LibrarySection, language: string): LibrarySection {
    if (language !== 'en') return section;
    return {
        ...section,
        title: section.titleEn || section.title,
        html: section.htmlEn || section.html,
        rows: section.rowsEn?.length ? section.rowsEn : section.rows,
        metrics: section.metricsEn?.length ? section.metricsEn : section.metrics,
        groups: section.groupsEn?.length ? section.groupsEn : section.groups,
        steps: section.stepsEn?.length ? section.stepsEn : section.steps,
        quote: section.quoteEn || section.quote,
        quoteBy: section.quoteByEn || section.quoteBy,
        links: section.linksEn?.length ? section.linksEn : section.links
    };
}
