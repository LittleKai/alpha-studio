import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import Reveal, { RevealItem } from '../motion/Reveal';
import TextReveal from '../motion/TextReveal';
import { cdnImage } from '../../services/cloudinaryAssets';

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

type ActiveKey = 'skills' | 'crm' | 'vocab' | 'vietyaku';
type UpcomingKey = 'generate' | 'edit' | 'interior';

interface ActiveTool {
    key: ActiveKey;
    to: string;
    span: string;
    featured?: boolean;
    logo: ReactNode;
    previewImage: string;
    /** Vị trí crop của ảnh preview (mặc định object-top) */
    previewPosition?: string;
}

const ACTIVE_TOOLS: ActiveTool[] = [
    {
        key: 'skills',
        to: '/studio/skills',
        span: 'sm:col-span-3 sm:row-span-2',
        featured: true,
        logo: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[var(--accent-primary)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        ),
        previewImage: '/skills-preview.png',
    },
    {
        key: 'crm',
        to: '/studio/crm/subscription',
        span: 'sm:col-span-2',
        logo: <img src="/crm-logo.png" alt="" className="w-5 h-5 object-contain" />,
        previewImage: '/crm-preview.png',
    },
    {
        key: 'vocab',
        to: '/studio/vocab',
        span: 'sm:col-span-2',
        logo: <img src="/vocab/icons/Icon-192.png" alt="" className="w-5 h-5 object-contain rounded" />,
        previewImage: '/images/vocab/vocab-preview.png',
    },
    {
        key: 'vietyaku',
        to: '/studio/vietyaku',
        span: 'sm:col-span-5',
        logo: <img src="/vietyaku-logo.png" alt="" className="w-5 h-5 object-contain rounded" />,
        previewImage: '/images/vietyaku/vietyaku-preview.png',
        // Ảnh 512×512 trên tile full-width: crop giữa để không chỉ thấy nền trắng
        previewPosition: 'object-center',
    },
];

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
const RAIL_ORDER: { key: ActiveKey | UpcomingKey; to?: string }[] = [
    { key: 'skills', to: '/studio/skills' },
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
        { value: '04', label: t('studio.hub.hero.stats.live') },
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
                                <span className="text-[10px] font-black tabular-nums text-[var(--accent-primary)]">07</span>
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

                <Reveal staggerChildren={0.12} className="grid grid-cols-1 sm:grid-cols-5 gap-4 auto-rows-[230px] md:auto-rows-[250px]">
                    {ACTIVE_TOOLS.map((tool) => (
                        <RevealItem key={tool.key} className={tool.span}>
                            <Link
                                to={tool.to}
                                className="group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] transition-colors duration-300 hover:border-[var(--accent-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
                            >
                                <img
                                    src={tool.previewImage}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    className={`absolute inset-0 w-full h-full object-cover ${tool.previewPosition || 'object-top'} transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]`}
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ background: 'linear-gradient(to top, color-mix(in srgb, var(--bg-primary) 94%, transparent) 0%, color-mix(in srgb, var(--bg-primary) 62%, transparent) 42%, transparent 72%)' }}
                                />

                                {/* Chip logo + Beta */}
                                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-md">
                                        {tool.logo}
                                    </span>
                                    <span className="px-2 py-1 text-[9px] font-extrabold bg-[var(--bg-card)] backdrop-blur-md text-amber-500 border border-amber-500/30 rounded-md uppercase tracking-widest leading-none select-none">
                                        Beta
                                    </span>
                                </div>

                                <div className="relative p-5 md:p-6 space-y-2">
                                    <h3 className={`font-black tracking-tight text-[var(--text-primary)] ${tool.featured ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                                        {t(`studio.hub.cards.${tool.key}.title`)}
                                    </h3>
                                    <p className={`text-sm leading-relaxed text-[var(--text-secondary)] ${tool.featured ? 'max-w-[52ch]' : 'line-clamp-2'}`}>
                                        {t(`studio.hub.cards.${tool.key}.desc`)}
                                    </p>
                                    <div className="flex items-center justify-between gap-4 pt-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                                            {t(`studio.hub.meta.${tool.key}`)}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--accent-primary)] whitespace-nowrap">
                                            {t('studio.hub.open')}
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
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
