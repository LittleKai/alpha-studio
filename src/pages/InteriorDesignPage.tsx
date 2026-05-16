import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { uploadToB2 } from '../services/b2StorageService';
import { generateObjFromCabinetModel, triggerDownload, downloadRemoteImage, createAiImagePackage, downloadDataUrl } from '../utils/cabinetExport';
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
    type InteriorModel,
    type InteriorProposalStructured
} from '../services/interiorService';

interface PendingProposal {
    message: string;
    refImageUrls: string[];
    structured: InteriorProposalStructured;
    aiModel: string | null;
    totalTokens: number | null;
}

interface ProposalAnswer {
    selected: string | null;
    note: string;
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
    // URL của ảnh được khôi phục từ version rollback — đã upload sẵn lên B2,
    // không cần upload lại khi gửi.
    const [restoredRefImageUrls, setRestoredRefImageUrls] = useState<string[]>([]);
    const MAX_REF_IMAGES = 5;
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [iframeReady, setIframeReady] = useState(false);
    const [previewVersionIndex, setPreviewVersionIndex] = useState<number | null>(null);
    const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
    const [selectedModel, setSelectedModel] = useState<InteriorModel>(INTERIOR_DEFAULT_MODEL);
    const [pendingProposal, setPendingProposal] = useState<PendingProposal | null>(null);
    const [editedChanges, setEditedChanges] = useState('');
    const [proposalAnswers, setProposalAnswers] = useState<ProposalAnswer[]>([]);
    const [generalNote, setGeneralNote] = useState('');
    const [togglingPref, setTogglingPref] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [aiPackageBusy, setAiPackageBusy] = useState(false);
    const [aiPackageError, setAiPackageError] = useState('');

    const twoStepConfirm = !!user?.preferences?.interiorTwoStepConfirm;

