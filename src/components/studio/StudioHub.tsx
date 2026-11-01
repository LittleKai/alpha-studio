import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';
import { useTheme } from '../../theme/context';
import Reveal, { RevealItem } from '../motion/Reveal';
import TextReveal from '../motion/TextReveal';
import { cdnImage } from '../../services/cloudinaryAssets';
import StudioToolTile, { STUDIO_TOOLS } from './StudioToolTile';
import { STUDIO_TOOLS_ANCHOR } from './StudioBackButton';
import SEOHead from '../ui/SEOHead';
import { buildBreadcrumbJsonLd } from '../../utils/seoMeta';

/**
 * /studio hub — launcher cinematic đồng bộ ngôn ngữ thiết kế của landing page:
 * hero asymmetric trên nền scene Event Creative City (đổi theo theme) và bento
 * công cụ đang mở.
 */

// Scene nền hero — cả hai public_id đều có bản master `hq/` trên Cloudinary
const HERO_SCENE = {
    dark: 'event-creative-city/01-event-gate',
    light: 'event-creative-city/concepts/living-storyboard/01-creative-desk',
} as const;

// Heading section: tiêu đề chính đặt trước, chỉ báo trạng thái đặt bên phải
const HubSectionHeading = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <Reveal y={20} className="mb-8 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] text-balance">{title}</h2>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" aria-hidden="true" />
            {eyebrow}
        </span>
    </Reveal>
);

export default function StudioHub() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const { hash } = useLocation();

    // Quay lại từ trang con công cụ (#studio-tools) → cuộn thẳng tới bento
    // công cụ. Hoãn một frame vì <ScrollToTop> của App reset scroll khi đổi route.
    useEffect(() => {
        if (hash !== `#${STUDIO_TOOLS_ANCHOR}`) return;
        const id = requestAnimationFrame(() => {
            document.getElementById(STUDIO_TOOLS_ANCHOR)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => cancelAnimationFrame(id);
    }, [hash]);

    const statItems = [
        { value: '06', label: t('studio.hub.hero.stats.live') },
        { value: '3000+', label: t('studio.hub.hero.stats.skills') },
        { value: '35+', label: t('studio.hub.hero.stats.effects') },
        { value: '100%', label: t('studio.hub.hero.stats.beta') },
    ];

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <SEOHead
                title={t('studio.hub.hero.title1')}
                description={t('studio.hub.hero.subtitle')}
                path="/studio"
                jsonLd={[
                    { '@context': 'https://schema.org', '@type': 'CollectionPage', name: t('studio.hub.hero.title1'), url: 'https://giaiphapsangtao.com/studio' },
                    buildBreadcrumbJsonLd([{ name: t('common.home'), path: '/' }, { name: 'Studio', path: '/studio' }]),
                ]}
            />
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

                <div className="relative container mx-auto px-6 py-14 md:py-18 max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <Reveal staggerChildren={0.1} delay={0.05} className="lg:col-span-7 space-y-6">
                        <RevealItem y={12}>
                            <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border-secondary)] bg-[var(--bg-card)] backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
                                <span className="relative flex h-2 w-2" aria-hidden="true">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-70 animate-ping" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-primary)]" />
                                </span>
                                {t('studio.hub.hero.badge')}
                            </span>
                        </RevealItem>

                        <RevealItem tag="h1" y={15} className="text-4xl md:text-6xl font-extrabold leading-[1.06] tracking-tight uppercase text-[var(--text-primary)] text-balance">
                            <TextReveal text={t('studio.hub.hero.title1')} delay={0.05} />
                            <span className="block text-[var(--accent-primary)]">
                                <TextReveal text={t('studio.hub.hero.title2')} delay={0.25} />
                            </span>
                        </RevealItem>

                        <RevealItem tag="p" y={15} className="text-base md:text-lg leading-relaxed text-[var(--text-secondary)] max-w-[56ch]">
                            {t('studio.hub.hero.subtitle')}
                        </RevealItem>

                        <RevealItem y={15} className="grid grid-cols-2 sm:grid-cols-4 gap-px pt-2 rounded-2xl overflow-hidden border border-[var(--border-primary)] bg-[var(--border-primary)] max-w-[620px]">
                            {statItems.map((stat) => (
                                <div key={stat.label} className="bg-[var(--bg-card)] backdrop-blur-md px-4 py-4">
                                    <div className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] leading-none tabular-nums">{stat.value}</div>
                                    <div className="mt-1.5 text-xs font-semibold text-[var(--text-secondary)]">{stat.label}</div>
                                </div>
                            ))}
                        </RevealItem>
                    </Reveal>

                    {/* Tool rail — mục lục 6 công cụ đang mở, đồng bộ thứ tự với Bento */}
                    <Reveal y={24} delay={0.25} className="hidden lg:block lg:col-span-5">
                        <div className="ml-auto w-full max-w-[380px] rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] backdrop-blur-xl p-6 shadow-[var(--glass-shadow)]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                                    {t('studio.hub.hero.railLabel')}
                                </span>
                                <span className="text-xs font-extrabold tabular-nums text-[var(--accent-primary)]">
                                    {String(STUDIO_TOOLS.length).padStart(2, '0')}
                                </span>
                            </div>
                            <ul className="space-y-1">
                                {STUDIO_TOOLS.map(({ key, index, to, logo, accent }) => {
                                    const label = t(`studio.hub.cards.${key}.title`);
                                    const accentText = theme === 'dark' ? accent.textDark : accent.textLight;
                                    return (
                                        <li key={key}>
                                            <button
                                                type="button"
                                                onClick={() => navigate(to)}
                                                className="w-full min-h-[44px] flex items-center gap-3 px-2.5 py-1.5 rounded-xl text-left cursor-pointer transition-[background-color,transform] duration-200 hover:bg-[var(--bg-card-alpha)] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]"
                                            >
                                                <span className={`inline-flex items-center justify-center w-8 h-8 p-1 flex-shrink-0 rounded-lg border ${accent.chip} ${accentText}`}>
                                                    {logo}
                                                </span>
                                                <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{label}</span>
                                                <span className="text-xs font-extrabold tabular-nums text-[var(--text-secondary)]">{index}</span>
                                                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 flex-shrink-0 text-[var(--text-secondary)]">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
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
            {/* id = neo cho nút "Về Studio" của mọi trang con công cụ */}
            <section id={STUDIO_TOOLS_ANCHOR} className="container mx-auto px-6 pt-14 pb-20 max-w-6xl scroll-mt-24">
                <HubSectionHeading eyebrow={t('studio.hub.sections.activeEyebrow')} title={t('studio.hub.sections.activeTitle')} />

                <Reveal staggerChildren={0.12} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {STUDIO_TOOLS.map((tool) => (
                        <RevealItem key={tool.key} className={tool.span}>
                            <StudioToolTile tool={tool} />
                        </RevealItem>
                    ))}
                </Reveal>
            </section>
        </div>
    );
}
