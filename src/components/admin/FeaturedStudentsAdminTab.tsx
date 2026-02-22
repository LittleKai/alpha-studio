import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { searchUsers } from '../../services/workflowService';
import {
    getAdminFeaturedStudents,
    addFeaturedStudent,
    updateFeaturedStudent,
    removeFeaturedStudent,
    reorderFeaturedStudents,
    type AdminFeaturedStudent
} from '../../services/featuredStudentsService';

// ─── icons ────────────────────────────────────────────────────────────────────

const DragIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// ─── main component ───────────────────────────────────────────────────────────

const FeaturedStudentsAdminTab: React.FC = () => {
    const { t } = useTranslation();

    const [students, setStudents] = useState<AdminFeaturedStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string; name: string; avatar: string; email: string; role: string }[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // drag state
    const dragIndex = useRef<number | null>(null);
    const dragOverIndex = useRef<number | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // per-row edit state: { [userId]: label }
    const [labels, setLabels] = useState<Record<string, string>>({});

    // ── load ──────────────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        setLoading(true);
        const data = await getAdminFeaturedStudents();
        setStudents(data);
        const initial: Record<string, string> = {};
        data.forEach(s => { initial[s.userId] = s.label; });
        setLabels(initial);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // ── search ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); setShowDropdown(false); return; }
        const t = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchUsers(searchQuery, true);
                if (res.success) {
                    const existingIds = new Set(students.map(s => s.userId));
                    setSearchResults(res.data.filter(u => !existingIds.has(u.id)));
                    setShowDropdown(true);
                }
            } catch { /* */ }
            setSearching(false);
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery, students]);

    // close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── add ───────────────────────────────────────────────────────────────────
    const handleAdd = async (userId: string) => {
        setShowDropdown(false);
        setSearchQuery('');
        const res = await addFeaturedStudent(userId);
        if (res.success && res.data) {
            setStudents(prev => [...prev, res.data!]);
            setLabels(prev => ({ ...prev, [res.data!.userId]: res.data!.label }));
        }
    };

    // ── remove ────────────────────────────────────────────────────────────────
    const handleRemove = async (userId: string) => {
        await removeFeaturedStudent(userId);
        setStudents(prev => prev.filter(s => s.userId !== userId));
    };

    // ── label/hired inline save ───────────────────────────────────────────────
    const handleLabelBlur = async (userId: string) => {
        await updateFeaturedStudent(userId, { label: labels[userId] ?? '' });
    };

    const handleHiredToggle = async (userId: string, current: boolean) => {
        setStudents(prev => prev.map(s => s.userId === userId ? { ...s, hired: !current } : s));
        await updateFeaturedStudent(userId, { hired: !current });
    };

    // ── drag & drop ───────────────────────────────────────────────────────────
    const handleDragStart = (idx: number) => { dragIndex.current = idx; };
    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        dragOverIndex.current = idx;
        setDragOverId(students[idx]?.userId ?? null);
    };
    const handleDragEnd = async () => {
        const from = dragIndex.current;
        const to = dragOverIndex.current;
        if (from === null || to === null || from === to) {
            dragIndex.current = null; dragOverIndex.current = null; setDragOverId(null); return;
        }
        const reordered = [...students];
        const [moved] = reordered.splice(from, 1);
        reordered.splice(to, 0, moved);
        setStudents(reordered);
        dragIndex.current = null; dragOverIndex.current = null; setDragOverId(null);
        // persist
        setSaving(true);
        await reorderFeaturedStudents(reordered.map(s => s.userId));
        setSaving(false);
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {t('admin.community.featuredStudents')}
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        {t('admin.community.featuredStudentsDesc')}
                    </p>
                </div>
                {saving && (
                    <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        {t('common.saving')}
                    </span>
                )}
            </div>

            {/* search + add */}
            <div ref={searchRef} className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                        placeholder={t('admin.community.searchUser')}
                        className="flex-1 px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                    />
                    {searching && (
                        <div className="flex items-center px-3">
                            <span className="w-4 h-4 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    )}
                </div>

                {/* dropdown */}
                {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                        {searchResults.map(u => (
                            <button
                                key={u.id}
                                onClick={() => handleAdd(u.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-secondary)] transition-colors text-left"
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex-shrink-0">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{u.name}</p>
                                    <p className="text-xs text-[var(--text-secondary)] truncate">{u.email}</p>
                                </div>
                                <span className="flex items-center gap-1 text-xs text-[var(--accent-primary)] font-semibold flex-shrink-0">
                                    <PlusIcon /> {t('common.add')}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* list */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-3 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-secondary)]">
                    <p className="text-4xl mb-3">🎓</p>
                    <p>{t('admin.community.noStudents')}</p>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mb-3 opacity-70">
                        ☰ {t('admin.community.dragToReorder')}
                    </p>
                    {students.map((s, idx) => (
                        <div
                            key={s.userId}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={e => handleDragOver(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 p-3 bg-[var(--bg-card)] border rounded-xl transition-all ${
                                dragOverId === s.userId
                                    ? 'border-[var(--accent-primary)] shadow-lg scale-[1.01]'
                                    : 'border-[var(--border-primary)]'
                            }`}
                        >
                            {/* drag handle */}
                            <div className="cursor-grab active:cursor-grabbing text-[var(--text-secondary)] flex-shrink-0 px-1">
                                <DragIcon />
                            </div>

                            {/* order badge */}
                            <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-full flex-shrink-0">
                                {idx + 1}
                            </span>

                            {/* avatar */}
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--bg-secondary)] flex-shrink-0">
                                {s.avatar ? (
                                    <img src={s.avatar} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[var(--accent-primary)]">
                                        {s.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            {/* info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{s.name}</p>
                                <p className="text-xs text-[var(--text-secondary)] truncate">{s.email}</p>
                            </div>

                            {/* label input */}
                            <input
                                type="text"
                                value={labels[s.userId] ?? ''}
                                onChange={e => setLabels(prev => ({ ...prev, [s.userId]: e.target.value }))}
                                onBlur={() => handleLabelBlur(s.userId)}
                                placeholder={t('admin.community.labelPlaceholder')}
                                className="w-40 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                            />

                            {/* hired toggle */}
                            <button
                                onClick={() => handleHiredToggle(s.userId, s.hired)}
                                title={t('admin.community.hired')}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    s.hired
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                        : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] hover:border-green-500/50'
                                }`}
                            >
                                {s.hired && <CheckIcon />}
                                {t('admin.community.hired')}
                            </button>

                            {/* remove */}
                            <button
                                onClick={() => handleRemove(s.userId)}
                                className="p-2 text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <TrashIcon />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedStudentsAdminTab;
