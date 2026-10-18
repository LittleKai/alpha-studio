import { describe, expect, it } from 'vitest';
import { deriveVietYakuAndroidApkUrl } from './vietyakuReleaseService';

describe('deriveVietYakuAndroidApkUrl', () => {
    it('returns the GitHub APK asset when release metadata omits the APK URL', () => {
        expect(
            deriveVietYakuAndroidApkUrl('https://github.com/LittleKai/VietYaku/releases/tag/v1.3.3'),
        ).toBe(
            'https://github.com/LittleKai/VietYaku/releases/download/v1.3.3/VietYaku-android-v1.3.3.apk',
        );
    });
});
