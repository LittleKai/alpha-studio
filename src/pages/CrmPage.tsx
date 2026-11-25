import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import {
    getCrmSubscription,
    createCrmCheckout,
    listCrmBillingOrders,
    getLatestCrmRelease,
    formatCurrency,
    type CrmSubscription,
    type CrmBillingOrder,
    type CrmReleaseInfo,
} from '../services/crmService';
import { trackToolDownload } from '../services/toolDownloadService';
import {
    CRM_MONTHLY_RENEWAL_PLAN,
    buildRenewalConfirmationDetails,
} from './crmSubscriptionRenewal';
import StudioBackButton from '../components/studio/StudioBackButton';
import SEOHead from '../components/ui/SEOHead';
import { buildBreadcrumbJsonLd } from '../utils/seoMeta';

const Login = lazy(() => import('../components/ui/Login'));

const CRM_FALLBACK_RELEASE: CrmReleaseInfo = {
    version: '0.4.0',
    windowsInstallerUrl: 'https://download.giaiphapsangtao.com/file/alpha-studio/crm-app/releases/alpha-crm-windows-v0.4.0.zip',
    androidApkUrl: 'https://download.giaiphapsangtao.com/file/alpha-studio/crm-app/releases/alpha-crm-v0.4.0.apk',
    publishedAt: '2026-11-18T20:00:18.805Z',
};

const SHOTS = [
    { src: '/images/crm/crm-dashboard.png', captionKey: 'studio.hub.cards.crm.page.shot1' },
    { src: '/images/crm/crm-customers.png', captionKey: 'studio.hub.cards.crm.page.shot2' },
    { src: '/images/crm/crm-bulk.png', captionKey: 'studio.hub.cards.crm.page.shot3' },
    { src: '/images/crm/crm-chatbot.png', captionKey: 'studio.hub.cards.crm.page.shot4' },
];

interface CrmProductSelection {
    id: string;
    name: string;
    priceVnd: number;
    priceCredits: number;
    type: 'plan' | 'addon';
}

interface FeatureCardProps {
    title: string;
    description: string;
    tone: string;
    titleColor: string;
    icon: React.ReactNode;
}

const formatReleaseDate = (value: string, locale: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale);
};

