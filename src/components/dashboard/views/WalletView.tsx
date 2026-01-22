import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import {
  createPaymentRequest,
  cancelTransaction,
  confirmPayment,
  getPaymentHistory,
  formatCurrency,
  formatDate,
  type CreditPackage,
  type Transaction,
  type BankInfo
} from '../../../services/paymentService';

// SVG Icons for packages
const PackageIcons: Record<string, JSX.Element> = {
  pkg0: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="8" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-2-6h4" /></svg>,
  pkg1: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
  pkg2: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  pkg3: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>,
  pkg4: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
};

// Credit packages with display info
const CREDIT_PACKAGES: (CreditPackage & { priceLabel: string; color: string })[] = [
  { id: 'pkg0', credits: 10, price: 10000, label: '10 Credits', priceLabel: '10.000đ', color: 'from-gray-500 to-slate-500' },
  { id: 'pkg1', credits: 100, price: 100000, label: '100 Credits', priceLabel: '100.000đ', color: 'from-blue-500 to-cyan-500' },
  { id: 'pkg2', credits: 210, price: 200000, label: '210 Credits', priceLabel: '200.000đ', bonus: '+5%', color: 'from-green-500 to-emerald-500' },
  { id: 'pkg3', credits: 550, price: 500000, label: '550 Credits', priceLabel: '500.000đ', bonus: '+10%', popular: true, color: 'from-purple-500 to-pink-500' },
  { id: 'pkg4', credits: 1120, price: 1000000, label: '1.120 Credits', priceLabel: '1.000.000đ', bonus: '+12%', color: 'from-orange-500 to-red-500' },
];

