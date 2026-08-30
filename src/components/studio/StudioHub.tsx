import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import Reveal, { RevealItem } from '../motion/Reveal';
import TextReveal from '../motion/TextReveal';
import { cdnImage } from '../../services/cloudinaryAssets';
import StudioToolTile, { STUDIO_TOOLS, type StudioToolKey } from './StudioToolTile';

/**
 * /studio hub — launcher cinematic đồng bộ ngôn ngữ thiết kế của landing page:
 * hero asymmetric trên nền scene Event Creative City (đổi theo theme), bento
 * công cụ đang mở, và lộ trình các công cụ sắp ra mắt.
 */

// Scene nền hero — cả hai public_id đều có bản master `hq/` trên Cloudinary
const HERO_SCENE = {
    dark: 'event-creative-city/01-event-gate',
    light: 'event-creative-city/concepts/living-storyboard/01-creative-desk',
} as const;

type UpcomingKey = 'generate' | 'edit' | 'interior';
const UPCOMING_TOOLS: { key: UpcomingKey; icon: ReactNode }[] = [
    {
        key: 'generate',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4-4 3 3 5-6 4 5M4 6h16v12H4z" />
            </svg>
        ),
    },
    {
        key: 'edit',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-6M17.5 3.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 8.5-8.5z" />
            </svg>
        ),
    },
    {
        key: 'interior',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V8l8-4 8 4v12M8 20V10h8v10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14h4M10 17h4M8 10h8" />
            </svg>
        ),
    },
];

// Thứ tự hiển thị trong tool rail của hero
const RAIL_ORDER: { key: StudioToolKey | UpcomingKey; to?: string }[] = [
    { key: 'eventLibrary', to: '/studio/event-library' },
    { key: 'skills', to: '/studio/ai-skills' },
    { key: 'crm', to: '/studio/crm/subscription' },
    { key: 'vocab', to: '/studio/vocab' },
    { key: 'vietyaku', to: '/studio/vietyaku' },
    { key: 'generate' },
    { key: 'edit' },
    { key: 'interior' },
];

// Heading section: eyebrow + title, cùng hệ với SectionHeading của landing
const HubSectionHeading = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <Reveal y={20} className="mb-8 space-y-3">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent-primary)]">
            <span className="w-6 h-px bg-[var(--accent-primary)]" aria-hidden="true" />
            {eyebrow}
        </span>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
    </Reveal>
);