const formatFileSize = (bytes?: number): string => {
    if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, tone, titleColor, icon }) => (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 transition-transform duration-200 hover:-translate-y-0.5">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${tone}`}>
            {icon}
        </div>
        <h3 className={`text-base font-extrabold tracking-tight ${titleColor}`}>{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
    </div>
);

const CrmPage: React.FC = () => {
    const { t, language } = useTranslation();
    const { user, isAuthenticated, refreshUser } = useAuth();
    const { hash } = useLocation();
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    // Release state
    const [release, setRelease] = useState<CrmReleaseInfo>(CRM_FALLBACK_RELEASE);
    const [releaseLoading, setReleaseLoading] = useState(true);
    const [releaseError, setReleaseError] = useState(false);

    // Slideshow & lightbox state
    const [slide, setSlide] = useState(0);
    const [showZoomModal, setShowZoomModal] = useState(false);

    // Subscription & billing state
    const [sub, setSub] = useState<CrmSubscription | null>(null);
    const [orders, setOrders] = useState<CrmBillingOrder[]>([]);
    const [subLoading, setSubLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auth & checkout modal state
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [pendingProduct, setPendingProduct] = useState<CrmProductSelection | null>(null);
    const [showRenewalConfirmModal, setShowRenewalConfirmModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<CrmProductSelection | null>(null);
    const [checkoutResponse, setCheckoutResponse] = useState<{
        order: CrmBillingOrder;
        qrCodeUrl?: string;
        bankInfo?: { bankName?: string; accountHolder?: string; accountNumber?: string };
    } | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [countdown, setCountdown] = useState(5 * 60);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const goPrev = useCallback(() => setSlide((i) => (i - 1 + SHOTS.length) % SHOTS.length), []);
    const goNext = useCallback(() => setSlide((i) => (i + 1) % SHOTS.length), []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'Escape') {
                setShowZoomModal(false);
                setShowRenewalConfirmModal(false);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goPrev, goNext]);

    // Smooth scroll to anchor when redirected from /studio/crm/subscription -> /studio/crm#subscription
    useEffect(() => {
        if (!hash) return;
        const targetId = hash.replace(/^#/, '');
        const id = requestAnimationFrame(() => {
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        return () => cancelAnimationFrame(id);
    }, [hash]);

    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const loadRelease = useCallback(async () => {
        try {
            setReleaseLoading(true);
            setReleaseError(false);
            const data = await getLatestCrmRelease();
            setRelease(data || CRM_FALLBACK_RELEASE);
        } catch (err) {
            console.error('Failed to load CRM release metadata:', err);
            setRelease(CRM_FALLBACK_RELEASE);
            setReleaseError(true);
        } finally {
            setReleaseLoading(false);
        }
    }, []);

    const loadSubscription = useCallback(async () => {
        if (!isAuthenticated) {
            setSub(null);
            setSubLoading(false);
            return;
        }
        try {
            setSubLoading(true);
            setSub(await getCrmSubscription());
        } catch (err) {
            console.error('Failed to load CRM subscription status:', err);
        } finally {
            setSubLoading(false);
        }
    }, [isAuthenticated]);

    const loadOrders = useCallback(async () => {
        if (!isAuthenticated) {
            setOrders([]);
            setOrdersLoading(false);
            return;
        }
        try {
            setOrdersLoading(true);
            setOrders(await listCrmBillingOrders());
        } catch (err: any) {
            console.error('Failed to load CRM billing orders:', err);
            setError(err?.message || t('studio.hub.cards.crm.subscription.loadError'));
        } finally {
            setOrdersLoading(false);
        }
    }, [isAuthenticated, t]);

    useEffect(() => {
        loadRelease();
    }, [loadRelease]);

    useEffect(() => {
        if (isAuthenticated) {
            setError(null);
            loadSubscription();
            loadOrders();
        } else {
            setSub(null);
            setOrders([]);
        }
    }, [isAuthenticated, loadSubscription, loadOrders]);

    const startCountdown = useCallback(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(5 * 60);
        countdownRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setShowCheckoutModal(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const openProductFlow = useCallback((product: CrmProductSelection) => {
        setSelectedProduct(product);
        setCheckoutResponse(null);
        setError(null);
        if (product.id === CRM_MONTHLY_RENEWAL_PLAN.productId) {
            setShowRenewalConfirmModal(true);
            return;
        }
        setShowCheckoutModal(true);
    }, []);

    const handleSelectProduct = useCallback((product: CrmProductSelection) => {
        if (!isAuthenticated) {
            setPendingProduct(product);
            setShowLoginDialog(true);
            return;
        }
        openProductFlow(product);
    }, [isAuthenticated, openProductFlow]);

    const handleLoginSuccess = useCallback(() => {
        setShowLoginDialog(false);
        if (pendingProduct) {
            const product = pendingProduct;
            setPendingProduct(null);
            openProductFlow(product);
        }
    }, [pendingProduct, openProductFlow]);

    const handleContinueRenewalCheckout = () => {
        setShowRenewalConfirmModal(false);
        setShowCheckoutModal(true);
    };

    const handleCheckout = async (method: 'credit' | 'bank_transfer') => {
        if (!selectedProduct) return;
        setActionLoading(method);
        setError(null);

        try {
            const balanceCredits = Number(user?.balance || 0);
            if (
                method === 'credit' &&
                selectedProduct.id === CRM_MONTHLY_RENEWAL_PLAN.productId &&
                balanceCredits < selectedProduct.priceCredits
            ) {
                throw new Error(
                    t('studio.hub.cards.crm.subscription.renewInsufficientCredits')
                        .replace('{{missing}}', String(selectedProduct.priceCredits - balanceCredits)),
                );
            }

            const res = await createCrmCheckout({
                productId: selectedProduct.id,
                paymentMethod: method,
            });
            setCheckoutResponse(res);

            if (method === 'credit') {
                setShowCheckoutModal(false);
                setSelectedProduct(null);
                setCheckoutResponse(null);
                refreshUser();
                loadOrders();
                loadSubscription();
            } else {
                startCountdown();
            }
        } catch (err: any) {
            setError(err?.message || t('studio.hub.cards.crm.subscription.checkoutError'));
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch {
            // Fallback silent ignore if clipboard blocked
        }
    };

    const closeCheckout = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setShowCheckoutModal(false);
        setSelectedProduct(null);
        setCheckoutResponse(null);
        setCopiedCode(false);
        if (isAuthenticated) {
            loadOrders();
            loadSubscription();
        }
    };

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Derived release strings
    const publishedDate = formatReleaseDate(release.publishedAt, locale);
    const windowsSizeLabel = formatFileSize(release.windowsSize);
    const releaseMeta = [
        t('studio.hub.cards.crm.page.releaseVersion').replace('{{version}}', release.version),
        publishedDate ? t('studio.hub.cards.crm.page.releaseDate').replace('{{date}}', publishedDate) : '',
    ].filter(Boolean).join(' · ');

    // Derived subscription metrics (safe against NaN)
    const isTrial = sub?.entitlementType === 'trial' || sub?.plan === 'crm_trial';
    const includedLimit = Number((sub?.includedAiLimit ?? 0).toFixed(2));
    const includedUsed = Number((sub?.includedAiUsed ?? 0).toFixed(2));
    const extraAi = Number((sub?.extraAiRemaining ?? 0).toFixed(2));
    const includedRemaining = Number(Math.max(0, includedLimit - includedUsed).toFixed(2));
    const totalRemaining = Number((includedRemaining + extraAi).toFixed(2));
    const includedPct = includedLimit > 0 ? Math.min(100, (includedUsed / includedLimit) * 100) : 0;
    const userCreditBalance = Number(user?.balance || 0);
    const renewalDetails = buildRenewalConfirmationDetails(userCreditBalance);

    const monthlyPlanSelection: CrmProductSelection = {
        id: CRM_MONTHLY_RENEWAL_PLAN.productId,
        name: t('studio.hub.cards.crm.subscription.monthlyPlanName'),
        priceVnd: CRM_MONTHLY_RENEWAL_PLAN.priceVnd,
        priceCredits: CRM_MONTHLY_RENEWAL_PLAN.priceCredits,
        type: 'plan',
    };

    const addonPacks: Array<{
        product: CrmProductSelection;
        amountLabel: string;
        priceVndDisplay: string;
        priceCreditsDisplay: string;
        descKey: string;
        popular?: boolean;
        accentTone: string;
        titleColor: string;
    }> = [
        {
            product: {
                id: 'crm_ai_pack_100',
                name: t('studio.hub.cards.crm.subscription.addonPack100Name'),
                priceVnd: 50000,
                priceCredits: 500,
                type: 'addon',
            },
            amountLabel: '500 Cr',
            priceVndDisplay: '50.000',
            priceCreditsDisplay: '500',
            descKey: 'studio.hub.cards.crm.subscription.addonPack100Desc',
            accentTone: 'bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-300',
            titleColor: 'text-sky-700 dark:text-sky-300',
        },
        {
            product: {
                id: 'crm_ai_pack_500',
                name: t('studio.hub.cards.crm.subscription.addonPack500Name'),
                priceVnd: 200000,
                priceCredits: 2000,
                type: 'addon',
            },
            amountLabel: '2.200 Cr',
            priceVndDisplay: '200.000',
            priceCreditsDisplay: '2000',
            descKey: 'studio.hub.cards.crm.subscription.addonPack500Desc',
            popular: true,
            accentTone: 'bg-blue-500/10 border-blue-500/25 text-blue-700 dark:text-blue-300',
            titleColor: 'text-blue-700 dark:text-blue-300',
        },
        {
            product: {
                id: 'crm_ai_pack_1000',
                name: t('studio.hub.cards.crm.subscription.addonPack1000Name'),
                priceVnd: 350000,
                priceCredits: 3500,
                type: 'addon',
            },
            amountLabel: '4.000 Cr',
            priceVndDisplay: '350.000',
            priceCreditsDisplay: '3500',
            descKey: 'studio.hub.cards.crm.subscription.addonPack1000Desc',
            accentTone: 'bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-300',
            titleColor: 'text-teal-700 dark:text-teal-300',
        },
    ];

    const timelineSteps = [
        {
            title: t('studio.hub.cards.crm.subscription.timelineStep1Title'),
            desc: t('studio.hub.cards.crm.subscription.timelineStep1Desc'),
        },
        {
            title: t('studio.hub.cards.crm.subscription.timelineStep2Title'),
            desc: t('studio.hub.cards.crm.subscription.timelineStep2Desc'),
        },
        {
            title: t('studio.hub.cards.crm.subscription.timelineStep3Title'),
            desc: t('studio.hub.cards.crm.subscription.timelineStep3Desc'),
        },
        {
            title: t('studio.hub.cards.crm.subscription.timelineStep4Title'),
            desc: t('studio.hub.cards.crm.subscription.timelineStep4Desc'),
        },
    ];

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-x-hidden">
            <SEOHead
                title="Alpha CRM"
                description={t('studio.hub.cards.crm.desc')}
                path="/studio/crm"
                jsonLd={[
                    {
                        '@context': 'https://schema.org',
                        '@type': 'SoftwareApplication',
                        name: 'Alpha CRM',
                        applicationCategory: 'BusinessApplication',
                        operatingSystem: 'Windows, Android',
                        softwareVersion: release.version,
                        url: 'https://giaiphapsangtao.com/studio/crm',
                    },
                    buildBreadcrumbJsonLd([
                        { name: t('common.home'), path: '/' },
                        { name: 'Studio', path: '/studio' },
                        { name: 'Alpha CRM', path: '/studio/crm' },
                    ]),
                ]}
            />

            <StudioBackButton />

            <main className="container mx-auto max-w-6xl px-4 sm:px-6 pt-12 pb-20 relative z-10 space-y-14">
                {/* ─── Hero & Download Box ────────────────────────────────────────── */}
                <section className="space-y-8">
                    <header className="flex flex-col items-center gap-5 text-center">
                        <img
                            src="/crm-logo.webp"
                            alt="Alpha CRM"
                            className="h-20 w-20 rounded-2xl border border-sky-500/25 bg-[var(--bg-card)] p-1.5 object-contain shadow-md"
                        />
                        <div className="space-y-3">
                            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] flex items-center justify-center gap-3 flex-wrap text-balance">
                                <span>{t('studio.hub.cards.crm.page.title')}</span>
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 rounded-md uppercase tracking-wider select-none leading-normal">
                                    {t('studio.hub.cards.crm.page.betaBadge')}
                                </span>
                            </h1>
                            <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-[var(--text-secondary)]">
                                {t('studio.hub.cards.crm.page.subtitle')}
                            </p>
                        </div>
                    </header>

                    {/* Release & Download Console */}
                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 md:p-7 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-500/20 bg-sky-500/[0.06] px-4 py-2.5 text-xs font-bold tracking-wide text-sky-700 dark:text-sky-300">
                            <div className="flex items-center gap-2 tabular-nums">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                <span>
                                    {releaseLoading
                                        ? t('studio.hub.cards.crm.page.releaseLoading')
                                        : releaseMeta}
                                </span>
                            </div>
                            {releaseError && (
                                <button
                                    type="button"
                                    onClick={loadRelease}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-[var(--bg-card)] px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:text-sky-300 hover:border-sky-500 transition-colors cursor-pointer"
                                >
                                    <span>{t('studio.hub.cards.crm.subscription.retryBtn')}</span>
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1.5">
                                <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                    {t('studio.hub.cards.crm.page.downloadTitle')}
                                </h2>
                                <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
                                    {t('studio.hub.cards.crm.page.downloadDesc')}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <a
                                    href={release.windowsInstallerUrl}
                                    onClick={() => trackToolDownload('crm', 'windows', release.version)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 px-5 py-3 text-sm font-bold text-white transition-colors shadow-sm whitespace-nowrap"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                                    </svg>
                                    <span>
                                        {t('studio.hub.cards.crm.page.downloadWindows')}
                                        {!releaseLoading && (
                                            <span className="ml-1.5 text-xs font-semibold text-sky-100 tabular-nums">
                                                v{release.version}{windowsSizeLabel ? ` · ${windowsSizeLabel}` : ''}
                                            </span>
                                        )}
                                    </span>
                                </a>

                                {release.androidApkUrl && (
                                    <a
                                        href={release.androidApkUrl}
                                        onClick={() => trackToolDownload('crm', 'android', release.version)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-sky-600 px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-colors whitespace-nowrap"
                                    >
                                        <svg className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z" />
                                        </svg>
                                        <span>{t('studio.hub.cards.crm.page.downloadAndroid')}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/25 uppercase tracking-wider leading-none">
                                            {t('studio.hub.cards.crm.page.demoBadge')}
                                        </span>
                                    </a>
                                )}

                                <button
                                    type="button"
                                    onClick={() => scrollToSection('subscription')}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-600/35 bg-[var(--bg-card)] hover:border-sky-600 px-4 py-3 text-sm font-bold text-sky-700 dark:text-sky-300 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    <span>{t('studio.hub.cards.crm.page.manageSubscription')}</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex items-start gap-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                            <svg className="h-4 w-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{t('studio.hub.cards.crm.page.downloadAndroidNotice')}</span>
                        </div>

                        {releaseError && (
                            <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                                {t('studio.hub.cards.crm.page.releaseFallback')}
                            </p>
                        )}

                        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                            {t('studio.hub.cards.crm.page.updateNote')}
                        </p>
                    </div>
                </section>

                {/* ─── Screenshots Carousel ───────────────────────────────────────── */}
                <section className="space-y-5">
                    <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                        {t('studio.hub.cards.crm.page.screenshotsHeading')}
                    </h2>

                    <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-lg relative">
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
                                        className="w-full shrink-0 object-contain max-h-[540px]"
                                        loading={i === 0 ? 'eager' : 'lazy'}
                                        decoding="async"
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label={t('studio.hub.cards.crm.page.prevShot')}
                                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white backdrop-blur-md transition hover:border-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.crm.page.nextShot')}
                                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-slate-950/70 text-white backdrop-blur-md transition hover:border-sky-400 hover:text-sky-300 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-[var(--border-primary)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between bg-[var(--bg-card)]">
                            <p className="text-sm font-medium leading-relaxed text-[var(--text-primary)]">
                                {t(SHOTS[slide].captionKey)}
                            </p>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className="text-xs font-bold tabular-nums text-sky-700 dark:text-sky-300">
                                    {slide + 1} / {SHOTS.length}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {SHOTS.map((shot, i) => (
                                        <button
                                            key={shot.src}
                                            type="button"
                                            onClick={() => setSlide(i)}
                                            aria-label={`${t('studio.hub.cards.crm.page.screenshotsHeading')} ${i + 1}`}
                                            aria-current={i === slide}
                                            className={`h-2 rounded-full transition-all cursor-pointer ${
                                                i === slide
                                                    ? 'w-6 bg-sky-600 dark:bg-sky-400'
                                                    : 'w-2 bg-[var(--border-secondary)] hover:bg-[var(--text-tertiary)]'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Merged Subscription, AI Credits & Billing Workspace ───────── */}
                <section id="subscription" className="scroll-mt-24 space-y-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="space-y-1.5">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                                {t('studio.hub.cards.crm.page.pricingHeading')}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
                                {t('studio.hub.cards.crm.page.pricingDesc')}
                            </p>
                        </div>

                        {isAuthenticated && (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.08] px-3.5 py-2 text-xs font-bold text-sky-700 dark:text-sky-300 tabular-nums shrink-0 self-start sm:self-auto">
                                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                                </svg>
                                <span>
                                    {t('studio.hub.cards.crm.subscription.walletBalanceLabel').replace('{{balance}}', String(userCreditBalance))}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* License & AI Quota Dashboard (Authenticated) OR Plan & Trial Card (Guest) */}
                    {isAuthenticated ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {subLoading ? (
                                [1, 2, 3].map((i) => (
                                    <div key={i} className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 h-[220px] flex flex-col justify-between animate-pulse">
                                        <div className="space-y-4">
                                            <div className="h-3.5 w-28 bg-[var(--bg-secondary)] rounded" />
                                            <div className="h-9 w-40 bg-[var(--bg-secondary)] rounded" />
                                            <div className="h-3 w-52 bg-[var(--bg-secondary)] rounded" />
                                        </div>
                                        <div className="h-10 w-full bg-[var(--bg-secondary)] rounded-xl" />
                                    </div>
                                ))
                            ) : (
                                <>
                                    {/* Card 1: License Status */}
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 flex flex-col justify-between gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                                {t('studio.hub.cards.crm.subscription.statusTitle')}
                                            </h3>

                                            {sub && sub.status === 'active' ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                                                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                                                            {isTrial
                                                                ? t('studio.hub.cards.crm.subscription.statusTrial')
                                                                : t('studio.hub.cards.crm.subscription.statusActive')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)] tabular-nums">
                                                        {(isTrial
                                                            ? t('studio.hub.cards.crm.subscription.statusTrialExpiry')
                                                            : t('studio.hub.cards.crm.subscription.statusExpiry')
                                                        ).replace('{{date}}', new Date(sub.periodEnd).toLocaleDateString(locale))}
                                                    </p>
                                                    {isTrial && (
                                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                            {t('studio.hub.cards.crm.subscription.statusTrialDesc')}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : sub && sub.status === 'expired' ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
                                                        <span className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
                                                            {t('studio.hub.cards.crm.subscription.statusExpired')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed">
                                                        {t('studio.hub.cards.crm.subscription.statusExpiredDesc').replace(
                                                            '{{date}}',
                                                            new Date(sub.periodEnd).toLocaleDateString(locale),
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" aria-hidden="true" />
                                                        <span className="text-2xl font-black text-[var(--text-secondary)] tracking-tight">
                                                            {t('studio.hub.cards.crm.subscription.statusInactive')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                        {t('studio.hub.cards.crm.subscription.statusInactiveDesc')}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSelectProduct(monthlyPlanSelection)}
                                            className="w-full py-3 rounded-xl font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors text-sm cursor-pointer"
                                        >
                                            {sub && sub.status === 'active'
                                                ? isTrial
                                                    ? t('studio.hub.cards.crm.subscription.upgradeBtn')
                                                    : t('studio.hub.cards.crm.subscription.renewBtn')
                                                : t('studio.hub.cards.crm.subscription.subscribeBtn')}
                                        </button>
                                    </div>

                                    {/* Card 2: Monthly AI Credits */}
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 flex flex-col justify-between gap-4">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
                                                {t('studio.hub.cards.crm.subscription.quotaTitle')}
                                            </h3>

                                            <div className="space-y-2">
                                                <div className="text-3xl font-black flex items-baseline gap-1.5 tracking-tight tabular-nums text-[var(--text-primary)]">
                                                    <span className="text-sky-700 dark:text-sky-400">{includedRemaining}</span>
                                                    <span className="text-sm text-[var(--text-tertiary)] font-bold">/ {includedLimit} AI Credits</span>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                    {isTrial
                                                        ? t('studio.hub.cards.crm.subscription.trialQuotaDesc')
                                                        : t('studio.hub.cards.crm.subscription.quotaDesc')}
                                                </p>
                                            </div>

                                            <div className="space-y-2 pt-1">
                                                <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                                                    <div
                                                        className="h-full bg-sky-600 dark:bg-sky-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${includedPct}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                                                    <span>{t('studio.hub.cards.crm.subscription.quotaUsed').replace('{{used}}', String(includedUsed))}</span>
                                                    <span>{t('studio.hub.cards.crm.subscription.quotaRemaining').replace('{{remaining}}', String(includedRemaining))}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.quotaNote')}
                                        </p>
                                    </div>

                                    {/* Card 3: Extra Top-up AI Credits */}
                                    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 flex flex-col justify-between gap-4">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                                                {t('studio.hub.cards.crm.subscription.extraTitle')}
                                            </h3>

                                            <div className="space-y-2">
                                                <div className="text-3xl font-black text-teal-700 dark:text-teal-400 tracking-tight tabular-nums">
                                                    +{extraAi}
                                                    <span className="text-sm text-[var(--text-tertiary)] font-bold ml-2">AI Credits</span>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                                    {t('studio.hub.cards.crm.subscription.extraDesc')}
                                                </p>
                                            </div>

                                            <div className="rounded-xl p-3 border border-sky-500/20 bg-sky-500/[0.07] text-xs font-semibold text-sky-800 dark:text-sky-300 flex items-center justify-between gap-2 tabular-nums">
                                                <span>{t('studio.hub.cards.crm.subscription.extraTotal')}</span>
                                                <span className="font-black text-sm">
                                                    {t('studio.hub.cards.crm.subscription.extraTotalRequests').replace('{{total}}', String(totalRemaining))}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.extraNote')}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 md:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="space-y-2 max-w-2xl">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h3 className="text-lg font-extrabold text-[var(--text-primary)]">
                                        {t('studio.hub.cards.crm.page.monthlyPlanName')}
                                    </h3>
                                    <span className="rounded-md border border-sky-500/25 bg-sky-500/10 px-2.5 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300 tabular-nums">
                                        {t('studio.hub.cards.crm.subscription.monthlyPlanPriceLabel')}
                                    </span>
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    {t('studio.hub.cards.crm.page.monthlyPlanDesc')}
                                </p>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {t('studio.hub.cards.crm.subscription.guestPromptDesc')}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => handleSelectProduct(monthlyPlanSelection)}
                                    className="inline-flex items-center justify-center rounded-xl bg-sky-600 hover:bg-sky-700 px-5 py-3 text-sm font-bold text-white transition-colors cursor-pointer"
                                >
                                    {t('studio.hub.cards.crm.subscription.subscribeBtn')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLoginDialog(true)}
                                    className="inline-flex items-center justify-center rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] hover:border-sky-500 px-4 py-3 text-sm font-bold text-[var(--text-primary)] transition-colors cursor-pointer"
                                >
                                    {t('studio.hub.cards.crm.subscription.guestSignInBtn')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Top-up AI Credits Catalog */}
                    <div id="pricing-plans" className="space-y-5 pt-2 scroll-mt-24">
                        <div className="space-y-1">
                            <h3 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                {t('studio.hub.cards.crm.subscription.addonTitle')}
                            </h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('studio.hub.cards.crm.subscription.addonDesc')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {addonPacks.map((pack) => (
                                <div
                                    key={pack.product.id}
                                    className={`rounded-2xl bg-[var(--bg-card)] p-6 flex flex-col justify-between relative overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 ${
                                        pack.popular
                                            ? 'border-2 border-sky-500/70 shadow-lg'
                                            : 'border border-[var(--border-primary)]'
                                    }`}
                                >
                                    {pack.popular && (
                                        <span className="absolute top-0 right-0 bg-sky-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl uppercase tracking-wider select-none">
                                            {t('studio.hub.cards.crm.subscription.popularBadge')}
                                        </span>
                                    )}

                                    <div className="space-y-4">
                                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${pack.accentTone}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className={`text-lg font-black ${pack.titleColor}`}>{pack.product.name}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {t(pack.descKey)}
                                            </p>
                                        </div>
                                        <div className="text-3xl font-black text-[var(--text-primary)] tabular-nums pt-1">
                                            {t('studio.hub.cards.crm.subscription.addonPriceVnd').replace('{{price}}', pack.priceVndDisplay)}
                                            <span className="text-xs text-[var(--text-tertiary)] font-semibold block sm:inline sm:ml-2">
                                                {t('studio.hub.cards.crm.subscription.addonPriceCredits').replace('{{credits}}', pack.priceCreditsDisplay)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleSelectProduct(pack.product)}
                                        className={`mt-7 w-full py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer ${
                                            pack.popular
                                                ? 'bg-sky-600 hover:bg-sky-700 text-white'
                                                : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-sky-500 hover:text-sky-700 dark:hover:text-sky-300'
                                        }`}
                                    >
                                        {t('studio.hub.cards.crm.subscription.addonBtn').replace('{{amount}}', pack.amountLabel)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Billing History (Authenticated Users) */}
                    {isAuthenticated && (
                        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 space-y-4">
                            <h3 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
                                {t('studio.hub.cards.crm.subscription.historyTitle')}
                            </h3>

                            {ordersLoading ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-7 h-7 border-2 border-sky-500/25 border-t-sky-600 dark:border-t-sky-400 rounded-full animate-spin" />
                                </div>
                            ) : orders.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-6 text-center">
                                    {t('studio.hub.cards.crm.subscription.historyEmpty')}
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)]">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColCode')}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColProduct')}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColGateway')}</th>
                                                <th className="p-3.5 text-right">{t('studio.hub.cards.crm.subscription.historyColCost')}</th>
                                                <th className="p-3.5 text-center">{t('studio.hub.cards.crm.subscription.historyColStatus')}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColTime')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] tabular-nums">
                                            {orders.map((o) => (
                                                <tr key={o._id} className="hover:bg-[var(--bg-secondary)]/60 transition-colors">
                                                    <td className="p-3.5 font-mono text-xs font-semibold text-sky-700 dark:text-sky-300">
                                                        {o.transactionCode}
                                                    </td>
                                                    <td className="p-3.5 font-semibold text-[var(--text-primary)]">{o.description}</td>
                                                    <td className="p-3.5 text-[var(--text-secondary)]">
                                                        {o.paymentMethod === 'credit' || o.paymentMethod === 'credits'
                                                            ? 'Credits Wallet'
                                                            : 'Bank Transfer'}
                                                    </td>
                                                    <td className="p-3.5 text-right font-bold text-[var(--text-primary)]">
                                                        {o.paymentMethod === 'credit' || o.paymentMethod === 'credits'
                                                            ? `${o.credits} Credits`
                                                            : formatCurrency(o.amountVnd ?? o.amount ?? 0)}
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                                                o.status === 'completed' || o.status === 'paid'
                                                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                                                                    : o.status === 'pending'
                                                                        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                                                                        : o.status === 'failed'
                                                                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                                                                            : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25'
                                                            }`}
                                                        >
                                                            {o.status === 'pending' && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
                                                            )}
                                                            {o.status === 'completed' || o.status === 'paid'
                                                                ? t('studio.hub.cards.crm.subscription.historyStatusSuccess')
                                                                : o.status === 'pending'
                                                                    ? t('studio.hub.cards.crm.subscription.historyStatusPending')
                                                                    : o.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-[var(--text-secondary)]">
                                                        {new Date(o.createdAt).toLocaleString(locale)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* ─── Core Highlights (4 Features) ──────────────────────────────── */}
                <section className="space-y-6">
                    <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
                        {t('studio.hub.cards.crm.page.featuresHeading')}
                    </h2>
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureBulkTitle')}
                            description={t('studio.hub.cards.crm.page.featureBulkDesc')}
                            tone="bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
                            titleColor="text-blue-700 dark:text-blue-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureAiTitle')}
                            description={t('studio.hub.cards.crm.page.featureAiDesc')}
                            tone="bg-sky-500/10 border-sky-500/20 text-sky-700 dark:text-sky-400"
                            titleColor="text-sky-700 dark:text-sky-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featurePairingTitle')}
                            description={t('studio.hub.cards.crm.page.featurePairingDesc')}
                            tone="bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            titleColor="text-emerald-700 dark:text-emerald-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            )}
                        />
                        <FeatureCard
                            title={t('studio.hub.cards.crm.page.featureContactsTitle')}
                            description={t('studio.hub.cards.crm.page.featureContactsDesc')}
                            tone="bg-teal-500/10 border-teal-500/20 text-teal-700 dark:text-teal-400"
                            titleColor="text-teal-700 dark:text-teal-400"
                            icon={(
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            )}
                        />
                    </div>
                </section>

                {/* ─── Setup Workflow + System Requirements ──────────────────────── */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* 4-step Onboarding Timeline */}
                    <div className="lg:col-span-7 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 space-y-5">
                        <div className="space-y-1">
                            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                                {t('studio.hub.cards.crm.subscription.timelineTitle')}
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('studio.hub.cards.crm.subscription.timelineDesc')}
                            </p>
                        </div>

                        <ol className="space-y-4">
                            {timelineSteps.map((step, index) => (
                                <li key={step.title} className="flex items-start gap-3.5">
                                    <span className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-700 dark:text-sky-300 flex items-center justify-center font-extrabold text-xs shrink-0 tabular-nums mt-0.5">
                                        {index + 1}
                                    </span>
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-sm text-[var(--text-primary)]">{step.title}</p>
                                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* System Requirements */}
                    <div className="lg:col-span-5 rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 space-y-4">
                        <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                            {t('studio.hub.cards.crm.page.requirementsHeading')}
                        </h2>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-300">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium pt-0.5">
                                    {t('studio.hub.cards.crm.page.requirementWindows')}
                                </p>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </span>
                                <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium pt-0.5">
                                    {t('studio.hub.cards.crm.page.requirementAndroid')}
                                </p>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-700 dark:text-blue-300">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </span>
                                <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium pt-0.5">
                                    {t('studio.hub.cards.crm.page.requirementZalo')}
                                </p>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                    </svg>
                                </span>
                                <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium pt-0.5">
                                    {t('studio.hub.cards.crm.page.requirementMemory')}
                                </p>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                    </svg>
                                </span>
                                <p className="text-xs leading-relaxed text-[var(--text-primary)] font-medium pt-0.5">
                                    {t('studio.hub.cards.crm.page.requirementSize')}
                                </p>
                            </li>
                        </ul>
                    </div>
                </section>
            </main>

            {/* ─── Interactive Image Zoom Modal ──────────────────────────────── */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out"
                    onClick={() => setShowZoomModal(false)}
                >
                    <div
                        className="relative max-w-5xl w-full flex flex-col gap-3 max-h-[90vh] overflow-hidden rounded-2xl border border-white/15 shadow-2xl bg-slate-950 p-4 cursor-default"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-xs sm:text-sm font-medium text-slate-200 truncate">
                                {t(SHOTS[slide].captionKey)}
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowZoomModal(false)}
                                aria-label={t('studio.hub.cards.crm.subscription.checkoutClose')}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors shrink-0"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative min-h-[300px] max-h-[75vh]">
                            <img
                                src={SHOTS[slide].src}
                                alt={t(SHOTS[slide].captionKey)}
                                className="max-w-full max-h-[72vh] object-contain rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={goPrev}
                                aria-label={t('studio.hub.cards.crm.page.prevShot')}
                                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:border-sky-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={goNext}
                                aria-label={t('studio.hub.cards.crm.page.nextShot')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/20 hover:border-sky-400 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Renewal Confirmation Modal ────────────────────────────────── */}
            {showRenewalConfirmModal && selectedProduct && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => {
                        setShowRenewalConfirmModal(false);
                        setSelectedProduct(null);
                    }}
                >
                    <div
                        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-[var(--text-primary)]">
                                    {t('studio.hub.cards.crm.subscription.renewConfirmTitle')}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {t('studio.hub.cards.crm.subscription.renewConfirmDesc')}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRenewalConfirmModal(false);
                                    setSelectedProduct(null);
                                }}
                                className="p-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                                aria-label={t('studio.hub.cards.crm.subscription.checkoutClose')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                    <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                                        {t('studio.hub.cards.crm.subscription.renewConfirmCost')}
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-sky-700 dark:text-sky-400 tabular-nums">
                                        {CRM_MONTHLY_RENEWAL_PLAN.priceCredits}
                                        <span className="ml-1 text-xs text-[var(--text-tertiary)]">Credits</span>
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                                        {formatCurrency(CRM_MONTHLY_RENEWAL_PLAN.priceVnd)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
                                    <p className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
                                        {t('studio.hub.cards.crm.subscription.renewConfirmQuota')}
                                    </p>
                                    <p className="mt-1 text-2xl font-black text-teal-700 dark:text-teal-400 tabular-nums">
                                        {CRM_MONTHLY_RENEWAL_PLAN.includedAiLimit}
                                        <span className="ml-1 text-xs text-[var(--text-tertiary)]">AI Credits</span>
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        {t('studio.hub.cards.crm.subscription.renewConfirmDuration')}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--border-primary)] divide-y divide-[var(--border-primary)] overflow-hidden">
                                {renewalDetails.detailRows.map((row, index) => (
                                    <div key={row.label} className="flex items-start justify-between gap-4 p-3 bg-[var(--bg-card)]">
                                        <span className="text-xs font-bold text-[var(--text-secondary)]">
                                            {t(`studio.hub.cards.crm.subscription.renewDetail${index + 1}Label`) || row.label}
                                        </span>
                                        <span className="text-xs text-right font-semibold text-[var(--text-primary)]">
                                            {t(`studio.hub.cards.crm.subscription.renewDetail${index + 1}Value`) || row.value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div
                                className={`p-3.5 rounded-xl border text-xs leading-relaxed font-medium ${
                                    renewalDetails.canPayWithCredits
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-300'
                                }`}
                            >
                                {renewalDetails.canPayWithCredits
                                    ? t('studio.hub.cards.crm.subscription.renewBalanceOk').replace('{{balance}}', String(userCreditBalance))
                                    : t('studio.hub.cards.crm.subscription.renewBalanceLow')
                                        .replace('{{balance}}', String(userCreditBalance))
                                        .replace('{{missing}}', String(renewalDetails.missingCredits))}
                            </div>
                        </div>

                        <div className="p-4 border-t border-[var(--border-primary)] flex flex-col sm:flex-row gap-3 bg-[var(--bg-secondary)]">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRenewalConfirmModal(false);
                                    setSelectedProduct(null);
                                }}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] text-sm cursor-pointer transition-colors"
                            >
                                {t('studio.hub.cards.crm.subscription.renewCancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleContinueRenewalCheckout}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-sky-600 hover:bg-sky-700 text-white text-sm cursor-pointer transition-colors"
                            >
                                {t('studio.hub.cards.crm.subscription.renewContinue')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Checkout / VietQR Payment Modal ───────────────────────────── */}
            {showCheckoutModal && selectedProduct && (
                <div
                    className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={closeCheckout}
                >
                    <div
                        className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]">
                            <span className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                                {selectedProduct.name}
                            </span>
                            {checkoutResponse?.qrCodeUrl && (
                                <span
                                    className={`text-xs font-mono font-black px-3 py-1 rounded-full border tabular-nums ${
                                        countdown < 60
                                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
                                            : 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25'
                                    }`}
                                >
                                    {formatCountdown(countdown)}
                                </span>
                            )}
                        </div>

                        <div className="p-6">
                            {!checkoutResponse ? (
                                <div className="space-y-5">
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {t('studio.hub.cards.crm.subscription.checkoutSelectionDesc')}
                                    </p>

                                    <div className="grid grid-cols-1 gap-3.5">
                                        <button
                                            type="button"
                                            onClick={() => handleCheckout('credit')}
                                            disabled={
                                                actionLoading !== null ||
                                                (selectedProduct.id === CRM_MONTHLY_RENEWAL_PLAN.productId && !renewalDetails.canPayWithCredits)
                                            }
                                            className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm text-[var(--text-primary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutWalletTitle')}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutWalletDesc').replace('{{balance}}', String(userCreditBalance))}
                                                </p>
                                            </div>
                                            <div className="text-right tabular-nums">
                                                <span className="font-black text-sky-700 dark:text-sky-400 block text-lg">
                                                    {selectedProduct.priceCredits}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">Credits</span>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleCheckout('bank_transfer')}
                                            disabled={actionLoading !== null}
                                            className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-sky-500 disabled:opacity-50 transition-colors text-left cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm text-[var(--text-primary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutBankTitle')}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutBankDesc')}
                                                </p>
                                            </div>
                                            <div className="text-right tabular-nums">
                                                <span className="font-black text-emerald-700 dark:text-emerald-400 block text-base">
                                                    {formatCurrency(selectedProduct.priceVnd)}
                                                </span>
                                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">VND</span>
                                            </div>
                                        </button>
                                    </div>

                                    {actionLoading && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] py-2">
                                            <span className="w-4 h-4 border-2 border-sky-500/25 border-t-sky-600 dark:border-t-sky-400 rounded-full animate-spin" />
                                            <span>{t('studio.hub.cards.crm.subscription.checkoutLoading')}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="bg-white p-3 rounded-2xl shadow border border-slate-200 flex items-center justify-center">
                                        <img src={checkoutResponse.qrCodeUrl} alt="VietQR Banking Code" className="w-56 h-56 object-contain" />
                                    </div>

                                    <div className="space-y-0.5 select-all">
                                        <p className="text-[11px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                                            {t('studio.hub.cards.crm.subscription.checkoutBankTransferTo')}
                                        </p>
                                        <p className="text-sm font-black text-[var(--text-primary)]">
                                            {checkoutResponse.bankInfo?.bankName || 'OCB'} &bull; {checkoutResponse.bankInfo?.accountHolder || 'NGUYEN ANH DUC'}
                                        </p>
                                        <p className="text-xs font-mono font-bold text-[var(--text-secondary)] tracking-wide">
                                            {checkoutResponse.bankInfo?.accountNumber || 'CASS55252503'}
                                        </p>
                                    </div>

                                    <div className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl flex items-center justify-between gap-2">
                                        <div className="text-left space-y-0.5 min-w-0">
                                            <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                                                {t('studio.hub.cards.crm.subscription.checkoutBankTransferContent')}
                                            </p>
                                            <p className="font-mono font-black text-sky-700 dark:text-sky-300 text-xs sm:text-sm select-all truncate">
                                                {checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode)}
                                            className="px-3 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                                        >
                                            {copiedCode
                                                ? t('studio.hub.cards.crm.subscription.checkoutBankCopySuccess')
                                                : t('studio.hub.cards.crm.subscription.checkoutBankCopy')}
                                        </button>
                                    </div>

                                    <div className="p-3 bg-sky-500/[0.07] border border-sky-500/20 rounded-xl text-[11px] text-sky-800 dark:text-sky-300 text-left leading-relaxed">
                                        {t('studio.hub.cards.crm.subscription.checkoutBankNote')}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-[var(--border-primary)] flex gap-3 bg-[var(--bg-secondary)]">
                            <button
                                type="button"
                                onClick={closeCheckout}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] text-sm cursor-pointer transition-colors"
                            >
                                {t('studio.hub.cards.crm.subscription.checkoutClose')}
                            </button>
                            {checkoutResponse && (
                                <button
                                    type="button"
                                    onClick={closeCheckout}
                                    className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-sm cursor-pointer transition-colors"
                                >
                                    {t('studio.hub.cards.crm.subscription.checkoutSuccessBtn')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Inline Login Dialog ───────────────────────────────────────── */}
            {showLoginDialog && (
                <Suspense fallback={null}>
                    <Login
                        onLoginSuccess={handleLoginSuccess}
                        onClose={() => {
                            setShowLoginDialog(false);
                            setPendingProduct(null);
                        }}
                    />
                </Suspense>
            )}
        </div>
    );
};

export default CrmPage;
