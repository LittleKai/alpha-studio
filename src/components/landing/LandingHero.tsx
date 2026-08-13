import React, { useCallback, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import Reveal, { RevealItem } from '../motion/Reveal';
import HoverSpring from '../motion/HoverSpring';
import TextReveal from '../motion/TextReveal';
import HeroCinemaVideo from './HeroCinemaVideo';

interface LandingHeroProps {
    stats: { courses: number; students: number; partners: number };
    onExploreStudio: () => void;
    onOpenGpuServer: () => void;
}

const JOURNEY_KEYS = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'] as const;

const LandingHero: React.FC<LandingHeroProps> = ({ stats, onExploreStudio, onOpenGpuServer }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [activeClip, setActiveClip] = useState(0);

    const handleClipChange = useCallback((index: number) => setActiveClip(index), []);

    const statItems = [
        { value: stats.courses > 0 ? `${stats.courses}+` : '—', label: t('landing.hero.stats.courses') },
        { value: stats.students > 0 ? `${stats.students}+` : '—', label: t('landing.hero.stats.students') },
        { value: stats.partners > 0 ? `${stats.partners}+` : '—', label: t('landing.hero.stats.partners') },
        { value: 'RTX 4090', label: t('landing.hero.stats.gpu') },
    ];

    return (
        // 60px = chiều cao nav sticky, trừ đi để hero vừa đúng một màn hình
        <section className="relative w-full min-h-[calc(100dvh-60px)] flex items-center overflow-hidden border-b border-[var(--border-primary)] bg-[var(--bg-primary)]">
            <HeroCinemaVideo
                key={theme}
                theme={theme}
                onClipChange={handleClipChange}
                stillAlt={t('landing.hero.videoAlt')}
            />

            {/* Lớp phủ đọc chữ — bám theo --bg-primary nên tự đảo màu giữa hai theme */}
            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background: 'linear-gradient(105deg, var(--bg-primary) 0%, color-mix(in srgb, var(--bg-primary) 82%, transparent) 38%, color-mix(in srgb, var(--bg-primary) 24%, transparent) 72%, transparent 100%)',
                }}
            />
            <div
                className="absolute inset-x-0 bottom-0 h-48 z-[1] pointer-events-none"
                style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent)' }}
            />

            <div className="relative z-10 container mx-auto px-6 py-24 md:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Cột nội dung */}
                <Reveal staggerChildren={0.1} delay={0.05} className="lg:col-span-7 space-y-7">
                    <RevealItem y={12}>
                        <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card)] backdrop-blur-md px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-primary)]">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-70 animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                            </span>
                            {t('landing.hero.badge')}
                        </span>
                    </RevealItem>

                    <RevealItem tag="h1" y={15} className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight text-[var(--text-primary)] uppercase">
                        <TextReveal text={t('landing.hero.title1')} delay={0.05} />
                        <span className="block text-[var(--accent-primary)]">
                            <TextReveal text={t('landing.hero.title2')} delay={0.25} />
                        </span>
                    </RevealItem>

                    <RevealItem tag="p" y={15} className="text-base md:text-lg leading-relaxed text-[var(--text-secondary)] max-w-[58ch]">
                        {t('landing.hero.subtitle')}
                    </RevealItem>

                    <RevealItem y={15} className="flex flex-wrap gap-4 pt-1">
                        <HoverSpring scale={1.03} y={-2} className="inline-block">
                            <button
                                onClick={onExploreStudio}
                                className="py-3.5 px-8 font-black text-xs md:text-sm rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] tracking-wider uppercase transition-all duration-300 cursor-pointer shadow-[0_12px_32px_var(--accent-shadow)] hover:bg-[var(--accent-primary-hover)] active:scale-[0.98]"
                            >
                                {t('landing.hero.exploreStudio')}
                            </button>
                        </HoverSpring>
                        <HoverSpring scale={1.03} y={-2} className="inline-block">
                            <button
                                onClick={onOpenGpuServer}
                                className="py-3.5 px-8 font-black text-xs md:text-sm rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card-alpha)] backdrop-blur-md text-[var(--text-primary)] tracking-wider uppercase transition-all duration-300 cursor-pointer hover:border-[var(--accent-primary)] active:scale-[0.98]"
                            >
                                {t('landing.hero.gpuServer')}
                            </button>
                        </HoverSpring>
                    </RevealItem>

                    <RevealItem y={15} className="grid grid-cols-2 sm:grid-cols-4 gap-px pt-4 rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--border-primary)] max-w-[620px]">
                        {statItems.map((stat) => (
                            <div key={stat.label} className="bg-[var(--bg-card)] backdrop-blur-md px-4 py-4">
                                <div className="text-xl md:text-2xl font-black text-[var(--text-primary)] leading-none">{stat.value}</div>
                                <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{stat.label}</div>
                            </div>
                        ))}
                    </RevealItem>
                </Reveal>

                {/* Rail hành trình — bám theo clip đang chiếu */}
                <Reveal y={24} delay={0.25} className="hidden lg:block lg:col-span-5">
                    <div className="ml-auto w-full max-w-[340px] rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-xl p-6 shadow-[var(--glass-shadow)]">
                        <div className="flex items-center justify-between mb-5">
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                                {t('landing.hero.journeyLabel')}
                            </span>
                            <span className="text-[10px] font-black tabular-nums text-[var(--accent-primary)]">
                                {String(activeClip + 1).padStart(2, '0')} / {String(JOURNEY_KEYS.length).padStart(2, '0')}
                            </span>
                        </div>

                        <ol className="relative space-y-1">
                            <span className="absolute left-[5px] top-2 bottom-2 w-px bg-[var(--border-primary)]" aria-hidden="true" />
                            {JOURNEY_KEYS.map((key, index) => {
                                const isActive = index === activeClip;
                                return (
                                    <li
                                        key={key}
                                        className="relative flex items-center gap-4 pl-6 py-1.5 transition-transform duration-500"
                                        style={{ transform: isActive ? 'translateX(4px)' : 'none' }}
                                    >
                                        <span
                                            className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
                                            style={{
                                                width: isActive ? '11px' : '7px',
                                                height: isActive ? '11px' : '7px',
                                                marginLeft: isActive ? '0px' : '2px',
                                                background: isActive ? 'var(--accent-primary)' : 'var(--border-secondary)',
                                                boxShadow: isActive ? '0 0 0 4px var(--accent-shadow)' : 'none',
                                            }}
                                            aria-hidden="true"
                                        />
                                        <span
                                            className="text-sm font-bold transition-colors duration-500"
                                            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                                        >
                                            {t(`landing.hero.journey.${key}`)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ol>

                        <p className="mt-5 pt-4 border-t border-[var(--border-primary)] text-xs leading-relaxed text-[var(--text-secondary)]">
                            {t('landing.hero.journeyNote')}
                        </p>
                    </div>
                </Reveal>
            </div>

            {/* Gợi ý cuộn */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-3 select-none pointer-events-none">
                <span className="px-3 py-1 rounded-full bg-[var(--bg-card)] backdrop-blur-md text-[10px] font-black tracking-[0.3em] uppercase text-[var(--text-secondary)]">
                    {t('landing.hero.scrollDown')}
                </span>
                <span className="w-6 h-10 rounded-full border-2 border-[var(--border-secondary)] bg-[var(--bg-card-alpha)] backdrop-blur-md flex justify-center p-1.5">
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"
                        style={{ animation: 'hero-scroll-dot 1.8s cubic-bezier(0.16, 1, 0.3, 1) infinite' }}
                    />
                </span>
            </div>
        </section>
    );
};

export default LandingHero;
