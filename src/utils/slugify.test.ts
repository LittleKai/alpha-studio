import { describe, it, expect } from 'vitest';
import { slugify, generateUniqueSlug } from './slugify';

describe('slugify', () => {
    it('bỏ dấu tiếng Việt', () => {
        expect(slugify('Khóa học React')).toBe('khoa-hoc-react');
        expect(slugify('Nguyễn Văn A')).toBe('nguyen-van-a');
        expect(slugify('Đà Nẵng')).toBe('da-nang');
    });

    it('xử lý đủ mọi nguyên âm có dấu và chữ đ hoa/thường', () => {
        expect(slugify('ăâêôơư')).toBe('aaeoou');
        expect(slugify('ẤẦẨẪẬ')).toBe('aaaaa');
        expect(slugify('Đ đ')).toBe('d-d');
    });

    it('đưa về chữ thường và nối bằng gạch ngang', () => {
        expect(slugify('AI Design Expert 2026')).toBe('ai-design-expert-2026');
        expect(slugify('snake_case_text')).toBe('snake-case-text');
    });

    it('bỏ ký tự đặc biệt', () => {
        expect(slugify('Giá: 100.000đ (rẻ!)')).toBe('gia-100000d-re');
        expect(slugify('a@b#c$d')).toBe('abcd');
    });

    it('gộp gạch ngang lặp và cắt gạch thừa ở hai đầu', () => {
        expect(slugify('  --Xin   chào--  ')).toBe('xin-chao');
        expect(slugify('a   ---   b')).toBe('a-b');
    });

    it('trả chuỗi rỗng với đầu vào rỗng hoặc toàn ký tự bị loại', () => {
        expect(slugify('')).toBe('');
        expect(slugify('!!!')).toBe('');
        expect(slugify('   ')).toBe('');
    });
});

describe('generateUniqueSlug', () => {
    it('giữ nguyên slug gốc khi chưa trùng', () => {
        expect(generateUniqueSlug('React Course', [])).toBe('react-course');
        expect(generateUniqueSlug('React Course', ['vue-course'])).toBe('react-course');
    });

    it('thêm hậu tố -2 khi slug gốc đã tồn tại', () => {
        expect(generateUniqueSlug('React Course', ['react-course'])).toBe('react-course-2');
    });

    it('tăng số cho tới khi tìm được slug chưa dùng', () => {
        const existing = ['react-course', 'react-course-2', 'react-course-3'];
        expect(generateUniqueSlug('React Course', existing)).toBe('react-course-4');
    });

    it('bỏ qua khoảng trống trong dãy số đã dùng — chỉ cần không trùng', () => {
        expect(generateUniqueSlug('React Course', ['react-course', 'react-course-3'])).toBe('react-course-2');
    });
});
