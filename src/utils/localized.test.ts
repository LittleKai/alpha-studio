import { describe, it, expect } from 'vitest';
import { localizedText, fillLocalized } from './localized';

// Quy tắc nghiệp vụ (CLAUDE.md): nội dung do người dùng/admin đăng CHỈ bắt buộc
// tiếng Việt. Thiếu bản EN thì phải hiện bản VI, tuyệt đối không hiện ô trống.
describe('localizedText', () => {
    it('trả đúng ngôn ngữ đang xem khi có đủ cả hai', () => {
        const text = { vi: 'Xin chào', en: 'Hello' };
        expect(localizedText(text, 'vi')).toBe('Xin chào');
        expect(localizedText(text, 'en')).toBe('Hello');
    });

    it('thiếu EN thì rơi về VI thay vì trả chuỗi rỗng', () => {
        expect(localizedText({ vi: 'Chỉ có tiếng Việt' }, 'en')).toBe('Chỉ có tiếng Việt');
        expect(localizedText({ vi: 'Chỉ có tiếng Việt', en: '' }, 'en')).toBe('Chỉ có tiếng Việt');
    });

    it('thiếu VI thì rơi về EN (fallback hai chiều)', () => {
        expect(localizedText({ en: 'English only' }, 'vi')).toBe('English only');
        expect(localizedText({ vi: '', en: 'English only' }, 'vi')).toBe('English only');
    });

    it('không ném lỗi với null/undefined/rỗng', () => {
        expect(localizedText(undefined, 'vi')).toBe('');
        expect(localizedText(null, 'en')).toBe('');
        expect(localizedText({}, 'vi')).toBe('');
        expect(localizedText({ vi: '', en: '' }, 'en')).toBe('');
    });

    it('ngôn ngữ lạ được coi như không phải "en" nên ưu tiên VI', () => {
        expect(localizedText({ vi: 'Tiếng Việt', en: 'English' }, 'ja')).toBe('Tiếng Việt');
    });
});

describe('fillLocalized', () => {
    it('giữ nguyên khi cả hai đều có', () => {
        expect(fillLocalized('Tiêu đề', 'Title')).toEqual({ vi: 'Tiêu đề', en: 'Title' });
    });

    it('điền EN bằng VI khi bỏ trống EN — để dữ liệu luôn hiển thị được', () => {
        expect(fillLocalized('Tiêu đề', '')).toEqual({ vi: 'Tiêu đề', en: 'Tiêu đề' });
    });

    it('điền VI bằng EN khi bỏ trống VI', () => {
        expect(fillLocalized('', 'Title')).toEqual({ vi: 'Title', en: 'Title' });
    });

    it('coi chuỗi chỉ có khoảng trắng là trống', () => {
        expect(fillLocalized('Tiêu đề', '   ')).toEqual({ vi: 'Tiêu đề', en: 'Tiêu đề' });
        expect(fillLocalized('  \n\t ', 'Title')).toEqual({ vi: 'Title', en: 'Title' });
    });

    it('cắt khoảng trắng thừa ở hai đầu', () => {
        expect(fillLocalized('  Tiêu đề  ', '  Title  ')).toEqual({ vi: 'Tiêu đề', en: 'Title' });
    });

    it('cả hai trống thì trả về hai chuỗi rỗng, không ném lỗi', () => {
        expect(fillLocalized('', '')).toEqual({ vi: '', en: '' });
    });
});