export default function StudioHub() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();

    const statItems = [
        { value: '05', label: t('studio.hub.hero.stats.live') },
        { value: '03', label: t('studio.hub.hero.stats.upcoming') },
        { value: '3000+', label: t('studio.hub.hero.stats.skills') },
        { value: '100%', label: t('studio.hub.hero.stats.beta') },
    ];

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            {/* ─── Hero ───────────────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-[var(--border-primary)]">
                <img
                    src={cdnImage(HERO_SCENE[theme], { sizing: 'w_1920' })}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                {/* Lớp phủ đọc chữ — cùng công thức với hero landing */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'linear-gradient(105deg, color-mix(in srgb, var(--bg-primary) 78%, transparent) 0%, color-mix(in srgb, var(--bg-primary) 42%, transparent) 48%, color-mix(in srgb, var(--bg-primary) 12%, transparent) 78%)',
                    }}
                />
                <div
                    className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, var(--bg-primary), transparent)' }}
                />

                <div className="relative container mx-auto px-6 py-16 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                    <Reveal staggerChildren={0.1} delay={0.05} className="lg:col-span-7 space-y-6">
                        <RevealItem y={12}>
                            <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card)] backdrop-blur-md px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-primary)]">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-70 animate-ping" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                                </span>
                                {t('studio.hub.hero.badge')}
                            </span>
                        </RevealItem>

                        <RevealItem tag="h1" y={15} className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight uppercase text-[var(--text-primary)]">
                            <TextReveal text={t('studio.hub.hero.title1')} delay={0.05} />
                            <span className="block text-[var(--accent-primary)]">
                                <TextReveal text={t('studio.hub.hero.title2')} delay={0.25} />
                            </span>
                        </RevealItem>

                        <RevealItem tag="p" y={15} className="text-base md:text-lg leading-relaxed text-[var(--text-secondary)] max-w-[58ch]">
                            {t('studio.hub.hero.subtitle')}
                        </RevealItem>

                        <RevealItem y={15} className="grid grid-cols-2 sm:grid-cols-4 gap-px pt-2 rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--border-primary)] max-w-[620px]">
                            {statItems.map((stat) => (
                                <div key={stat.label} className="bg-[var(--bg-card)] backdrop-blur-md px-4 py-4">
                                    <div className="text-xl md:text-2xl font-black text-[var(--text-primary)] leading-none tabular-nums">{stat.value}</div>
                                    <div className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">{stat.label}</div>
                                </div>
                            ))}
                        </RevealItem>
                    </Reveal>

                    {/* Tool rail — mục lục toàn bộ công cụ, bấm được với công cụ đang mở */}
                    <Reveal y={24} delay={0.25} className="hidden lg:block lg:col-span-5">
                        <div className="ml-auto w-full max-w-[340px] rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-xl p-6 shadow-[var(--glass-shadow)]">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
                                    {t('studio.hub.hero.railLabel')}
                                </span>
                                <span className="text-[10px] font-black tabular-nums text-[var(--accent-primary)]">08</span>
                            </div>
                            <ul className="space-y-1">
                                {RAIL_ORDER.map(({ key, to }) => {
                                    const live = Boolean(to);
                                    const label = t(`studio.hub.cards.${key}.title`);
                                    return (
                                        <li key={key}>
                                            {live ? (
                                                <button
                                                    onClick={() => navigate(to!)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-card-alpha)] focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
                                                >
                                                    <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shadow-[0_0_0_3px_var(--accent-shadow)]" aria-hidden="true" />
                                                    <span className="flex-1 text-sm font-bold text-[var(--text-primary)]">{label}</span>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 text-[var(--text-tertiary)]">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            ) : (
                                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                                                    <span className="w-2 h-2 rounded-full bg-[var(--border-secondary)]" aria-hidden="true" />
                                                    <span className="flex-1 text-sm font-bold text-[var(--text-tertiary)]">{label}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                                                        {t('studio.hub.comingSoon')}
                                                    </span>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                            <p className="mt-4 pt-4 border-t border-[var(--border-primary)] text-xs leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.hero.railNote')}
                            </p>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ─── Công cụ đang mở — bento ────────────────────────────── */}
            <section className="container mx-auto px-6 pt-14 pb-6 max-w-6xl">
                <HubSectionHeading eyebrow={t('studio.hub.sections.activeEyebrow')} title={t('studio.hub.sections.activeTitle')} />

                <Reveal staggerChildren={0.12} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {STUDIO_TOOLS.map((tool) => (
                        <RevealItem key={tool.key} className={tool.span}>
                            <StudioToolTile tool={tool} />
                        </RevealItem>
                    ))}
                </Reveal>
            </section>

            {/* ─── Sắp ra mắt ─────────────────────────────────────────── */}
            <section className="container mx-auto px-6 pt-10 pb-20 max-w-6xl">
                <HubSectionHeading eyebrow={t('studio.hub.sections.upcomingEyebrow')} title={t('studio.hub.sections.upcomingTitle')} />

                <Reveal y={20} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card-alpha)] divide-y divide-[var(--border-primary)]">
                    {UPCOMING_TOOLS.map(({ key, icon }) => (
                        <div key={key} className="flex items-center gap-4 px-5 py-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-tertiary)] flex-shrink-0">
                                {icon}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-[var(--text-primary)]">{t(`studio.hub.cards.${key}.title`)}</h3>
                                <p className="text-sm leading-relaxed text-[var(--text-secondary)] truncate">{t(`studio.hub.cards.${key}.desc`)}</p>
                            </div>
                            <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border border-[var(--border-secondary)] text-[var(--text-secondary)] select-none whitespace-nowrap">
                                {t('studio.hub.comingSoon')}
                            </span>
                        </div>
                    ))}
                </Reveal>
            </section>
        </div>
    );
}
