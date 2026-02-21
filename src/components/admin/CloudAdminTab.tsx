import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
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

type SubTab = 'machines' | 'sessions';

export default function CloudAdminTab() {
    const { t } = useTranslation();
    const [subTab, setSubTab] = useState<SubTab>('machines');

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
            </div>

            {subTab === 'machines' && <MachinesTab />}
            {subTab === 'sessions' && <SessionsTab />}
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
