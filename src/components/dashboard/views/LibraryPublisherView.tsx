import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { useConfirm } from '../../ui/ConfirmDialog';
import LibraryItemForm from '../../library/LibraryItemForm';
import { localized } from '../../library/EventLibraryCard';
import { cdnFromUrl } from '../../../services/cloudinaryAssets';
import {
    getLibraryItems, getLibraryItem, deleteLibraryItem, updateLibraryItem,
    type EventLibraryItem
} from '../../../services/eventLibraryService';

const ACCENT = '#7c5cff';
const PAGE_SIZE = 20;

/**
 * Bộ công cụ đăng nội dung lên Thư viện tri thức sự kiện — thay chỗ "Kho tài
 * nguyên" cũ trong sidebar `/workflow`.
 *
 * Hai chế độ trong cùng một view: danh sách nội dung của tài khoản (admin xem
 * được tất cả) và form soạn thảo đầy đủ.
 */
export default function LibraryPublisherView({ searchQuery }: { searchQuery: string }) {
    const { t, language } = useTranslation();
    const { user } = useAuth();
    const { confirm } = useConfirm();
    const isAdmin = user?.role === 'admin';

    const [items, setItems] = useState<EventLibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // null = đang xem danh sách; undefined = tạo mới; object = sửa mục đó
    const [editing, setEditing] = useState<EventLibraryItem | null | undefined>(null);
    const [scope, setScope] = useState<'mine' | 'all'>('mine');
    const [busySlug, setBusySlug] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await getLibraryItems({
                scope: scope === 'mine' ? 'mine' : 'all',
                limit: PAGE_SIZE,
                search: searchQuery || undefined,
                sort: 'recent'
            });
            setItems(res.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, [scope, searchQuery]);

    useEffect(() => { load(); }, [load]);

    // Danh sách không trả `sections`/`content` — phải nạp bản đầy đủ trước khi sửa
    const openEditor = async (item: EventLibraryItem) => {
        setBusySlug(item.slug);
        try {
            const { item: full } = await getLibraryItem(item.slug);
            setEditing(full);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setBusySlug('');
        }
    };

    const handleDelete = async (item: EventLibraryItem) => {
        const ok = await confirm({
            title: t('eventLibrary.detail.deleteTitle'),
            message: t('eventLibrary.detail.deleteConfirm'),
            variant: 'danger'
        });
        if (!ok) return;
        await deleteLibraryItem(item._id);
        load();
    };

    const handleToggleVisibility = async (item: EventLibraryItem) => {
        setBusySlug(item.slug);
        try {
            const updated = await updateLibraryItem(item._id, {
                visibility: item.visibility === 'public' ? 'private' : 'public'
            });
            setItems(prev => prev.map(i => (i._id === updated._id ? { ...i, visibility: updated.visibility } : i)));
        } finally {
            setBusySlug('');
        }
    };

    if (editing !== null) {
        return (
            <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in space-y-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                            {editing ? t('eventLibrary.editor.editTitle') : t('eventLibrary.editor.createTitle')}
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-0.5">{t('eventLibrary.editor.subtitle')}</p>
                    </div>
                    <button
                        onClick={() => setEditing(null)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                        ← {t('eventLibrary.editor.backToList')}
                    </button>
                </div>

                <LibraryItemForm
                    item={editing}
                    onCancel={() => setEditing(null)}
                    onSaved={() => { setEditing(null); load(); }}
                />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">{t('eventLibrary.editor.viewTitle')}</h1>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">{t('eventLibrary.editor.viewSubtitle')}</p>
                </div>
                <button
                    onClick={() => setEditing(undefined)}
                    style={{ backgroundColor: ACCENT }}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white hover:opacity-90 transition-all cursor-pointer shrink-0"
                >
                    + {t('eventLibrary.editor.createTitle')}
                </button>
            </div>

            {isAdmin && (
                <div className="flex gap-1.5">
                    {(['mine', 'all'] as const).map(value => (
                        <button
                            key={value}
                            onClick={() => setScope(value)}
                            style={scope === value ? { backgroundColor: ACCENT, color: '#fff' } : undefined}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                scope === value ? '' : 'bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]'
                            }`}
                        >
                            {t('eventLibrary.editor.scopes.' + value)}
                        </button>
                    ))}
                </div>
            )}

            {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500">{error}</div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: `${ACCENT}33`, borderTopColor: ACCENT }} />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{t('eventLibrary.editor.empty')}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">{t('eventLibrary.editor.emptyHint')}</p>
                    <button
                        onClick={() => setEditing(undefined)}
                        style={{ backgroundColor: ACCENT }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 cursor-pointer"
                    >
                        + {t('eventLibrary.editor.createTitle')}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map(item => (
                        <div
                            key={item._id}
                            className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)]"
                        >
                            {item.coverImage
                                ? <img src={cdnFromUrl(item.coverImage, 'w_320')} alt="" className="w-full md:w-28 h-20 object-cover rounded-lg shrink-0" />
                                : <div className="w-full md:w-28 h-20 rounded-lg shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}33, transparent 70%)` }} />}

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${ACCENT}1a`, color: ACCENT }}>
                                        {t('eventLibrary.types.' + item.itemType)}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                        item.visibility === 'public'
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-primary)]'
                                    }`}>
                                        {t('eventLibrary.publish.visibilities.' + item.visibility)}
                                    </span>
                                    {item.ownership === 'platform' && (
                                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/30">
                                            {t('eventLibrary.editor.ownerships.platform')}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-[var(--text-primary)] truncate">{localized(item.title, language)}</h3>
                                <p className="text-xs text-[var(--text-tertiary)] truncate">{localized(item.summary, language)}</p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={`/studio/event-library/${item.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                >
                                    {t('eventLibrary.actions.viewDetail')}
                                </a>
                                {item.ownership === 'user' && (
                                    <button
                                        onClick={() => handleToggleVisibility(item)}
                                        disabled={busySlug === item.slug}
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                                    >
                                        {item.visibility === 'public'
                                            ? t('eventLibrary.detail.makePrivate')
                                            : t('eventLibrary.detail.makePublic')}
                                    </button>
                                )}
                                <button
                                    onClick={() => openEditor(item)}
                                    disabled={busySlug === item.slug}
                                    style={{ backgroundColor: ACCENT }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 cursor-pointer disabled:opacity-50"
                                >
                                    {t('eventLibrary.editor.edit')}
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 cursor-pointer"
                                >
                                    {t('eventLibrary.detail.delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
