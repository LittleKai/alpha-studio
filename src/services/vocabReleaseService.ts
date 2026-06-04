const VOCAB_RELEASE_BASE_URL = 'https://cdn.giaiphapsangtao.com/file/alpha-studio/vocabflip-app';
const VOCAB_FALLBACK_VERSION = '1.1.5';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ReleaseAsset {
    name?: string;
    browser_download_url?: string;
    size?: number;
}

interface ReleaseMetadata {
    tag_name?: string;
    version?: string;
    body?: string;
    published_at?: string;
    assets?: ReleaseAsset[];
}

interface VocabReleaseResponse {
    success?: boolean;
    data?: Partial<VocabReleaseInfo>;
}

export interface VocabReleaseInfo {
    version: string;
    windowsInstallerUrl: string;
    androidApkUrl: string;
    releaseNotes?: string;
    publishedAt: string;
    windowsSize?: number;
    androidSize?: number;
}

export const VOCAB_RELEASE_METADATA_URL = `${VOCAB_RELEASE_BASE_URL}/version.json`;

export const VOCAB_FALLBACK_RELEASE: VocabReleaseInfo = {
    version: VOCAB_FALLBACK_VERSION,
    windowsInstallerUrl: `${VOCAB_RELEASE_BASE_URL}/releases/vocabflip-windows-v${VOCAB_FALLBACK_VERSION}.zip`,
    androidApkUrl: `${VOCAB_RELEASE_BASE_URL}/releases/vocabflip-v${VOCAB_FALLBACK_VERSION}.apk`,
    releaseNotes: 'VocabFlip release build.',
    publishedAt: new Date().toISOString(),
};

const normalizeVersion = (value?: string): string => {
    if (!value) return VOCAB_FALLBACK_VERSION;
    return value.startsWith('v') ? value.slice(1) : value;
};

const findAsset = (assets: ReleaseAsset[], predicate: (name: string) => boolean): ReleaseAsset | undefined => {
    return assets.find((asset) => predicate((asset.name || '').toLowerCase()));
};

export const getLatestVocabRelease = async (): Promise<VocabReleaseInfo> => {
    const response = await fetch(`${API_URL}/vocab/releases/latest`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Failed to fetch VocabFlip release metadata');
    }

    const json = await response.json() as VocabReleaseResponse;
    const release = json.data;
    if (release?.windowsInstallerUrl && release?.androidApkUrl) {
        return {
            version: release.version || VOCAB_FALLBACK_RELEASE.version,
            windowsInstallerUrl: release.windowsInstallerUrl,
            androidApkUrl: release.androidApkUrl,
            releaseNotes: release.releaseNotes || VOCAB_FALLBACK_RELEASE.releaseNotes,
            publishedAt: release.publishedAt || new Date().toISOString(),
            windowsSize: release.windowsSize,
            androidSize: release.androidSize,
        };
    }

    const metadata = json as ReleaseMetadata;
    const assets = metadata.assets || [];
    const windowsAsset = findAsset(assets, (name) => name.includes('windows') && name.endsWith('.zip'))
        || findAsset(assets, (name) => name.endsWith('.zip'));
    const androidAsset = findAsset(assets, (name) => name.endsWith('.apk'));
    const version = normalizeVersion(metadata.tag_name || metadata.version);

    return {
        version,
        windowsInstallerUrl: windowsAsset?.browser_download_url || `${VOCAB_RELEASE_BASE_URL}/releases/vocabflip-windows-v${version}.zip`,
        androidApkUrl: androidAsset?.browser_download_url || `${VOCAB_RELEASE_BASE_URL}/releases/vocabflip-v${version}.apk`,
        releaseNotes: metadata.body || VOCAB_FALLBACK_RELEASE.releaseNotes,
        publishedAt: metadata.published_at || new Date().toISOString(),
        windowsSize: windowsAsset?.size,
        androidSize: androidAsset?.size,
    };
};