export default function WalletView() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // QR Payment State
  const [selectedPackage, setSelectedPackage] = useState<typeof CREDIT_PACKAGES[0] | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [transferContent, setTransferContent] = useState<string>('');
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5 * 60); // 5 minutes
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // History State
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Bank Info
  const [bankInfo, setBankInfo] = useState<BankInfo>({
    bankId: 'OCB',
    bankName: 'OCB (Phương Đông)',
    accountNumber: 'CASS55252503',
    accountHolder: 'NGUYEN ANH DUC'
  });

  // Get user balance
  const balance = (user as any)?.balance || 0;

  // Cleanup countdown on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    setCountdown(5 * 60);

    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          handleCancelPayment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle package selection - Create payment request via API
  const handleSelectPackage = async (pkg: typeof CREDIT_PACKAGES[0]) => {
    setPaymentLoading(true);
    setPaymentError(null);
    setSelectedPackage(pkg);

    try {
      const response = await createPaymentRequest(pkg.id);

      setQrCodeUrl(response.qrCodeUrl);
      setTransferContent(response.transferContent);
      setCurrentTransactionId(response.transaction._id);
      setBankInfo(response.bankInfo);
      setQrModalOpen(true);
      startCountdown();

    } catch (error: any) {
      setPaymentError(error.message || 'Không thể tạo yêu cầu nạp tiền');
      setSelectedPackage(null);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Cancel payment
  const handleCancelPayment = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    if (currentTransactionId) {
      try {
        await cancelTransaction(currentTransactionId);
      } catch (error) {
        console.error('Failed to cancel transaction:', error);
      }
    }

    setQrModalOpen(false);
    setSelectedPackage(null);
    setQrCodeUrl('');
    setTransferContent('');
    setCurrentTransactionId(null);
    setCountdown(5 * 60);
  };

  // Confirm payment (user has transferred)
  const handleConfirmPayment = async () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Call API to set confirmedAt timestamp
    if (currentTransactionId) {
      try {
        await confirmPayment(currentTransactionId);
      } catch (error) {
        console.error('Failed to confirm payment:', error);
      }
    }

    setQrModalOpen(false);
    setSelectedPackage(null);
    setQrCodeUrl('');
    setTransferContent('');
    setCurrentTransactionId(null);
    setCountdown(5 * 60);

    // Refresh history
    if (showHistory) {
      loadHistory();
    }

    alert('Giao dịch đã được ghi nhận. Vui lòng đợi hệ thống xác nhận (1-5 phút).');
  };

  // Load payment history
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getPaymentHistory(1, 20);
      setPaymentHistory(response.data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Toggle history view
  const handleToggleHistory = () => {
    const newState = !showHistory;
    setShowHistory(newState);
    if (newState && paymentHistory.length === 0) {
      loadHistory();
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép!');
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-500';
      case 'timeout':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'pending': return 'Đang chờ';
      case 'failed': return 'Thất bại';
      case 'cancelled': return 'Đã hủy';
      case 'timeout': return 'Hết hạn';
      default: return status;
    }
  };

  return (
    <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-r from-yellow-600 to-amber-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.29 0 2.13-.72 2.13-1.55 0-.8-.68-1.38-2.26-1.75-2.03-.49-3.08-1.5-3.08-2.81 0-1.74 1.35-2.88 3.2-3.21V6h2.67v1.95c1.47.33 2.65 1.28 2.87 2.9h-1.99c-.15-.99-1.09-1.63-2.16-1.63-1.15 0-1.92.7-1.92 1.5 0 .75.64 1.29 2.16 1.65 2.12.51 3.19 1.57 3.19 2.92 0 1.91-1.54 3.03-3.36 3.35z"/>
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">
              {t('workflow.wallet.balance')}
            </h2>
            <div className="text-6xl font-black mb-4 flex items-end gap-2">
              {balance.toLocaleString()}
              <span className="text-2xl font-bold mb-2">Credits</span>
            </div>
            <p className="text-sm opacity-90 max-w-md">
              Sử dụng Credits để thuê máy chủ GPU tốc độ cao, đăng ký khóa học chuyên sâu.
            </p>
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8 flex flex-col justify-center shadow-xl">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Hướng dẫn nạp tiền</h2>
          <ul className="text-sm text-[var(--text-secondary)] space-y-2 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-green-500">1.</span>
              Chọn gói Credits bên dưới
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">2.</span>
              Quét mã QR hoặc chuyển khoản thủ công
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">3.</span>
              Nhập đúng nội dung chuyển khoản
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">4.</span>
              Credits sẽ được cộng tự động trong 1-5 phút
            </li>
          </ul>
          <p className="text-xs text-[var(--text-tertiary)]">
            Hỗ trợ: Momo, ZaloPay có thể quét mã QR ngân hàng
          </p>
        </div>
      </div>

      {/* Error Message */}
      {paymentError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {paymentError}
          <button
            onClick={() => setPaymentError(null)}
            className="ml-4 underline hover:no-underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Credit Packages */}
      <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{t('workflow.wallet.buy')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {CREDIT_PACKAGES.map(pkg => (
          <div
            key={pkg.id}
            className={`bg-[var(--bg-card)] border ${pkg.popular ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20' : 'border-[var(--border-primary)]'} rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform`}
          >
            {pkg.popular && (
              <div className="absolute top-0 right-0 bg-[var(--accent-primary)] text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Phổ biến
              </div>
            )}
            {pkg.bonus && (
              <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                {pkg.bonus}
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white mb-4 mt-2`}>
              {PackageIcons[pkg.id]}
            </div>
            <h4 className="text-lg font-bold text-[var(--text-primary)]">{pkg.label}</h4>
            <div className="text-3xl font-black text-[var(--text-primary)] my-2">{pkg.priceLabel}</div>
            <ul className="space-y-2 mb-6 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Thuê Server GPU</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Mua khóa học</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Đăng tuyển dụng</li>
            </ul>
            <button
              onClick={() => handleSelectPackage(pkg)}
              disabled={paymentLoading}
              className={`w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50 ${pkg.popular ? 'bg-[var(--accent-primary)] text-black hover:opacity-90' : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]'}`}
            >
              {paymentLoading && selectedPackage?.id === pkg.id ? 'Đang xử lý...' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>

      {/* Transaction History Toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{t('workflow.wallet.history')}</h3>
        <button
          onClick={handleToggleHistory}
          className="text-sm text-[var(--accent-primary)] hover:underline"
        >
          {showHistory ? 'Ẩn lịch sử' : 'Xem lịch sử giao dịch'}
        </button>
      </div>

      {/* Transaction History */}
      {showHistory && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
          {historyLoading ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">Đang tải...</div>
          ) : paymentHistory.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-tertiary)]">Chưa có giao dịch nào</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-xs uppercase text-[var(--text-secondary)]">
                  <th className="p-4">Mã GD</th>
                  <th className="p-4">Thời gian</th>
                  <th className="p-4 text-right">Số tiền</th>
                  <th className="p-4 text-right">Credits</th>
                  <th className="p-4 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {paymentHistory.map(tx => (
                  <tr key={tx._id} className="text-sm">
                    <td className="p-4 text-[var(--text-secondary)] font-mono text-xs">{tx.transactionCode}</td>
                    <td className="p-4 text-[var(--text-secondary)]">{formatDate(tx.createdAt)}</td>
                    <td className="p-4 text-right font-bold text-[var(--text-primary)]">{formatCurrency(tx.amount)}</td>
                    <td className="p-4 text-right font-bold text-green-500">+{tx.credits}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusBadge(tx.status)}`}>
                        {getStatusText(tx.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {showHistory && (
            <div className="p-4 border-t border-[var(--border-primary)] flex justify-center">
              <button
                onClick={loadHistory}
                disabled={historyLoading}
                className="text-sm text-[var(--accent-primary)] hover:underline disabled:opacity-50"
              >
                {historyLoading ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={handleCancelPayment}>
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
              <span className="font-medium text-[var(--text-primary)]">Thanh toán {selectedPackage.priceLabel}</span>
              <span className={`text-sm font-mono ${countdown < 60 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                {formatCountdown(countdown)}
              </span>
            </div>

            {/* QR Code */}
            <div className="p-6 flex flex-col items-center">
              <div className="bg-white p-3 rounded-lg mb-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 object-contain" />
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-4">{bankInfo.bankName} • {bankInfo.accountHolder}</p>

              {/* Transfer Content */}
              <div className="w-full p-3 bg-[var(--bg-secondary)] rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Nội dung CK</p>
                  <p className="font-mono font-bold text-[var(--text-primary)]">{transferContent}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(transferContent)}
                  className="px-3 py-1.5 bg-[var(--accent-primary)] text-black rounded text-xs font-medium hover:opacity-90"
                >
                  Sao chép
                </button>
              </div>

              <p className="text-xs text-[var(--text-tertiary)] mt-3 text-center">
                Nhập đúng nội dung CK để được cộng {selectedPackage.credits} Credits tự động
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--border-primary)] flex gap-3">
              <button
                onClick={handleCancelPayment}
                className="flex-1 py-2.5 rounded-lg font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 py-2.5 rounded-lg font-medium bg-[var(--accent-primary)] text-black hover:opacity-90"
              >
                Đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
