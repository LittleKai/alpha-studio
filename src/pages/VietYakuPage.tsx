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

const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
};

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => (
    <div className="glass-card rounded-2xl p-5">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {icon}
        </div>
        <h3 className="text-base font-black text-[var(--text-primary)]">{title}</h3>
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
        formatSize(release.windowsSize),
    ].filter(Boolean).join(' · ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <StudioBackButton />
            <main className="container mx-auto max-w-5xl px-4 py-12">
                {/* Hero */}
                <header className="flex flex-col items-center gap-6 text-center">
                    <img
                        src="/vietyaku-logo.png"
                        alt="VietYaku"
                        className="h-24 w-24 rounded-3xl shadow-lg"
                    />
                    <div>
                        <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                            {t('studio.hub.cards.vietyaku.page.tag')}
                        </span>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
                            {t('studio.hub.cards.vietyaku.page.title')}
                        </h1>
                        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.vietyaku.page.subtitle')}
                        </p>
                    </div>
                </header>

                {/* Download */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-black">
                                {t('studio.hub.cards.vietyaku.page.downloadTitle')}
                            </h2>
                            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.cards.vietyaku.page.downloadDesc')}
                            </p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                                {releaseLoading
                                    ? t('studio.hub.cards.vietyaku.page.releaseLoading')
                                    : releaseMeta}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                            <a
                                href={release.windowsZipUrl}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-bold text-[var(--bg-primary)] transition hover:opacity-90 shadow-md"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                <span>{t('studio.hub.cards.vietyaku.page.downloadWindows')}</span>
                            </a>

                            {release.androidApkUrl ? (
                                <a
                                    href={release.androidApkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-emerald-500 hover:text-emerald-500 shadow-sm"
                                >
                                    <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                    </svg>
                                    <span>{t('studio.hub.cards.vietyaku.page.downloadAndroid')}</span>
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
                    <h2 className="mb-6 text-center text-2xl font-black">
                        {t('studio.hub.cards.vietyaku.page.screenshotsHeading')}
                    </h2>

                    <div className="glass-card overflow-hidden rounded-3xl">
                        {/* Viewport: all slides sit in a row and the track shifts by 100% per step */}
                        <div className="relative overflow-hidden bg-[var(--bg-secondary)]">
                            <div
                                className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                                style={{ transform: `translateX(-${slide * 100}%)` }}
                            >
                                {SHOTS.map((shot, i) => (
                                    <img
                                        key={shot.src}
                                        src={shot.src}
                                        alt={t(shot.captionKey)}
                                        className="w-full shrink-0 object-contain"
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label={t('studio.hub.cards.vietyaku.page.prevShot')}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md transition hover:border-[var(--accent-primary)]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.vietyaku.page.nextShot')}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md transition hover:border-[var(--accent-primary)]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Caption + position */}
                        <div className="flex flex-col gap-3 border-t border-[var(--border-primary)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                                {t(SHOTS[slide].captionKey)}
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-xs font-bold tabular-nums text-[var(--text-tertiary)]">
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
                                            className={`h-2 rounded-full transition-all ${
                                                i === slide
                                                    ? 'w-5 bg-[var(--accent-primary)]'
                                                    : 'w-2 bg-[var(--border-secondary)] hover:bg-[var(--text-tertiary)]'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black">
                        {t('studio.hub.cards.vietyaku.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureOfflineTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureOfflineDesc')}
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureOriginTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureOriginDesc')}
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureLookupTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureLookupDesc')}
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.vietyaku.page.featureRepairTitle')}
                            description={t('studio.hub.cards.vietyaku.page.featureRepairDesc')}
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        />
                    </div>
                </section>

                {/* Requirements */}
                <section className="glass-card mt-12 rounded-3xl p-6 md:p-8">
                    <h2 className="text-xl font-black">
                        {t('studio.hub.cards.vietyaku.page.requirementsHeading')}
                    </h2>
                    <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementOrigin')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementOs')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementAndroid')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementPortable')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementSize')}</li>
                    </ul>
                </section>
            </main>
        </div>
    );
};

export default VietYakuPage;
