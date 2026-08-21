const VIETYAKU_RELEASE_BASE_URL = 'https://cdn.giaiphapsangtao.com/file/alpha-studio/vietyaku-app';
const VIETYAKU_FALLBACK_VERSION = '1.1.0';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const VIETYAKU_GITHUB_URL = 'https://github.com/LittleKai/VietYaku/releases';

export interface VietYakuReleaseInfo {
    version: string;
    /** Backblaze B2 CDN link — what the web download button uses. */
    windowsZipUrl: string;
    windowsSize?: number;
    releaseNotes?: string;
    /** GitHub release page — the channel the in-app updater reads. */
    releaseUrl: string;
    publishedAt: string;
}

export const VIETYAKU_FALLBACK_RELEASE: VietYakuReleaseInfo = {
    version: VIETYAKU_FALLBACK_VERSION,
    windowsZipUrl: `${VIETYAKU_RELEASE_BASE_URL}/releases/VietYaku-windows-x64-v${VIETYAKU_FALLBACK_VERSION}.zip`,
    releaseUrl: VIETYAKU_GITHUB_URL,
    publishedAt: new Date().toISOString(),
};

export const getLatestVietYakuRelease = async (): Promise<VietYakuReleaseInfo> => {
    const response = await fetch(`${API_URL}/vietyaku/releases/latest`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to fetch VietYaku release metadata');
    }

    const json = await response.json() as { data?: Partial<VietYakuReleaseInfo> };
    const release = json.data;
    if (!release?.windowsZipUrl) {
        throw new Error('VietYaku release metadata is missing a download URL');
    }

    return {
        version: release.version || VIETYAKU_FALLBACK_RELEASE.version,
        windowsZipUrl: release.windowsZipUrl,
        windowsSize: release.windowsSize,
        releaseNotes: release.releaseNotes,
        releaseUrl: release.releaseUrl || VIETYAKU_GITHUB_URL,
        publishedAt: release.publishedAt || new Date().toISOString(),
    };
};
