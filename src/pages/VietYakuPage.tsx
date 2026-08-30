import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/context';
import {
    VIETYAKU_FALLBACK_RELEASE,
    getLatestVietYakuRelease,
    type VietYakuReleaseInfo,
} from '../services/vietyakuReleaseService';
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

const SHOTS = [1, 2, 3, 4, 5, 6].map((n) => ({
    src: `/images/vietyaku/screenshot-${n}.png`,
    captionKey: `studio.hub.cards.vietyaku.page.shot${n}`,
}));

const VietYakuPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [release, setRelease] = useState<VietYakuReleaseInfo>(VIETYAKU_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);
    const [slide, setSlide] = useState(0);

    const goPrev = useCallback(() => setSlide((i) => (i - 1 + SHOTS.length) % SHOTS.length), []);
    const goNext = useCallback(() => setSlide((i) => (i + 1) % SHOTS.length), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext]);

    const loadRelease = useCallback(async () => {
        try {
            setReleaseLoading(true);
            setReleaseError(false);
            setRelease(await getLatestVietYakuRelease());
        } catch (err) {
            console.error('Failed to load VietYaku release metadata:', err);
            setRelease(VIETYAKU_FALLBACK_RELEASE);
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
        t('studio.hub.cards.vietyaku.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.vietyaku.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' · ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
            {/* Custom Embedded Vibrant Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .vietyaku-title-gradient {
                    background: linear-gradient(135deg, #ffffff 20%, #f43f5e 60%, #fbbf24 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                html[data-theme="light"] .vietyaku-title-gradient {
                    background: linear-gradient(135deg, #0f172a 20%, #e11d48 60%, #d97706 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .ambient-rose-glow {
                    background: radial-gradient(circle, rgba(244, 63, 94, 0.12) 0%, transparent 70%);
                }
                .ambient-amber-glow {
                    background: radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, transparent 70%);
                }
            ` }} />

            {/* Ambient Background Glows */}
            <div className="ambient-rose-glow absolute -top-24 -left-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />
            <div className="ambient-amber-glow absolute top-1/3 -right-24 w-96 h-96 blur-3xl pointer-events-none rounded-full" />

            <StudioBackButton />

            <main className="container mx-auto max-w-5xl px-4 py-12 relative z-10">
                {/* Hero */}
                <header className="flex flex-col items-center gap-6 text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-500/20 rounded-3xl blur-xl group-hover:bg-rose-500/30 transition-all" />
                        <img
                            src="/vietyaku-logo.png"
                            alt="VietYaku"
                            className="relative h-24 w-24 rounded-3xl shadow-xl shadow-rose-500/10 ring-2 ring-rose-500/30"
                        />
                    </div>
                    <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            {t('studio.hub.cards.vietyaku.page.tag')}
                        </span>
                        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl vietyaku-title-gradient">
                            {t('studio.hub.cards.vietyaku.page.title')}
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.vietyaku.page.subtitle')}
                        </p>
                    </div>
                </header>

                {/* Download */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-transparent blur-2xl pointer-events-none" />
                    
                    <div className="relative w-full rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                        {releaseLoading
                            ? t('studio.hub.cards.vietyaku.page.releaseLoading')
                            : releaseMeta}
                    </div>

                    <div className="relative mt-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                                <h2 className="text-xl font-black bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                                    {t('studio.hub.cards.vietyaku.page.downloadTitle')}
                                </h2>
                            </div>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.cards.vietyaku.page.downloadDesc')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href={release.windowsZipUrl}
                                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-rose-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                <span>{t('studio.hub.cards.vietyaku.page.downloadWindows')}</span>
                            </a>

                            {release.androidApkUrl ? (
                                <a
                                    href={release.androidApkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                    </svg>
                                    <span>{t('studio.hub.cards.vietyaku.page.downloadAndroid')}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-white/20 text-white border border-white/30 uppercase tracking-wider leading-none">
                                        {t('studio.hub.cards.vietyaku.page.betaBadge')}
                                    </span>
                                </a>
                            ) : (
                                <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)]/60 px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] shadow-sm select-none">
                                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                    </svg>
                                    <span>{t('studio.hub.cards.vietyaku.page.downloadAndroid')}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider leading-none">
                                        {t('studio.hub.cards.vietyaku.page.comingSoonBadge')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {release.androidApkUrl && (
                        <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-600 dark:text-amber-400">
                            <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span>{t('studio.hub.cards.vietyaku.page.downloadAndroidNotice')}</span>
                        </p>
                    )}

                    {releaseError && (
                        <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-600 dark:text-amber-400">
                            {t('studio.hub.cards.vietyaku.page.releaseFallback')}
                        </p>
                    )}

                    <p className="mt-5 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {t('studio.hub.cards.vietyaku.page.updateNote')}
                    </p>
                </section>

                {/* Screenshots — slideshow */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-rose-500 via-amber-500 to-violet-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.vietyaku.page.screenshotsHeading')}
                    </h2>

                    <div className="glass-card overflow-hidden rounded-3xl border border-[var(--border-primary)] shadow-2xl relative">
                        {/* Viewport */}
                        <div className="relative overflow-hidden bg-slate-950">
                            <div
                                className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                style={{ transform: `translateX(-${slide * 100}%)` }}
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
                                aria-label={t('studio.hub.cards.vietyaku.page.prevShot')}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-rose-500 hover:text-rose-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.vietyaku.page.nextShot')}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:border-rose-500 hover:text-rose-400 cursor-pointer"
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
                                <span className="text-xs font-bold tabular-nums text-rose-500 dark:text-rose-400">
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
                                                    ? 'w-6 bg-gradient-to-r from-rose-500 to-amber-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
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
                    <h2 className="mb-6 text-center text-2xl font-black bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 bg-clip-text text-transparent">
                        {t('studio.hub.cards.vietyaku.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        {/* Feature 1: Offline - Emerald Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureOfflineTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureOfflineDesc')}
                            tone="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm"
                            titleColor="text-emerald-600 dark:text-emerald-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        {/* Feature 2: Origin & QuickConverter - Amber Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureOriginTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureOriginDesc')}
                            tone="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm"
                            titleColor="text-amber-600 dark:text-amber-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                        />
                        {/* Feature 3: Lookup - Sky Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureLookupTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureLookupDesc')}
                            tone="bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 shadow-sm"
                            titleColor="text-sky-600 dark:text-sky-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            )}
                        />
                        {/* Feature 4: Repair - Rose Tone */}
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureRepairTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureRepairDesc')}
                            tone="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm"
                            titleColor="text-rose-600 dark:text-rose-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        />
                    </div>
                </section>

                {/* Requirements - Styled with colorful badges */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-lg">
                    <h2 className="text-xl font-black flex items-center gap-2.5">
                        <span className="w-2 h-4 rounded-full bg-gradient-to-b from-rose-500 to-amber-500" />
                        <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                            {t('studio.hub.cards.vietyaku.page.requirementsHeading')}
                        </span>
                    </h2>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                ✓
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vietyaku.page.requirementOrigin')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold">
                                ⊞
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vietyaku.page.requirementOs')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                🤖
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vietyaku.page.requirementAndroid')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 text-xs font-bold">
                                ⚡
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vietyaku.page.requirementPortable')}
                            </p>
                        </div>
                        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 sm:col-span-2 lg:col-span-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold">
                                💾
                            </span>
                            <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium">
                                {t('studio.hub.cards.vietyaku.page.requirementSize')}
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default VietYakuPage;
