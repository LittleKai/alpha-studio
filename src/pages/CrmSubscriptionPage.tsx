import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
    type CrmReleaseInfo
} from '../services/crmService';

export default function CrmSubscriptionPage() {
    const { t } = useTranslation();
    const { user, refreshUser } = useAuth();
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
            setError(err.message || 'Failed to load data');
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

    const handleCheckout = async (method: 'credits' | 'bank_transfer') => {
        if (!selectedProduct) return;
        setActionLoading(method);
        setError(null);

        try {
            const res = await createCrmCheckout({
                productId: selectedProduct.id,
                productType: selectedProduct.type,
                paymentMethod: method
            });

            setCheckoutResponse(res);

            if (method === 'credits') {
                alert(t('workflow.wallet.paySuccess') || 'Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
                setShowCheckoutModal(false);
                refreshUser(); // Refresh wallet credits display
                loadData();
            } else {
                startCountdown(); // Start OCB bank transfer QR expiration countdown
            }
        } catch (err: any) {
            setError(err.message || 'Lỗi khi xử lý thanh toán.');
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

    // Calculate dates & percentages
    const includedRemaining = sub ? Math.max(0, sub.includedAiLimit - sub.includedAiUsed) : 0;
    const totalRemaining = sub ? (includedRemaining + sub.extraAiRemaining) : 0;
    const includedPct = sub ? (sub.includedAiUsed / sub.includedAiLimit) * 100 : 0;

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
            <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Alpha CRM</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                Quản lý gói dịch vụ phần mềm tiếp thị và tự động hóa Zalo của bạn.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/studio/crm')}
                            disabled={!sub || sub.status !== 'active'}
                            className="px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
                        >
                            <span>Mở Zalo Bot Studio</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                        <p className="text-[var(--text-secondary)]">Đang tải thông tin dịch vụ...</p>
                    </div>
                ) : (
                    <>
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                                {error}
                            </div>
                        )}

                        {/* Top Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Subscription Status Card */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Trạng thái gói</h3>
                                    {sub && sub.status === 'active' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                                                <span className="text-2xl font-black text-green-500">Đang hoạt động</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                Hạn sử dụng đến: <span className="font-semibold text-[var(--text-primary)]">{new Date(sub.periodEnd).toLocaleDateString('vi-VN')}</span>
                                            </p>
                                        </div>
                                    ) : sub && sub.status === 'expired' ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                                <span className="text-2xl font-black text-red-500">Đã hết hạn</span>
                                            </div>
                                            <p className="text-xs text-red-400">
                                                Hạn dùng đã kết thúc vào {new Date(sub.periodEnd).toLocaleDateString('vi-VN')}. Hãy gia hạn để tiếp tục gửi tin nhắn và AI.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                                                <span className="text-2xl font-black text-[var(--text-secondary)]">Chưa đăng ký</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                Bạn chưa có giấy phép Alpha CRM. Mua giấy phép để bắt đầu vận hành chiến dịch tiếp thị Zalo.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Manage/Buy Plan Button */}
                                <div className="mt-6">
                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_monthly',
                                            name: 'Gói Đăng Ký Alpha CRM 1 Tháng',
                                            priceVnd: 200000,
                                            priceCredits: 210,
                                            type: 'plan'
                                        })}
                                        className="w-full py-2.5 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-500 transition-all text-sm"
                                    >
                                        {sub && sub.status === 'active' ? 'Gia hạn gói hàng tháng' : 'Đăng ký gói 1 tháng'}
                                    </button>
                                </div>
                            </div>

                            {/* Quota Usage Progress Card */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">AI Quota trong chu kỳ</h3>
                                    <div className="space-y-2">
                                        <div className="text-4xl font-black flex items-baseline gap-2">
                                            <span>{sub ? (sub.includedAiLimit - sub.includedAiUsed) : 0}</span>
                                            <span className="text-lg text-[var(--text-tertiary)] font-bold">/ {sub ? sub.includedAiLimit : 500}</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)]">Yêu cầu AI miễn phí đi kèm chu kỳ hàng tháng.</p>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-1">
                                        <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${Math.min(100, includedPct)}%` }}
                                            ></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
                                            <span>Đã dùng: {sub ? sub.includedAiUsed : 0}</span>
                                            <span>Hạn mức: {sub ? sub.includedAiLimit : 500}</span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-[var(--text-tertiary)] mt-4">
                                    * Chỉ bị khấu trừ quota sau khi AI trả phản hồi thành công.
                                </p>
                            </div>

                            {/* Extra packs remaining */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">AI Quota Mua Thêm</h3>
                                    <div className="space-y-2">
                                        <div className="text-4xl font-black text-emerald-400">
                                            +{sub ? sub.extraAiRemaining : 0}
                                            <span className="text-xs text-[var(--text-tertiary)] font-bold ml-2">Requests</span>
                                        </div>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            Không giới hạn thời gian sử dụng, khả dụng khi gói chính còn hoạt động.
                                        </p>
                                    </div>

                                    <div className="bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 text-xs text-emerald-400 flex items-center justify-between">
                                        <span>Tổng AI khả dụng hiện tại:</span>
                                        <span className="font-bold">{totalRemaining} Requests</span>
                                    </div>
                                </div>

                                <div className="mt-4 text-xs text-[var(--text-tertiary)]">
                                    Quá hạn gói đăng ký chính sẽ tạm giữ quota mua thêm này.
                                </div>
                            </div>
                        </div>

                        {/* Downloads and Instruction Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Download Area */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md space-y-4">
                                <h3 className="text-xl font-bold">Tải bộ cài đặt phần mềm</h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Tải phiên bản mới nhất của ứng dụng khách (Client PC) và ứng dụng kết nối di động Android.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                    {/* Windows */}
                                    <a
                                        href={release?.windowsInstallerUrl || 'https://github.com/LittleKai/alpha-crm-app/releases'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-center group"
                                    >
                                        <svg className="w-10 h-10 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.101zM11.25 1.9L24 0v11.55H11.25V1.9zM11.25 12.45H24v11.55l-12.75-1.9v-9.65z"/>
                                        </svg>
                                        <span className="font-bold text-sm">Windows Setup</span>
                                        <span className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                            Phiên bản {release?.version || '1.0.0'} (Active PC)
                                        </span>
                                    </a>

                                    {/* Android */}
                                    <a
                                        href={release?.androidApkUrl || 'https://github.com/LittleKai/alpha-crm-app/releases'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all text-center group"
                                    >
                                        <svg className="w-10 h-10 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.523 15.3l1.816 3.146a.5.5 0 01-.173.682.5.5 0 01-.682-.172L16.63 15.75c-1.42.617-2.992.95-4.63.95s-3.21-.333-4.63-.95L5.516 18.8a.5.5 0 01-.682.173.5.5 0 01-.173-.682l1.816-3.146C3.722 13.784 2 11.082 2 8h20c0 3.082-1.722 5.784-4.477 7.3zM7 6a1 1 0 100-2 1 1 0 000 2zm10 0a1 1 0 100-2 1 1 0 000 2z"/>
                                        </svg>
                                        <span className="font-bold text-sm">Android APK</span>
                                        <span className="text-[10px] text-[var(--text-tertiary)] mt-1">
                                            Kết nối & pairing QR code di động
                                        </span>
                                    </a>
                                </div>
                            </div>

                            {/* Brief Guide */}
                            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md space-y-4">
                                <h3 className="text-xl font-bold">Hướng dẫn khởi tạo</h3>
                                <ul className="text-xs text-[var(--text-secondary)] space-y-3">
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                                        <span>Đăng ký giấy phép Alpha CRM (bằng tín dụng wallet hoặc chuyển khoản).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                                        <span>Cài đặt và khởi chạy **Windows Setup** trên máy tính phục vụ chạy Zalo Automation.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                                        <span>Mở app Windows, đăng nhập và quét mã QR pairing thông qua ứng dụng **Android APK** hoặc fallback mã 6 chữ số để kích hoạt liên kết outbound.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-[10px] shrink-0">4</span>
                                        <span>Mở Zalo Bot Studio trên web, tạo liên hệ và gửi tin nhắn tự động hàng loạt cực kỳ dễ dàng.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Extra AI top-up catalog */}
                        <div className="space-y-6">
                            <h3 className="text-2xl font-black text-[var(--text-primary)]">Mua thêm hạn mức AI</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Pack 100 */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform group">
                                    <div className="space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Gói AI Top-up 100</h4>
                                        <div className="text-2xl font-black text-[var(--text-primary)]">50.000đ <span className="text-xs text-[var(--text-tertiary)]">hoặc 50 Credits</span></div>
                                        <p className="text-xs text-[var(--text-secondary)]">Thêm +100 yêu cầu AI thành công sử dụng trong chu kỳ.</p>
                                    </div>
                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_100',
                                            name: 'Gói AI Top-up 100',
                                            priceVnd: 50000,
                                            priceCredits: 50,
                                            type: 'addon'
                                        })}
                                        className="w-full py-2.5 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-emerald-500 hover:text-emerald-500 mt-6 transition-all text-sm"
                                    >
                                        Mua gói AI 100
                                    </button>
                                </div>

                                {/* Pack 500 */}
                                <div className="bg-[var(--bg-card)] border border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20 rounded-2xl p-6 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 bg-[var(--accent-primary)] text-black text-[8px] font-black px-2.5 py-1 rounded-bl-lg uppercase tracking-wider">
                                        Phổ biến
                                    </div>
                                    <div className="space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Gói AI Top-up 500</h4>
                                        <div className="text-2xl font-black text-[var(--text-primary)]">200.000đ <span className="text-xs text-[var(--text-tertiary)]">hoặc 200 Credits</span></div>
                                        <p className="text-xs text-[var(--text-secondary)]">Thêm +500 yêu cầu AI thành công. Tối ưu chi phí doanh nghiệp.</p>
                                    </div>
                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_500',
                                            name: 'Gói AI Top-up 500',
                                            priceVnd: 200000,
                                            priceCredits: 200,
                                            type: 'addon'
                                        })}
                                        className="w-full py-2.5 rounded-xl font-bold bg-[var(--accent-primary)] text-black hover:opacity-90 mt-6 transition-all text-sm"
                                    >
                                        Mua gói AI 500
                                    </button>
                                </div>

                                {/* Pack 1000 */}
                                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md flex flex-col justify-between hover:-translate-y-1 transition-transform group">
                                    <div className="space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <h4 className="text-lg font-bold text-[var(--text-primary)]">Gói AI Top-up 1000</h4>
                                        <div className="text-2xl font-black text-[var(--text-primary)]">350.000đ <span className="text-xs text-[var(--text-tertiary)]">hoặc 350 Credits</span></div>
                                        <p className="text-xs text-[var(--text-secondary)]">Thêm +1000 yêu cầu AI thành công. Tiết kiệm tối đa 30%.</p>
                                    </div>
                                    <button
                                        onClick={() => handleSelectProduct({
                                            id: 'crm_ai_pack_1000',
                                            name: 'Gói AI Top-up 1000',
                                            priceVnd: 350000,
                                            priceCredits: 350,
                                            type: 'addon'
                                        })}
                                        className="w-full py-2.5 rounded-xl font-bold bg-[var(--bg-secondary)] border border-[var(--border-primary)] hover:border-emerald-500 hover:text-emerald-500 mt-6 transition-all text-sm"
                                    >
                                        Mua gói AI 1000
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User Billing History Table */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-md space-y-4">
                            <h3 className="text-xl font-bold">Lịch sử thanh toán CRM</h3>
                            {orders.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">Chưa có giao dịch CRM nào được thực hiện.</p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)]">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-xs uppercase text-[var(--text-secondary)]">
                                                <th className="p-3">Mã GD</th>
                                                <th className="p-3">Sản phẩm</th>
                                                <th className="p-3">Thanh toán</th>
                                                <th className="p-3 text-right">Chi phí</th>
                                                <th className="p-3 text-center">Trạng thái</th>
                                                <th className="p-3">Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)]">
                                            {orders.map(o => (
                                                <tr key={o._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3 font-mono text-xs">{o.transactionCode}</td>
                                                    <td className="p-3 font-semibold">{o.description}</td>
                                                    <td className="p-3">
                                                        {o.paymentMethod === 'credits' ? 'Credits Wallet' : 'Bank Transfer'}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">
                                                        {o.paymentMethod === 'credits' ? `${o.credits} Credits` : formatCurrency(o.amount)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            o.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                            o.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            o.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-gray-500/10 text-gray-500'
                                                        }`}>
                                                            {o.status === 'completed' ? 'Đã duyệt' :
                                                             o.status === 'pending' ? 'Chờ duyệt' : o.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-[var(--text-secondary)]">
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

            {/* Checkout / QR Payment Modal */}
            {showCheckoutModal && selectedProduct && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={closeCheckout}>
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                            <span className="font-bold text-lg">{selectedProduct.name}</span>
                            {checkoutResponse?.qrCodeUrl && (
                                <span className={`text-xs font-mono font-bold px-2 py-1 rounded bg-[var(--bg-secondary)] ${
                                    countdown < 60 ? 'text-red-500' : 'text-emerald-500'
                                }`}>
                                    Hết hạn: {formatCountdown(countdown)}
                                </span>
                            )}
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {!checkoutResponse ? (
                                <div className="space-y-6">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        Hãy lựa chọn phương thức thanh toán phù hợp cho gói đã chọn:
                                    </p>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Credits Payment */}
                                        <button
                                            onClick={() => handleCheckout('credits')}
                                            disabled={actionLoading !== null}
                                            className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left"
                                        >
                                            <div>
                                                <p className="font-bold text-sm">Tài khoản Tín dụng (Credits)</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    Số dư hiện tại: <span className="font-semibold text-yellow-500">{(user as any)?.balance || 0} Credits</span>
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-yellow-500 block text-lg">{selectedProduct.priceCredits}</span>
                                                <span className="text-[10px] text-[var(--text-tertiary)]">Credits</span>
                                            </div>
                                        </button>

                                        {/* Bank Transfer Payment */}
                                        <button
                                            onClick={() => handleCheckout('bank_transfer')}
                                            disabled={actionLoading !== null}
                                            className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-left"
                                        >
                                            <div>
                                                <p className="font-bold text-sm">Chuyển khoản Ngân hàng (VietQR)</p>
                                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                    Quét mã chuyển khoản tức thì 24/7.
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-black text-emerald-400 block text-lg">{formatCurrency(selectedProduct.priceVnd)}</span>
                                                <span className="text-[10px] text-[var(--text-tertiary)]">VND</span>
                                            </div>
                                        </button>
                                    </div>

                                    {actionLoading && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)] py-2">
                                            <div className="w-4 h-4 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                            <span>Đang tạo yêu cầu giao dịch...</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 text-center">
                                    <div className="bg-white p-3 rounded-2xl shadow-inner border border-gray-100">
                                        <img src={checkoutResponse.qrCodeUrl} alt="VietQR VietQR" className="w-60 h-60 object-contain" />
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-[var(--text-tertiary)]">Chuyển đến tài khoản</p>
                                        <p className="text-sm font-bold text-[var(--text-primary)]">
                                            {checkoutResponse.bankInfo?.bankName || 'OCB'} &bull; {checkoutResponse.bankInfo?.accountHolder || 'NGUYEN ANH DUC'}
                                        </p>
                                        <p className="text-sm font-mono text-[var(--text-secondary)]">
                                            {checkoutResponse.bankInfo?.accountNumber || 'CASS55252503'}
                                        </p>
                                    </div>

                                    {/* Transfer Content */}
                                    <div className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl flex items-center justify-between mt-2">
                                        <div className="text-left">
                                            <p className="text-[10px] text-[var(--text-tertiary)]">Nội dung chuyển khoản chính xác</p>
                                            <p className="font-mono font-black text-emerald-400 text-sm">{checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode}</p>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(checkoutResponse.order.transferContent || checkoutResponse.order.transactionCode)}
                                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:opacity-90 active:scale-95 transition-transform"
                                        >
                                            Sao chép
                                        </button>
                                    </div>

                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-400 text-left">
                                        Hệ thống sẽ tự động duyệt kích hoạt dịch vụ ngay khi nhận được thông báo biến động số dư chuyển khoản khớp hoàn toàn với nội dung ở trên.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-[var(--border-primary)] flex gap-3 bg-[var(--bg-secondary)]/50">
                            <button
                                onClick={closeCheckout}
                                className="flex-1 py-2.5 rounded-xl font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)] border border-[var(--border-primary)]"
                            >
                                Đóng
                            </button>
                            {checkoutResponse && (
                                <button
                                    onClick={closeCheckout}
                                    className="flex-1 py-2.5 rounded-xl font-bold bg-emerald-500 text-white hover:opacity-90 shadow-md"
                                >
                                    Đã chuyển khoản thành công
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
