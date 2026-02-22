import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    getCloudMachines,
    registerMachine,
    updateMachine,
    toggleMachine,
    getCloudSessions,
    forceEndSession,
    type HostMachine,
    type CloudSession,
} from '../../services/cloudService';
import {
    listOrphanedFiles,
    deleteOrphanedFile,
    type OrphanedFile,
    formatDate,
} from '../../services/adminService';

const SUPER_ADMIN_EMAIL = 'aduc5525@gmail.com';

type SubTab = 'machines' | 'sessions' | 'storage';

export default function CloudAdminTab() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [subTab, setSubTab] = useState<SubTab>('machines');

    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    return (
        <div>
            {/* Sub-Tabs */}
            <div className="flex gap-2 mb-6">
                {(['machines', 'sessions'] as SubTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setSubTab(tab)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            subTab === tab
                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                    >
                        {t(`admin.cloud.tabs.${tab}`)}
                    </button>
                ))}
                {isSuperAdmin && (
                    <button
                        onClick={() => setSubTab('storage')}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                            subTab === 'storage'
                                ? 'bg-red-500/10 text-red-400'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                        }`}
                    >
                        🗑️ Storage Cleanup
                    </button>
                )}
            </div>

            {subTab === 'machines' && <MachinesTab />}
            {subTab === 'sessions' && <SessionsTab />}
            {subTab === 'storage' && isSuperAdmin && <StorageCleanupTab />}
        </div>
    );
}

// ==================== MACHINES TAB ====================
function MachinesTab() {
    const { t } = useTranslation();
    const [machines, setMachines] = useState<HostMachine[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingMachine, setEditingMachine] = useState<HostMachine | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        machineId: '',
        agentUrl: '',
        secret: '',
        cpu: '',
        ram: '',
        gpu: '',
        maxContainers: 5,
    });

    const loadMachines = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCloudMachines();
            setMachines(response.data);
        } catch (error) {
            console.error('Failed to load machines:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMachines();
    }, [loadMachines]);

    const resetForm = () => {
        setFormData({ name: '', machineId: '', agentUrl: '', secret: '', cpu: '', ram: '', gpu: '', maxContainers: 5 });
        setEditingMachine(null);
        setShowForm(false);
    };

    const handleEdit = (machine: HostMachine) => {
        setEditingMachine(machine);
        setFormData({
            name: machine.name,
            machineId: machine.machineId,
            agentUrl: machine.agentUrl,
            secret: machine.secret,
            cpu: machine.specs.cpu,
            ram: machine.specs.ram,
            gpu: machine.specs.gpu,
            maxContainers: machine.maxContainers,
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        try {
            const payload = {
                name: formData.name,
                machineId: formData.machineId,
                agentUrl: formData.agentUrl,
                secret: formData.secret,
                specs: { cpu: formData.cpu, ram: formData.ram, gpu: formData.gpu },
                maxContainers: formData.maxContainers,
            };

            if (editingMachine) {
                await updateMachine(editingMachine._id, payload);
            } else {
                await registerMachine(payload);
            }
            resetForm();
            loadMachines();
        } catch (error: any) {
            alert(error.message || 'Failed to save machine');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await toggleMachine(id);
            loadMachines();
        } catch (error: any) {
            alert(error.message || 'Failed to toggle machine');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500/10 text-green-500';
            case 'busy': return 'bg-yellow-500/10 text-yellow-500';
            case 'offline': return 'bg-gray-500/10 text-gray-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    };

    const formatLastPing = (lastPingAt: string | null) => {
        if (!lastPingAt) return '-';
        const diff = Date.now() - new Date(lastPingAt).getTime();
        if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        return new Date(lastPingAt).toLocaleString();
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('admin.cloud.machines.title')}</h3>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="px-4 py-2 bg-[var(--accent-primary)] text-black font-medium rounded-lg hover:opacity-90"
                >
                    + {t('admin.cloud.machines.register')}
                </button>
            </div>

            {/* Register/Edit Form */}
            {showForm && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
                    <h4 className="font-medium text-[var(--text-primary)]">
                        {editingMachine ? t('admin.cloud.machines.edit') : t('admin.cloud.machines.register')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.name')}
                            value={formData.name}
                            onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.machineId')}
                            value={formData.machineId}
                            onChange={(e) => setFormData(f => ({ ...f, machineId: e.target.value }))}
                            disabled={!!editingMachine}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] disabled:opacity-50"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.agentUrl')}
                            value={formData.agentUrl}
                            onChange={(e) => setFormData(f => ({ ...f, agentUrl: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.secret')}
                            value={formData.secret}
                            onChange={(e) => setFormData(f => ({ ...f, secret: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.cpu')}
                            value={formData.cpu}
                            onChange={(e) => setFormData(f => ({ ...f, cpu: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.ram')}
                            value={formData.ram}
                            onChange={(e) => setFormData(f => ({ ...f, ram: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            placeholder={t('admin.cloud.machines.gpu')}
                            value={formData.gpu}
                            onChange={(e) => setFormData(f => ({ ...f, gpu: e.target.value }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                        <input
                            type="number"
                            placeholder={t('admin.cloud.machines.maxContainers')}
                            value={formData.maxContainers}
                            onChange={(e) => setFormData(f => ({ ...f, maxContainers: parseInt(e.target.value) || 1 }))}
                            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.name || !formData.machineId || !formData.agentUrl || !formData.secret}
                            className="px-4 py-2 bg-[var(--accent-primary)] text-black font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
                        >
                            {t('admin.cloud.machines.save')}
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--border-primary)]"
                        >
                            {t('admin.cloud.machines.cancel')}
                        </button>
                    </div>
                </div>
            )}

            {/* Machine List */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                {loading ? (
                    <p className="text-center text-[var(--text-secondary)] py-8">Loading...</p>
                ) : machines.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--text-secondary)]">{t('admin.cloud.machines.noMachines')}</p>
                        <p className="text-sm text-[var(--text-tertiary)]">{t('admin.cloud.machines.registerFirst')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs uppercase">
                                    <th className="p-3 text-left">{t('admin.cloud.machines.name')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.machines.machineId')}</th>
                                    <th className="p-3 text-center">{t('admin.cloud.machines.status')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.machines.specs')}</th>
                                    <th className="p-3 text-center">{t('admin.cloud.machines.containers')}</th>
                                    <th className="p-3 text-center">{t('admin.cloud.machines.lastPing')}</th>
                                    <th className="p-3 text-center">{t('admin.cloud.machines.enabled')}</th>
                                    <th className="p-3 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {machines.map((m) => (
                                    <tr key={m._id} className="hover:bg-[var(--bg-secondary)]/50">
                                        <td className="p-3 font-medium text-[var(--text-primary)]">{m.name}</td>
                                        <td className="p-3 font-mono text-xs text-[var(--text-secondary)]">{m.machineId}</td>
                                        <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(m.status)}`}>
                                                {t(`admin.cloud.machines.${m.status}`)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs text-[var(--text-secondary)]">
                                            {m.specs.gpu && <span className="block">{m.specs.gpu}</span>}
                                            {m.specs.cpu && <span className="block">{m.specs.cpu}</span>}
                                            {m.specs.ram && <span className="block">{m.specs.ram}</span>}
                                        </td>
                                        <td className="p-3 text-center text-[var(--text-primary)]">
                                            {m.currentContainers} / {m.maxContainers}
                                        </td>
                                        <td className="p-3 text-center text-xs text-[var(--text-tertiary)]">
                                            {formatLastPing(m.lastPingAt)}
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleToggle(m._id)}
                                                className={`w-10 h-5 rounded-full relative transition-colors ${
                                                    m.enabled ? 'bg-green-500' : 'bg-gray-500'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                                                    m.enabled ? 'right-0.5' : 'left-0.5'
                                                }`} />
                                            </button>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => handleEdit(m)}
                                                className="text-xs text-[var(--accent-primary)] hover:underline"
                                            >
                                                {t('admin.cloud.machines.edit')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== SESSIONS TAB ====================
function SessionsTab() {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState<CloudSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 0 });

    const loadSessions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCloudSessions({
                page,
                limit: 20,
                status: statusFilter || undefined,
            });
            setSessions(response.data);
            setPagination(response.pagination);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    const handleForceEnd = async (id: string) => {
        if (!confirm(t('admin.cloud.sessions.forceEndConfirm'))) return;
        try {
            await forceEndSession(id);
            loadSessions();
        } catch (error: any) {
            alert(error.message || 'Failed to force end session');
        }
    };

    const getStatusStyle = (status: string) => {
        return status === 'active'
            ? 'bg-green-500/10 text-green-500'
            : 'bg-gray-500/10 text-gray-500';
    };

    const getEndReasonText = (reason: string | null) => {
        if (!reason) return '-';
        return t(`admin.cloud.sessions.reasons.${reason}`) || reason;
    };

    const getUserInfo = (userId: CloudSession['userId']) => {
        if (typeof userId === 'string') return { name: '-', email: '' };
        return userId;
    };

    const getMachineInfo = (hostMachineId: CloudSession['hostMachineId']) => {
        if (typeof hostMachineId === 'string') return { name: '-' };
        return hostMachineId;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('admin.cloud.sessions.title')}</h3>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm"
                >
                    <option value="">{t('admin.cloud.sessions.all')}</option>
                    <option value="active">{t('admin.cloud.sessions.active')}</option>
                    <option value="ended">{t('admin.cloud.sessions.ended')}</option>
                </select>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl overflow-hidden">
                {loading ? (
                    <p className="text-center text-[var(--text-secondary)] py-8">Loading...</p>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-[var(--text-secondary)]">{t('admin.cloud.sessions.noSessions')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs uppercase">
                                    <th className="p-3 text-left">{t('admin.cloud.sessions.user')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.sessions.machine')}</th>
                                    <th className="p-3 text-center">{t('admin.cloud.sessions.status')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.sessions.startedAt')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.sessions.endedAt')}</th>
                                    <th className="p-3 text-left">{t('admin.cloud.sessions.endReason')}</th>
                                    <th className="p-3 text-center"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {sessions.map((s) => {
                                    const user = getUserInfo(s.userId);
                                    const machine = getMachineInfo(s.hostMachineId);
                                    return (
                                        <tr key={s._id} className="hover:bg-[var(--bg-secondary)]/50">
                                            <td className="p-3">
                                                <p className="font-medium text-[var(--text-primary)]">{user.name}</p>
                                                {'email' in user && (
                                                    <p className="text-xs text-[var(--text-tertiary)]">{user.email}</p>
                                                )}
                                            </td>
                                            <td className="p-3 text-[var(--text-secondary)]">{machine.name}</td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusStyle(s.status)}`}>
                                                    {t(`admin.cloud.sessions.${s.status}`)}
                                                </span>
                                            </td>
                                            <td className="p-3 text-xs text-[var(--text-secondary)]">
                                                {new Date(s.startedAt).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-xs text-[var(--text-secondary)]">
                                                {s.endedAt ? new Date(s.endedAt).toLocaleString() : '-'}
                                            </td>
                                            <td className="p-3 text-xs text-[var(--text-secondary)]">
                                                {getEndReasonText(s.endReason)}
                                            </td>
                                            <td className="p-3 text-center">
                                                {s.status === 'active' && (
                                                    <button
                                                        onClick={() => handleForceEnd(s._id)}
                                                        className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium hover:bg-red-500/20"
                                                    >
                                                        {t('admin.cloud.sessions.forceEnd')}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 p-4 border-t border-[var(--border-primary)]">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 text-sm bg-[var(--bg-secondary)] rounded-lg disabled:opacity-50"
                        >
                            &laquo;
                        </button>
                        <span className="px-3 py-1 text-sm text-[var(--text-secondary)]">
                            {page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                            disabled={page === pagination.pages}
                            className="px-3 py-1 text-sm bg-[var(--bg-secondary)] rounded-lg disabled:opacity-50"
                        >
                            &raquo;
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================== STORAGE CLEANUP TAB ====================
function StorageCleanupTab() {
    const [files, setFiles] = useState<OrphanedFile[]>([]);
    const [meta, setMeta] = useState<{ orphaned: number; totalB2: number; referenced: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    const load = async () => {
        setLoading(true);
        setError(null);
        setSelectedKeys(new Set());
        try {
            const res = await listOrphanedFiles();
            setFiles(res.data);
            setMeta(res.meta);
        } catch (e: any) {
            setError(e.message || 'Lỗi khi tải danh sách file');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!confirm(`Xóa file này vĩnh viễn?\n${key}`)) return;
        setDeletingKeys(prev => new Set(prev).add(key));
        try {
            await deleteOrphanedFile(key);
            setFiles(prev => prev.filter(f => f.key !== key));
            setMeta(prev => prev ? { ...prev, orphaned: prev.orphaned - 1 } : null);
            setSelectedKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
        } catch {
            alert('Xóa thất bại');
        } finally {
            setDeletingKeys(prev => { const s = new Set(prev); s.delete(key); return s; });
        }
    };

    const handleBulkDelete = async () => {
        if (selectedKeys.size === 0) return;
        if (!confirm(`Xóa ${selectedKeys.size} file đã chọn vĩnh viễn?`)) return;
        setBulkDeleting(true);
        const keys = Array.from(selectedKeys);
        let deleted = 0;
        for (const key of keys) {
            try { await deleteOrphanedFile(key); deleted++; } catch { /* continue */ }
        }
        setFiles(prev => prev.filter(f => !selectedKeys.has(f.key)));
        setMeta(prev => prev ? { ...prev, orphaned: prev.orphaned - deleted } : null);
        setSelectedKeys(new Set());
        setBulkDeleting(false);
    };

    const toggleSelect = (key: string) => {
        setSelectedKeys(prev => {
            const s = new Set(prev);
            s.has(key) ? s.delete(key) : s.add(key);
            return s;
        });
    };

    const toggleSelectAll = () => {
        setSelectedKeys(prev => prev.size === files.length ? new Set() : new Set(files.map(f => f.key)));
    };

    const totalSelectedSize = files
        .filter(f => selectedKeys.has(f.key))
        .reduce((acc, f) => acc + f.size, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">🗑️ B2 Storage Cleanup</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Tìm các file trong Backblaze B2 không được tham chiếu bởi bất kỳ collection nào trong MongoDB.
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-black font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                >
                    {loading
                        ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Đang quét...</>
                        : <><span>🔍</span> Quét B2</>
                    }
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* Stats */}
            {meta && !loading && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Tổng file B2', value: meta.totalB2, color: 'text-[var(--text-primary)]' },
                        { label: 'Đang được dùng', value: meta.referenced, color: 'text-green-400' },
                        { label: 'Không dùng (orphaned)', value: meta.orphaned, color: 'text-red-400' },
                    ].map(s => (
                        <div key={s.label} className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)]">
                            <p className={`text-2xl font-black ${s.color}`}>{s.value.toLocaleString()}</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Bulk actions bar */}
            {files.length > 0 && !loading && (
                <div className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                            type="checkbox"
                            checked={selectedKeys.size === files.length && files.length > 0}
                            onChange={toggleSelectAll}
                            className="accent-red-500 w-4 h-4"
                        />
                        <span className="text-[var(--text-secondary)]">
                            {selectedKeys.size > 0
                                ? `Đã chọn ${selectedKeys.size} file · ${formatBytes(totalSelectedSize)}`
                                : 'Chọn tất cả'}
                        </span>
                    </label>
                    {selectedKeys.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={bulkDeleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-lg border border-red-500/30 transition-colors disabled:opacity-50"
                        >
                            {bulkDeleting ? 'Đang xóa...' : `🗑 Xóa ${selectedKeys.size} file`}
                        </button>
                    )}
                </div>
            )}

            {/* File list */}
            {!loading && files.length > 0 && (
                <div className="rounded-xl border border-[var(--border-primary)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="w-10 py-3 px-4"></th>
                                <th className="py-3 px-4 text-left">File</th>
                                <th className="py-3 px-4 text-left">Folder</th>
                                <th className="py-3 px-4 text-right">Dung lượng</th>
                                <th className="py-3 px-4 text-left">Sửa lần cuối (B2)</th>
                                <th className="py-3 px-4 text-center">Xóa</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {files.map(f => (
                                <tr key={f.key} className={`transition-colors ${selectedKeys.has(f.key) ? 'bg-red-500/5' : 'hover:bg-[var(--bg-secondary)]'}`}>
                                    <td className="py-3 px-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedKeys.has(f.key)}
                                            onChange={() => toggleSelect(f.key)}
                                            className="accent-red-500 w-4 h-4 cursor-pointer"
                                        />
                                    </td>
                                    <td className="py-3 px-4 max-w-xs">
                                        <p className="font-medium text-[var(--text-primary)] truncate" title={f.key}>{f.filename}</p>
                                        <p className="text-[10px] text-[var(--text-tertiary)] truncate font-mono">{f.key}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] whitespace-nowrap">
                                            {f.folder || 'root'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                        {formatBytes(f.size)}
                                    </td>
                                    <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                                        {f.lastModified ? formatDate(f.lastModified) : '—'}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        <button
                                            onClick={() => handleDelete(f.key)}
                                            disabled={deletingKeys.has(f.key)}
                                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-40"
                                            title="Xóa file"
                                        >
                                            {deletingKeys.has(f.key)
                                                ? <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                : <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty states */}
            {!loading && files.length === 0 && meta && (
                <div className="text-center py-16 text-[var(--text-tertiary)]">
                    <div className="text-5xl mb-3">✅</div>
                    <p className="font-bold text-[var(--text-secondary)]">Không có file orphaned!</p>
                    <p className="text-sm mt-1">Tất cả {meta.totalB2} file trong B2 đều đang được sử dụng.</p>
                </div>
            )}

            {!loading && !meta && (
                <div className="text-center py-16 text-[var(--text-tertiary)]">
                    <div className="text-5xl mb-3">☁️</div>
                    <p className="text-sm">Nhấn <strong className="text-[var(--text-primary)]">Quét B2</strong> để bắt đầu kiểm tra.</p>
                </div>
            )}
        </div>
    );
}
