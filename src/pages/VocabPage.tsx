import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import {
    VOCAB_FALLBACK_RELEASE,
    getLatestVocabRelease,
    type VocabReleaseInfo,
} from '../services/vocabReleaseService';

interface FeatureCardProps {
    title: string;
    description: string;
    tone: string;
    icon: React.ReactNode;
}

const formatReleaseDate = (value: string, locale: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale);
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
    const navigate = useNavigate();
    const [release, setRelease] = useState<VocabReleaseInfo>(VOCAB_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);

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

    const publishedDate = formatReleaseDate(release.publishedAt, language === 'vi' ? 'vi-VN' : 'en-US');
    const releaseMeta = [
        t('studio.hub.cards.vocab.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.vocab.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' - ');

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <button
                onClick={() => navigate('/studio')}
                className="fixed top-20 left-4 z-40 hidden md:inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all"
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
                            <a
                                href="/vocab/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-black text-[var(--text-on-accent)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m5-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                {t('studio.hub.cards.vocab.page.openWebApp')}
                            </a>
                            <a
                                href={release.windowsInstallerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-5 py-3 text-sm font-black text-[var(--text-primary)] transition-all hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-500"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M0 3.45 9.75 2.1v9.45H0V3.45Zm0 9h9.75v9.45L0 20.55v-8.1ZM11.25 1.9 24 0v11.55H11.25V1.9Zm0 10.55H24V24l-12.75-1.9v-9.65Z" />
                                </svg>
                                {t('studio.hub.cards.vocab.page.downloadWindows')}
                            </a>
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
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                                        <p className="text-3xl font-black text-[var(--accent-primary)]">4</p>
                                        <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                            {t('studio.hub.cards.vocab.page.languages')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-4">
                                        <p className="text-3xl font-black text-emerald-400">FSRS</p>
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
            </div>
        </div>
    );
};

export default VocabPage;
