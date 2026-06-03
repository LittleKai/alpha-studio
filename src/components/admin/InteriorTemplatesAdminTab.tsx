import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import {
    listAdminTemplates,
    getAdminTemplate,
    approveTemplate,
    rejectTemplate,
    deprecateTemplate,
    editTemplate,
    type InteriorTemplateRecord,
    type InteriorTemplateStatus,
    type InteriorTemplateCategory
} from '../../services/interiorTemplateService';

declare global {
    interface Window {
        InteriorDesigner?: {
            render: (options: any) => any;
        };
    }
}

const STATUS_OPTIONS: InteriorTemplateStatus[] = ['pending', 'approved', 'deprecated', 'seed'];
const CATEGORY_OPTIONS: ('all' | InteriorTemplateCategory)[] = ['all', 'upper-cabinet', 'lower-cabinet', 'wardrobe', 'shelf', 'desk', 'void', 'other'];

function statusBadgeClass(status: InteriorTemplateStatus): string {
    switch (status) {
        case 'approved': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
        case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
        case 'deprecated': return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
        case 'seed': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
        default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
}

function authorLabel(author: InteriorTemplateRecord['authorId']): string {
    if (!author) return '—';
    if (typeof author === 'string') return author;
    return author.name || author.email || author._id || '—';
}

export default function InteriorTemplatesAdminTab() {
    const { t } = useTranslation();
    const { confirm } = useConfirm();

    const [items, setItems] = useState<InteriorTemplateRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<InteriorTemplateStatus>('pending');
    const [categoryFilter, setCategoryFilter] = useState<'all' | InteriorTemplateCategory>('all');
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detail, setDetail] = useState<InteriorTemplateRecord | null>(null);
    const [dslText, setDslText] = useState('');
    const [dslError, setDslError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [previewW, setPreviewW] = useState<number>(120);
    const [previewH, setPreviewH] = useState<number>(120);
    const [previewD, setPreviewD] = useState<number>(60);
    const previewRef = useRef<HTMLDivElement | null>(null);

    const loadList = async () => {
        setLoading(true);
        try {
            const { items: data } = await listAdminTemplates({
                status: statusFilter,
                category: categoryFilter === 'all' ? undefined : categoryFilter,
                search: search.trim() || undefined,
                limit: 100
            });
            setItems(data);
            if (data.length && !data.some((row) => row._id === selectedId)) {
                setSelectedId(data[0]._id);
            } else if (!data.length) {
                setSelectedId(null);
                setDetail(null);
            }
        } catch (err: any) {
            console.error(err);
            alert(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadList(); }, [statusFilter, categoryFilter]);
    useEffect(() => {
        const handler = setTimeout(loadList, 250);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        if (!selectedId) {
            setDetail(null);
            setDslText('');
            return;
        }
        (async () => {
            try {
                const row = await getAdminTemplate(selectedId);
                setDetail(row);
                setDslText(JSON.stringify(row.dsl || {}, null, 2));
                setDslError(null);
                const widthDef = row.params?.width as any;
                const heightDef = row.params?.height as any;
                const depthDef = row.params?.depth as any;
                setPreviewW(row.previewDims?.width || widthDef?.default || 120);
                setPreviewH(row.previewDims?.height || heightDef?.default || 120);
                setPreviewD(row.previewDims?.depth || depthDef?.default || 60);
            } catch (err: any) {
                console.error(err);
                alert(err?.message || String(err));
            }
        })();
    }, [selectedId]);

    // Render preview via engine
    useEffect(() => {
        if (!detail || !previewRef.current || !window.InteriorDesigner) return;
        try {
            let parsedDsl: any;
            try {
                parsedDsl = JSON.parse(dslText || '{}');
                setDslError(null);
            } catch (err: any) {
                setDslError(err?.message || 'JSON không hợp lệ.');
                return;
            }
            const inlineId = detail.templateId;
            const inlineTpl = {
                id: inlineId,
                version: detail.version,
                category: detail.category,
                tags: detail.tags,
                description: detail.description,
                params: detail.params,
                style: detail.styleOptions,
                ...parsedDsl
            };
            window.InteriorDesigner.render({
                mount: previewRef.current,
                language: 'vi',
                tabs: ['front', '3d'],
                model: {
                    title: detail.templateId,
                    subtitle: `${t('admin.interiorTemplates.categories.' + detail.category) || detail.category} · v${detail.version}`,
                    units: 'cm',
                    width: previewW,
                    height: previewH,
                    depth: previewD,
                    palette: 'wood-oak',
                    inlineTemplates: { [inlineId]: inlineTpl },
                    modules: [{ tpl: inlineId, x: 0, y: 0, z: 0, width: previewW, height: previewH, depth: previewD }]
                }
            });
        } catch (err: any) {
            console.error('[admin:templates] preview render failed:', err);
            setDslError(err?.message || 'Preview lỗi.');
        }
    }, [detail, dslText, previewW, previewH, previewD]);

    const onApprove = async () => {
        if (!detail) return;
        try {
            await approveTemplate(detail._id);
            await loadList();
        } catch (err: any) {
            alert(err?.message || String(err));
        }
    };

    const onDeprecate = async () => {
        if (!detail) return;
        const ok = await confirm({
            title: t('admin.interiorTemplates.confirmDeprecateTitle') || 'Ẩn template?',
            message: t('admin.interiorTemplates.confirmDeprecate') || 'Ẩn template này khỏi AI catalog?',
            variant: 'warning'
        });
        if (!ok) return;
        try {
            await deprecateTemplate(detail._id);
            await loadList();
        } catch (err: any) {
            alert(err?.message || String(err));
        }
    };

    const onReject = async () => {
        if (!detail) return;
        const ok = await confirm({
            title: t('admin.interiorTemplates.confirmRejectTitle') || 'Xoá template?',
            message: t('admin.interiorTemplates.confirmReject') || 'Xoá template này khỏi DB? Không thể hoàn tác.',
            variant: 'danger'
        });
        if (!ok) return;
        try {
            await rejectTemplate(detail._id);
            await loadList();
        } catch (err: any) {
            alert(err?.message || String(err));
        }
    };

    const onSaveEdit = async () => {
        if (!detail) return;
        let parsed: any;
        try {
            parsed = JSON.parse(dslText);
        } catch (err: any) {
            setDslError(err?.message || 'JSON không hợp lệ.');
            return;
        }
        setSaving(true);
        try {
            await editTemplate(detail._id, {
                dsl: parsed,
                previewDims: { width: previewW, height: previewH, depth: previewD },
                bumpVersion: true
            });
            const updated = await getAdminTemplate(detail._id);
            setDetail(updated);
            setDslText(JSON.stringify(updated.dsl || {}, null, 2));
            await loadList();
        } catch (err: any) {
            alert(err?.message || String(err));
        } finally {
            setSaving(false);
        }
    };

    const statusLabel = useMemo(() => ({
        seed: t('admin.interiorTemplates.statusSeed') || 'Seed',
        pending: t('admin.interiorTemplates.statusPending') || 'Chờ duyệt',
        approved: t('admin.interiorTemplates.statusApproved') || 'Đã duyệt',
        deprecated: t('admin.interiorTemplates.statusDeprecated') || 'Đã ẩn'
    }), [t]);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 text-sm rounded border transition ${statusFilter === s
                            ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                            : 'border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        {statusLabel[s]}
                    </button>
                ))}
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="ml-2 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
                >
                    {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                            {t('admin.interiorTemplates.categories.' + c) || c}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('admin.interiorTemplates.searchPlaceholder') || 'Tìm id / tag / mô tả...'}
                    className="ml-2 flex-1 min-w-[200px] px-3 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
                />
                <button
                    type="button"
                    onClick={loadList}
                    className="px-3 py-1.5 text-sm border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:border-[var(--border-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)]"
                >
                    ↻
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
                <div className="border border-[var(--border-primary)] rounded bg-[var(--bg-card)] max-h-[70vh] overflow-y-auto">
                    {loading && <div className="p-3 text-sm text-[var(--text-tertiary)]">{t('common.loading') || 'Đang tải...'}</div>}
                    {!loading && items.length === 0 && (
                        <div className="p-3 text-sm text-[var(--text-tertiary)]">{t('admin.interiorTemplates.empty') || 'Không có template'}</div>
                    )}
                    {items.map((row) => (
                        <button
                            key={row._id}
                            type="button"
                            onClick={() => setSelectedId(row._id)}
                            className={`w-full text-left px-3 py-2 border-b border-[var(--border-primary)] hover:bg-[var(--bg-secondary)]/50 transition ${selectedId === row._id ? 'bg-[var(--accent-primary)]/10' : ''}`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-sm text-[var(--text-primary)]">{row.templateId}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded border ${statusBadgeClass(row.status)}`}>{row.status}</span>
                                <span className="text-xs text-[var(--text-tertiary)]">v{row.version}</span>
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">{t('admin.interiorTemplates.categories.' + row.category) || row.category} · {(row.tags || []).slice(0, 3).join(', ')}</div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">{t('admin.interiorTemplates.author') || 'Tác giả'}: {authorLabel(row.authorId)}</div>
                        </button>
                    ))}
                </div>

                <div className="border border-[var(--border-primary)] rounded bg-[var(--bg-card)] p-4">
                    {!detail && <div className="text-sm text-[var(--text-tertiary)]">{t('admin.interiorTemplates.selectHint') || 'Chọn 1 template ở danh sách'}</div>}
                    {detail && (
                        <>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <div>
                                    <h3 className="font-mono text-base text-[var(--text-primary)]">{detail.templateId}@{detail.version}</h3>
                                    <p className="text-xs text-[var(--text-secondary)]">{t('admin.interiorTemplates.categories.' + detail.category) || detail.category} · {(detail.tags || []).join(', ')}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">{detail.description?.vi || detail.description?.en}</p>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded border ${statusBadgeClass(detail.status)}`}>{detail.status}</span>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-1">{t('admin.interiorTemplates.preview') || 'Xem trước'}</div>
                                    <div ref={previewRef} className="bg-[#e9e4da] rounded h-[360px] overflow-hidden" />
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <label className="flex items-center gap-1">
                                            <span className="text-[var(--text-secondary)]">W</span>
                                            <input type="number" value={previewW} onChange={(e) => setPreviewW(Number(e.target.value) || 0)} className="w-16 px-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]" />
                                        </label>
                                        <label className="flex items-center gap-1">
                                            <span className="text-[var(--text-secondary)]">H</span>
                                            <input type="number" value={previewH} onChange={(e) => setPreviewH(Number(e.target.value) || 0)} className="w-16 px-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]" />
                                        </label>
                                        <label className="flex items-center gap-1">
                                            <span className="text-[var(--text-secondary)]">D</span>
                                            <input type="number" value={previewD} onChange={(e) => setPreviewD(Number(e.target.value) || 0)} className="w-16 px-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]" />
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-[var(--text-secondary)] mb-1">DSL</div>
                                    <textarea
                                        value={dslText}
                                        onChange={(e) => setDslText(e.target.value)}
                                        className="w-full h-[360px] font-mono text-xs px-2 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded text-[var(--text-primary)]"
                                        spellCheck={false}
                                    />
                                    {dslError && <div className="text-xs text-red-400 mt-1">{dslError}</div>}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                {detail.status !== 'approved' && (
                                    <button type="button" onClick={onApprove} className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-500 text-white rounded">
                                        {t('admin.interiorTemplates.approve') || 'Duyệt'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onSaveEdit}
                                    disabled={saving || !!dslError}
                                    className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (t('common.saving') || 'Đang lưu...') : (t('admin.interiorTemplates.editSave') || 'Sửa & Lưu (bump v)')}
                                </button>
                                {detail.status !== 'deprecated' && detail.status !== 'seed' && (
                                    <button type="button" onClick={onDeprecate} className="px-3 py-1.5 text-sm border border-yellow-500/40 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-200 rounded">
                                        {t('admin.interiorTemplates.deprecate') || 'Ẩn'}
                                    </button>
                                )}
                                {detail.status !== 'seed' && (
                                    <button type="button" onClick={onReject} className="px-3 py-1.5 text-sm border border-red-500/40 hover:bg-red-500/10 text-red-600 dark:text-red-300 rounded">
                                        {t('admin.interiorTemplates.reject') || 'Từ chối + xoá'}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
