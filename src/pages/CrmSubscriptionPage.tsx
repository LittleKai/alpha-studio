import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import { useConfirm } from '../components/ui/ConfirmDialog';
import {
    getCrmSubscription,
    createCrmCheckout,
    listCrmBillingOrders,
    getLatestCrmRelease,
    formatCurrency,
    type CrmSubscription,
    type CrmBillingOrder,
    type CrmReleaseInfo
} from '../services/crmService';

export default function CrmSubscriptionPage() {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
    const { confirm } = useConfirm();
    const navigate = useNavigate();

    // Data states
    const [sub, setSub] = useState<CrmSubscription | null>(null);
    const [release, setRelease] = useState<CrmReleaseInfo | null>(null);
    const [orders, setOrders] = useState<CrmBillingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal & QR code checkout states
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string; priceVnd: number; priceCredits: number; type: 'plan' | 'addon' } | null>(null);
    const [checkoutResponse, setCheckoutResponse] = useState<{ order: CrmBillingOrder; qrCodeUrl?: string; bankInfo?: any } | null>(null);
    const [countdown, setCountdown] = useState(5 * 60); // 5 mins
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Image Zoom modal state
    const [showZoomModal, setShowZoomModal] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [subData, releaseData, ordersData] = await Promise.all([
                getCrmSubscription(),
                getLatestCrmRelease().catch(() => null),
                listCrmBillingOrders().catch(() => [])
            ]);
            setSub(subData);
            setRelease(releaseData);
            setOrders(ordersData);
        } catch (err: any) {
            console.error('Failed to load CRM subscription data:', err);
            setError(err.message || t('studio.hub.cards.crm.subscription.loadError') || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Cleanup countdown timer
    useEffect(() => {
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, []);

    const startCountdown = useCallback(() => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(5 * 60);

        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setShowCheckoutModal(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const formatCountdown = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSelectProduct = (product: { id: string; name: string; priceVnd: number; priceCredits: number; type: 'plan' | 'addon' }) => {
        setSelectedProduct(product);
        setCheckoutResponse(null);
        setShowCheckoutModal(true);
    };

    const handleCheckout = async (method: 'credit' | 'bank_transfer') => {
        if (!selectedProduct) return;
        setActionLoading(method);
        setError(null);

        try {
            const res = await createCrmCheckout({
                productId: selectedProduct.id,
                paymentMethod: method
            });

            setCheckoutResponse(res);

            if (method === 'credit') {
                alert(t('workflow.wallet.paySuccess') || 'Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
                setShowCheckoutModal(false);
                refreshUser(); // Refresh wallet credits display
                loadData();
            } else {
                startCountdown(); // Start OCB bank transfer QR expiration countdown
            }
        } catch (err: any) {
            setError(err.message || t('studio.hub.cards.crm.subscription.checkoutError') || 'Lỗi khi xử lý thanh toán.');
        } finally {
            setActionLoading(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(t('workflow.wallet.copied') || 'Đã sao chép!');
    };

    const closeCheckout = () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setShowCheckoutModal(false);
        setSelectedProduct(null);
        setCheckoutResponse(null);
        loadData();
    };

    // Click handler for Mở Zalo Bot Studio
    const handleOpenStudio = async () => {
        if (sub && sub.status === 'active') {
            navigate('/studio/crm');
        } else {
            const ok = await confirm({
                title: t('studio.hub.cards.crm.subscription.confirmTitle') || 'Giấy phép chưa kích hoạt',
                message: t('studio.hub.cards.crm.subscription.confirmMessage') || 'Bạn cần sở hữu giấy phép Alpha CRM đang hoạt động để truy cập Zalo Bot Studio. Kích hoạt hoặc đăng ký ngay?',
                confirmText: t('studio.hub.cards.crm.subscription.confirmBtn') || 'Xem các gói dịch vụ',
                cancelText: t('studio.hub.cards.crm.subscription.confirmClose') || 'Đóng',
                variant: 'info'
            });
            if (ok) {
                const pricingSec = document.getElementById('pricing-plans');
                if (pricingSec) {
                    pricingSec.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    };

    // Robust variables calculation to completely prevent NaN
    const includedLimit = sub?.includedAiLimit ?? 500;
    const includedUsed = sub?.includedAiUsed ?? 0;
    const extraAi = sub?.extraAiRemaining ?? 0;

    const includedRemaining = Math.max(0, includedLimit - includedUsed);
    const totalRemaining = includedRemaining + extraAi;
    const includedPct = includedLimit > 0 ? (includedUsed / includedLimit) * 100 : 0;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)] p-4 sm:p-8 pt-14 sm:pt-16 text-[var(--text-primary)] relative overflow-hidden">
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
                .active-glow-ring {
                    box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
                }
                .spotlight-glow {
                    position: absolute;
                    width: 350px;
                    height: 350px;
                    background: radial-gradient(circle, rgba(97, 232, 255, 0.08) 0%, transparent 70%);
                    pointer-events: none;
                    z-index: 0;
                    border-radius: 50%;
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
                .monospaced-nums {
                    font-variant-numeric: tabular-nums;
                    font-family: 'Plus Jakarta Sans', monospace;
                }
                .timeline-line::before {
                    content: '';
                    position: absolute;
                    left: 10px;
                    top: 15px;
                    bottom: 15px;
                    width: 2px;
                    background: linear-gradient(to bottom, var(--accent-primary) 0%, var(--border-primary) 100%);
                    opacity: 0.5;
                }
                .timeline-step:hover .timeline-icon {
                    transform: scale(1.15);
                    border-color: var(--accent-primary);
                    box-shadow: 0 0 10px rgba(97, 232, 255, 0.3);
                }
                .pulse-breathing {
                    animation: breathingPulse 2.5s ease-in-out infinite;
                }
                @keyframes breathingPulse {
                    0%, 100% { transform: scale(1); opacity: 0.95; }
                    50% { transform: scale(1.03); opacity: 1; box-shadow: 0 0 20px rgba(97, 232, 255, 0.18); }
                }
                .glow-border-popular {
                    border: 2px solid transparent;
                    background: linear-gradient(var(--bg-card), var(--bg-card)) padding-box,
                                linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)) border-box;
                    box-shadow: 0 20px 45px rgba(139, 125, 255, 0.12);
                }
                .shimmer-bg {
                    background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border-secondary) 50%, var(--bg-secondary) 75%);
                    background-size: 200% 100%;
                    animation: shimmerLoading 1.5s infinite linear;
                }
                @keyframes shimmerLoading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
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
                
                /* BILLING HISTORY LIGHT THEME OVERRIDES */
                html[data-theme="light"] .billing-history-container {
                    background: rgba(255, 255, 255, 0.7) !important;
                    border-color: rgba(15, 75, 112, 0.15) !important;
                }
                html[data-theme="light"] .billing-history-header {
                    background: rgba(226, 232, 240, 0.6) !important;
                    color: #475569 !important;
                }
                html[data-theme="light"] .billing-history-row {
                    color: #334155 !important;
                    border-bottom-color: rgba(15, 75, 112, 0.12) !important;
                }
                html[data-theme="light"] .billing-history-row:hover {
                    background: rgba(2, 132, 199, 0.04) !important;
                }
                html[data-theme="light"] .billing-history-code {
                    color: #0284c7 !important;
                }
                html[data-theme="light"] .billing-history-row td {
                    color: #334155 !important;
                }
                html[data-theme="light"] .billing-history-row td span {
                    color: inherit !important;
                }
            ` }} />

            {/* Ambient Background Lights */}
            <div className="spotlight-glow top-[-100px] left-[-50px]"></div>
            <div className="spotlight-glow bottom-[-50px] right-[-100px] bg-radial-[circle,rgba(139,125,255,0.06)_0%,transparent_70%]"></div>

            <div className="max-w-6xl mx-auto space-y-10 animate-fade-in relative z-10">
                {/* Header & Horizontal Showcase Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Hero Text */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-xs text-[var(--accent-primary)] font-semibold uppercase tracking-wider backdrop-blur-sm">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-primary)] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--accent-primary)]"></span>
                            </span>
                            <span>{t('studio.hub.cards.crm.subscription.tag') || 'Zalo Marketing Automation'}</span>
                        </div>

                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tight premium-title-gradient leading-[1.1]">
                                {t('studio.hub.cards.crm.subscription.title') || 'Alpha CRM Studio'}
                            </h1>
                            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl">
                                {t('studio.hub.cards.crm.subscription.desc') || 'Giải pháp tự động hóa phễu tiếp thị, gửi tin nhắn hàng loạt và chăm sóc khách hàng tự động tối ưu chi phí qua nền tảng Zalo.'}
                            </p>
                        </div>

                        {/* Top Action & Launch Button */}
                        <div className="flex flex-wrap gap-4 pt-1">
                            <button
                                onClick={handleOpenStudio}
                                className="px-8 py-3 rounded-xl font-bold bg-[var(--accent-primary)] text-black shadow-lg hover:shadow-cyan-500/20 spring-bounce transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden"
                            >
                                <span>{t('studio.hub.cards.crm.subscription.openCrm') || 'Mở Zalo Bot Studio'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* HIGH-ALTITUDE DOWNLOAD AREA with STRICT WHITE FONT COLOR */}
                        <div className="space-y-2 pt-2 border-t border-[var(--border-primary)]/50 max-w-xl">
                            <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                                {t('studio.hub.cards.crm.subscription.downloadsHeading') || 'Tải bộ cài đặt Client & Connectors:'}
                            </p>
                            <div className="grid grid-cols-2 gap-3.5">
                                {/* Windows Download Card */}
                                <a
                                    href={release?.windowsInstallerUrl || 'https://github.com/LittleKai/alpha-crm-app/releases'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-600 to-cyan-600 border border-sky-500/30 rounded-xl hover:border-cyan-400/50 hover:from-sky-500 hover:to-cyan-500 transition-all text-left spring-bounce shadow-md"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/10 text-cyan-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.101zM11.25 1.9L24 0v11.55H11.25V1.9zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/>
                                        </svg>
                                    </div>
                                    <div className="space-y-0.5 select-none">
                                        <span className="block font-bold text-xs text-white">
                                            {t('studio.hub.cards.crm.subscription.downloadPCTitle') || 'Windows Client'}
                                        </span>
                                        <span className="block text-[10px] text-white/90 monospaced-nums">
                                            {t('studio.hub.cards.crm.subscription.downloadPCDesc').replace('{{version}}', release?.version || '1.0.0')}
                                        </span>
                                    </div>
                                </a>

                                {/* Android Download Card */}
                                <a
                                    href={release?.androidApkUrl || 'https://github.com/LittleKai/alpha-crm-app/releases'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-sky-600 to-cyan-600 border border-sky-500/30 rounded-xl hover:border-cyan-400/50 hover:from-sky-500 hover:to-cyan-500 transition-all text-left spring-bounce shadow-md"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-white/10 text-cyan-100 flex items-center justify-center shrink-0">
                                        <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                        </svg>
                                    </div>
                                    <div className="space-y-0.5 select-none">
                                        <span className="block font-bold text-xs text-white">
                                            {t('studio.hub.cards.crm.subscription.downloadAndroidTitle') || 'Android APK'}
                                        </span>
                                        <span className="block text-[10px] text-white/90">
                                            {t('studio.hub.cards.crm.subscription.downloadAndroidDesc') || 'Pair QR Connector'}
                                        </span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Widescreen Landscape Mockup Showcase with 3D Ambient Shadow Glow */}
                    <div className="lg:col-span-5 flex justify-center relative">
                        {/* 3D Reflection backlight behind window */}
                        <div className="ambient-glow-reflector absolute inset-0 bg-radial-[circle,rgba(97,232,255,0.12)_0%,transparent_70%] scale-110 blur-xl z-0 pointer-events-none"></div>

                        <div
                            onClick={() => setShowZoomModal(true)}
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
                                    alpha-crm.app/studio
                                </div>
                                <div className="w-10"></div>
                            </div>

                            {/* Aspect Ratio Landscape CSS Background Image Cover (Satisfies user request) */}
                            <div 
                                className="flex-1 w-full bg-slate-950 bg-cover bg-center bg-no-repeat relative group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                                style={{ backgroundImage: "url('/crm-preview.png')" }}
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
                </div>

                {loading ? (
                    /* High-Fidelity Skeleton Loader */
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card rounded-2xl p-6 h-[220px] flex flex-col justify-between overflow-hidden">
                                <div className="space-y-4">
                                    <div className="h-4 w-28 shimmer-bg rounded"></div>
                                    <div className="h-10 w-44 shimmer-bg rounded"></div>
                                    <div className="h-3 w-56 shimmer-bg rounded"></div>
                                </div>
                                <div className="h-10 w-full shimmer-bg rounded-xl"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-[var(--bg-error)] border border-[var(--border-error)] rounded-2xl text-[var(--text-error)] text-sm flex items-center gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Subscription Quota Dashboard Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Card 1: Subscription Status */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                                        {t('studio.hub.cards.crm.subscription.statusTitle') || 'Trạng thái giấy phép'}
                                    </h3>

                                    {sub && sub.status === 'active' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 active-glow-ring"></span>
                                                </span>
                                                <span className="text-2xl font-black text-green-500 tracking-tight">
                                                    {t('studio.hub.cards.crm.subscription.statusActive') || 'Đang Hoạt Động'}
                                                </span>
                                            </div>
                                             <p className="text-sm text-[var(--text-secondary)] monospaced-nums">
                                                {t('studio.hub.cards.crm.subscription.statusExpiry').replace('{{date}}', new Date(sub.periodEnd).toLocaleDateString('vi-VN'))}
                                            </p>
                                        </div>
                                    ) : sub && sub.status === 'expired' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                </span>
                                                <span className="text-2xl font-black text-red-500 tracking-tight">
                                                    {t('studio.hub.cards.crm.subscription.statusExpired') || 'Đã Hết Hạn'}
                                                </span>
                                            </div>
                                             <p className="text-sm text-red-500/90 leading-relaxed">
                                                {t('studio.hub.cards.crm.subscription.statusExpiredDesc').replace('{{date}}', new Date(sub.periodEnd).toLocaleDateString('vi-VN'))}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>
                                                <span className="text-2xl font-black text-[var(--text-secondary)] tracking-tight">
                                                    {t('studio.hub.cards.crm.subscription.statusInactive') || 'Chưa Đăng Ký'}
                                                </span>
                                            </div>
                                             <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {t('studio.hub.cards.crm.subscription.statusInactiveDesc') || 'Bạn chưa có giấy phép Alpha CRM. Sở hữu giấy phép ngay để liên kết bot và bắt đầu chiến dịch.'}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_monthly',
                                            name: t('studio.hub.cards.crm.subscription.monthlyPlanName') || 'Giấy phép Alpha CRM 1 Tháng',
                                            priceVnd: 200000,
                                            priceCredits: 210,
                                            type: 'plan'
                                        })}
                                        className="w-full py-3 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] spring-bounce text-sm cursor-pointer"
                                    >
                                        {sub && sub.status === 'active' 
                                            ? (t('studio.hub.cards.crm.subscription.renewBtn') || 'Gia hạn gói hàng tháng') 
                                            : (t('studio.hub.cards.crm.subscription.subscribeBtn') || 'Đăng ký gói 1 tháng')
                                        }
                                    </button>
                                </div>
                            </div>

                            {/* Card 2: AI Quota tracker */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-5">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                                        {t('studio.hub.cards.crm.subscription.quotaTitle') || 'AI Quota / Chu kỳ'}
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="text-4xl font-black flex items-baseline gap-1.5 tracking-tight monospaced-nums">
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-500">
                                                {includedRemaining}
                                            </span>
                                            <span className="text-sm text-[var(--text-tertiary)] font-bold">/ {includedLimit} requests</span>
                                        </div>
                                         <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.quotaDesc') || 'Hạn ngạch AI hỗ trợ soạn thảo, tối ưu kịch bản và phản hồi tin nhắn tự động hàng tháng.'}
                                        </p>
                                    </div>

                                    {/* Progress track */}
                                    <div className="space-y-2 pt-1">
                                        <div className="h-2 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-700"
                                                style={{ width: `${Math.min(100, includedPct)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] monospaced-nums">
                                            <span>{t('studio.hub.cards.crm.subscription.quotaUsed').replace('{{used}}', String(includedUsed))}</span>
                                            <span>{t('studio.hub.cards.crm.subscription.quotaRemaining').replace('{{remaining}}', String(includedRemaining))}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-[var(--text-tertiary)] leading-tight mt-4 italic">
                                    {t('studio.hub.cards.crm.subscription.quotaNote') || '* Lượt AI chỉ khấu trừ khi máy chủ trả dữ liệu thành công.'}
                                </p>
                            </div>

                            {/* Card 3: Extra AI top-up Remaining */}
                            <div className="glass-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                                        {t('studio.hub.cards.crm.subscription.extraTitle') || 'AI Quota Mua Thêm'}
                                    </h3>

                                    <div className="space-y-2">
                                        <div className="text-4xl font-black text-[var(--accent-primary)] tracking-tight monospaced-nums">
                                            +{extraAi}
                                            <span className="text-xs text-[var(--text-tertiary)] font-bold ml-2">Requests</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.extraDesc') || 'Hạn ngạch bổ sung vô thời hạn, khả dụng khi giấy phép chính còn trong thời hạn hoạt động.'}
                                        </p>
                                    </div>

                                     <div className="bg-cyan-500/5 rounded-xl p-3 border border-cyan-500/10 text-sm text-[var(--accent-primary)] flex items-center justify-between monospaced-nums">
                                        <span>{t('studio.hub.cards.crm.subscription.extraTotal') || 'Tổng AI khả dụng hiện tại:'}</span>
                                        <span className="font-bold text-sm">
                                            {t('studio.hub.cards.crm.subscription.extraTotalRequests').replace('{{total}}', String(totalRemaining))}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-xs text-[var(--text-tertiary)] leading-normal mt-4">
                                    {t('studio.hub.cards.crm.subscription.extraNote') || '* Khi gói chính hết hạn, quota này sẽ tạm khóa cho tới khi gia hạn thành công.'}
                                </div>
                            </div>
                        </div>

                        {/* Pairing Timeline Quickstart Guide */}
                        <div className="glass-card rounded-2xl p-6 shadow-md space-y-5">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold tracking-tight">
                                    {t('studio.hub.cards.crm.subscription.timelineTitle') || 'Quy trình ghép nối & vận hành bot'}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {t('studio.hub.cards.crm.subscription.timelineDesc') || 'Theo dõi 4 bước chuẩn để bắt đầu chạy chiến dịch tiếp thị tự động hóa trên Zalo.'}
                                </p>
                            </div>

                            <div className="relative timeline-line pl-6 sm:pl-8 space-y-5 pt-1">
                                <div className="timeline-step relative flex items-start gap-4">
                                    <span className="timeline-icon w-6.5 h-6.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[var(--accent-primary)] flex items-center justify-center font-black text-xs shrink-0 transition-transform">1</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-base text-[var(--text-primary)]">
                                            {t('studio.hub.cards.crm.subscription.timelineStep1Title') || 'Sở hữu Giấy phép Alpha CRM'}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.timelineStep1Desc') || 'Kích hoạt thông qua Tín dụng ví (Credits) hoặc chuyển khoản VietQR ở dưới.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="timeline-step relative flex items-start gap-4">
                                    <span className="timeline-icon w-6.5 h-6.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[var(--accent-primary)] flex items-center justify-center font-black text-xs shrink-0 transition-transform">2</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-base text-[var(--text-primary)]">
                                            {t('studio.hub.cards.crm.subscription.timelineStep2Title') || 'Tải Client & Pairing Connector'}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.timelineStep2Desc') || 'Tải bản cài đặt Windows Client và ứng dụng di động Android APK (nằm ngay ở phần đầu trang) để cài đặt.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="timeline-step relative flex items-start gap-4">
                                    <span className="timeline-icon w-6.5 h-6.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[var(--accent-primary)] flex items-center justify-center font-black text-xs shrink-0 transition-transform">3</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-base text-[var(--text-primary)]">
                                            {t('studio.hub.cards.crm.subscription.timelineStep3Title') || 'Khởi chạy & Kết nối pairing thiết bị'}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.timelineStep3Desc') || 'Mở app PC Windows, đăng nhập và quét mã QR ghép nối từ thiết bị Android của bạn để tạo cầu nối gửi tin nhắn.'}
                                        </p>
                                    </div>
                                </div>

                                <div className="timeline-step relative flex items-start gap-4">
                                    <span className="timeline-icon w-6.5 h-6.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[var(--accent-primary)] flex items-center justify-center font-black text-xs shrink-0 transition-transform">4</span>
                                    <div className="space-y-1">
                                        <p className="font-bold text-base text-[var(--text-primary)]">
                                            {t('studio.hub.cards.crm.subscription.timelineStep4Title') || 'Vận hành phễu tự động hóa CRM'}
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {t('studio.hub.cards.crm.subscription.timelineStep4Desc') || 'Truy cập Zalo Bot Studio trên Web, import tệp khách hàng tiềm năng và lên lịch chạy gửi tin chăm sóc hàng loạt.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra AI top-up catalog */}
                        <div id="pricing-plans" className="space-y-6 pt-2 scroll-mt-20">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                                    {t('studio.hub.cards.crm.subscription.addonTitle') || 'Mua thêm hạn mức AI'}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {t('studio.hub.cards.crm.subscription.addonDesc') || 'Thêm nhanh các gói lượt sử dụng AI độc lập, không giới hạn hạn chu kỳ sử dụng.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Pack 100 */}
                                <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col justify-between hover:border-cyan-500/20 spring-bounce group">
                                    <div className="space-y-4">
                                        <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">{t('studio.hub.cards.crm.subscription.addonPack100Name')}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {t('studio.hub.cards.crm.subscription.addonPack100Desc') || 'Thêm +100 yêu cầu AI thành công sử dụng vĩnh viễn trong phễu bot.'}
                                            </p>
                                        </div>
                                        <div className="text-3xl font-black text-[var(--text-primary)] monospaced-nums pt-1">
                                            {t('studio.hub.cards.crm.subscription.addonPriceVnd').replace('{{price}}', '50.000')}
                                            <span className="text-xs text-[var(--text-tertiary)] font-semibold block sm:inline sm:ml-2">
                                                {t('studio.hub.cards.crm.subscription.addonPriceCredits').replace('{{credits}}', '50')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_100',
                                            name: t('studio.hub.cards.crm.subscription.addonPack100Name') || 'Gói AI Top-up 100',
                                            priceVnd: 50000,
                                            priceCredits: 50,
                                            type: 'addon'
                                        })}
                                        className="w-full py-3 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-cyan-500 hover:text-cyan-400 mt-8 spring-bounce text-sm cursor-pointer"
                                    >
                                        {t('studio.hub.cards.crm.subscription.addonBtn').replace('{{amount}}', '100')}
                                    </button>
                                </div>

                                {/* Pack 500 - Popular Glowing Card */}
                                <div className="glass-card rounded-2xl p-6 glow-border-popular relative flex flex-col justify-between spring-bounce group">
                                    {/* Premium Popular Tag */}
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black text-[9px] font-black px-3.5 py-1.5 rounded-bl-xl uppercase tracking-wider shadow-sm select-none">
                                        {t('studio.hub.cards.crm.subscription.popularBadge') || 'Phổ biến'}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">{t('studio.hub.cards.crm.subscription.addonPack500Name')}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {t('studio.hub.cards.crm.subscription.addonPack500Desc') || 'Thêm +500 yêu cầu AI thành công. Lựa chọn kinh tế nhất cho doanh nghiệp.'}
                                            </p>
                                        </div>
                                        <div className="text-3xl font-black text-[var(--text-primary)] monospaced-nums pt-1">
                                            {t('studio.hub.cards.crm.subscription.addonPriceVnd').replace('{{price}}', '200.000')}
                                            <span className="text-xs text-[var(--text-tertiary)] font-semibold block sm:inline sm:ml-2">
                                                {t('studio.hub.cards.crm.subscription.addonPriceCredits').replace('{{credits}}', '200')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_500',
                                            name: t('studio.hub.cards.crm.subscription.addonPack500Name') || 'Gói AI Top-up 500',
                                            priceVnd: 200000,
                                            priceCredits: 200,
                                            type: 'addon'
                                        })}
                                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black hover:opacity-90 shadow-lg hover:shadow-cyan-500/10 mt-8 spring-bounce text-sm cursor-pointer"
                                    >
                                        {t('studio.hub.cards.crm.subscription.addonBtn').replace('{{amount}}', '500')}
                                    </button>
                                </div>

                                {/* Pack 1000 */}
                                <div className="glass-card rounded-2xl p-6 shadow-md flex flex-col justify-between hover:border-cyan-500/20 spring-bounce group">
                                    <div className="space-y-4">
                                        <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="text-xl font-black text-[var(--text-primary)]">{t('studio.hub.cards.crm.subscription.addonPack1000Name')}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                                {t('studio.hub.cards.crm.subscription.addonPack1000Desc') || 'Thêm +1000 yêu cầu AI thành công. Tối ưu chi phí tiết kiệm đến 30%.'}
                                            </p>
                                        </div>
                                        <div className="text-3xl font-black text-[var(--text-primary)] monospaced-nums pt-1">
                                            {t('studio.hub.cards.crm.subscription.addonPriceVnd').replace('{{price}}', '350.000')}
                                            <span className="text-xs text-[var(--text-tertiary)] font-semibold block sm:inline sm:ml-2">
                                                {t('studio.hub.cards.crm.subscription.addonPriceCredits').replace('{{credits}}', '350')}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_1000',
                                            name: t('studio.hub.cards.crm.subscription.addonPack1000Name') || 'Gói AI Top-up 1000',
                                            priceVnd: 350000,
                                            priceCredits: 350,
                                            type: 'addon'
                                        })}
                                        className="w-full py-3 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-cyan-500 hover:text-cyan-400 mt-8 spring-bounce text-sm cursor-pointer"
                                    >
                                        {t('studio.hub.cards.crm.subscription.addonBtn').replace('{{amount}}', '1000')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User Billing History Table */}
                        <div className="glass-card rounded-2xl p-6 shadow-md space-y-4 billing-history-container">
                            <h3 className="text-xl font-bold tracking-tight">
                                {t('studio.hub.cards.crm.subscription.historyTitle') || 'Lịch sử giao dịch CRM'}
                            </h3>

                            {orders.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-8 text-center italic">
                                    {t('studio.hub.cards.crm.subscription.historyEmpty') || 'Chưa phát hiện giao dịch CRM nào trong tài khoản.'}
                                </p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-black/10">
                                    <table className="w-full text-sm sm:text-[15px] text-left border-collapse">
                                        <thead>
                                            <tr className="billing-history-header bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColCode') || 'Mã Giao Dịch'}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColProduct') || 'Sản Phẩm'}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColGateway') || 'Cổng Thanh Toán'}</th>
                                                <th className="p-3.5 text-right">{t('studio.hub.cards.crm.subscription.historyColCost') || 'Chi Phí'}</th>
                                                <th className="p-3.5 text-center">{t('studio.hub.cards.crm.subscription.historyColStatus') || 'Trạng Thái'}</th>
                                                <th className="p-3.5">{t('studio.hub.cards.crm.subscription.historyColTime') || 'Khởi Tạo'}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] monospaced-nums">
                                            {orders.map(o => (
                                                <tr key={o._id} className="billing-history-row hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-3.5 font-mono text-xs billing-history-code text-cyan-400">{o.transactionCode}</td>
                                                    <td className="p-3.5 font-semibold text-[var(--text-primary)]">{o.description}</td>
                                                    <td className="p-3.5 text-slate-400">
                                                        {o.paymentMethod === 'credit' || o.paymentMethod === 'credits' ? 'Credits Wallet' : 'Bank Transfer'}
                                                    </td>
                                                    <td className="p-3.5 text-right font-black text-[var(--text-primary)]">
                                                        {o.paymentMethod === 'credit' || o.paymentMethod === 'credits' ? `${o.credits} Credits` : formatCurrency(o.amountVnd ?? o.amount ?? 0)}
                                                    </td>
                                                    <td className="p-3.5 text-center">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                            (o.status === 'completed' || o.status === 'paid') ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                            o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                            o.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                        }`}>
                                                            {o.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>}
                                                            {(o.status === 'completed' || o.status === 'paid') 
                                                                ? (t('studio.hub.cards.crm.subscription.historyStatusSuccess') || 'Thành công') 
                                                                : o.status === 'pending' 
                                                                    ? (t('studio.hub.cards.crm.subscription.historyStatusPending') || 'Chờ duyệt') 
                                                                    : o.status
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-400">
                                                        {new Date(o.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Interactive Image Zoom Modal */}
            {showZoomModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-fast cursor-zoom-out"
                    onClick={() => setShowZoomModal(false)}
                >
                    <div className="relative max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-slate-950">
                        {/* Close bar */}
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
                        <img
                            src="/crm-preview.png"
                            alt="Alpha CRM Interface Preview Detailed View"
                            className="w-full h-auto max-h-[85vh] object-contain mx-auto"
                        />
                    </div>
                </div>
            )}

            {/* Checkout / QR Payment Modal */}
            {showCheckoutModal && selectedProduct && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-fast" onClick={closeCheckout}>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-5 border-b border-[var(--border-primary)] flex items-center justify-between bg-black/20">
                            <span className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] leading-tight">{selectedProduct.name}</span>
                            {checkoutResponse?.qrCodeUrl && (
                                <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border monospaced-nums ${
                                    countdown < 60 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-cyan-500/10 text-[var(--accent-primary)] border-cyan-500/20'
                                }`}>
                                    {formatCountdown(countdown)}
                                </span>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {!checkoutResponse ? (
                                <div className="space-y-6">
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                        {t('studio.hub.cards.crm.subscription.checkoutSelectionDesc') || 'Lựa chọn hình thức kích hoạt hạn ngạch thích hợp cho gói bạn đã chọn:'}
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Credits Payment */}
                                        <button
                                            onClick={() => handleCheckout('credit')}
                                            disabled={actionLoading !== null}
                                            className="flex items-center justify-between p-4 bg-black/20 border border-[var(--border-primary)] rounded-2xl hover:border-cyan-500 hover:bg-cyan-500/[0.03] transition-all text-left spring-bounce group cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutWalletTitle') || 'Tài khoản Tín dụng (Credits)'}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-secondary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutWalletDesc').replace('{{balance}}', String((user as any)?.balance || 0))}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-yellow-500 block text-lg group-hover:scale-105 transition-transform monospaced-nums">{selectedProduct.priceCredits}</span>
                                                <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">Credits</span>
                                            </div>
                                        </button>

                                        {/* Bank Transfer Payment */}
                                        <button
                                            onClick={() => handleCheckout('bank_transfer')}
                                            disabled={actionLoading !== null}
                                            className="flex items-center justify-between p-4 bg-black/20 border border-[var(--border-primary)] rounded-2xl hover:border-cyan-500 hover:bg-cyan-500/[0.03] transition-all text-left spring-bounce group cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutBankTitle') || 'Chuyển khoản VietQR'}
                                                </p>
                                                <p className="text-[10px] text-[var(--text-secondary)]">
                                                    {t('studio.hub.cards.crm.subscription.checkoutBankDesc') || 'Quét mã nhận diện biến động tự động 24/7.'}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-cyan-400 block text-base group-hover:scale-105 transition-transform monospaced-nums">{formatCurrency(selectedProduct.priceVnd)}</span>
                                                <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">VND</span>
                                            </div>
                                        </button>
                                    </div>

                                    {actionLoading && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] py-2">
                                            <span className="w-4.5 h-4.5 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></span>
                                            <span>{t('studio.hub.cards.crm.subscription.checkoutLoading') || 'Đang tạo hóa đơn và cổng quét mã...'}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-5 text-center">
                                    {/* VietQR visual frame */}
                                    <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center">
                                        <img src={checkoutResponse.qrCodeUrl} alt="VietQR Banking Code" className="w-56 h-56 object-contain" />
                                    </div>

                                    <div className="space-y-1 select-all">
                                        <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                                            {t('studio.hub.cards.crm.subscription.checkoutBankTransferTo') || 'Chuyển đến tài khoản'}
                                        </p>
                                        <p className="text-sm font-black text-[var(--text-primary)]">
                                            {checkoutResponse.bankInfo?.bankName || 'OCB'} &bull; {checkoutResponse.bankInfo?.accountHolder || 'NGUYEN ANH DUC'}
                                        </p>
                                        <p className="text-xs font-mono font-bold text-[var(--text-secondary)] tracking-wide">
                                            {checkoutResponse.bankInfo?.accountNumber || 'CASS55252503'}
                                        </p>
                                    </div>

                                    {/* Transfer Content */}
                                    <div className="w-full p-3 bg-black/25 border border-[var(--border-primary)] rounded-xl flex items-center justify-between mt-1">
                                        <div className="text-left space-y-0.5">
                                            <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold tracking-wider">
                                                {t('studio.hub.cards.crm.subscription.checkoutBankTransferContent') || 'Cú pháp chuyển khoản chính xác'}
                                            </p>
                                            <p className="font-mono font-black text-cyan-400 text-xs sm:text-sm select-all">{checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode)}
                                            className="px-3 py-2 bg-[var(--accent-primary)] text-black rounded-lg text-xs font-bold hover:opacity-90 spring-bounce cursor-pointer"
                                        >
                                            {t('studio.hub.cards.crm.subscription.checkoutBankCopy') || 'Sao chép'}
                                        </button>
                                    </div>

                                    <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl text-[10px] text-cyan-400 text-left leading-relaxed">
                                        {t('studio.hub.cards.crm.subscription.checkoutBankNote') || '* Robot sẽ tự động dò tìm và duyệt hóa đơn ngay khi nhận được luồng biến động khớp lệnh với cú pháp ở trên. Vui lòng không thay đổi nội dung.'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-primary)] flex gap-3 bg-black/20">
                            <button
                                onClick={closeCheckout}
                                className="flex-1 py-2.5 rounded-xl font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)] spring-bounce text-xs sm:text-sm cursor-pointer"
                            >
                                {t('studio.hub.cards.crm.subscription.checkoutClose') || 'Hủy Bỏ'}
                            </button>
                            {checkoutResponse && (
                                <button
                                    onClick={closeCheckout}
                                    className="flex-1 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-95 shadow-md spring-bounce text-xs sm:text-sm cursor-pointer"
                                >
                                    {t('studio.hub.cards.crm.subscription.checkoutSuccessBtn') || 'Đã Chuyển Tiền'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
