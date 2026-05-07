import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { useConfirm } from '../ui/ConfirmDialog';
import {
    getCloudMachines,
    registerMachine,
    updateMachine,
    toggleMachine,
    getCloudSessions,
    forceEndSession,
    getFlowServers,
    registerFlowServer,
    updateFlowServer,
    toggleFlowServer,
    deleteFlowServer,
    syncFlowServerProjects,
    deleteFlowServerProject,
    type HostMachine,
    type CloudSession,
    type FlowServer,
} from '../../services/cloudService';
import {
    listOrphanedFiles,
    deleteOrphanedFile,
    type OrphanedFile,
    formatDate,
} from '../../services/adminService';

const SUPER_ADMIN_EMAIL = 'aduc5525@gmail.com';

type SubTab = 'machines' | 'flow-servers' | 'sessions' | 'storage';

export default function CloudAdminTab() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [subTab, setSubTab] = useState<SubTab>('machines');

    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    return (
        <div>
            {/* Sub-Tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {(['machines', 'flow-servers', 'sessions'] as SubTab[]).map((tab) => (
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
            {subTab === 'flow-servers' && <FlowServersTab />}
            {subTab === 'sessions' && <SessionsTab />}
            {subTab === 'storage' && isSuperAdmin && <StorageCleanupTab />}
        </div>
    );
}

// ==================== FLOW SERVERS TAB ====================
function FlowServersTab() {
    const { t } = useTranslation();
    const { confirm } = useConfirm();
    const [servers, setServers] = useState<FlowServer[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<FlowServer | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', machineId: '', agentUrl: '', secret: '', targetProjectCount: 3 });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFlowServers();
            setServers(res.data || []);
            setErr(null);
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); const int = setInterval(load, 15000); return () => clearInterval(int); }, [load]);

    const startCreate = () => {
        setEditing(null);
        setForm({ name: '', machineId: '', agentUrl: '', secret: '', targetProjectCount: 3 });
        setShowForm(true);
    };
    const startEdit = (s: FlowServer) => {
        setEditing(s);
        setForm({ name: s.name, machineId: s.machineId, agentUrl: s.agentUrl, secret: '', targetProjectCount: s.targetProjectCount || 3 });
        setShowForm(true);
    };

    const submit = async () => {
        try {
            if (editing) {
                await updateFlowServer(editing._id, {
                    name: form.name,
                    agentUrl: form.agentUrl,
                    targetProjectCount: form.targetProjectCount,
                    ...(form.secret ? { secret: form.secret } : {}),
                });
            } else {
                await registerFlowServer({
                    name: form.name,
                    machineId: form.machineId,
                    agentUrl: form.agentUrl,
                    secret: form.secret,
                    targetProjectCount: form.targetProjectCount,
                });
            }
            setShowForm(false);
            await load();
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Save failed');
        }
    };

    const onToggle = async (s: FlowServer) => {
        try { await toggleFlowServer(s._id); await load(); } catch (e) { alert(String(e)); }
    };

    const onDelete = async (s: FlowServer) => {
        const ok = await confirm({
            message: t('admin.cloud.flowServers.confirmDelete').replace('{{name}}', s.name),
            variant: 'danger',
        });
        if (!ok) return;
        try { await deleteFlowServer(s._id); await load(); } catch (e) { alert(String(e)); }
    };

    const onSync = async (s: FlowServer) => {
        if (syncingId) return;
        setSyncingId(s._id);
        try {
            await syncFlowServerProjects(s._id);
            await load();
        } catch (e) {
            alert(String(e));
        } finally {
            setSyncingId(null);
        }
    };

    const onDeleteProject = async (s: FlowServer, pid: string) => {
        const ok = await confirm({
            message: `${t('admin.cloud.flowServers.deleteProject')} ${pid.slice(0, 8)}?`,
            variant: 'danger',
        });
        if (!ok) return;
        try {
            await deleteFlowServerProject(s._id, pid);
            await load();
        } catch (e) { alert(String(e)); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">{t('admin.cloud.flowServers.desc')}</p>
                <button
                    onClick={startCreate}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-black rounded-lg hover:opacity-90"
                >
                    + {t('admin.cloud.flowServers.register')}
                </button>
            </div>

            {err && <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-lg text-sm text-red-400">{err}</div>}

            {loading ? (
                <p className="text-sm text-[var(--text-tertiary)]">Loading...</p>
            ) : servers.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] py-8 text-center">{t('admin.cloud.flowServers.empty')}</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                            <tr>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.name')}</th>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.machineId')}</th>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.status')}</th>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.token')}</th>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.projectIds')}</th>
                                <th className="text-left py-2 px-2">{t('admin.cloud.flowServers.lastPing')}</th>
                                <th className="text-right py-2 px-2">{t('admin.cloud.flowServers.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servers.map(s => (
                                <tr key={s._id} className="border-b border-[var(--border-primary)]">
                                    <td className="py-2 px-2 font-medium">{s.name}</td>
                                    <td className="py-2 px-2 font-mono text-xs">{s.machineId}</td>
                                    <td className="py-2 px-2">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                            s.status === 'available' ? 'bg-green-500/20 text-green-400'
                                            : s.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-500'
                                            : 'bg-red-500/20 text-red-400'
                                        }`}>
                                            {s.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2">
                                        <span className={`text-xs ${s.tokenValid ? 'text-green-400' : 'text-red-400'}`}>
                                            {s.tokenValid ? '✓ valid' : '✗ invalid'}
                                        </span>
                                    </td>
                                    <td className="py-2 px-2 font-mono text-xs">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[var(--text-tertiary)] mb-1">
                                                {s.projectIds?.length || 0} / {s.targetProjectCount || 3}
                                            </span>
                                            {s.projectIds?.map(pid => (
                                                <div key={pid} className="flex items-center gap-2 group">
                                                    <span title={pid}>{pid.slice(0, 8)}…</span>
                                                    <button
                                                        onClick={() => onDeleteProject(s, pid)}
                                                        className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded px-1"
                                                        title={t('admin.cloud.flowServers.deleteProject')}
                                                    >×</button>
                                                </div>
                                            ))}
                                            {(!s.projectIds || s.projectIds.length === 0) && '—'}
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 text-xs text-[var(--text-tertiary)]">
                                        {s.lastPingAt ? new Date(s.lastPingAt).toLocaleString() : 'never'}
                                    </td>
                                    <td className="py-2 px-2">
                                        <div className="flex gap-1 justify-end items-center">
                                            <IconButton
                                                onClick={() => onSync(s)}
                                                disabled={syncingId === s._id}
                                                title={t('admin.cloud.flowServers.syncPool')}
                                                tone="accent"
                                            >
                                                {syncingId === s._id ? (
                                                    <span className="block w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </IconButton>
                                            <IconButton
                                                onClick={() => startEdit(s)}
                                                title={t('admin.cloud.flowServers.edit')}
                                                tone="default"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                                </svg>
                                            </IconButton>
                                            <IconButton
                                                onClick={() => onToggle(s)}
                                                title={s.enabled ? t('admin.cloud.flowServers.disable') : t('admin.cloud.flowServers.enable')}
                                                tone={s.enabled ? 'warn' : 'success'}
                                            >
                                                {s.enabled ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0v4a1 1 0 102 0V6z" clipRule="evenodd" />
                                                        <path d="M9 13h2v2H9z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </IconButton>
                                            <IconButton
                                                onClick={() => onDelete(s)}
                                                title={t('admin.cloud.flowServers.delete')}
                                                tone="danger"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </IconButton>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
                    <div onClick={(e) => e.stopPropagation()} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 w-full max-w-md space-y-4">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                            {editing ? t('admin.cloud.flowServers.editTitle') : t('admin.cloud.flowServers.registerTitle')}
                        </h3>
                        <FloatInput id="fs-name" label={t('admin.cloud.flowServers.name')} value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
                        <FloatInput id="fs-mid" label={t('admin.cloud.flowServers.machineId')} value={form.machineId} onChange={v => setForm(f => ({ ...f, machineId: v }))} disabled={!!editing} />
                        <FloatInput id="fs-url" label={t('admin.cloud.flowServers.agentUrl')} value={form.agentUrl} onChange={v => setForm(f => ({ ...f, agentUrl: v }))} />
                        <FloatInput id="fs-secret" label={editing ? t('admin.cloud.flowServers.secretOptional') : t('admin.cloud.flowServers.secret')} value={form.secret} onChange={v => setForm(f => ({ ...f, secret: v }))} type="password" />
                        <FloatInput id="fs-pid" label={t('admin.cloud.flowServers.targetProjectCount')} value={form.targetProjectCount} onChange={v => setForm(f => ({ ...f, targetProjectCount: Number(v) || 0 }))} type="number" />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm rounded-lg border border-[var(--border-primary)]">{t('common.cancel')}</button>
                            <button onClick={submit} className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-primary)] text-black font-semibold">{t('common.save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== ICON BUTTON ====================
function IconButton({
    children, onClick, title, tone = 'default', disabled = false,
}: {
    children: ReactNode;
    onClick: () => void;
    title: string;
    tone?: 'default' | 'accent' | 'success' | 'warn' | 'danger';
    disabled?: boolean;
}) {
    const tones: Record<string, string> = {
        default: 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
        accent: 'text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)]',
        success: 'text-green-400 hover:bg-green-500/10',
        warn: 'text-yellow-500 hover:bg-yellow-500/10',
        danger: 'text-red-400 hover:bg-red-500/10',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            aria-label={title}
            className={`p-1.5 rounded transition-colors ${tones[tone]} disabled:opacity-50 disabled:cursor-wait`}
        >
            {children}
        </button>
    );
}

// ==================== FLOAT LABEL INPUT ====================
function FloatInput({
    id, label, value, onChange, type = 'text', disabled = false,
}: {
    id: string;
    label: string;
    value: string | number;
    onChange: (v: string) => void;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div className="relative">
            <input
                id={id}
                type={type}
                placeholder=" "
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="peer w-full px-3 pt-6 pb-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
                htmlFor={id}
                className="absolute left-3 text-[var(--text-tertiary)] transition-all duration-150 pointer-events-none
                           top-1.5 text-[10px]
                           peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm
                           peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-[var(--accent-primary)]"
            >
                {label}
            </label>
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
        maxContainers: 5,
        gpu: '',
    });
    const [currentSpecs, setCurrentSpecs] = useState<{ cpu: string; ram: string; gpu: string } | null>(null);
    const [refreshingSpecs, setRefreshingSpecs] = useState(false);

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
        setFormData({ name: '', machineId: '', agentUrl: '', secret: '', maxContainers: 5, gpu: '' });
        setEditingMachine(null);
        setCurrentSpecs(null);
        setShowForm(false);
    };

    const handleEdit = (machine: HostMachine) => {
        setEditingMachine(machine);
        setFormData({
            name: machine.name,
            machineId: machine.machineId,
            agentUrl: machine.agentUrl,
            secret: machine.secret,
            maxContainers: machine.maxContainers,
            gpu: machine.specs?.gpu || '',
        });
        setCurrentSpecs(machine.specs);
        setShowForm(true);
    };

    const handleRefreshSpecs = async () => {
        if (!editingMachine) return;
        setRefreshingSpecs(true);
        try {
            const response = await getCloudMachines();
            const updated = response.data.find((m: HostMachine) => m._id === editingMachine._id);
            if (updated) {
                setCurrentSpecs(updated.specs);
                setFormData(f => ({ ...f, gpu: updated.specs?.gpu || f.gpu }));
            }
        } catch {
            // ignore
        } finally {
            setRefreshingSpecs(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const payload: any = {
                name: formData.name,
                machineId: formData.machineId,
                agentUrl: formData.agentUrl,
                secret: formData.secret,
                maxContainers: formData.maxContainers,
            };

            if (editingMachine) {
                payload.specs = { ...(currentSpecs || { cpu: '', ram: '' }), gpu: formData.gpu };
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
                        <FloatInput
                            id="m-name"
                            label={t('admin.cloud.machines.name')}
                            value={formData.name}
                            onChange={(v) => setFormData(f => ({ ...f, name: v }))}
                        />
                        <FloatInput
                            id="m-machineId"
                            label={t('admin.cloud.machines.machineId')}
                            value={formData.machineId}
                            onChange={(v) => setFormData(f => ({ ...f, machineId: v }))}
                            disabled={!!editingMachine}
                        />
                        <FloatInput
                            id="m-agentUrl"
                            label={t('admin.cloud.machines.agentUrl')}
                            value={formData.agentUrl}
                            onChange={(v) => setFormData(f => ({ ...f, agentUrl: v }))}
                        />
                        <FloatInput
                            id="m-secret"
                            label={t('admin.cloud.machines.secret')}
                            value={formData.secret}
                            onChange={(v) => setFormData(f => ({ ...f, secret: v }))}
                        />
                        <FloatInput
                            id="m-maxContainers"
                            label={t('admin.cloud.machines.maxContainers')}
                            type="number"
                            value={formData.maxContainers}
                            onChange={(v) => setFormData(f => ({ ...f, maxContainers: parseInt(v) || 1 }))}
                        />
                        {editingMachine && (
                            <FloatInput
                                id="m-gpu"
                                label={t('admin.cloud.machines.gpu')}
                                value={formData.gpu}
                                onChange={(v) => setFormData(f => ({ ...f, gpu: v }))}
                            />
                        )}

                        {/* Specs display — Edit mode only */}
                        {editingMachine && (
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-3 pt-2 pb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                                        {t('admin.cloud.machines.currentSpecs')}
                                    </span>
                                    <button
                                        onClick={handleRefreshSpecs}
                                        disabled={refreshingSpecs}
                                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded transition-colors disabled:opacity-50"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className={`w-3 h-3 ${refreshingSpecs ? 'animate-spin' : ''}`}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        {refreshingSpecs ? t('admin.cloud.machines.refreshing') : t('admin.cloud.machines.refreshSpecs')}
                                    </button>
                                </div>
                                {currentSpecs && (currentSpecs.cpu || currentSpecs.ram || currentSpecs.gpu) ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'CPU', value: currentSpecs.cpu },
                                            { label: 'RAM', value: currentSpecs.ram },
                                            { label: 'GPU', value: currentSpecs.gpu },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="text-center">
                                                <p className="text-[10px] text-[var(--text-tertiary)]">{label}</p>
                                                <p className="text-xs font-medium text-[var(--text-primary)] truncate" title={value || '-'}>{value || '-'}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[var(--text-tertiary)] text-center py-1">{t('admin.cloud.machines.noSpecs')}</p>
                                )}
                            </div>
                        )}
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
    const { confirm: confirmDialog } = useConfirm();
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
        if (!await confirmDialog({ message: t('admin.cloud.sessions.forceEndConfirm'), variant: 'danger' })) return;
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
    const { t } = useTranslation();
    const { confirm: confirmDialog } = useConfirm();
    const [files, setFiles] = useState<OrphanedFile[]>([]);
    const [referencedFiles, setReferencedFiles] = useState<OrphanedFile[]>([]);
    const [meta, setMeta] = useState<{ orphaned: number; totalB2: number; referenced: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [deletingKeys, setDeletingKeys] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [viewMode, setViewMode] = useState<'orphaned' | 'all'>('orphaned');

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
            setReferencedFiles(res.referencedFiles ?? []);
            setMeta(res.meta);
        } catch (e: any) {
            setError(e.message || 'Lỗi khi tải danh sách file');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (key: string) => {
        if (!await confirmDialog({ message: `${t('admin.storage.deleteFileConfirm')}\n${key}`, variant: 'danger' })) return;
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
        if (!await confirmDialog({ message: t('admin.storage.deleteBulkConfirm').replace('{count}', String(selectedKeys.size)), variant: 'danger' })) return;
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

    const displayFiles = viewMode === 'orphaned' ? files : [...files, ...referencedFiles];

    const totalSelectedSize = files
        .filter(f => selectedKeys.has(f.key))
        .reduce((acc, f) => acc + f.size, 0);

    const sourceLabel = (source: OrphanedFile['source']) => {
        const map: Record<string, string> = { workflow: 'Workflow', resource: 'Resource', course: 'Course', prompt: 'Prompt' };
        return source ? map[source] ?? source : '—';
    };

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
                <div className="flex items-center gap-2">
                    {meta && (
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border-primary)] text-sm font-medium">
                            <button
                                onClick={() => setViewMode('orphaned')}
                                className={`px-3 py-1.5 transition-colors ${viewMode === 'orphaned' ? 'bg-red-500/20 text-red-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            >
                                🗑 Orphaned ({meta.orphaned})
                            </button>
                            <button
                                onClick={() => setViewMode('all')}
                                className={`px-3 py-1.5 border-l border-[var(--border-primary)] transition-colors ${viewMode === 'all' ? 'bg-green-500/10 text-green-400' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}
                            >
                                📂 Tất cả ({meta.totalB2})
                            </button>
                        </div>
                    )}
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

            {/* Bulk actions bar — orphaned mode only */}
            {viewMode === 'orphaned' && files.length > 0 && !loading && (
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
            {!loading && displayFiles.length > 0 && (
                <div className="rounded-xl border border-[var(--border-primary)] overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-[var(--bg-secondary)] text-[var(--text-tertiary)] text-xs uppercase tracking-wider">
                            <tr>
                                {viewMode === 'orphaned' && <th className="w-10 py-3 px-4"></th>}
                                <th className="py-3 px-4 text-left">File</th>
                                <th className="py-3 px-4 text-left">Folder</th>
                                {viewMode === 'all' && <th className="py-3 px-4 text-left">Nguồn</th>}
                                {viewMode === 'all' && <th className="py-3 px-4 text-left">Người upload</th>}
                                <th className="py-3 px-4 text-right">Dung lượng</th>
                                <th className="py-3 px-4 text-left">Sửa lần cuối (B2)</th>
                                {viewMode === 'all'
                                    ? <th className="py-3 px-4 text-center">Trạng thái</th>
                                    : <th className="py-3 px-4 text-center">Xóa</th>
                                }
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-primary)]">
                            {displayFiles.map(f => (
                                <tr key={f.key} className={`transition-colors ${
                                    f.referenced
                                        ? 'hover:bg-[var(--bg-secondary)]'
                                        : selectedKeys.has(f.key) ? 'bg-red-500/5' : 'hover:bg-[var(--bg-secondary)]'
                                }`}>
                                    {viewMode === 'orphaned' && (
                                        <td className="py-3 px-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedKeys.has(f.key)}
                                                onChange={() => toggleSelect(f.key)}
                                                className="accent-red-500 w-4 h-4 cursor-pointer"
                                            />
                                        </td>
                                    )}
                                    <td className="py-3 px-4 max-w-xs">
                                        <p className="font-medium text-[var(--text-primary)] truncate" title={f.key}>{f.filename}</p>
                                        <p className="text-[10px] text-[var(--text-tertiary)] truncate font-mono">{f.key}</p>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] whitespace-nowrap">
                                            {f.folder || 'root'}
                                        </span>
                                    </td>
                                    {viewMode === 'all' && (
                                        <td className="py-3 px-4">
                                            {f.source ? (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 whitespace-nowrap">
                                                    {sourceLabel(f.source)}
                                                </span>
                                            ) : <span className="text-[var(--text-tertiary)]">—</span>}
                                        </td>
                                    )}
                                    {viewMode === 'all' && (
                                        <td className="py-3 px-4 text-[var(--text-secondary)] text-xs">
                                            {f.uploader !== 'Unknown' ? f.uploader : <span className="text-[var(--text-tertiary)]">—</span>}
                                        </td>
                                    )}
                                    <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                        {formatBytes(f.size)}
                                    </td>
                                    <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                                        {f.lastModified ? formatDate(f.lastModified) : '—'}
                                    </td>
                                    {viewMode === 'all' ? (
                                        <td className="py-3 px-4 text-center">
                                            {f.referenced
                                                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">✓ Đang dùng</span>
                                                : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">✗ Orphaned</span>
                                            }
                                        </td>
                                    ) : (
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
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty states */}
            {!loading && displayFiles.length === 0 && meta && (
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