    useEffect(() => {
        if (!settingsOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSettingsOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [settingsOpen]);

    useEffect(() => {
        if (!exportDialogOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExportDialogOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [exportDialogOpen]);

    // Ảnh tham chiếu user đã upload — gom unique URL trong branch hiện tại.
    const exportImages = useMemo(() => {
        if (!project) return [] as { url: string; version: number }[];
        const seen = new Set<string>();
        const images: { url: string; version: number }[] = [];
        for (const v of project.versions) {
            if (v.index > project.currentVersionIndex) continue;
            if (!Array.isArray(v.refImageUrls)) continue;
            for (const url of v.refImageUrls) {
                if (url && !seen.has(url)) {
                    seen.add(url);
                    images.push({ url, version: v.index });
                }
            }
        }
        return images;
    }, [project]);

    const handleExportObj = () => {
        if (!project || !activeVersion) return;
        const safeName = (project.name || 'cabinet').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 40) || 'cabinet';
        const mtlFilename = `${safeName}_v${activeVersion.index}.mtl`;
        const { obj, mtl } = generateObjFromCabinetModel(activeVersion.modelJson as any, mtlFilename);
        triggerDownload(`${safeName}_v${activeVersion.index}.obj`, obj, 'text/plain;charset=utf-8');
        setTimeout(() => triggerDownload(mtlFilename, mtl, 'text/plain;charset=utf-8'), 200);
    };

    const handleDownloadImage = async (url: string, version: number, index: number) => {
        const safeName = (project?.name || 'project').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 30) || 'project';
        const extMatch = url.split('?')[0].match(/\.([a-zA-Z0-9]{2,5})$/);
        const ext = extMatch ? extMatch[1] : 'jpg';
        await downloadRemoteImage(url, `${safeName}_v${version}_img${index + 1}.${ext}`);
    };

    const handleDownloadAiPackage = async () => {
        if (!project || !activeVersion) return;
        setAiPackageBusy(true);
        setAiPackageError('');
        try {
            const pkg = await createAiImagePackage(activeVersion.modelJson);
            // Trigger each download với delay nhỏ tránh browser block batch download.
            pkg.files.forEach((file, i) => {
                setTimeout(() => downloadDataUrl(file.dataUrl, file.name), i * 200);
            });
        } catch (err) {
            setAiPackageError(err instanceof Error ? err.message : 'Lỗi tạo bộ AI');
        } finally {
            setAiPackageBusy(false);
        }
    };

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

    // First user message của dự án (xét theo branch hiện tại sau khi rollback) →
    // luôn ép 2-step để user xác nhận baseline understanding.
    const isFirstUserMessage = useMemo(() => {
        if (!project) return false;
        return !project.versions
            .filter((v) => v.index <= project.currentVersionIndex)
            .some((v) => v.userPrompt && v.userPrompt.trim());
    }, [project]);
    const effectiveTwoStep = twoStepConfirm || isFirstUserMessage;

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
        const remaining = MAX_REF_IMAGES - refFiles.length - restoredRefImageUrls.length;
        if (remaining <= 0) return;
        setRefFiles((prev) => [...prev, ...incoming.slice(0, remaining)]);
    };

    const handlePickRefFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []).filter((f) => f.type.startsWith('image/'));
        addRefFiles(files);
        event.target.value = '';
    };

    const handleRemoveRefFile = (index: number) => {
        setRefFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveRestoredUrl = (index: number) => {
        setRestoredRefImageUrls((prev) => prev.filter((_, i) => i !== index));
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
            const newUrls: string[] = [];
            for (let i = 0; i < refFiles.length; i++) {
                const uploaded = await uploadToB2(
                    refFiles[i],
                    'interior-refs',
                    token,
                    (pct) => setUploadProgress(Math.round(((i + pct / 100) / refFiles.length) * 100))
                );
                newUrls.push(uploaded.url);
            }
            // Kết hợp URL khôi phục từ rollback + URL mới upload, tôn trọng giới hạn 5 ảnh.
            const refImageUrls = [...restoredRefImageUrls, ...newUrls].slice(0, MAX_REF_IMAGES);

            const stage = effectiveTwoStep ? 'proposal' : 'apply';
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
                const structured = result.structured;
                setPendingProposal({
                    message: message.trim(),
                    refImageUrls: result.refImageUrls,
                    structured,
                    aiModel: result.aiModel,
                    totalTokens: result.usage?.totalTokens ?? null
                });
                setEditedChanges(structured.proposedChanges.join('\n'));
                setProposalAnswers(structured.questions.map(() => ({ selected: null, note: '' })));
                setGeneralNote('');
                setRefFiles([]);
                setRestoredRefImageUrls([]);
                return;
            }

            setProject(result.project);
            setProjects((prev) => [result.project, ...prev.filter((item) => item._id !== result.project._id)]);
            setMessage('');
            setRefFiles([]);
            setRestoredRefImageUrls([]);
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

    const buildEnrichedProposalContext = (): string => {
        if (!pendingProposal) return '';
        const { structured } = pendingProposal;
        const lines: string[] = [];
        if (structured.observation) lines.push(`Quan sát ảnh: ${structured.observation}`);
        if (structured.understanding) lines.push(`Hiểu yêu cầu: ${structured.understanding}`);
        const cleanedChanges = editedChanges.split('\n').map((s) => s.trim()).filter(Boolean);
        if (cleanedChanges.length) {
            lines.push('Đề xuất thay đổi (đã user xác nhận/chỉnh sửa):');
            cleanedChanges.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
        }
        if (structured.questions.length) {
            lines.push('Trả lời câu hỏi:');
            structured.questions.forEach((q, i) => {
                const ans = proposalAnswers[i] || { selected: null, note: '' };
                lines.push(`Q${i + 1}: ${q.question}`);
                if (ans.selected) lines.push(`  Lựa chọn: ${ans.selected}`);
                if (ans.note.trim()) lines.push(`  Ghi chú: ${ans.note.trim()}`);
                if (!ans.selected && !ans.note.trim()) lines.push(`  (User để AI tự quyết)`);
            });
        }
        const note = generalNote.trim();
        if (note) lines.push(`Ghi chú thêm của user: ${note}`);
        return lines.join('\n');
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
                proposalText: buildEnrichedProposalContext()
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
            setProposalAnswers([]);
            setEditedChanges('');
            setGeneralNote('');
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
        // Khôi phục ảnh đã upload vào ô input để user sửa lại prompt và gửi lại
        // mà không cần upload lại.
        setRestoredRefImageUrls(pendingProposal.refImageUrls || []);
        setPendingProposal(null);
        setProposalAnswers([]);
        setEditedChanges('');
        setGeneralNote('');
    };

    const updateAnswerSelected = (index: number, value: string) => {
        setProposalAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, selected: value } : a)));
    };

    const updateAnswerNote = (index: number, value: string) => {
        setProposalAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, note: value } : a)));
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
            // Khôi phục prompt + ảnh đính kèm của version cũ vào ô chat để user
            // có thể chỉnh sửa và gửi lại nhanh chóng.
            setMessage(version.userPrompt || '');
            setRestoredRefImageUrls(Array.isArray(version.refImageUrls) ? version.refImageUrls.slice(0, MAX_REF_IMAGES) : []);
            setRefFiles([]);
            setPendingProposal(null);
            setEditedChanges('');
            setProposalAnswers([]);
            setGeneralNote('');
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
                    <div className="flex min-h-[56px] items-center justify-between gap-3 border-b border-[var(--border-primary)] px-4 py-3">
                        <div className="min-w-0">
                            <h2 className="truncate font-bold">{project?.name || t('studio.interior.noProjectSelected')}</h2>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                {activeVersion ? `${t('studio.interior.previewing')} V${activeVersion.index}` : t('studio.interior.createFirst')}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {previewVersionIndex !== null && (
                                <button
                                    onClick={() => setPreviewVersionIndex(null)}
                                    className="rounded-lg border border-[var(--border-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]"
                                >
                                    {t('studio.interior.backToCurrent')}
                                </button>
                            )}
                            {project && (
                                <button
                                    type="button"
                                    onClick={() => setExportDialogOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-3 py-2 text-xs font-bold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20"
                                    title={t('studio.interior.export.title')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    {t('studio.interior.export.openButton')}
                                </button>
                            )}
                        </div>
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
                            {twoStepConfirm
                                ? t('studio.interior.creditNote2Step')
                                : isFirstUserMessage
                                    ? t('studio.interior.creditNoteFirstMessage')
                                    : t('studio.interior.creditNote')}
                        </p>
                    </div>

                    <div className="max-h-[calc(100vh-520px)] min-h-[230px] overflow-y-auto p-4">
                        {!project && <p className="text-sm text-[var(--text-secondary)]">{t('studio.interior.createFirst')}</p>}
                        {project?.versions
                            .filter((version) => version.index <= project.currentVersionIndex && (version.userPrompt || version.aiReply))
                            .map((version) => (
                            <div key={version._id} className="mb-5 space-y-3">
                                {version.userPrompt && (
                                    <div className="ml-8 rounded-2xl bg-[var(--chat-user-bg)] px-4 py-2.5 text-sm leading-relaxed text-[var(--text-primary)] shadow-sm">
                                        <div className="whitespace-pre-wrap">{version.userPrompt}</div>
                                        {version.refImageUrls && version.refImageUrls.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {version.refImageUrls.map((url, idx) => (
                                                    <a key={idx} href={url} target="_blank" rel="noreferrer" className="block">
                                                        <img src={url} alt={`ref-${idx}`} className="h-12 w-12 rounded-lg border border-[var(--border-primary)] object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {version.aiReply && (
                                    <div className="mr-2 rounded-2xl bg-[var(--chat-assistant-bg)] px-1 py-1 text-sm leading-relaxed text-[var(--text-primary)]">
                                        <div className="whitespace-pre-wrap">{version.aiReply}</div>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-tertiary)]">
                                            <span>V{version.index} · {formatDateTime(version.createdAt)}</span>
                                            {version.aiModel && (
                                                <span className="rounded-md bg-[var(--chat-meta-bg)] px-1.5 py-0.5">{version.aiModel}</span>
                                            )}
                                            {version.usage?.totalTokens != null && (
                                                <span className="rounded-md bg-[var(--chat-meta-bg)] px-1.5 py-0.5">
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
                        <div className="border-t border-[var(--border-primary)] bg-[var(--accent-primary)]/10 px-4 py-3 text-sm">
                            <span className="font-semibold text-[var(--accent-primary)]">{t('studio.interior.proposal.pendingBanner')}</span>
                        </div>
                    )}

                    <form onSubmit={handleSend} className="border-t border-[var(--border-primary)] p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                                {t('studio.interior.promptLabel')}
                            </label>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(true)}
                                title={t('studio.interior.settings.title')}
                                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent-primary)]"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </button>
                        </div>
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

                        {(restoredRefImageUrls.length > 0 || refFiles.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {restoredRefImageUrls.map((url, index) => (
                                    <div key={`restored-${index}`} className="relative h-16 w-16 overflow-hidden rounded-lg border border-[var(--accent-primary)]/60 bg-[var(--bg-secondary)]" title={t('studio.interior.restoredRef')}>
                                        <img
                                            src={url}
                                            alt={`restored-${index}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <span className="absolute bottom-0 left-0 right-0 bg-[var(--accent-primary)]/80 px-1 text-center text-[9px] font-bold text-[var(--text-on-accent)]">
                                            {t('studio.interior.restoredBadge')}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRestoredUrl(index)}
                                            disabled={busy}
                                            title={t('studio.interior.clearRef')}
                                            className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg bg-black/60 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
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
                                {(restoredRefImageUrls.length + refFiles.length) > 0
                                    ? t('studio.interior.refImageCount').replace('{n}', String(restoredRefImageUrls.length + refFiles.length)).replace('{max}', String(MAX_REF_IMAGES))
                                    : t('studio.interior.refImage')}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={!project || busy || !!pendingProposal || (restoredRefImageUrls.length + refFiles.length) >= MAX_REF_IMAGES}
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
                                : (effectiveTwoStep ? t('studio.interior.sendProposal') : t('studio.interior.send'))}
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

            {pendingProposal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-lg">
                        <div className="flex items-center justify-between gap-2 border-b border-[var(--border-primary)] px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('studio.interior.proposal.title')}</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">
                                    {pendingProposal.aiModel}
                                    {pendingProposal.totalTokens != null
                                        ? ` · ${t('studio.interior.tokens').replace('{n}', String(pendingProposal.totalTokens))}`
                                        : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancelProposal}
                                disabled={busy}
                                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                                title={t('studio.interior.proposal.cancel')}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {pendingProposal.structured.observation && (
                                <section className="mb-4">
                                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.proposal.observation')}</h4>
                                    <p className="whitespace-pre-wrap rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 px-3 py-2 text-sm text-[var(--text-secondary)]">{pendingProposal.structured.observation}</p>
                                </section>
                            )}

                            {pendingProposal.structured.understanding && (
                                <section className="mb-4">
                                    <h4 className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.proposal.understanding')}</h4>
                                    <p className="whitespace-pre-wrap rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 px-3 py-2 text-sm text-[var(--text-secondary)]">{pendingProposal.structured.understanding}</p>
                                </section>
                            )}

                            <section className="mb-4">
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.proposal.proposedChanges')}</label>
                                <textarea
                                    value={editedChanges}
                                    onChange={(event) => setEditedChanges(event.target.value)}
                                    rows={Math.max(3, pendingProposal.structured.proposedChanges.length + 1)}
                                    disabled={busy}
                                    className="w-full resize-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                                />
                                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t('studio.interior.proposal.proposedChangesHint')}</p>
                            </section>

                            {pendingProposal.structured.questions.length > 0 && (
                                <section className="mb-4">
                                    <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.proposal.questions')}</h4>
                                    {pendingProposal.structured.questions.map((q, i) => (
                                        <div key={i} className="mb-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-3">
                                            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">{i + 1}. {q.question}</p>
                                            {q.options.length > 0 && (
                                                <div className="mb-2 space-y-1">
                                                    {q.options.map((opt, j) => (
                                                        <label key={j} className="flex cursor-pointer items-start gap-2 text-sm">
                                                            <input
                                                                type="radio"
                                                                name={`proposal-q-${i}`}
                                                                value={opt}
                                                                checked={proposalAnswers[i]?.selected === opt}
                                                                onChange={() => updateAnswerSelected(i, opt)}
                                                                disabled={busy}
                                                                className="mt-0.5 accent-[var(--accent-primary)]"
                                                            />
                                                            <span className="text-[var(--text-secondary)]">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            <input
                                                type="text"
                                                value={proposalAnswers[i]?.note || ''}
                                                onChange={(event) => updateAnswerNote(i, event.target.value)}
                                                placeholder={t('studio.interior.proposal.answerNotePlaceholder')}
                                                disabled={busy}
                                                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                                            />
                                        </div>
                                    ))}
                                </section>
                            )}

                            <section>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.proposal.generalNote')}</label>
                                <textarea
                                    value={generalNote}
                                    onChange={(event) => setGeneralNote(event.target.value)}
                                    placeholder={t('studio.interior.proposal.generalNotePlaceholder')}
                                    rows={2}
                                    disabled={busy}
                                    className="w-full resize-none rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
                                />
                            </section>
                        </div>

                        <div className="flex gap-2 border-t border-[var(--border-primary)] px-5 py-3">
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
                </div>
            )}

            {exportDialogOpen && project && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setExportDialogOpen(false)}
                >
                    <div
                        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-[var(--border-primary)] px-5 py-4">
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('studio.interior.export.title')}</h3>
                                <p className="text-xs text-[var(--text-tertiary)]">{project.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setExportDialogOpen(false)}
                                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                                title={t('studio.interior.settings.close')}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            <section className="mb-5">
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.export.sketchupSection')}</h4>
                                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-3">
                                    <p className="mb-2 text-sm text-[var(--text-secondary)]">{t('studio.interior.export.sketchupDesc')}</p>
                                    <button
                                        type="button"
                                        onClick={handleExportObj}
                                        disabled={!activeVersion}
                                        className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-bold text-[var(--text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {t('studio.interior.export.downloadObj').replace('{n}', String(activeVersion?.index ?? 0))}
                                    </button>
                                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">{t('studio.interior.export.sketchupHint')}</p>
                                </div>
                            </section>

                            <section className="mb-5">
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{t('studio.interior.export.aiPackageSection')}</h4>
                                <div className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 p-3">
                                    <p className="mb-2 text-sm text-[var(--text-secondary)]">{t('studio.interior.export.aiPackageDesc')}</p>
                                    <ul className="mb-3 ml-5 list-disc text-xs text-[var(--text-tertiary)]">
                                        <li>reference-front.png / side.png / plan.png / 3d.png</li>
                                        <li>ai-image-prompt-en.txt + ai-image-prompt-vi.txt</li>
                                        <li>huong-dan-tao-anh-ai.txt + design-model.json</li>
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={handleDownloadAiPackage}
                                        disabled={!activeVersion || aiPackageBusy}
                                        className="rounded-lg bg-[var(--accent-primary)] px-4 py-2 text-sm font-bold text-[var(--text-on-accent)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {aiPackageBusy ? t('studio.interior.export.aiPackageBusy') : t('studio.interior.export.aiPackageDownload')}
                                    </button>
                                    {aiPackageError && (
                                        <p className="mt-2 text-xs text-red-400">{aiPackageError}</p>
                                    )}
                                    <p className="mt-2 text-xs text-[var(--text-tertiary)]">{t('studio.interior.export.aiPackageHint')}</p>
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--text-tertiary)]">
                                    {t('studio.interior.export.imagesSection')} ({exportImages.length})
                                </h4>
                                <p className="mb-2 text-xs text-[var(--text-tertiary)]">{t('studio.interior.export.imagesHint')}</p>
                                {exportImages.length === 0 ? (
                                    <p className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 px-3 py-2 text-xs text-[var(--text-tertiary)]">{t('studio.interior.export.imagesEmpty')}</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                                        {exportImages.map((img, idx) => (
                                            <div key={`${img.url}-${idx}`} className="relative overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                                <img src={img.url} alt={`v${img.version}-${idx}`} className="h-24 w-full object-cover" />
                                                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">V{img.version}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadImage(img.url, img.version, idx)}
                                                    className="absolute bottom-0 left-0 right-0 bg-[var(--accent-primary)]/90 px-1 py-1 text-[11px] font-bold text-[var(--text-on-accent)] hover:opacity-90"
                                                >
                                                    {t('studio.interior.export.downloadImage')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>

                        <div className="border-t border-[var(--border-primary)] px-5 py-3 text-right">
                            <button
                                type="button"
                                onClick={() => setExportDialogOpen(false)}
                                className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--accent-primary)]"
                            >
                                {t('studio.interior.settings.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {settingsOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setSettingsOpen(false)}
                >
                    <div
                        className="w-full max-w-md rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('studio.interior.settings.title')}</h3>
                            <button
                                type="button"
                                onClick={() => setSettingsOpen(false)}
                                className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                                title={t('studio.interior.settings.close')}
                            >
                                ✕
                            </button>
                        </div>
                        <label className="flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={twoStepConfirm}
                                onChange={handleToggleTwoStep}
                                disabled={togglingPref || busy || !!pendingProposal}
                                className="mt-1 h-4 w-4 cursor-pointer accent-[var(--accent-primary)] disabled:cursor-not-allowed"
                            />
                            <span className="flex-1">
                                <span className="font-semibold text-[var(--text-primary)]">{t('studio.interior.twoStep.label')}</span>
                                <span className="mt-1 block text-xs text-[var(--text-tertiary)]">{t('studio.interior.twoStep.desc')}</span>
                            </span>
                        </label>
                        <p className="mt-4 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-secondary)]">
                            {twoStepConfirm ? t('studio.interior.creditNote2Step') : t('studio.interior.creditNote')}
                        </p>
                        {pendingProposal && (
                            <p className="mt-3 text-xs text-yellow-500">
                                {t('studio.interior.settings.lockedDuringProposal')}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteriorDesignPage;
