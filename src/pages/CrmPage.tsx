import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import {
    getLatestCrmRelease,
    type CrmReleaseInfo,
} from '../services/crmService';
import { trackToolDownload } from '../services/toolDownloadService';
import StudioBackButton from '../components/studio/StudioBackButton';

const CRM_FALLBACK_RELEASE: CrmReleaseInfo = {
    version: '1.0.0',
    windowsInstallerUrl: 'https://download.giaiphapsangtao.com/file/alpha-studio/crm-app/releases/alpha-crm-setup.exe',
    androidApkUrl: 'https://download.giaiphapsangtao.com/file/alpha-studio/crm-app/releases/alpha-crm-v1.0.0.apk',
    publishedAt: new Date().toISOString(),
};

const formatReleaseDate = (value: string, locale: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale);
};

interface FeatureCardProps {
    title: string;
    description: string;
    tone: string;
    titleColor?: string;
    icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, tone, titleColor, icon }) => (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tone}`}>
            {icon}
        </div>
        <h3 className={`text-base font-black ${titleColor || 'text-[var(--text-primary)]'}`}>{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </div>
);

const SHOTS = [
    {
        src: '/crm-preview.png',
        captionKey: 'studio.hub.cards.crm.page.shot1',
    },
    {
        src: '/crm-preview.png',
        captionKey: 'studio.hub.cards.crm.page.shot2',
    },
    {
        src: '/crm-preview.png',
        captionKey: 'studio.hub.cards.crm.page.shot3',
    },
    {
        src: '/crm-preview.png',
        captionKey: 'studio.hub.cards.crm.page.shot4',
    },
];

const CrmPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [release, setRelease] = useState<CrmReleaseInfo>(CRM_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);
    const [slide, setSlide] = useState(0);
    const [showZoomModal, setShowZoomModal] = useState(false);

    const goPrev = useCallback(() => setSlide((i) => (i - 1 + SHOTS.length) % SHOTS.length), []);
    const goNext = useCallback(() => setSlide((i) => (i + 1) % SHOTS.length), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'Escape') setShowZoomModal(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext]);

    const loadRelease = useCallback(async () => {
        try {
            setReleaseLoading(true);
            setReleaseError(false);
            const data = await getLatestCrmRelease();
            setRelease(data || CRM_FALLBACK_RELEASE);
        } catch (err) {
            console.error('Failed to load CRM release metadata:', err);
            setRelease(CRM_FALLBACK_RELEASE);
            setReleaseError(true);
        } finally {
            setReleaseLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRelease();
    }, [loadRelease]);

    const publishedDate = formatReleaseDate(release.publishedAt, language === 'vi' ? 'vi-VN' : 'en-US');
    const releaseMeta = [
        t('studio.hub.cards.crm.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.crm.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' · ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
            {/* Custom Embedded Vibrant Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .crm-title-gradient {
                    background: linear-gradient(135deg, #ffffff 20%, #0284c7 60%, #6366f1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                html[data-theme="light"] .crm-title-gradient {
                    background: linear-gradient(135deg, #0f172a 20%, #0369a1 60%, #4338ca 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .ambient-sky-glow {
                    background: radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%);
                }
                .ambient-blue-glow {
                    background: radial-gradient(circle, rgba(99, 102, 241, 0.10) 0%, transparent 70%);
                }
            ` }} />

            {/* Ambient Background Glows */}
            <div className="ambient-sky-glow absolute -top-24 -left-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />
            <div className="ambient-blue-glow absolute top-1/3 -right-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />

            <StudioBackButton />

            <main className="container mx-auto max-w-5xl px-4 py-12 relative z-10">
                {/* Hero */}
                <header className="flex flex-col items-center gap-6 text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-sky-500/20 rounded-3xl blur-xl group-hover:bg-sky-500/30 transition-all" />
                        <img
                            src="/crm-logo.png"
                            alt="Alpha CRM"
                            className="relative h-24 w-24 rounded-3xl shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/30 object-contain"
                        />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                            {t('studio.hub.cards.crm.page.tag')}
                        </span>
                        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl crm-title-gradient flex items-center justify-center gap-3 flex-wrap">
                            <span>{t('studio.hub.cards.crm.page.title')}</span>
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider select-none leading-normal">
                                Beta
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.crm.page.subtitle')}
                        </p>
                    </div>
                </header>

                {/* Download & Action Box */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-transparent blur-2xl pointer-events-none" />

                    <div className="relative w-full rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        {releaseLoading
                            ? t('studio.hub.cards.crm.page.releaseLoading')
                            : releaseMeta}
                    </div>

                    <div className="relative mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                                <h2 className="text-xl font-black bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
                                    {t('studio.hub.cards.crm.page.downloadTitle')}
                                </h2>
                            </div>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.cards.crm.page.downloadDesc')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Windows Client Download */}
                            <a
                                href={release.windowsInstallerUrl}
                                onClick={() => trackToolDownload('crm', 'windows', release.version)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-sky-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                <span>{t('studio.hub.cards.crm.page.downloadWindows')}</span>
                            </a>

                            {/* Android APK Download */}
                            {release.androidApkUrl ? (
                                <a
                                    href={release.androidApkUrl}
                                    onClick={() => trackToolDownload('crm', 'android', release.version)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-sky-500 px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-all hover:scale-105 shadow-sm"
                                >
                                    <svg className="h-5 w-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                    </svg>
                                    <span>{t('studio.hub.cards.crm.page.downloadAndroid')}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider leading-none">
                                        {t('studio.hub.cards.crm.page.demoBadge')}
                                    </span>
                                </a>
                            ) : null}

                            {/* Link to Pricing / Subscriptions */}
                            <Link
                                to="/studio/crm/subscription"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-all hover:scale-105 shadow-sm"
                            >
                                <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{t('studio.hub.cards.crm.page.viewPricing')}</span>
                            </Link>
                        </div>
                    </div>

                    {/* Android Demo Notice */}
                    <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                        <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{t('studio.hub.cards.crm.page.downloadAndroidNotice')}</span>
                    </p>

                    {releaseError && (
                        <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                            {t('studio.hub.cards.crm.page.releaseFallback')}
                        </p>
                    )}

                    <p className="mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {t('studio.hub.cards.crm.page.updateNote')}
                    </p>
                </section>

                {/* Screenshots — slideshow */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.crm.page.screenshotsHeading')}
                    </h2>

                    <div className="glass-card overflow-hidden rounded-3xl border border-[var(--border-primary)] shadow-2xl relative">
                        {/* Viewport */}
                        <div className="relative overflow-hidden bg-slate-950">
                            <div
                                className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-zoom-in"
                                style={{ transform: `translateX(-${slide * 100}%)` }}
                                onClick={() => setShowZoomModal(true)}
                            >
                                {SHOTS.map((shot, i) => (
                                    <img
                                        key={`${shot.src}-${i}`}
                                        src={shot.src}
                                        alt={t(shot.captionKey)}
                                        className="w-full shrink-0 object-contain max-h-[550px]"
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label={t('studio.hub.cards.crm.page.prevShot')}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-sky-500 hover:text-sky-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.crm.page.nextShot')}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-sky-500 hover:text-sky-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Caption + position */}
                        <div className="flex flex-col gap-3 border-t border-[var(--border-primary)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--bg-card)]">
                            <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                                {t(SHOTS[slide].captionKey)}
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-xs font-bold tabular-nums text-sky-600 dark:text-sky-400">
                                    {slide + 1} / {SHOTS.length}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {SHOTS.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setSlide(i)}
                                            aria-label={`${t('studio.hub.cards.crm.page.screenshotsHeading')} ${i + 1}`}
                                            aria-current={i === slide}
                                            className={`h-2 rounded-full transition-all cursor-pointer ${
                                                i === slide
                                                    ? 'w-6 bg-gradient-to-r from-sky-500 to-blue-500 shadow-[0_0_8px_rgba(2,132,199,0.6)]'
                                                    : 'w-2 bg-[var(--border-secondary)] hover:bg-[var(--text-tertiary)]'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features - 4 Distinct Vibrant Tones */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-sky-500 via-blue-500 to-emerald-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.crm.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {/* Feature 1: Bulk Messaging - Blue Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureBulkTitle')}
                            description={t('studio.hub.cards.crm.page.featureBulkDesc')}
                            tone="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm"
                            titleColor="text-blue-600 dark:text-blue-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            )}
                        />
                        {/* Feature 2: AI Script - Cyan Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureAiTitle')}
                            description={t('studio.hub.cards.crm.page.featureAiDesc')}
                            tone="bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shadow-sm"
                            titleColor="text-cyan-600 dark:text-cyan-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        {/* Feature 3: Safe Device Pairing - Emerald Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featurePairingTitle')}
                            description={t('studio.hub.cards.crm.page.featurePairingDesc')}
                            tone="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            titleColor="text-emerald-600 dark:text-emerald-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )}
                        />
                        {/* Feature 4: Contacts & Funnel - Amber Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureContactsTitle')}
                            description={t('studio.hub.cards.crm.page.featureContactsDesc')}
                            tone="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm"
                            titleColor="text-amber-600 dark:text-amber-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        />
                    </div>
                </section>

                {/* Requirements - Styled with colorful badges */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-lg">
                    <h2 className="text-xl font-black flex items-center gap-2.5">
                        <span className="w-2 h-4 rounded-full bg-gradient-to-b from-sky-500 to-blue-500" />
                        <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent">
                            {t('studio.hub.cards.crm.page.requirementsHeading')}
                        </span>
                    </h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold">
                                ⊞
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.crm.page.requirementWindows')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                🤖
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.crm.page.requirementAndroid')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-bold">
                                💬
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.crm.page.requirementZalo')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold">
                                ⚡
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.crm.page.requirementMemory')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 sm:col-span-2 lg:col-span-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                💾
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.crm.page.requirementSize')}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Plans & Pricing Highlights Section */}
                <section id="pricing-plans" className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-lg relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                                <h2 className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                    {t('studio.hub.cards.crm.page.pricingHeading')}
                                </h2>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] max-w-xl leading-relaxed">
                                {t('studio.hub.cards.crm.page.pricingDesc')}
                            </p>
                        </div>

                        <Link
                            to="/studio/crm/subscription"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:scale-105 transition-all text-sm shrink-0"
                        >
                            <span>{t('studio.hub.cards.crm.page.manageSubscription')}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </section>
            </main>

            {/* Interactive Image Zoom Modal */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setShowZoomModal(false)}
                >
                    <div
                        className="relative max-w-5xl w-full flex flex-col gap-4 max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-950 p-4 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowZoomModal(false)}
                                className="p-2 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/10 cursor-pointer transition hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Active Image */}
                        <div className="flex-1 flex items-center justify-center relative min-h-[300px] max-h-[75vh]">
                            <img
                                src={SHOTS[slide].src}
                                alt={t(SHOTS[slide].captionKey)}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrmPage;
