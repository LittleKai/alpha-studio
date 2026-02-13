import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import { Layout } from '../components/layout';
import ArticlesAdminTab from '../components/admin/ArticlesAdminTab';
import {
    getUsers,
    getUserDetails,
    getUserTransactions,
    manualTopup,
    resetUserPassword,
    getAllTransactions,
    getWebhookLogs,
    reprocessWebhook,
    assignWebhookToUser,
    ignoreWebhook,
    formatCurrency,
    formatDate,
    type AdminUser,
    type AdminTransaction,
    type WebhookLog,
} from '../services/adminService';

type TopTabType = 'about' | 'services' | 'transactions';
type SubTabType = 'users' | 'transactionsList' | 'webhooks';

export default function AdminPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useTranslation();
    const [activeTopTab, setActiveTopTab] = useState<TopTabType>('about');
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('users');

    // Check admin/mod access
    useEffect(() => {
        if (user && user.role !== 'admin' && user.role !== 'mod') {
            navigate('/');
        }
    }, [user, navigate]);

    if (!user || (user.role !== 'admin' && user.role !== 'mod')) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-[var(--text-secondary)]">{t('admin.articles.loading')}</p>
                </div>
            </Layout>
        );
    }

    const topTabs = [
        { id: 'about' as TopTabType, label: t('admin.tabs.about') },
        { id: 'services' as TopTabType, label: t('admin.tabs.services') },
        { id: 'transactions' as TopTabType, label: t('admin.tabs.transactions') },
    ];

    const subTabs = [
        { id: 'users' as SubTabType, label: t('admin.tabs.users') },
        { id: 'transactionsList' as SubTabType, label: t('admin.tabs.transactionsList') },
        { id: 'webhooks' as SubTabType, label: t('admin.tabs.webhooks') },
    ];

    return (
        <Layout>
            <div className="min-h-screen bg-[var(--bg-primary)] p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('admin.management.title')}</h1>
                        <p className="text-sm text-[var(--text-secondary)]">{t('admin.management.subtitle')}</p>
                    </div>

                    {/* Top-Level Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-[var(--border-primary)]">
                        {topTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTopTab(tab.id)}
                                className={`px-4 py-2 font-medium transition-colors ${
                                    activeTopTab === tab.id
                                        ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTopTab === 'about' && <ArticlesAdminTab category="about" />}
                    {activeTopTab === 'services' && <ArticlesAdminTab category="services" />}
                    {activeTopTab === 'transactions' && (
                        <div>
                            {/* Sub-Tabs */}
                            <div className="flex gap-2 mb-6">
                                {subTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSubTab(tab.id)}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                            activeSubTab === tab.id
                                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {activeSubTab === 'users' && <UsersTab />}
                            {activeSubTab === 'transactionsList' && <TransactionsTab />}
                            {activeSubTab === 'webhooks' && <WebhooksTab />}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

// Users Tab Component
function UsersTab() {
    const { t } = useTranslation();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [userStats, setUserStats] = useState<any>(null);
    const [userTransactions, setUserTransactions] = useState<AdminTransaction[]>([]);
    const [topupAmount, setTopupAmount] = useState('');
    const [topupNote, setTopupNote] = useState('');
    const [topupLoading, setTopupLoading] = useState(false);
    const [resetPwLoading, setResetPwLoading] = useState(false);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getUsers(1, 50, search);
            setUsers(response.data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const debounce = setTimeout(loadUsers, 300);
        return () => clearTimeout(debounce);
    }, [loadUsers]);

    const handleSelectUser = async (user: AdminUser) => {
        setSelectedUser(user);
        try {
            const [detailsRes, txRes] = await Promise.all([
                getUserDetails(user._id),
                getUserTransactions(user._id, 1, 20),
            ]);
            setUserStats(detailsRes.data.stats);
            setUserTransactions(txRes.data);
        } catch (error) {
            console.error('Failed to load user details:', error);
        }
    };

    const handleTopup = async () => {
        if (!selectedUser || !topupAmount) return;
        const credits = parseInt(topupAmount);
        if (isNaN(credits) || credits <= 0) {
            alert('Số credits không hợp lệ');
            return;
        }

        try {
            setTopupLoading(true);
            const result = await manualTopup(selectedUser._id, credits, topupNote);
            alert(result.message);
            setTopupAmount('');
            setTopupNote('');
            handleSelectUser(selectedUser);
            loadUsers();
        } catch (error: any) {
            alert(error.message || 'Lỗi top-up');
        } finally {
            setTopupLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!selectedUser) return;
        if (!confirm(t('admin.resetPassword.confirmPrefix') + selectedUser.name + t('admin.resetPassword.confirmSuffix'))) return;

        try {
            setResetPwLoading(true);
            const result = await resetUserPassword(selectedUser._id);
            alert(t('admin.resetPassword.successPrefix') + result.data.newPassword + t('admin.resetPassword.successSuffix'));
        } catch (error: any) {
            alert(error.message || t('admin.resetPassword.error'));
        } finally {
            setResetPwLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User List */}
            <div className="lg:col-span-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
                <input
                    type="text"
                    placeholder="Tìm user (tên, email)..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] mb-4"
                />

                {loading ? (
                    <p className="text-center text-[var(--text-secondary)]">Loading...</p>
                ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {users.map((u) => (
                            <div
                                key={u._id}
                                onClick={() => handleSelectUser(u)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedUser?._id === u._id
                                        ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]'
                                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)]'
                                }`}
                            >
                                <p className="font-medium text-[var(--text-primary)]">{u.name}</p>
                                <p className="text-xs text-[var(--text-secondary)]">{u.email}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                        u.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                        u.role === 'partner' ? 'bg-blue-500/10 text-blue-500' :
                                        'bg-gray-500/10 text-gray-500'
                                    }`}>
                                        {u.role}
                                    </span>
                                    <span className="text-xs text-yellow-500 font-medium">{u.balance} credits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* User Details */}
            <div className="lg:col-span-2 space-y-4">
                {selectedUser ? (
                    <>
                        {/* User Info Card */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedUser.name}</h3>
                                    <p className="text-sm text-[var(--text-secondary)]">{selectedUser.email}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                    selectedUser.role === 'admin' ? 'bg-red-500/10 text-red-500' :
                                    selectedUser.role === 'partner' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-gray-500/10 text-gray-500'
                                }`}>
                                    {selectedUser.role}
                                </span>
                            </div>

                            {userStats && (
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--text-tertiary)]">Balance</p>
                                        <p className="text-lg font-bold text-yellow-500">{selectedUser.balance}</p>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--text-tertiary)]">Total Top-up</p>
                                        <p className="text-lg font-bold text-green-500">{userStats.totalTopup}</p>
                                    </div>
                                    <div className="bg-[var(--bg-secondary)] p-3 rounded-lg">
                                        <p className="text-xs text-[var(--text-tertiary)]">Total Spent</p>
                                        <p className="text-lg font-bold text-red-500">{userStats.totalSpent}</p>
                                    </div>
                                </div>
                            )}

                            {/* Manual Top-up */}
                            <div className="border-t border-[var(--border-primary)] pt-4">
                                <h4 className="font-medium text-[var(--text-primary)] mb-3">Top-up thủ công</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Số credits"
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Ghi chú (lý do)"
                                        value={topupNote}
                                        onChange={(e) => setTopupNote(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                                    />
                                    <button
                                        onClick={handleTopup}
                                        disabled={topupLoading || !topupAmount}
                                        className="px-4 py-2 bg-[var(--accent-primary)] text-black font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                                    >
                                        {topupLoading ? '...' : 'Top-up'}
                                    </button>
                                </div>
                            </div>

                            {/* Reset Password */}
                            <div className="border-t border-[var(--border-primary)] pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-[var(--text-primary)]">{t('admin.resetPassword.title')}</h4>
                                        <p className="text-xs text-[var(--text-tertiary)]">{t('admin.resetPassword.description')}</p>
                                    </div>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={resetPwLoading}
                                        className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50"
                                    >
                                        {resetPwLoading ? '...' : t('admin.resetPassword.button')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User Transactions */}
                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4">
                            <h4 className="font-medium text-[var(--text-primary)] mb-3">Lịch sử giao dịch</h4>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {userTransactions.length === 0 ? (
                                    <p className="text-center text-[var(--text-secondary)] py-4">Chưa có giao dịch</p>
                                ) : (
                                    userTransactions.map((tx) => (
                                        <div key={tx._id} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{tx.description}</p>
                                                <p className="text-xs text-[var(--text-tertiary)]">
                                                    {formatDate(tx.createdAt)} • {tx.transactionCode}
                                                </p>
                                                {tx.processedBy && (
                                                    <p className="text-xs text-blue-400">By: {tx.processedBy.name}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold ${tx.credits >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                    {tx.credits >= 0 ? '+' : ''}{tx.credits}
                                                </p>
                                                <span className={`text-xs px-2 py-0.5 rounded ${
                                                    tx.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                    tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                    'bg-red-500/10 text-red-500'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-8 text-center">
                        <p className="text-[var(--text-secondary)]">Chọn một user để xem chi tiết</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Transactions Tab Component
function TransactionsTab() {
    const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: '',
        status: '',
        search: '',
    });

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllTransactions({
                page: 1,
                limit: 100,
                type: filters.type || undefined,
                status: filters.status || undefined,
                search: filters.search || undefined,
            });
            setTransactions(response.data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const debounce = setTimeout(loadTransactions, 300);
        return () => clearTimeout(debounce);
    }, [loadTransactions]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-500/10 text-green-500';
            case 'pending': return 'bg-yellow-500/10 text-yellow-500';
            case 'timeout': return 'bg-orange-500/10 text-orange-500';
            case 'failed': return 'bg-red-500/10 text-red-500';
            case 'cancelled': return 'bg-gray-500/10 text-gray-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'Hoàn thành';
            case 'pending': return 'Đang chờ';
            case 'timeout': return 'Hết hạn';
            case 'failed': return 'Thất bại';
            case 'cancelled': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
            {/* Filters */}
            <div className="p-4 border-b border-[var(--border-primary)] flex flex-wrap gap-3">
                <input
                    type="text"
                    placeholder="Tìm kiếm mã GD..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                />
                <select
                    value={filters.type}
                    onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                    className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                >
                    <option value="">Tất cả loại</option>
                    <option value="topup">Top-up</option>
                    <option value="manual_topup">Manual Top-up</option>
                    <option value="spend">Spend</option>
                    <option value="refund">Refund</option>
                </select>
                <select
                    value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="pending">Đang chờ</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="timeout">Hết hạn</option>
                    <option value="failed">Thất bại</option>
                    <option value="cancelled">Đã hủy</option>
                </select>
            </div>

            {/* Transaction List */}
            <div className="overflow-x-auto">
                {loading ? (
                    <p className="text-center text-[var(--text-secondary)] py-8">Loading...</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs uppercase">
                                <th className="p-3 text-left">Thời gian</th>
                                <th className="p-3 text-left">User</th>
                                <th className="p-3 text-left">Mã GD</th>
                                <th className="p-3 text-left">Loại</th>
                                <th className="p-3 text-right">Số tiền</th>
                                <th className="p-3 text-right">Credits</th>
                                <th className="p-3 text-center">Trạng thái</th>
                                <th className="p-3 text-left">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {transactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-[var(--bg-secondary)]/50">
                                    <td className="p-3 text-[var(--text-secondary)]">{formatDate(tx.createdAt)}</td>
                                    <td className="p-3">
                                        {tx.userId ? (
                                            <div>
                                                <p className="font-medium text-[var(--text-primary)]">{tx.userId.name}</p>
                                                <p className="text-xs text-[var(--text-tertiary)]">{tx.userId.email}</p>
                                            </div>
                                        ) : (
                                            <span className="text-[var(--text-tertiary)]">-</span>
                                        )}
                                    </td>
                                    <td className="p-3 font-mono text-xs text-[var(--text-primary)]">{tx.transactionCode}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            tx.type === 'topup' ? 'bg-green-500/10 text-green-500' :
                                            tx.type === 'manual_topup' ? 'bg-blue-500/10 text-blue-500' :
                                            tx.type === 'spend' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-gray-500/10 text-gray-500'
                                        }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-[var(--text-primary)]">{formatCurrency(tx.amount)}</td>
                                    <td className={`p-3 text-right font-bold ${tx.credits >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {tx.credits >= 0 ? '+' : ''}{tx.credits}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(tx.status)}`}>
                                            {getStatusText(tx.status)}
                                        </span>
                                    </td>
                                    <td className="p-3 text-[var(--text-tertiary)] text-xs max-w-[200px] truncate">
                                        {tx.description || '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// Webhooks Tab Component
function WebhooksTab() {
    const [logs, setLogs] = useState<WebhookLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
    const [statusFilter, setStatusFilter] = useState('');

    // User assignment state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [assignNote, setAssignNote] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getWebhookLogs(1, 100, undefined, statusFilter || undefined);
            setLogs(response.data);
        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    // Load users for assignment dropdown
    const loadUsers = useCallback(async () => {
        if (!userSearch) {
            setUsers([]);
            return;
        }
        try {
            const response = await getUsers(1, 10, userSearch);
            setUsers(response.data);
            setShowUserDropdown(true);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }, [userSearch]);

    useEffect(() => {
        const debounce = setTimeout(loadUsers, 300);
        return () => clearTimeout(debounce);
    }, [loadUsers]);

    const handleReprocess = async (logId: string) => {
        if (!confirm('Xử lý lại webhook này?')) return;

        try {
            const result = await reprocessWebhook(logId);
            alert(result.message);
            loadLogs();
            setSelectedLog(null);
        } catch (error: any) {
            alert(error.message || 'Lỗi xử lý');
        }
    };

    const handleAssignUser = async () => {
        if (!selectedLog || !selectedUserId) {
            alert('Vui lòng chọn user để gán');
            return;
        }

        try {
            setAssignLoading(true);
            const result = await assignWebhookToUser(selectedLog._id, selectedUserId, assignNote);
            alert(result.message);
            loadLogs();
            setSelectedLog(null);
            setSelectedUserId('');
            setUserSearch('');
            setAssignNote('');
        } catch (error: any) {
            alert(error.message || 'Lỗi gán user');
        } finally {
            setAssignLoading(false);
        }
    };

    const handleIgnore = async () => {
        if (!selectedLog) return;
        const note = prompt('Lý do bỏ qua (tùy chọn):');
        if (note === null) return;

        try {
            const result = await ignoreWebhook(selectedLog._id, note);
            alert(result.message);
            loadLogs();
            setSelectedLog(null);
        } catch (error: any) {
            alert(error.message || 'Lỗi bỏ qua webhook');
        }
    };

    const handleSelectUser = (user: AdminUser) => {
        setSelectedUserId(user._id);
        setUserSearch(user.name + ' (' + user.email + ')');
        setShowUserDropdown(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'matched': return 'bg-green-500/10 text-green-500';
            case 'unmatched': return 'bg-yellow-500/10 text-yellow-500';
            case 'error': return 'bg-red-500/10 text-red-500';
            case 'processing': return 'bg-blue-500/10 text-blue-500';
            case 'ignored': return 'bg-gray-500/10 text-gray-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'matched': return 'Đã khớp';
            case 'unmatched': return 'Chưa khớp';
            case 'error': return 'Lỗi';
            case 'processing': return 'Đang xử lý';
            case 'ignored': return 'Đã bỏ qua';
            default: return status;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Log List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                <div className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h3 className="font-medium text-[var(--text-primary)]">Webhook Logs</h3>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                    >
                        <option value="">Tất cả</option>
                        <option value="matched">Đã khớp</option>
                        <option value="unmatched">Chưa khớp</option>
                        <option value="error">Lỗi</option>
                        <option value="ignored">Đã bỏ qua</option>
                    </select>
                </div>

                {loading ? (
                    <p className="text-center text-[var(--text-secondary)] py-8">Loading...</p>
                ) : (
                    <div className="divide-y divide-[var(--border-primary)] max-h-[600px] overflow-y-auto">
                        {logs.length === 0 ? (
                            <p className="text-center text-[var(--text-tertiary)] py-8">Không có webhook nào</p>
                        ) : (
                            logs.map((log) => (
                                <div
                                    key={log._id}
                                    onClick={() => {
                                        setSelectedLog(log);
                                        setSelectedUserId('');
                                        setUserSearch('');
                                        setAssignNote('');
                                    }}
                                    className={`p-4 cursor-pointer hover:bg-[var(--bg-secondary)]/50 ${
                                        selectedLog?._id === log._id ? 'bg-[var(--accent-primary)]/5' : ''
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(log.status)}`}>
                                            {getStatusText(log.status)}
                                        </span>
                                        <span className="text-xs text-[var(--text-tertiary)]">{formatDate(log.createdAt)}</span>
                                    </div>
                                    <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                                        {log.parsedData?.transactionCode || 'No code'}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate">
                                        {log.parsedData?.description || '-'}
                                    </p>
                                    {log.parsedData?.amount && (
                                        <p className="text-xs text-green-500 mt-1">{formatCurrency(log.parsedData.amount)}</p>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Log Detail */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl">
                {selectedLog ? (
                    <div className="p-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-medium text-[var(--text-primary)]">Chi tiết Webhook</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(selectedLog.status)}`}>
                                {getStatusText(selectedLog.status)}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Mã giao dịch</p>
                                    <p className="font-mono text-[var(--text-primary)]">{selectedLog.parsedData?.transactionCode || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Số tiền</p>
                                    <p className="text-[var(--text-primary)] font-bold text-green-500">
                                        {selectedLog.parsedData?.amount ? formatCurrency(selectedLog.parsedData.amount) : '-'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-[var(--text-tertiary)] mb-1">Nội dung chuyển khoản</p>
                                <p className="text-[var(--text-primary)] text-sm">{selectedLog.parsedData?.description || '-'}</p>
                            </div>

                            {selectedLog.matchedUserId && (
                                <div className="p-3 bg-green-500/10 rounded-lg">
                                    <p className="text-xs text-green-500 mb-1">Đã khớp với user</p>
                                    <p className="text-[var(--text-primary)] font-medium">
                                        {selectedLog.matchedUserId.name} ({selectedLog.matchedUserId.email})
                                    </p>
                                </div>
                            )}

                            {selectedLog.errorMessage && (
                                <div className="p-3 bg-red-500/10 rounded-lg">
                                    <p className="text-xs text-red-500 mb-1">Lỗi</p>
                                    <p className="text-red-400 text-sm">{selectedLog.errorMessage}</p>
                                </div>
                            )}

                            {selectedLog.processingNotes && (
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Ghi chú xử lý</p>
                                    <p className="text-[var(--text-secondary)] text-sm">{selectedLog.processingNotes}</p>
                                </div>
                            )}

                            {/* Action buttons for unmatched/error webhooks */}
                            {(selectedLog.status === 'unmatched' || selectedLog.status === 'error') && (
                                <div className="border-t border-[var(--border-primary)] pt-4 space-y-3">
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Gán cho user</p>

                                    {/* User search */}
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm user (tên hoặc email)..."
                                            value={userSearch}
                                            onChange={(e) => {
                                                setUserSearch(e.target.value);
                                                setSelectedUserId('');
                                            }}
                                            onFocus={() => userSearch && setShowUserDropdown(true)}
                                            className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                                        />
                                        {showUserDropdown && users.length > 0 && (
                                            <div className="absolute z-10 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
                                                {users.map((user) => (
                                                    <div
                                                        key={user._id}
                                                        onClick={() => handleSelectUser(user)}
                                                        className="p-2 hover:bg-[var(--bg-secondary)] cursor-pointer"
                                                    >
                                                        <p className="text-sm text-[var(--text-primary)]">{user.name}</p>
                                                        <p className="text-xs text-[var(--text-tertiary)]">{user.email} • {user.balance} credits</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Ghi chú (tùy chọn)"
                                        value={assignNote}
                                        onChange={(e) => setAssignNote(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                                    />

                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAssignUser}
                                            disabled={!selectedUserId || assignLoading}
                                            className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {assignLoading ? 'Đang xử lý...' : 'Gán & Cộng credits'}
                                        </button>
                                        <button
                                            onClick={() => handleReprocess(selectedLog._id)}
                                            className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                                        >
                                            Xử lý lại
                                        </button>
                                        <button
                                            onClick={handleIgnore}
                                            className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600"
                                        >
                                            Bỏ qua
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Raw payload */}
                            <div className="border-t border-[var(--border-primary)] pt-4">
                                <p className="text-xs text-[var(--text-tertiary)] mb-2">Raw Payload</p>
                                <pre className="bg-[var(--bg-secondary)] p-3 rounded-lg text-xs text-[var(--text-primary)] overflow-x-auto max-h-[150px]">
                                    {JSON.stringify(selectedLog.payload, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-[var(--text-secondary)]">
                        Chọn một webhook để xem chi tiết
                    </div>
                )}
            </div>
        </div>
    );
}
