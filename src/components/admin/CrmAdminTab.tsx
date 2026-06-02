import { useState, useEffect, useCallback } from 'react';
import { useConfirm } from '../ui/ConfirmDialog';
import { useTranslation } from '../../i18n/context';
import {
    listCrmAdminSubscriptions,
    listCrmAdminDevices,
    disableCrmAdminDevice,
    listCrmAdminBillingOrders,
    approveCrmAdminBillingOrder,
    listCrmAdminAiUsage,
    listCrmAdminAuditLogs,
    getCrmAdminTenantHealth,
    disableCrmAdminAutomation,
    formatCurrency,
    type CrmSubscription,
    type CrmDevice,
    type CrmBillingOrder,
    type CrmAiUsageLog,
    type CrmAuditLog,
    type CrmTenantHealth
} from '../../services/crmService';

type AdminSubTab = 'health' | 'subscriptions' | 'devices' | 'billing' | 'aiUsage' | 'audit';

export default function CrmAdminTab() {
    const { confirm: confirmDialog } = useConfirm();
    const { t } = useTranslation();
    const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('health');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Lists
    const [subscriptions, setSubscriptions] = useState<CrmSubscription[]>([]);
    const [devices, setDevices] = useState<CrmDevice[]>([]);
    const [billingOrders, setBillingOrders] = useState<CrmBillingOrder[]>([]);
    const [aiUsageLogs, setAiUsageLogs] = useState<CrmAiUsageLog[]>([]);
    const [auditLogs, setAuditLogs] = useState<CrmAuditLog[]>([]);
    const [tenantHealth, setTenantHealth] = useState<CrmTenantHealth | null>(null);

    // Filters
    const [subStatusFilter, setSubStatusFilter] = useState('');
    const [subEmailSearch, setSubEmailSearch] = useState('');

    const loadTabDetails = useCallback(async () => {
        try {
            setLoading(true);
            if (activeSubTab === 'health') {
                const data = await getCrmAdminTenantHealth();
                setTenantHealth(data);
            } else if (activeSubTab === 'subscriptions') {
                const data = await listCrmAdminSubscriptions({
                    status: subStatusFilter || undefined,
                    email: subEmailSearch || undefined
                });
                setSubscriptions(data);
            } else if (activeSubTab === 'devices') {
                const data = await listCrmAdminDevices();
                setDevices(data);
            } else if (activeSubTab === 'billing') {
                const data = await listCrmAdminBillingOrders();
                setBillingOrders(data);
            } else if (activeSubTab === 'aiUsage') {
                const data = await listCrmAdminAiUsage();
                setAiUsageLogs(data);
            } else if (activeSubTab === 'audit') {
                const data = await listCrmAdminAuditLogs();
                setAuditLogs(data);
            }
        } catch (err) {
            console.error('Failed to load CRM admin tab details:', err);
        } finally {
            setLoading(false);
        }
    }, [activeSubTab, subStatusFilter, subEmailSearch]);

    useEffect(() => {
        loadTabDetails();
    }, [loadTabDetails]);

    const handleDisableDevice = async (deviceId: string, name: string) => {
        if (!await confirmDialog({
            message: `Bạn có chắc muốn vô hiệu hóa thiết bị "${name}"? Hành động này sẽ ngắt kết nối outbound và unbind thiết bị này khỏi tài khoản.`,
            variant: 'danger'
        })) return;

        setActionLoading(deviceId);
        try {
            await disableCrmAdminDevice(deviceId);
            alert('Đã vô hiệu hóa thiết bị thành công!');
            loadTabDetails();
        } catch (err: any) {
            alert(err.message || 'Lỗi khi vô hiệu hóa thiết bị');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveOrder = async (orderId: string, code: string) => {
        if (!await confirmDialog({
            message: `Xác nhận phê duyệt thủ công đơn hàng chuyển khoản "${code}"? Gói cước và quota AI tương ứng sẽ được kích hoạt cho khách hàng ngay lập tức.`,
            variant: 'warning'
        })) return;

        setActionLoading(orderId);
        try {
            await approveCrmAdminBillingOrder(orderId);
            alert('Phê duyệt đơn hàng thành công!');
            loadTabDetails();
        } catch (err: any) {
            alert(err.message || 'Lỗi phê duyệt đơn hàng');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDisableAutomation = async () => {
        if (!await confirmDialog({
            message: t('admin.crm.health.disableConfirm'),
            variant: 'danger'
        })) return;

        setActionLoading('automation');
        try {
            await disableCrmAdminAutomation({ reason: 'Manual admin tenant health action' });
            alert(t('admin.crm.health.disableSuccess'));
            loadTabDetails();
        } catch (err: any) {
            alert(err.message || t('admin.crm.health.disableError'));
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'completed': return 'Đã duyệt / Hoàn thành';
            case 'paid': return 'Đã thanh toán';
            case 'fulfilling': return 'Đang kích hoạt';
            case 'pending': return 'Đang chờ duyệt';
            case 'failed': return 'Thất bại';
            case 'cancelled': return 'Đã hủy';
            case 'active': return 'Hoạt động';
            case 'expired': return 'Hết hạn';
            case 'disabled': return 'Đã vô hiệu';
            default: return status;
        }
    };

    const tabs: { id: AdminSubTab; label: string }[] = [
        { id: 'health', label: t('admin.crm.health.tab') },
        { id: 'subscriptions', label: 'Danh Sách Gói Đăng Ký' },
        { id: 'devices', label: 'Danh Sách Thiết Bị / Machine' },
        { id: 'billing', label: 'Đơn Hàng & VietQR' },
        { id: 'aiUsage', label: 'Nhật Ký Sử Dụng AI' },
        { id: 'audit', label: t('admin.crm.audit.tab') }
    ];

    return (
        <div className="space-y-6">
            {/* Sub Tabs Selection */}
            <div className="flex gap-2 border-b border-[var(--border-primary)] pb-4">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSubTab(tab.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            activeSubTab === tab.id
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <p className="text-xs text-[var(--text-secondary)]">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden shadow-lg animate-fade-in">
                    {/* Health Tab */}
                    {activeSubTab === 'health' && (
                        <div className="p-5 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{t('admin.crm.health.title')}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-1">{t('admin.crm.health.subtitle')}</p>
                                </div>
                                <button
                                    onClick={handleDisableAutomation}
                                    disabled={actionLoading !== null}
                                    className="px-3 py-2 bg-red-500 hover:opacity-90 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    {actionLoading === 'automation' ? '...' : t('admin.crm.health.disableAutomation')}
                                </button>
                            </div>
                            {tenantHealth && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
                                        {[
                                            [t('admin.crm.health.activeSubscriptions'), tenantHealth.activeSubscriptions],
                                            [t('admin.crm.health.activeDevices'), tenantHealth.activeDevices],
                                            [t('admin.crm.health.commandBacklog'), tenantHealth.commandBacklog],
                                            [t('admin.crm.health.failedCampaigns'), tenantHealth.failedCampaigns],
                                            [t('admin.crm.health.groupSummaries'), tenantHealth.groupSummaryUsage],
                                            [t('admin.crm.health.aiRequests'), tenantHealth.aiUsageByType.reduce((sum, item) => sum + item.count, 0)],
                                        ].map(([label, value]) => (
                                            <div key={String(label)} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
                                                <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
                                                <p className="text-xl font-black text-[var(--text-primary)] mt-1">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="rounded-lg border border-[var(--border-primary)] overflow-hidden">
                                        <div className="px-3 py-2 bg-[var(--bg-secondary)] text-xs font-bold text-[var(--text-secondary)]">
                                            {t('admin.crm.health.aiUsageBreakdown')}
                                        </div>
                                        <div className="divide-y divide-[var(--border-primary)]">
                                            {tenantHealth.aiUsageByType.length === 0 ? (
                                                <p className="p-3 text-xs text-[var(--text-tertiary)]">{t('admin.crm.health.noAiUsage')}</p>
                                            ) : tenantHealth.aiUsageByType.map(item => (
                                                <div key={item.requestType} className="p-3 flex items-center justify-between text-xs">
                                                    <span className="font-mono text-[var(--text-secondary)]">{item.requestType || 'unknown'}</span>
                                                    <span className="font-bold text-[var(--text-primary)]">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Subscriptions Tab */}
                    {activeSubTab === 'subscriptions' && (
                        <div>
                            {/* Filter Bar */}
                            <div className="p-4 border-b border-[var(--border-primary)] flex gap-3 flex-wrap">
                                <input
                                    type="text"
                                    placeholder="Tìm email khách hàng..."
                                    value={subEmailSearch}
                                    onChange={(e) => setSubEmailSearch(e.target.value)}
                                    className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-primary)] w-48"
                                />
                                <select
                                    value={subStatusFilter}
                                    onChange={(e) => setSubStatusFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-primary)]"
                                >
                                    <option value="">Tất cả trạng thái</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <button
                                    onClick={loadTabDetails}
                                    className="px-3 py-1.5 bg-emerald-500 hover:opacity-90 text-white rounded-lg text-xs font-bold"
                                >
                                    Lọc
                                </button>
                            </div>

                            {subscriptions.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-12 text-center">Chưa có gói đăng ký nào</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-semibold">
                                                <th className="p-3">Khách hàng</th>
                                                <th className="p-3">Trạng thái</th>
                                                <th className="p-3">Thời gian hiệu lực</th>
                                                <th className="p-3 text-center">Included Quota</th>
                                                <th className="p-3 text-center">Extra Quota (Còn)</th>
                                                <th className="p-3 text-center">Tự gia hạn</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                                            {subscriptions.map(s => (
                                                <tr key={s._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3">
                                                        <span className="font-bold">{s.userId?.name || 'User'}</span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{s.userId?.email || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            s.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {getStatusText(s.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {new Date(s.periodStart).toLocaleDateString('vi-VN')} &rarr; {new Date(s.periodEnd).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="p-3 text-center font-semibold">
                                                        {s.includedAiLimit - s.includedAiUsed} / {s.includedAiLimit} Used
                                                    </td>
                                                    <td className="p-3 text-center font-semibold text-emerald-400">
                                                        +{s.extraAiRemaining} Requests
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {(s.autoRenewCredit ?? s.autoRenew) ? 'Có' : 'Không'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Devices Tab */}
                    {activeSubTab === 'devices' && (
                        <div>
                            {devices.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-12 text-center">Chưa có thiết bị nào ghép đôi outbound</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-semibold">
                                                <th className="p-3">Khách hàng</th>
                                                <th className="p-3">Tên thiết bị</th>
                                                <th className="p-3">Trạng thái</th>
                                                <th className="p-3">App / Agent Ver</th>
                                                <th className="p-3">Đăng nhập cuối (IP)</th>
                                                <th className="p-3 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                                            {devices.map(d => (
                                                <tr key={d._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3">
                                                        <span className="font-bold">{d.userId?.name || 'User'}</span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{d.userId?.email || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3 font-semibold">{d.displayName || 'Windows Machine'}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            d.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
                                                        }`}>
                                                            {getStatusText(d.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 font-mono text-[10px]">
                                                        {d.appVersion || 'N/A'} / {d.agentVersion || 'N/A'}
                                                    </td>
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {new Date(d.lastSeenAt).toLocaleString('vi-VN')}
                                                        <span className="block font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">{d.lastIp || '127.0.0.1'}</span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {d.status === 'active' ? (
                                                            <button
                                                                onClick={() => handleDisableDevice(d._id, d.displayName)}
                                                                disabled={actionLoading !== null}
                                                                className="px-2.5 py-1 bg-red-500 hover:opacity-90 text-white rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                                            >
                                                                {actionLoading === d._id ? '...' : 'Vô hiệu hóa'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-[var(--text-tertiary)]">N/A</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Billing Orders Tab */}
                    {activeSubTab === 'billing' && (
                        <div>
                            {billingOrders.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-12 text-center">Chưa có đơn hàng thanh toán nào</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-semibold">
                                                <th className="p-3">Khách hàng</th>
                                                <th className="p-3">Mã GD</th>
                                                <th className="p-3">Sản phẩm</th>
                                                <th className="p-3">Cổng</th>
                                                <th className="p-3 text-right">Chi phí</th>
                                                <th className="p-3 text-center">Trạng thái</th>
                                                <th className="p-3">Thời gian tạo</th>
                                                <th className="p-3 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                                            {billingOrders.map(b => (
                                                <tr key={b._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3">
                                                        <span className="font-bold">{b.userId?.name || 'User'}</span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{b.userId?.email || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-[var(--text-secondary)]">{b.transactionCode}</td>
                                                    <td className="p-3 font-semibold">{b.description}</td>
                                                    <td className="p-3">
                                                        {b.paymentMethod === 'credit' || b.paymentMethod === 'credits' ? 'Credits Wallet' : 'Bank Transfer'}
                                                    </td>
                                                    <td className="p-3 text-right font-bold">
                                                        {b.paymentMethod === 'credit' || b.paymentMethod === 'credits' ? `${b.credits} Credits` : formatCurrency(b.amountVnd ?? b.amount ?? 0)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            (b.status === 'completed' || b.status === 'paid') ? 'bg-green-500/10 text-green-500' :
                                                            b.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                                                            'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {getStatusText(b.status)}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {new Date(b.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {b.status === 'pending' && b.paymentMethod === 'bank_transfer' ? (
                                                            <button
                                                                onClick={() => handleApproveOrder(b._id, b.transactionCode)}
                                                                disabled={actionLoading !== null}
                                                                className="px-2.5 py-1 bg-emerald-500 hover:opacity-90 text-white rounded text-[10px] font-bold transition-all disabled:opacity-50"
                                                            >
                                                                {actionLoading === b._id ? '...' : 'Phê duyệt'}
                                                            </button>
                                                        ) : (
                                                            <span className="text-[var(--text-tertiary)]">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Usage Log Tab */}
                    {activeSubTab === 'aiUsage' && (
                        <div>
                            {aiUsageLogs.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-12 text-center">Chưa có bản ghi sử dụng AI nào</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-semibold">
                                                <th className="p-3">Khách hàng</th>
                                                <th className="p-3">Yêu cầu / Model</th>
                                                <th className="p-3">Trạng thái</th>
                                                <th className="p-3 text-center">Quota Bucket</th>
                                                <th className="p-3 text-right">Tokens (Prompt/Comp/Total)</th>
                                                <th className="p-3 text-right">Độ trễ</th>
                                                <th className="p-3">Thời gian</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                                            {aiUsageLogs.map(l => (
                                                <tr key={l._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3">
                                                        <span className="font-bold">{l.userId?.name || 'User'}</span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{l.userId?.email || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3 font-semibold">
                                                        {l.requestType}
                                                        <span className="block font-mono text-[10px] text-[var(--text-tertiary)] mt-0.5">{l.model || 'gcli-default'}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                            l.status === 'succeeded' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                                        }`}>
                                                            {l.status}
                                                        </span>
                                                        {l.errorMessage && (
                                                            <span className="block text-[9px] text-red-400 max-w-[200px] truncate mt-1" title={l.errorMessage}>
                                                                {l.errorMessage}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center font-mono text-[10px] font-bold text-teal-400">
                                                        {l.quotaBucket}
                                                    </td>
                                                    <td className="p-3 text-right font-mono text-[10px] text-[var(--text-secondary)]">
                                                        {l.tokens ? `${l.tokens.promptTokens} / ${l.tokens.completionTokens} / ${l.tokens.totalTokens}` : 'N/A'}
                                                    </td>
                                                    <td className="p-3 text-right font-semibold">
                                                        {(l.latencyMs / 1000).toFixed(2)}s
                                                    </td>
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {new Date(l.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Audit Timeline Tab */}
                    {activeSubTab === 'audit' && (
                        <div>
                            {auditLogs.length === 0 ? (
                                <p className="text-xs text-[var(--text-tertiary)] py-12 text-center">{t('admin.crm.audit.empty')}</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-semibold">
                                                <th className="p-3">{t('admin.crm.audit.time')}</th>
                                                <th className="p-3">{t('admin.crm.audit.user')}</th>
                                                <th className="p-3">{t('admin.crm.audit.event')}</th>
                                                <th className="p-3">{t('admin.crm.audit.device')}</th>
                                                <th className="p-3">{t('admin.crm.audit.details')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border-primary)] text-[var(--text-primary)]">
                                            {auditLogs.map(log => (
                                                <tr key={log._id} className="hover:bg-[var(--bg-secondary)]/30 transition-colors">
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                                                    </td>
                                                    <td className="p-3">
                                                        <span className="font-bold">{log.userId?.name || 'User'}</span>
                                                        <span className="block text-[10px] text-[var(--text-secondary)] mt-0.5">{log.userId?.email || 'N/A'}</span>
                                                    </td>
                                                    <td className="p-3 font-mono text-[10px] font-bold text-emerald-400">{log.action}</td>
                                                    <td className="p-3 text-[var(--text-secondary)]">
                                                        {log.deviceId?.displayName || log.deviceId || '-'}
                                                    </td>
                                                    <td className="p-3">
                                                        <pre className="max-w-[360px] whitespace-pre-wrap break-words rounded bg-[var(--bg-secondary)] p-2 text-[10px] text-[var(--text-secondary)]">
                                                            {JSON.stringify(log.details || {}, null, 2)}
                                                        </pre>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
