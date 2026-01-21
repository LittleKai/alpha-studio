import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import {
    getPaymentHistory,
    createPaymentRequest,
    checkTransactionStatus,
    formatCurrency,
    formatDate,
    Transaction,
    PaymentRequest,
} from '../services/paymentService';
import { Layout } from '../components/layout';

// Icon components
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const WalletIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
        <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"></path>
    </svg>
);

const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const RefreshIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const BankIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="10" width="18" height="11" rx="2"></rect>
        <path d="m3 10 9-7 9 7"></path>
        <path d="M12 14v4"></path>
    </svg>
);

const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
        <path d="M12 7v5l4 2"></path>
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 16v-4"></path>
        <path d="M12 8h.01"></path>
    </svg>
);

// Preset amounts
const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const { t } = useTranslation();
    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
        pending: {
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/20 border-yellow-500/30',
            label: t('payment.status.pending', 'Pending'),
        },
        completed: {
            color: 'text-green-400',
            bg: 'bg-green-500/20 border-green-500/30',
            label: t('payment.status.completed', 'Completed'),
        },
        failed: {
            color: 'text-red-400',
            bg: 'bg-red-500/20 border-red-500/30',
            label: t('payment.status.failed', 'Failed'),
        },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.color}`}>
            {status === 'pending' && <ClockIcon />}
            {status === 'completed' && <CheckIcon />}
            {config.label}
        </span>
    );
};

const TopUpPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();

    // State
    const [amount, setAmount] = useState<number>(100000);
    const [customAmount, setCustomAmount] = useState<string>('');
    const [isCustom, setIsCustom] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

    // Load payment history
    const loadHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            const response = await getPaymentHistory(1, 20);
            setTransactions(response.data);
        } catch (err) {
            console.error('Failed to load history:', err);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // Handle preset amount selection
    const handlePresetClick = (value: number) => {
        setAmount(value);
        setIsCustom(false);
        setCustomAmount('');
    };

    // Handle custom amount
    const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setCustomAmount(value);
        setIsCustom(true);
        if (value) {
            setAmount(parseInt(value, 10));
        }
    };

    // Create payment request
    const handleCreatePayment = async () => {
        if (amount < 10000) {
            setError(t('payment.error.minAmount', 'Minimum amount is 10,000 VND'));
            return;
        }
        if (amount > 100000000) {
            setError(t('payment.error.maxAmount', 'Maximum amount is 100,000,000 VND'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const request = await createPaymentRequest(amount);
            setPaymentRequest(request);
            loadHistory(); // Refresh history
        } catch (err: any) {
            setError(err.message || t('payment.error.createFailed', 'Failed to create payment request'));
        } finally {
            setIsLoading(false);
        }
    };

    // Check transaction status
    const handleCheckStatus = async (transactionId: string) => {
        setCheckingStatus(transactionId);
        try {
            const updated = await checkTransactionStatus(transactionId);
            setTransactions(prev =>
                prev.map(t => (t._id === transactionId ? updated : t))
            );
            if (updated.status === 'completed') {
                refreshUser(); // Refresh user balance
            }
        } catch (err) {
            console.error('Failed to check status:', err);
        } finally {
            setCheckingStatus(null);
        }
    };

    // Copy to clipboard
    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    // Reset payment request
    const handleNewPayment = () => {
        setPaymentRequest(null);
        setAmount(100000);
        setCustomAmount('');
        setIsCustom(false);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Header */}
                <div className="bg-gray-800/50 border-b border-gray-700 sticky top-0 z-10 backdrop-blur-sm">
                    <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                        <button
                            onClick={() => navigate('/workflow')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeftIcon />
                            <span>{t('common.back', 'Back')}</span>
                        </button>
                        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                            <WalletIcon />
                            {t('payment.title', 'Top Up Balance')}
                        </h1>
                        <div className="flex items-center gap-2 text-purple-400">
                            <span className="text-sm text-gray-400">{t('payment.balance', 'Balance')}:</span>
                            <span className="font-bold">{formatCurrency((user as any)?.balance || 0)}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
                    {/* Top Up Form */}
                    {!paymentRequest ? (
                        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                                <BankIcon />
                                {t('payment.selectAmount', 'Select Amount')}
                            </h2>

                            {/* Preset Amounts */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                                {PRESET_AMOUNTS.map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => handlePresetClick(preset)}
                                        className={`py-4 px-4 rounded-xl border-2 transition-all text-center ${
                                            amount === preset && !isCustom
                                                ? 'border-purple-500 bg-purple-600/20 text-white'
                                                : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-purple-500/50'
                                        }`}
                                    >
                                        <span className="font-bold text-lg">{formatCurrency(preset)}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">
                                    {t('payment.customAmount', 'Or enter custom amount')}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={customAmount}
                                        onChange={handleCustomAmountChange}
                                        placeholder="0"
                                        className={`w-full bg-gray-700/50 border-2 rounded-xl px-4 py-4 text-white text-xl font-bold placeholder-gray-500 focus:outline-none transition-colors ${
                                            isCustom ? 'border-purple-500' : 'border-gray-600 focus:border-purple-500'
                                        }`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                        VND
                                    </span>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-gray-700/30 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">{t('payment.totalAmount', 'Amount to top up')}</span>
                                    <span className="text-2xl font-bold text-white">{formatCurrency(amount)}</span>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                onClick={handleCreatePayment}
                                disabled={isLoading || amount < 10000}
                                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {t('payment.processing', 'Processing...')}
                                    </>
                                ) : (
                                    t('payment.createRequest', 'Create Payment Request')
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Payment Instructions */
                        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <BankIcon />
                                    {t('payment.transferInfo', 'Bank Transfer Information')}
                                </h2>
                                <button
                                    onClick={handleNewPayment}
                                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    {t('payment.newPayment', 'New Payment')}
                                </button>
                            </div>

                            {/* Amount Summary */}
                            <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4 mb-6">
                                <div className="flex justify-between items-center">
                                    <span className="text-purple-300">{t('payment.amountToTransfer', 'Amount to transfer')}</span>
                                    <span className="text-2xl font-bold text-white">{formatCurrency(paymentRequest.transaction.amount)}</span>
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-400">{t('payment.bankName', 'Bank')}</p>
                                        <p className="text-white font-medium">{paymentRequest.bankInfo.bankName}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-400">{t('payment.accountNumber', 'Account Number')}</p>
                                        <p className="text-white font-medium">{paymentRequest.bankInfo.accountNumber}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(paymentRequest.bankInfo.accountNumber, 'account')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm transition-colors"
                                    >
                                        {copiedField === 'account' ? <CheckIcon /> : <CopyIcon />}
                                        {copiedField === 'account' ? t('payment.copied', 'Copied') : t('payment.copy', 'Copy')}
                                    </button>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                                    <div>
                                        <p className="text-sm text-gray-400">{t('payment.accountHolder', 'Account Holder')}</p>
                                        <p className="text-white font-medium">{paymentRequest.bankInfo.accountHolder}</p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                                    <div>
                                        <p className="text-sm text-yellow-400">{t('payment.transferContent', 'Transfer Content (IMPORTANT)')}</p>
                                        <p className="text-white font-bold text-lg">{paymentRequest.transferContent}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(paymentRequest.transferContent, 'content')}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm transition-colors"
                                    >
                                        {copiedField === 'content' ? <CheckIcon /> : <CopyIcon />}
                                        {copiedField === 'content' ? t('payment.copied', 'Copied') : t('payment.copy', 'Copy')}
                                    </button>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <h3 className="font-semibold text-blue-400 flex items-center gap-2 mb-3">
                                    <InfoIcon />
                                    {t('payment.instructions', 'Instructions')}
                                </h3>
                                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                                    <li>{t('payment.instruction1', 'Open your banking app')}</li>
                                    <li>{t('payment.instruction2', 'Transfer the exact amount shown above')}</li>
                                    <li>{t('payment.instruction3', 'Use the transfer content EXACTLY as shown')}</li>
                                    <li>{t('payment.instruction4', 'Your balance will be updated automatically within 1-5 minutes')}</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Transaction History */}
                    <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <HistoryIcon />
                                {t('payment.history', 'Transaction History')}
                            </h2>
                            <button
                                onClick={loadHistory}
                                disabled={loadingHistory}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors text-gray-300"
                            >
                                <RefreshIcon />
                                {t('payment.refresh', 'Refresh')}
                            </button>
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                {t('payment.noTransactions', 'No transactions yet')}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((transaction) => (
                                    <div
                                        key={transaction._id}
                                        className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-mono text-sm text-gray-400">
                                                    {transaction.transactionCode}
                                                </span>
                                                <StatusBadge status={transaction.status} />
                                            </div>
                                            <p className="text-white font-bold">
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(transaction.createdAt)}
                                            </p>
                                        </div>
                                        {transaction.status === 'pending' && (
                                            <button
                                                onClick={() => handleCheckStatus(transaction._id)}
                                                disabled={checkingStatus === transaction._id}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 hover:bg-purple-600/30 transition-colors"
                                            >
                                                {checkingStatus === transaction._id ? (
                                                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <RefreshIcon />
                                                )}
                                                {t('payment.checkStatus', 'Check')}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default TopUpPage;
