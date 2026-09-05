import { describe, it, expect } from 'vitest';
import { cdnFromUrl } from './cloudinaryAssets';

// Quy tắc CLAUDE.md #3: không bao giờ nhúng thẳng `secure_url` vào <img src>.
// `cdnFromUrl` phải chèn `f_auto,q_auto` để CDN trả WebP/AVIF đúng kích cỡ,
// nhưng phải để yên URL không phải Cloudinary (người đăng có thể dán link ngoài).
const CLOUDINARY_URL = 'https://res.cloudinary.com/demo/image/upload/v123/folder/pic.jpg';

describe('cdnFromUrl', () => {
    it('chèn f_auto,q_auto vào URL Cloudinary', () => {
        expect(cdnFromUrl(CLOUDINARY_URL)).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v123/folder/pic.jpg'
        );
    });

    it('chèn kèm transform kích thước khi được truyền', () => {
        expect(cdnFromUrl(CLOUDINARY_URL, 'w_640')).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v123/folder/pic.jpg'
        );
    });

    it('trả nguyên vẹn URL không phải Cloudinary — chèn vào sẽ làm hỏng ảnh', () => {
        const external = 'https://example.com/images/pic.jpg';
        expect(cdnFromUrl(external, 'w_640')).toBe(external);

        const b2 = 'https://cdn.giaiphapsangtao.com/uploads/doc.pdf';
        expect(cdnFromUrl(b2)).toBe(b2);
    });

    it('trả nguyên vẹn URL Cloudinary không có /upload/ (vd URL fetch/private)', () => {
        const noUpload = 'https://res.cloudinary.com/demo/image/private/v123/pic.jpg';
        expect(cdnFromUrl(noUpload)).toBe(noUpload);
    });

    it('không chồng transform khi URL đã có f_auto hoặc q_auto', () => {
        const withF = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/pic.jpg';
        expect(cdnFromUrl(withF, 'w_320')).toBe(withF);

        const withQ = 'https://res.cloudinary.com/demo/image/upload/q_auto:best/v1/pic.jpg';
        expect(cdnFromUrl(withQ)).toBe(withQ);
    });

    it('vẫn chèn khi transform sẵn có không phải f_auto/q_auto', () => {
        const cropped = 'https://res.cloudinary.com/demo/image/upload/c_fill,w_100/v1/pic.jpg';
        expect(cdnFromUrl(cropped)).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/c_fill,w_100/v1/pic.jpg'
        );
    });

    it('không ném lỗi với chuỗi rỗng', () => {
        expect(cdnFromUrl('')).toBe('');
        expect(cdnFromUrl('', 'w_640')).toBe('');
    });
});
