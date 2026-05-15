import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { uploadToB2 } from '../services/b2StorageService';
import {
    createInteriorProject,
    deleteInteriorProject,
    getInteriorProject,
    InteriorApiError,
    InteriorProject,
    InteriorVersion,
    listInteriorProjects,
    rollbackInteriorProject,
    sendInteriorMessage,
    INTERIOR_MODELS,
    INTERIOR_DEFAULT_MODEL,
    type InteriorModel
} from '../services/interiorService';

interface PendingProposal {
    proposalText: string;
    message: string;
    refImageUrls: string[];
    aiModel: string | null;
    totalTokens: number | null;
}

type MobileTab = 'projects' | 'preview' | 'chat';

const currentVersion = (project: InteriorProject | null): InteriorVersion | null => {
    if (!project) return null;
    return project.versions.find((version) => version.index === project.currentVersionIndex)
        || project.versions[project.versions.length - 1]
        || null;
};

const formatDateTime = (value: string) => {
    try {
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const InteriorDesignPage: React.FC = () => {
    const { projectId } = useParams<{ projectId?: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, token, isAuthenticated, refreshUser, updateProfile } = useAuth();
    const { confirm } = useConfirm();
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    const [projects, setProjects] = useState<InteriorProject[]>([]);
    const [project, setProject] = useState<InteriorProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [refFiles, setRefFiles] = useState<File[]>([]);
    const MAX_REF_IMAGES = 5;
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [iframeReady, setIframeReady] = useState(false);
    const [previewVersionIndex, setPreviewVersionIndex] = useState<number | null>(null);
    const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
    const [selectedModel, setSelectedModel] = useState<InteriorModel>(INTERIOR_DEFAULT_MODEL);
    const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null);
    const [togglingPref, setTogglingPref] = useState(false);

    const twoStepConfirm = !!user?.preferences?.interiorTwoStepConfirm;

    const activeVersion = useMemo(() => {
        if (!project) return null;
        if (previewVersionIndex !== null) {
            return project.versions.find((version) => version.index === previewVersionIndex) || currentVersion(project);
        }
        return currentVersion(project);
    }, [project, previewVersionIndex]);

    const canUseAi = isAuthenticated && !!token && !!project && !busy;
    const needsCredit = user?.role !== 'admin' && user?.role !== 'mod';
    const hasCredit = !needsCredit || (user?.balance || 0) >= 1;

    const postModel = useCallback((version: InteriorVersion | null) => {
        if (!version || !iframeRef.current?.contentWindow) return;
        iframeRef.current.contentWindow.postMessage({
            type: 'APPLY_MODEL',
            model: version.modelJson
        }, '*');
    }, []);

    const loadProjects = useCallback(async () => {
        if (!token) {
            setProjects([]);
            setProject(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const result = await listInteriorProjects(token);
            setProjects(result.projects);
            if (!projectId && result.projects[0]) {
                navigate(`/studio/interior-design/${result.projects[0]._id}`, { replace: true });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [navigate, projectId, t, token]);

    const loadProject = useCallback(async (id: string) => {
        if (!token) return;
        setLoading(true);
        setError('');
        try {
            const result = await getInteriorProject(token, id);
            setProject(result.project);
            setPreviewVersionIndex(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.loadFailed'));
            setProject(null);
        } finally {
            setLoading(false);
        }
    }, [t, token]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (projectId && token) loadProject(projectId);
    }, [loadProject, projectId, token]);

    useEffect(() => {
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'INTERIOR_SHELL_READY') setIframeReady(true);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    useEffect(() => {
        if (iframeReady) postModel(activeVersion);
    }, [activeVersion, iframeReady, postModel]);

    const handleCreateProject = async () => {
        if (!token) {
            document.dispatchEvent(new CustomEvent('openLoginModal'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const result = await createInteriorProject(token, t('studio.interior.newProjectName'));
            setProjects((prev) => [result.project, ...prev]);
            setProject(result.project);
            navigate(`/studio/interior-design/${result.project._id}`);
            setMobileTab('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.createFailed'));
        } finally {
            setBusy(false);
        }
    };

    const handleDeleteProject = async (target: InteriorProject) => {
        if (!token) return;
        const ok = await confirm({
            title: t('studio.interior.deleteTitle'),
            message: t('studio.interior.deleteMessage').replace('{{name}}', target.name),
            confirmText: t('studio.interior.deleteConfirm'),
            variant: 'danger'
        });
        if (!ok) return;

        setBusy(true);
        setError('');
        try {
            await deleteInteriorProject(token, target._id);
            const remaining = projects.filter((item) => item._id !== target._id);
            setProjects(remaining);
            if (project?._id === target._id) {
                setProject(null);
                navigate(remaining[0] ? `/studio/interior-design/${remaining[0]._id}` : '/studio/interior-design');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.deleteFailed'));
        } finally {
            setBusy(false);
        }
    };

    const addRefFiles = (incoming: File[]) => {
        if (incoming.length === 0) return;
        setRefFiles((prev) => {
            const merged = [...prev];
            for (const file of incoming) {
                if (merged.length >= MAX_REF_IMAGES) break;
                merged.push(file);
            }
            return merged;
        });
    };

    const handlePickRefFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith('image/'));
        addRefFiles(files);
        event.target.value = '';
    };

    const handleRemoveRefFile = (index: number) => {
        setRefFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handlePasteInTextarea = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        const pasted: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file' && item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) pasted.push(file);
            }
        }
        if (pasted.length > 0) {
            event.preventDefault();
            addRefFiles(pasted);
        }
    };

    const handleSend = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!token || !project) {
            document.dispatchEvent(new CustomEvent('openLoginModal'));
            return;
        }
        if (!message.trim()) {
            setError(t('studio.interior.errors.emptyPrompt'));
            return;
        }
        if (!hasCredit) {
            setError(t('studio.interior.errors.noCredit'));
            return;
        }

        setBusy(true);
        setError('');
        setUploadProgress(0);
        try {
            const refImageUrls: string[] = [];
            for (let i = 0; i < refFiles.length; i++) {
                const uploaded = await uploadToB2(
                    refFiles[i],
                    'interior-refs',
                    token,
                    (pct) => setUploadProgress(Math.round(((i + pct / 100) / refFiles.length) * 100))
                );
                refImageUrls.push(uploaded.url);
            }

            const stage = twoStepConfirm ? 'proposal' : 'apply';
            const result = await sendInteriorMessage(token, project._id, {
                message: message.trim(),
                refImageUrls,
                expectedCurrentVersionIndex: project.currentVersionIndex,
                model: selectedModel,
                stage
            });

            setUploadProgress(0);
            refreshUser();

            if (result.stage === 'proposal') {
                setPendingProposal({
                    proposalText: result.proposalText,
                    message: message.trim(),
                    refImageUrls: result.refImageUrls,
                    aiModel: result.aiModel,
                    totalTokens: result.usage?.totalTokens ?? null
                });
                setRefFiles([]);
                return;
            }

            setProject(result.project);
            setProjects((prev) => [result.project, ...prev.filter((item) => item._id !== result.project._id)]);
            setMessage('');
            setRefFiles([]);
            setPreviewVersionIndex(null);
            setMobileTab('preview');
        } catch (err) {
            if (err instanceof InteriorApiError && err.status === 409 && (err.data as any)?.data?.project) {
                setProject((err.data as any).data.project);
            }
            setError(err instanceof Error ? err.message : t('studio.interior.errors.sendFailed'));
        } finally {
            setBusy(false);
        }
    };

    const handleApplyProposal = async () => {
        if (!token || !project || !pendingProposal) return;
        if (!hasCredit) {
            setError(t('studio.interior.errors.noCredit'));
            return;
        }
        setBusy(true);
        setError('');
        try {
            const result = await sendInteriorMessage(token, project._id, {
                message: pendingProposal.message,
                refImageUrls: pendingProposal.refImageUrls,
                expectedCurrentVersionIndex: project.currentVersionIndex,
                model: selectedModel,
                stage: 'apply',
                proposalText: pendingProposal.proposalText
            });
            refreshUser();
            if (result.stage !== 'apply') {
                setError(t('studio.interior.errors.sendFailed'));
                return;
            }
            setProject(result.project);
            setProjects((prev) => [result.project, ...prev.filter((item) => item._id !== result.project._id)]);
            setMessage('');
            setPendingProposal(null);
            setPreviewVersionIndex(null);
            setMobileTab('preview');
        } catch (err) {
            if (err instanceof InteriorApiError && err.status === 409 && (err.data as any)?.data?.project) {
                setProject((err.data as any).data.project);
            }
            setError(err instanceof Error ? err.message : t('studio.interior.errors.sendFailed'));
        } finally {
            setBusy(false);
        }
    };

    const handleCancelProposal = () => {
        if (!pendingProposal) return;
        setMessage(pendingProposal.message);
        setPendingProposal(null);
    };

    const handleToggleTwoStep = async () => {
        if (!token || togglingPref) return;
        const next = !twoStepConfirm;
        setTogglingPref(true);
        setError('');
        try {
            await updateProfile({ preferences: { interiorTwoStepConfirm: next } });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.sendFailed'));
        } finally {
            setTogglingPref(false);
        }
    };

    const handleRollback = async (version: InteriorVersion) => {
        if (!token || !project) return;
        const ok = await confirm({
            title: t('studio.interior.rollbackTitle'),
            message: t('studio.interior.rollbackMessage').replace('{{version}}', `V${version.index}`),
            confirmText: t('studio.interior.rollbackConfirm'),
            variant: 'warning'
        });
        if (!ok) return;

        setBusy(true);
        setError('');
        try {
            const result = await rollbackInteriorProject(token, project._id, version._id);
            setProject(result.project);
            setProjects((prev) => [result.project, ...prev.filter((item) => item._id !== result.project._id)]);
            setPreviewVersionIndex(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('studio.interior.errors.rollbackFailed'));
        } finally {
            setBusy(false);
        }
    };

    const openLogin = () => document.dispatchEvent(new CustomEvent('openLoginModal'));

    if (!isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] px-4 py-8">
                <button
                    onClick={() => navigate('/studio')}
                    className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                >
                    {t('studio.hub.backToStudio')}
                </button>
                <div className="mx-auto max-w-md rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t('studio.interior.loginTitle')}</h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">{t('studio.interior.loginDesc')}</p>
                    <button
                        onClick={openLogin}
                        className="mt-5 rounded-lg bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-bold text-[var(--text-on-accent)] hover:opacity-90"
                    >
                        {t('studio.interior.signIn')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <div className="border-b border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3">
                <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/studio')}
                            className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                        >
                            {t('studio.hub.backToStudio')}
                        </button>
                        <div>
                            <h1 className="text-lg font-bold">{t('studio.interior.title')}</h1>
                            <p className="text-xs text-[var(--text-tertiary)]">{t('studio.interior.subtitle')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-secondary)]">
                            {t('studio.interior.balance')}: {user?.role === 'admin' || user?.role === 'mod' ? t('studio.interior.unlimited') : user?.balance ?? 0}
                        </span>
                        <button
                            onClick={handleCreateProject}
                            disabled={busy}
                            className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 font-bold text-[var(--text-on-accent)] hover:opacity-90 disabled:opacity-50"
                        >
                            {t('studio.interior.newProject')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:hidden border-b border-[var(--border-primary)] bg-[var(--bg-card)] p-2">
                <div className="grid grid-cols-3 gap-2">
                    {(['projects', 'preview', 'chat'] as MobileTab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setMobileTab(tab)}
                            className={`rounded-lg px-3 py-2 text-sm font-semibold ${mobileTab === tab ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
                        >
                            {t(`studio.interior.tabs.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mx-auto mt-4 max-w-[1800px] px-4">
                    <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
                </div>
            )}

            <div className="mx-auto grid max-w-[1800px] grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)_380px]">
                <aside className={`${mobileTab === 'projects' ? 'block' : 'hidden'} lg:block rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]`}>
                    <div className="flex items-center justify-between border-b border-[var(--border-primary)] p-4">
                        <h2 className="font-bold">{t('studio.interior.projects')}</h2>
                        <span className="text-xs text-[var(--text-tertiary)]">{projects.length}</span>
                    </div>
                    <div className="max-h-[calc(100vh-210px)] overflow-y-auto p-2">
                        {loading && <div className="p-4 text-sm text-[var(--text-secondary)]">{t('studio.interior.loading')}</div>}
                        {!loading && projects.length === 0 && (
                            <div className="p-4 text-sm text-[var(--text-secondary)]">{t('studio.interior.noProjects')}</div>
                        )}
                        {projects.map((item) => (
                            <div
                                key={item._id}
                                className={`mb-2 rounded-lg border p-3 ${item._id === project?._id ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-primary)] bg-[var(--bg-secondary)]'}`}
                            >
                                <button
                                    onClick={() => {
                                        navigate(`/studio/interior-design/${item._id}`);
                                        setMobileTab('preview');
                                    }}
                                    className="block w-full text-left"
                                >
                                    <div className="font-semibold text-[var(--text-primary)]">{item.name}</div>
                                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">
                                        V{item.currentVersionIndex} · {formatDateTime(item.updatedAt)}
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(item)}
                                    disabled={busy}
                                    className="mt-3 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                    {t('studio.interior.delete')}
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className={`${mobileTab === 'preview' ? 'block' : 'hidden'} lg:block rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden`}>
                    <div className="flex min-h-[56px] items-center justify-between border-b border-[var(--border-primary)] px-4 py-3">
                        <div>
                            <h2 className="font-bold">{project?.name || t('studio.interior.noProjectSelected')}</h2>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                {activeVersion ? `${t('studio.interior.previewing')} V${activeVersion.index}` : t('studio.interior.createFirst')}
                            </p>
                        </div>
                        {previewVersionIndex !== null && (
                            <button
                                onClick={() => setPreviewVersionIndex(null)}
                                className="rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                            >
                                {t('studio.interior.backToCurrent')}
                            </button>
                        )}
                    </div>
                    <div className="relative h-[calc(100vh-220px)] min-h-[560px]">
                        {project ? (
                            <iframe
                                ref={iframeRef}
                                src="/interior-design/shell.html"
                                className="absolute inset-0 h-full w-full border-0"
                                title={t('studio.hub.cards.interior.title')}
                                onLoad={() => {
                                    setIframeReady(true);
                                    postModel(activeVersion);
                                }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[var(--text-secondary)]">
                                <div>
                                    <p>{t('studio.interior.emptyState')}</p>
                                    <button
                                        onClick={handleCreateProject}
                                        className="mt-4 rounded-lg bg-[var(--accent-primary)] px-4 py-2 font-bold text-[var(--text-on-accent)]"
                                    >
                                        {t('studio.interior.newProject')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <aside className={`${mobileTab === 'chat' ? 'block' : 'hidden'} lg:block rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]`}>
                    <div className="border-b border-[var(--border-primary)] p-4">
                        <h2 className="font-bold">{t('studio.interior.chat')}</h2>
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                            {twoStepConfirm ? t('studio.interior.creditNote2Step') : t('studio.interior.creditNote')}
                        </p>
                        <label className="mt-3 flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={twoStepConfirm}
                                onChange={handleToggleTwoStep}
                                disabled={togglingPref || busy || !!pendingProposal}
                                className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent-primary)] disabled:cursor-not-allowed"
                            />
                            <span>
                                <span className="font-semibold text-[var(--text-primary)]">{t('studio.interior.twoStep.label')}</span>
                                <span className="block text-[var(--text-tertiary)]">{t('studio.interior.twoStep.desc')}</span>
                            </span>
                        </label>
                    </div>

                    <div className="max-h-[calc(100vh-520px)] min-h-[230px] overflow-y-auto p-4">
                        {!project && <p className="text-sm text-[var(--text-secondary)]">{t('studio.interior.createFirst')}</p>}
                        {project?.versions.filter((version) => version.userPrompt || version.aiReply).map((version) => (
                            <div key={version._id} className="mb-4 space-y-2">
                                {version.userPrompt && (
                                    <div className="ml-8 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-sm text-[var(--text-on-accent)]">
                                        <div>{version.userPrompt}</div>
                                        {version.refImageUrls && version.refImageUrls.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {version.refImageUrls.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                                                        <img src={url} alt={`ref-${idx}`} className="h-12 w-12 rounded border border-white/30 object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {version.aiReply && (
                                    <div className="mr-8 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                                        <div>{version.aiReply}</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                                            <span>V{version.index} · {formatDateTime(version.createdAt)}</span>
                                            {version.aiModel && (
                                                <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5">{version.aiModel}</span>
                                            )}
                                            {version.usage?.totalTokens != null && (
                                                <span className="rounded bg-[var(--bg-card)] px-1.5 py-0.5">
                                                    {t('studio.interior.tokens').replace('{n}', String(version.usage.totalTokens))}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {pendingProposal && (
                        <div className="border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/40 p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <h3 className="text-sm font-bold text-[var(--accent-primary)]">{t('studio.interior.proposal.title')}</h3>
                                <span className="text-[10px] text-[var(--text-tertiary)]">
                                    {pendingProposal.aiModel}
                                    {pendingProposal.totalTokens != null
                                        ? ` · ${t('studio.interior.tokens').replace('{n}', String(pendingProposal.totalTokens))}`
                                        : ''}
                                </span>
                            </div>
                            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-3 text-sm text-[var(--text-secondary)]">
                                {pendingProposal.proposalText}
                            </div>
                            <p className="mt-2 text-xs text-[var(--text-tertiary)]">{t('studio.interior.proposal.applyHint')}</p>
                            <div className="mt-3 flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleApplyProposal}
                                    disabled={busy || !hasCredit}
                                    className="flex-1 rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-bold text-[var(--text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {busy ? t('studio.interior.sending') : t('studio.interior.proposal.apply')}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelProposal}
                                    disabled={busy}
                                    className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)] disabled:opacity-50"
                                >
                                    {t('studio.interior.proposal.cancel')}
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="border-t border-[var(--border-primary)] p-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                            {t('studio.interior.promptLabel')}
                        </label>
                        <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            onPaste={handlePasteInTextarea}
                            placeholder={t('studio.interior.promptPlaceholder')}
                            className="min-h-[112px] w-full resize-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                            maxLength={8000}
                            disabled={!project || busy || !!pendingProposal}
                        />
                        <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t('studio.interior.pasteHint')}</p>

                        {refFiles.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {refFiles.map((file, index) => {
                                    const url = URL.createObjectURL(file);
                                    return (
                                        <div key={`${file.name}-${index}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                            <img
                                                src={url}
                                                alt={file.name}
                                                className="h-full w-full object-cover"
                                                onLoad={() => URL.revokeObjectURL(url)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveRefFile(index)}
                                                disabled={busy}
                                                title={t('studio.interior.clearRef')}
                                                className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/60 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-3 text-center text-sm text-[var(--text-secondary)] hover:border-[var(--accent-primary)]">
                            <span className="font-semibold">
                                {refFiles.length > 0
                                    ? t('studio.interior.refImageCount').replace('{n}', String(refFiles.length)).replace('{max}', String(MAX_REF_IMAGES))
                                    : t('studio.interior.refImage')}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={!project || busy || !!pendingProposal || refFiles.length >= MAX_REF_IMAGES}
                                onChange={handlePickRefFiles}
                            />
                        </label>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mt-2 h-2 rounded-full bg-[var(--bg-secondary)]">
                                <div className="h-2 rounded-full bg-[var(--accent-primary)]" style={{ width: `${uploadProgress}%` }} />
                            </div>
                        )}
                        <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                {t('studio.interior.modelLabel')}
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(event) => setSelectedModel(event.target.value as InteriorModel)}
                                disabled={busy}
                                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                            >
                                {INTERIOR_MODELS.map((modelId) => (
                                    <option key={modelId} value={modelId}>
                                        {modelId}{modelId === INTERIOR_DEFAULT_MODEL ? ` (${t('studio.interior.modelDefault')})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {!hasCredit && (
                            <div className="mt-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
                                {t('studio.interior.errors.noCredit')}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={!canUseAi || !message.trim() || !hasCredit || !!pendingProposal}
                            className="mt-3 w-full rounded-lg bg-[var(--accent-primary)] px-4 py-3 text-sm font-bold text-[var(--text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {busy
                                ? t('studio.interior.sending')
                                : (twoStepConfirm ? t('studio.interior.sendProposal') : t('studio.interior.send'))}
                        </button>
                    </form>

                    <div className="border-t border-[var(--border-primary)] p-4">
                        <h3 className="mb-3 text-sm font-bold">{t('studio.interior.versions')}</h3>
                        <div className="max-h-52 space-y-2 overflow-y-auto">
                            {project?.versions.slice().reverse().map((version) => (
                                <div key={version._id} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            onClick={() => {
                                                setPreviewVersionIndex(version.index);
                                                setMobileTab('preview');
                                            }}
                                            className="text-left text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                                        >
                                            V{version.index}
                                            {version.index === project.currentVersionIndex ? ` · ${t('studio.interior.current')}` : ''}
                                        </button>
                                        {version.index !== project.currentVersionIndex && (
                                            <button
                                                onClick={() => handleRollback(version)}
                                                disabled={busy}
                                                className="text-xs font-semibold text-[var(--accent-primary)] disabled:opacity-50"
                                            >
                                                {t('studio.interior.rollback')}
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--text-tertiary)]">{formatDateTime(version.createdAt)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default InteriorDesignPage;
