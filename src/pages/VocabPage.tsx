import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import {
    VOCAB_FALLBACK_RELEASE,
    getLatestVocabRelease,
    type VocabReleaseInfo,
} from '../services/vocabReleaseService';

interface DownloadCardProps {
    title: string;
    description: string;
    meta: string;
    href: string;
    platform: 'windows' | 'android';
}

interface FeatureCardProps {
    title: string;
    description: string;
    tone: string;
    icon: React.ReactNode;
}

const formatFileSize = (size?: number): string => {
    if (!size) return '';
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
};

const formatReleaseDate = (value: string, locale: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale);
};

const DownloadCard: React.FC<DownloadCardProps> = ({ title, description, meta, href, platform }) => {
    const isWindows = platform === 'windows';

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group flex min-h-[132px] items-center gap-4 rounded-2xl border p-4 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${
                isWindows
                    ? 'border-sky-500/30 bg-gradient-to-br from-sky-600 to-cyan-600'
                    : 'border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-600'
            }`}
        >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 transition-transform group-hover:scale-105">
                {isWindows ? (
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M0 3.45 9.75 2.1v9.45H0V3.45Zm0 9h9.75v9.45L0 20.55v-8.1ZM11.25 1.9 24 0v11.55H11.25V1.9Zm0 10.55H24V24l-12.75-1.9v-9.65Z" />
                    </svg>
                ) : (
                    <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M17.52 15.3 19.34 18.45a.5.5 0 1 1-.86.5l-1.85-3.2c-1.42.62-2.99.95-4.63.95s-3.21-.33-4.63-.95l-1.85 3.2a.5.5 0 1 1-.86-.5L6.48 15.3C3.72 13.78 2 11.08 2 8h20c0 3.08-1.72 5.78-4.48 7.3ZM7 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm10 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
                    </svg>
                )}
            </span>
            <span className="min-w-0 space-y-1">
                <span className="block text-base font-black text-white">{title}</span>
                <span className="block text-sm leading-relaxed text-white/90">{description}</span>
                <span className="block text-xs font-semibold text-white/75">{meta}</span>
            </span>
        </a>
    );
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, tone, icon }) => (
    <div className="glass-card rounded-2xl p-5">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
            {icon}
        </div>
        <h3 className="text-base font-black text-[var(--text-primary)]">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </div>
);

const VocabPage: React.FC = () => {
    const { t, language } = useTranslation();
    const { token } = useAuth();
    const navigate = useNavigate();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const webAppRef = useRef<HTMLDivElement>(null);
    const [release, setRelease] = useState<VocabReleaseInfo>(VOCAB_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);

    const sendAuthToken = useCallback(() => {
        if (!iframeRef.current?.contentWindow || !token) return;

        iframeRef.current.contentWindow.postMessage(
            { type: 'AUTH_TOKEN', token },
            window.location.origin
        );
    }, [token]);

    useEffect(() => {
        let cancelled = false;

        getLatestVocabRelease()
            .then((releaseInfo) => {
                if (!cancelled) {
                    setRelease(releaseInfo);
                    setReleaseError(false);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setRelease(VOCAB_FALLBACK_RELEASE);
                    setReleaseError(true);
                }
            })
            .finally(() => {
                if (!cancelled) setReleaseLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const handleIframeLoad = () => sendAuthToken();

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleIframeLoad);
            return () => {
                iframe.removeEventListener('load', handleIframeLoad);
            };
        }
    }, [sendAuthToken]);

    useEffect(() => {
        sendAuthToken();
    }, [sendAuthToken]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (event.data?.type === 'AUTH_READY') {
                sendAuthToken();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [sendAuthToken]);

    const handleOpenWebApp = useCallback(() => {
        webAppRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        sendAuthToken();
    }, [sendAuthToken]);

    const windowsSize = formatFileSize(release.windowsSize);
    const androidSize = formatFileSize(release.androidSize);
    const publishedDate = formatReleaseDate(release.publishedAt, language === 'vi' ? 'vi-VN' : 'en-US');
    const releaseMeta = [
        t('studio.hub.cards.vocab.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.vocab.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' - ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <button
                onClick={() => navigate('/studio')}
                className="fixed top-[11px] left-4 md:left-[190px] z-[60] hidden md:inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('studio.hub.backToStudio')}
            </button>

            <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-8 sm:py-14">
                <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-7">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-black uppercase text-[var(--accent-primary)]">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />
                            {t('studio.hub.cards.vocab.page.tag')}
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
                                {t('studio.hub.cards.vocab.page.title')}
                            </h1>
                            <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                                {t('studio.hub.cards.vocab.page.subtitle')}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={handleOpenWebApp}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-on-accent)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                {t('studio.hub.cards.vocab.page.openWebApp')}
                            </button>
                            <a
                                href={release.androidApkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-3 text-sm font-black text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-400"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" />
                                </svg>
                                {t('studio.hub.cards.vocab.page.quickApk')}
                            </a>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="relative overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-2xl">
                            <div className="absolute right-[-80px] top-[-80px] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
                            <div className="absolute bottom-[-90px] left-[-70px] h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
                            <div className="relative space-y-5">
                                <div className="flex items-center justify-between border-b border-[var(--border-primary)] pb-4">
                                    <div>
                                        <p className="text-xs font-black uppercase text-[var(--text-tertiary)]">
                                            {t('studio.hub.cards.vocab.page.releaseHeading')}
                                        </p>
                                        <p className="mt-1 text-2xl font-black text-[var(--text-primary)]">
                                            {releaseLoading ? t('studio.hub.cards.vocab.page.releaseLoading') : releaseMeta}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-400">
                                        {t('studio.hub.cards.vocab.page.noMonthly')}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                                        <p className="text-3xl font-black text-[var(--accent-primary)]">4</p>
                                        <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                            {t('studio.hub.cards.vocab.page.languages')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                                        <p className="text-3xl font-black text-emerald-400">SM-2</p>
                                        <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                            {t('studio.hub.cards.vocab.page.scheduler')}
                                        </p>
                                    </div>
                                </div>

                                {releaseError && (
                                    <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-500">
                                        {t('studio.hub.cards.vocab.page.releaseFallback')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DownloadCard
                        platform="windows"
                        href={release.windowsInstallerUrl}
                        title={t('studio.hub.cards.vocab.page.downloadWindowsTitle')}
                        description={t('studio.hub.cards.vocab.page.downloadWindowsDesc')}
                        meta={[
                            t('studio.hub.cards.vocab.page.versionMeta').replace('{{version}}', release.version),
                            windowsSize,
                        ].filter(Boolean).join(' - ')}
                    />
                    <DownloadCard
                        platform="android"
                        href={release.androidApkUrl}
                        title={t('studio.hub.cards.vocab.page.downloadAndroidTitle')}
                        description={t('studio.hub.cards.vocab.page.downloadAndroidDesc')}
                        meta={[
                            t('studio.hub.cards.vocab.page.versionMeta').replace('{{version}}', release.version),
                            androidSize,
                        ].filter(Boolean).join(' - ')}
                    />
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FeatureCard
                        title={t('studio.hub.cards.vocab.page.featureDecksTitle')}
                        description={t('studio.hub.cards.vocab.page.featureDecksDesc')}
                        tone="bg-emerald-500/10 text-emerald-400"
                        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 13h5" /></svg>}
                    />
                    <FeatureCard
                        title={t('studio.hub.cards.vocab.page.featureSyncTitle')}
                        description={t('studio.hub.cards.vocab.page.featureSyncDesc')}
                        tone="bg-sky-500/10 text-sky-400"
                        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4A5 5 0 0 0 7.7 7.6L6 9.3M7.5 14.6a5 5 0 0 0 8.8 1.8L18 14.7" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 5v4h4m8 10v-4h-4" /></svg>}
                    />
                    <FeatureCard
                        title={t('studio.hub.cards.vocab.page.featureDictionaryTitle')}
                        description={t('studio.hub.cards.vocab.page.featureDictionaryDesc')}
                        tone="bg-amber-500/10 text-amber-400"
                        icon={<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5v-16Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h7M9 11h5" /></svg>}
                    />
                </section>

                <section ref={webAppRef} className="space-y-4 scroll-mt-20">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-black uppercase text-[var(--accent-primary)]">
                                {t('studio.hub.cards.vocab.page.webHeadingEyebrow')}
                            </p>
                            <h2 className="mt-1 text-2xl font-black text-[var(--text-primary)]">
                                {t('studio.hub.cards.vocab.page.webHeading')}
                            </h2>
                        </div>
                        <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.vocab.page.webDesc')}
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-red-400" />
                                <span className="h-3 w-3 rounded-full bg-amber-400" />
                                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                            </div>
                            <span className="rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs font-semibold text-[var(--text-tertiary)]">
                                /vocab/index.html
                            </span>
                        </div>
                        <div className="relative h-[78vh] min-h-[760px] w-full bg-[var(--bg-primary)]">
                            <iframe
                                ref={iframeRef}
                                src="/vocab/index.html"
                                className="absolute inset-0 h-full w-full border-0"
                                title={t('studio.hub.cards.vocab.page.webTitle')}
                                allow="microphone; camera"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default VocabPage;
