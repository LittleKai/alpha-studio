import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../i18n/context';
import {
    VIETYAKU_FALLBACK_RELEASE,
    VIETYAKU_GITHUB_URL,
    getLatestVietYakuRelease,
    type VietYakuReleaseInfo,
} from '../services/vietyakuReleaseService';

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

const VietYakuPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [release, setRelease] = useState<VietYakuReleaseInfo>(VIETYAKU_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);

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

                        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
                            <a
                                href={release.windowsZipUrl}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-3 text-sm font-bold text-[var(--bg-primary)] transition hover:opacity-90"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                {t('studio.hub.cards.vietyaku.page.downloadWindows')}
                            </a>
                            <a
                                href={release.releaseUrl || VIETYAKU_GITHUB_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] px-6 py-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--accent-primary)]"
                            >
                                {t('studio.hub.cards.vietyaku.page.viewGithub')}
                            </a>
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

                {/* Features */}
                <section className="mt-12">
                    <h2 className="mb-6 text-center text-2xl font-black">
                        {t('studio.hub.cards.vietyaku.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-3">
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
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementOs')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementPortable')}</li>
                        <li>• {t('studio.hub.cards.vietyaku.page.requirementSize')}</li>
                    </ul>
                </section>
            </main>
        </div>
    );
};

export default VietYakuPage;
