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
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const vocabImages = [
        '/images/vocab/vocab-preview.png',
        '/images/vocab/vocab-preview-1.png',
        '/images/vocab/vocab-preview-2.png',
        '/images/vocab/vocab-preview-3.png',
    ];

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
            {/* Custom Embedded Premium Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .premium-title-gradient {
                    background: linear-gradient(135deg, #ffffff 30%, var(--accent-primary) 70%, var(--accent-secondary) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .spring-bounce {
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease, background-color 0.4s ease;
                }
                .spring-bounce:hover {
                    transform: translateY(-4px) scale(1.025);
                }
                .spring-bounce:active {
                    transform: translateY(-1px) scale(0.98);
                }
                .mockup-window {
                    border: 1px solid var(--border-primary);
                    background: rgba(10, 22, 38, 0.6);
                    box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
                    backdrop-filter: blur(25px);
                    transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s ease;
                }
                .mockup-window:hover {
                    transform: translateY(-6px) scale(1.015);
                    box-shadow: 0 35px 85px -20px rgba(97, 232, 255, 0.15);
                }
                .ambient-glow-reflector {
                    background: radial-gradient(circle, rgba(97, 232, 255, 0.12) 0%, transparent 70%);
                }
                
                /* LIGHT THEME SPECIFIC OVERRIDES */
                html[data-theme="light"] .premium-title-gradient {
                    background: linear-gradient(135deg, #0f172a 30%, #0284c7 70%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                html[data-theme="light"] .mockup-window {
                    background: rgba(255, 255, 255, 0.75);
                    border: 1px solid rgba(15, 75, 112, 0.2);
                    box-shadow: 0 25px 60px -15px rgba(29, 78, 116, 0.12);
                }
                html[data-theme="light"] .mockup-window:hover {
                    box-shadow: 0 35px 80px -20px rgba(2, 132, 199, 0.18);
                }
                html[data-theme="light"] .mockup-window-header {
                    background: rgba(226, 232, 240, 0.7);
                    border-bottom: 1px solid rgba(15, 75, 112, 0.15) !important;
                }
                html[data-theme="light"] .mockup-address-bar {
                    background: rgba(255, 255, 255, 0.8) !important;
                    border: 1px solid rgba(15, 75, 112, 0.16) !important;
                    color: #475569 !important;
                }
                html[data-theme="light"] .ambient-glow-reflector {
                    background: radial-gradient(circle, rgba(2, 132, 199, 0.12) 0%, transparent 70%) !important;
                }
            ` }} />

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
                            <h1 className="text-4xl font-black leading-tight sm:text-5xl premium-title-gradient">
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

                    {/* Widescreen Landscape Mockup Showcase with 3D Ambient Shadow Glow */}
                    <div className="lg:col-span-5 flex justify-center relative">
                        {/* 3D Reflection backlight behind window */}
                        <div className="ambient-glow-reflector absolute inset-0 bg-radial-[circle,rgba(97,232,255,0.12)_0%,transparent_70%] scale-110 blur-xl z-0 pointer-events-none"></div>

                        <div
                            onClick={() => {
                                setActiveImageIndex(0);
                                setShowZoomModal(true);
                            }}
                            className="mockup-window rounded-2xl overflow-hidden cursor-zoom-in w-full max-w-lg aspect-[16/10] relative group z-10 flex flex-col"
                        >
                            {/* Window Header */}
                            <div className="mockup-window-header flex items-center justify-between px-4 py-2.5 bg-black/40 border-b border-[var(--border-primary)]">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
                                </div>
                                <div className="mockup-address-bar text-[10px] font-mono text-[var(--text-tertiary)] bg-black/30 px-5 py-0.5 rounded-full border border-white/5 select-none tracking-wide">
                                    vocabflip.app/studio
                                </div>
                                <div className="w-10"></div>
                            </div>

                            {/* Aspect Ratio Landscape CSS Background Image Cover */}
                            <div 
                                className="flex-1 w-full bg-slate-950 bg-cover bg-center bg-no-repeat relative group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                                style={{ backgroundImage: "url('/images/vocab/vocab-preview.png')" }}
                            >
                                {/* Bottom vignette gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity"></div>

                                {/* Zoom Icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Release Stats & Info Section */}
                <section className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border-primary)] shadow-xl relative overflow-hidden">
                    <div className="absolute right-[-80px] top-[-80px] h-48 w-48 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-[-90px] left-[-70px] h-48 w-48 rounded-full bg-sky-400/5 blur-3xl pointer-events-none" />
                    
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-wider text-[var(--text-tertiary)]">
                                {t('studio.hub.cards.vocab.page.releaseHeading')}
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                                {releaseLoading ? t('studio.hub.cards.vocab.page.releaseLoading') : releaseMeta}
                            </h2>
                            {releaseError && (
                                <p className="text-xs leading-relaxed text-amber-500 max-w-md pt-1">
                                    {t('studio.hub.cards.vocab.page.releaseFallback')}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex flex-wrap gap-4 items-center shrink-0">
                            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-6 py-4 text-center min-w-[120px]">
                                <p className="text-3xl font-black text-[var(--accent-primary)]">4</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                    {t('studio.hub.cards.vocab.page.languages')}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-6 py-4 text-center min-w-[120px]">
                                <p className="text-3xl font-black text-emerald-400">FSRS</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--text-secondary)]">
                                    {t('studio.hub.cards.vocab.page.scheduler')}
                                </p>
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

            {/* Interactive Image Zoom Modal with Gallery */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in-fast cursor-zoom-out"
                    onClick={() => setShowZoomModal(false)}
                >
                    <div 
                        className="relative max-w-4xl w-full flex flex-col gap-4 max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-950 p-4 cursor-default animate-scale-up"
                        onClick={(e) => e.stopPropagation()} // Stop click propagating to close modal
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setShowZoomModal(false)}
                                className="p-2 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/10 spring-bounce cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Active Image */}
                        <div className="flex-1 flex items-center justify-center relative min-h-[300px] max-h-[65vh]">
                            {/* Prev button */}
                            <button
                                onClick={() => setActiveImageIndex((prev) => (prev === 0 ? vocabImages.length - 1 : prev - 1))}
                                className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 spring-bounce cursor-pointer z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <img
                                src={vocabImages[activeImageIndex]}
                                alt={`VocabFlip Preview ${activeImageIndex + 1}`}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                            />

                            {/* Next button */}
                            <button
                                onClick={() => setActiveImageIndex((prev) => (prev === vocabImages.length - 1 ? 0 : prev + 1))}
                                className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 spring-bounce cursor-pointer z-10"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* Gallery Thumbnails */}
                        <div className="flex justify-center gap-3 overflow-x-auto py-2">
                            {vocabImages.map((imgUrl, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-20 aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                                        activeImageIndex === idx 
                                            ? 'border-[var(--accent-primary)] scale-105 shadow-[0_0_10px_rgba(97,232,255,0.4)]' 
                                            : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-102'
                                    }`}
                                >
                                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VocabPage;
