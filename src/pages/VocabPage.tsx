import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/context';
import {
    VOCAB_FALLBACK_RELEASE,
    getLatestVocabRelease,
    type VocabReleaseInfo,
} from '../services/vocabReleaseService';
import { trackToolDownload } from '../services/toolDownloadService';
import StudioBackButton from '../components/studio/StudioBackButton';

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
        src: '/images/vocab/vocab-preview.png',
        captionKey: 'studio.hub.cards.vocab.page.shot1',
    },
    {
        src: '/images/vocab/vocab-preview-1.png',
        captionKey: 'studio.hub.cards.vocab.page.shot2',
    },
    {
        src: '/images/vocab/vocab-preview-2.png',
        captionKey: 'studio.hub.cards.vocab.page.shot3',
    },
    {
        src: '/images/vocab/vocab-preview-3.png',
        captionKey: 'studio.hub.cards.vocab.page.shot4',
    },
];

const VocabPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [release, setRelease] = useState<VocabReleaseInfo>(VOCAB_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);
    const [slide, setSlide] = useState(0);
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [showComparisonModal, setShowComparisonModal] = useState(false);

    const goPrev = useCallback(() => setSlide((i) => (i - 1 + SHOTS.length) % SHOTS.length), []);
    const goNext = useCallback(() => setSlide((i) => (i + 1) % SHOTS.length), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'Escape') {
                setShowZoomModal(false);
                setShowComparisonModal(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext]);

    const loadRelease = useCallback(async () => {
        try {
            setReleaseLoading(true);
            setReleaseError(false);
            setRelease(await getLatestVocabRelease());
        } catch (err) {
            console.error('Failed to load VocabFlip release metadata:', err);
            setRelease(VOCAB_FALLBACK_RELEASE);
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
        t('studio.hub.cards.vocab.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.vocab.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' · ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
            {/* Custom Embedded Vibrant Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .vocab-title-gradient {
                    background: linear-gradient(135deg, #ffffff 20%, #10b981 60%, #06b6d4 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                html[data-theme="light"] .vocab-title-gradient {
                    background: linear-gradient(135deg, #0f172a 20%, #059669 60%, #0284c7 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .ambient-emerald-glow {
                    background: radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%);
                }
                .ambient-sky-glow {
                    background: radial-gradient(circle, rgba(14, 165, 233, 0.10) 0%, transparent 70%);
                }
            ` }} />

            {/* Ambient Background Glows */}
            <div className="ambient-emerald-glow absolute -top-24 -left-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />
            <div className="ambient-sky-glow absolute top-1/3 -right-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />

            <StudioBackButton />

            <main className="container mx-auto max-w-5xl px-4 py-12 relative z-10">
                {/* Hero */}
                <header className="flex flex-col items-center gap-6 text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl group-hover:bg-emerald-500/30 transition-all" />
                        <img
                            src="/vocab/icons/Icon-192.png"
                            alt="VocabFlip"
                            className="relative h-24 w-24 rounded-3xl shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/30 object-contain bg-slate-900"
                        />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t('studio.hub.cards.vocab.page.tag')}
                        </span>
                        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl vocab-title-gradient flex items-center justify-center gap-3 flex-wrap">
                            <span>{t('studio.hub.cards.vocab.page.title')}</span>
                            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded uppercase tracking-wider select-none leading-normal">
                                Beta
                            </span>
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.vocab.page.subtitleText')}
                        </p>
                    </div>
                </header>

                {/* Download & Action Box */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent blur-2xl pointer-events-none" />

                    <div className="relative w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {releaseLoading
                            ? t('studio.hub.cards.vocab.page.releaseLoading')
                            : releaseMeta}
                    </div>

                    <div className="relative mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                                <h2 className="text-xl font-black bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                                    {t('studio.hub.cards.vocab.page.downloadTitle')}
                                </h2>
                            </div>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.cards.vocab.page.downloadDesc')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            {/* Open Web App */}
                            <a
                                href="/vocab/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                            >
                                <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                <span>{t('studio.hub.cards.vocab.page.openWebApp')}</span>
                            </a>

                            {/* Windows Download */}
                            <a
                                href={release.windowsInstallerUrl}
                                onClick={() => trackToolDownload('vocabflip', 'windows', release.version)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-sky-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                <span>{t('studio.hub.cards.vocab.page.downloadWindows')}</span>
                            </a>

                            {/* Android Download */}
                            {release.androidApkUrl && (
                                <a
                                    href={release.androidApkUrl}
                                    onClick={() => trackToolDownload('vocabflip', 'android', release.version)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-emerald-500 px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-all hover:scale-105 shadow-sm"
                                >
                                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                    </svg>
                                    <span>{t('studio.hub.cards.vocab.page.quickApk')}</span>
                                </a>
                            )}

                            {/* Compare Platforms button */}
                            <button
                                type="button"
                                onClick={() => setShowComparisonModal(true)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)] transition-all hover:scale-105 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer shadow-sm shrink-0"
                                title={t('studio.hub.cards.vocab.page.compareVersionsBtn') || 'So sánh phiên bản'}
                                aria-label={t('studio.hub.cards.vocab.page.compareVersionsBtn') || 'So sánh phiên bản'}
                            >
                                <svg className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Recommendation Notice */}
                    <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                        <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t('studio.hub.cards.vocab.page.subtitleRecommend')}</span>
                    </p>

                    {releaseError && (
                        <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                            {t('studio.hub.cards.vocab.page.releaseFallback')}
                        </p>
                    )}

                    <p className="mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {t('studio.hub.cards.vocab.page.updateNote')}
                    </p>
                </section>

                {/* Screenshots — slideshow */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.vocab.page.screenshotsHeading')}
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
                                        key={shot.src}
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
                                aria-label={t('studio.hub.cards.vocab.page.prevShot')}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.vocab.page.nextShot')}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-emerald-500 hover:text-emerald-400 cursor-pointer"
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
                                <span className="text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                    {slide + 1} / {SHOTS.length}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {SHOTS.map((shot, i) => (
                                        <button
                                            key={shot.src}
                                            type="button"
                                            onClick={() => setSlide(i)}
                                            aria-label={t(shot.captionKey)}
                                            aria-current={i === slide}
                                            className={`h-2 rounded-full transition-all cursor-pointer ${
                                                i === slide
                                                    ? 'w-6 bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
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
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.vocab.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {/* Feature 1: FSRS & Decks - Emerald Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vocab.page.featureFsrsTitle')}
                            description={t('studio.hub.cards.vocab.page.featureFsrsDesc')}
                            tone="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            titleColor="text-emerald-600 dark:text-emerald-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                        />
                        {/* Feature 2: Dictionary - Amber Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vocab.page.featureDictionaryTitle')}
                            description={t('studio.hub.cards.vocab.page.featureDictionaryDesc')}
                            tone="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm"
                            titleColor="text-amber-600 dark:text-amber-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            )}
                        />
                        {/* Feature 3: Studio Sync - Sky Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vocab.page.featureSyncTitle')}
                            description={t('studio.hub.cards.vocab.page.featureSyncDesc')}
                            tone="bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm"
                            titleColor="text-sky-600 dark:text-sky-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 9.4A5 5 0 0 0 7.7 7.6L6 9.3M7.5 14.6a5 5 0 0 0 8.8 1.8L18 14.7M6 5v4h4m8 10v-4h-4" />
                                </svg>
                            )}
                        />
                        {/* Feature 4: Import / Export - Violet Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vocab.page.featureImportTitle')}
                            description={t('studio.hub.cards.vocab.page.featureImportDesc')}
                            tone="bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 shadow-sm"
                            titleColor="text-violet-600 dark:text-violet-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            )}
                        />
                    </div>
                </section>

                {/* Requirements - Styled with colorful badges */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-lg">
                    <h2 className="text-xl font-black flex items-center gap-2.5">
                        <span className="w-2 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-sky-500" />
                        <span className="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent">
                            {t('studio.hub.cards.vocab.page.requirementsHeading')}
                        </span>
                    </h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-teal-500/5 border border-teal-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 text-xs font-bold">
                                🌐
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vocab.page.requirementWeb')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold">
                                ⊞
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vocab.page.requirementOs')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                🤖
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vocab.page.requirementAndroid')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold">
                                ⚡
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vocab.page.requirementAlgorithm')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 sm:col-span-2 lg:col-span-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                💾
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vocab.page.requirementSize')}
                            </p>
                        </div>
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
                        <div className="flex-1 flex items-center justify-center relative min-h-[300px] max-h-[70vh]">
                            <button
                                type="button"
                                onClick={goPrev}
                                className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 cursor-pointer z-10 hover:scale-110 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <img
                                src={SHOTS[slide].src}
                                alt={t(SHOTS[slide].captionKey)}
                                className="max-w-full max-h-[65vh] object-contain rounded-lg shadow-lg"
                            />

                            <button
                                type="button"
                                onClick={goNext}
                                className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 cursor-pointer z-10 hover:scale-110 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Thumbnails */}
                        <div className="flex justify-center gap-3 overflow-x-auto py-2">
                            {SHOTS.map((shot, idx) => (
                                <button
                                    key={shot.src}
                                    type="button"
                                    onClick={() => setSlide(idx)}
                                    className={`relative w-20 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                                        slide === idx
                                            ? 'border-emerald-500 scale-105 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                            : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-102'
                                    }`}
                                >
                                    <img src={shot.src} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Platform Comparison Modal */}
            {showComparisonModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setShowComparisonModal(false)}
                >
                    <div
                        className="relative max-w-3xl w-full flex flex-col gap-6 max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border-primary)] shadow-2xl bg-[var(--bg-card)] p-6 sm:p-8 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                            <button
                                type="button"
                                onClick={() => setShowComparisonModal(false)}
                                className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-primary)] cursor-pointer transition hover:scale-110"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent tracking-tight">
                                {t('studio.hub.cards.vocab.page.comparisonTitle')}
                            </h2>
                            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                {t('studio.hub.cards.vocab.page.comparisonDesc')}
                            </p>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm text-[var(--text-primary)]">
                                <thead>
                                    <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-card)]/50 text-[var(--text-secondary)] font-semibold">
                                        <th className="p-4">{t('studio.hub.cards.vocab.page.tableColFeature')}</th>
                                        <th className="p-4">{t('studio.hub.cards.vocab.page.tableColWeb')}</th>
                                        <th className="p-4">{t('studio.hub.cards.vocab.page.tableColAndroid')}</th>
                                        <th className="p-4">{t('studio.hub.cards.vocab.page.tableColWindows')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.flashcard')}</td>
                                        <td className="p-4 text-[var(--text-secondary)]">{t('studio.hub.cards.vocab.page.featureSupport.basic')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.full')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.full')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.fsrs')}</td>
                                        <td className="p-4 text-emerald-500 font-semibold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.sync')}</td>
                                        <td className="p-4 text-emerald-500 font-semibold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.dict')}</td>
                                        <td className="p-4 text-[var(--text-secondary)]">{t('studio.hub.cards.vocab.page.featureSupport.limited')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.full')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.full')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.offline')}</td>
                                        <td className="p-4 text-[var(--text-error)]">{t('studio.hub.cards.vocab.page.featureSupport.no')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.importExport')}</td>
                                        <td className="p-4 text-[var(--text-error)]">{t('studio.hub.cards.vocab.page.featureSupport.no')}</td>
                                        <td className="p-4 text-[var(--text-error)]">{t('studio.hub.cards.vocab.page.featureSupport.no')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                    </tr>
                                    <tr className="border-b border-[var(--border-secondary)] hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.tts')}</td>
                                        <td className="p-4 text-[var(--text-secondary)]">{t('studio.hub.cards.vocab.page.featureSupport.browserDependent')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.yes')}</td>
                                    </tr>
                                    <tr className="hover:bg-[var(--bg-secondary)]/20 transition-colors">
                                        <td className="p-4 font-bold text-[var(--text-primary)]">{t('studio.hub.cards.vocab.page.featureList.performance')}</td>
                                        <td className="p-4 text-[var(--text-secondary)]">{t('studio.hub.cards.vocab.page.featureSupport.good')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.high')}</td>
                                        <td className="p-4 text-emerald-500 font-bold">{t('studio.hub.cards.vocab.page.featureSupport.high')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VocabPage;
