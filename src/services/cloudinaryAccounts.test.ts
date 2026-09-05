import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Module đọc `import.meta.env` ngay lúc load nên mỗi kịch bản phải stub env
// rồi `resetModules()` trước khi import lại.
const ENV_KEYS = [
    'VITE_CLOUDINARY_CLOUD_NAMES',
    'VITE_CLOUDINARY_UPLOAD_PRESETS',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_UPLOAD_PRESET',
] as const;

async function loadWith(env: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
    vi.resetModules();
    for (const key of ENV_KEYS) vi.stubEnv(key, env[key] ?? '');
    return import('./cloudinaryAccounts');
}

beforeEach(() => vi.resetModules());
afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('buildAccounts (qua CLOUDINARY_ACCOUNTS)', () => {
    it('ghép cloud name với preset theo thứ tự', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_a,cloud_b',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'preset_a,preset_b',
        });
        expect(m.CLOUDINARY_ACCOUNTS).toEqual([
            { cloudName: 'cloud_a', uploadPreset: 'preset_a' },
            { cloudName: 'cloud_b', uploadPreset: 'preset_b' },
        ]);
    });

    it('ít preset hơn cloud name thì dùng lại preset cuối', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_a,cloud_b,cloud_c',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'preset_a,preset_b',
        });
        expect(m.CLOUDINARY_ACCOUNTS.map(a => a.uploadPreset)).toEqual([
            'preset_a', 'preset_b', 'preset_b',
        ]);
    });

    it('cắt khoảng trắng và bỏ phần tử rỗng trong danh sách', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: ' cloud_a , , cloud_b ',
            VITE_CLOUDINARY_UPLOAD_PRESETS: ' preset_a ,preset_b',
        });
        expect(m.CLOUDINARY_ACCOUNTS).toEqual([
            { cloudName: 'cloud_a', uploadPreset: 'preset_a' },
            { cloudName: 'cloud_b', uploadPreset: 'preset_b' },
        ]);
    });

    it('cặp biến số ít cũ được ghép vào ĐẦU danh sách (tương thích ngược)', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_b',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'preset_b',
            VITE_CLOUDINARY_CLOUD_NAME: 'legacy_cloud',
            VITE_CLOUDINARY_UPLOAD_PRESET: 'legacy_preset',
        });
        expect(m.CLOUDINARY_ACCOUNTS[0]).toEqual({
            cloudName: 'legacy_cloud',
            uploadPreset: 'legacy_preset',
        });
        expect(m.PRIMARY_CLOUD_NAME).toBe('legacy_cloud');
    });

    it('không nhân đôi khi cloud name cũ đã có trong danh sách mới', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_a,cloud_b',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'preset_a,preset_b',
            VITE_CLOUDINARY_CLOUD_NAME: 'cloud_a',
        });
        expect(m.CLOUDINARY_ACCOUNTS.map(a => a.cloudName)).toEqual(['cloud_a', 'cloud_b']);
    });

    it('chỉ khai biến số ít thì preset mặc định là alpha_studio', async () => {
        const m = await loadWith({ VITE_CLOUDINARY_CLOUD_NAME: 'solo_cloud' });
        expect(m.CLOUDINARY_ACCOUNTS).toEqual([
            { cloudName: 'solo_cloud', uploadPreset: 'alpha_studio' },
        ]);
    });
});

describe('PRIMARY_CLOUD_NAME', () => {
    // Asset tĩnh (Event Creative City, landing) tham chiếu bằng public_id nên
    // luôn phải đọc từ tài khoản ĐẦU TIÊN — đảo thứ tự là ảnh landing 404.
    it('là tài khoản đầu tiên của danh sách', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'first_cloud,second_cloud',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'p1,p2',
        });
        expect(m.PRIMARY_CLOUD_NAME).toBe('first_cloud');
    });

    it('rơi về cloud gốc dzchj4ysj khi không khai biến nào', async () => {
        const m = await loadWith({});
        expect(m.CLOUDINARY_ACCOUNTS).toEqual([]);
        expect(m.PRIMARY_CLOUD_NAME).toBe('dzchj4ysj');
    });
});

describe('accountsToTry', () => {
    it('trả đủ mọi tài khoản, không trùng lặp — để hết hạn mức vẫn còn chỗ thử', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_a,cloud_b,cloud_c',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'p1,p2,p3',
        });
        const names = m.accountsToTry().map(a => a.cloudName);
        expect(names).toHaveLength(3);
        expect(new Set(names)).toEqual(new Set(['cloud_a', 'cloud_b', 'cloud_c']));
    });

    it('đặt tài khoản bốc được lên đầu', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'cloud_a,cloud_b,cloud_c',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'p1,p2,p3',
        });
        // Math.random() = 0.9 → index 2 → cloud_c được bốc
        vi.spyOn(Math, 'random').mockReturnValue(0.9);
        expect(m.accountsToTry()[0].cloudName).toBe('cloud_c');
    });

    it('một tài khoản thì trả đúng một, không lỗi', async () => {
        const m = await loadWith({
            VITE_CLOUDINARY_CLOUD_NAMES: 'only_cloud',
            VITE_CLOUDINARY_UPLOAD_PRESETS: 'only_preset',
        });
        expect(m.accountsToTry()).toEqual([
            { cloudName: 'only_cloud', uploadPreset: 'only_preset' },
        ]);
    });

    it('không có tài khoản nào thì trả mảng rỗng và pickAccount trả undefined', async () => {
        const m = await loadWith({});
        expect(m.accountsToTry()).toEqual([]);
        expect(m.pickAccount()).toBeUndefined();
    });
});
