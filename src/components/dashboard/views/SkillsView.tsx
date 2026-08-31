import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { getSkills, getSkillBySlug, deleteSkill, type Skill, type SkillDetail } from '../../../services/skillService';
import SkillFormModal from '../../modals/SkillFormModal';
import DeleteConfirmModal from '../../ui/DeleteConfirmModal';

interface SkillsViewProps {
    searchQuery: string;
    /** Slug mở sẵn form sửa — đến từ deep link /workflow?view=skills&edit=<slug> */
    initialEditSlug?: string | null;
    /** Gọi sau khi đã tiêu thụ initialEditSlug để URL không mở lại modal */
    onInitialEditConsumed?: () => void;
}

const PAGE_SIZE = 24;

// Màu nhấn của thư viện skill — trùng SkillsPage / SkillDetailPage / SkillFormModal
const ACCENT = '#ff5a1f';

// Dùng lại class huy hiệu cấp độ của trang công khai (định nghĩa trong index.css)
const TIER_BADGES: Record<string, string> = {
    gold: 'tier-badge-gold',
    silver: 'tier-badge-silver',
    bronze: 'tier-badge-bronze'
};

const SkillsView: React.FC<SkillsViewProps> = ({ searchQuery, initialEditSlug, onInitialEditConsumed }) => {
    const { t, language } = useTranslation();
    const { user, token } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [skills, setSkills] = useState<Skill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [tierFilter, setTierFilter] = useState('all');
    const [page, setPage] = useState(1);

    // Modals
    const [editingSkill, setEditingSkill] = useState<SkillDetail | null>(null);
    const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSkills = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await getSkills({ limit: 10000 });
            setSkills(response.data || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('workflow.skillsAdmin.errors.loadFailed'));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (isAdmin) fetchSkills();
    }, [fetchSkills, isAdmin]);

    const openEditor = useCallback(async (slug: string) => {
        setLoadingSlug(slug);
        try {
            const response = await getSkillBySlug(slug);
            setEditingSkill(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('workflow.skillsAdmin.errors.loadFailed'));
        } finally {
            setLoadingSlug(null);
        }
    }, [t]);

    // Deep link từ nút Sửa trên trang chi tiết skill
    useEffect(() => {
        if (!isAdmin || !initialEditSlug) return;
        openEditor(initialEditSlug);
        onInitialEditConsumed?.();
    }, [initialEditSlug, isAdmin, onInitialEditConsumed, openEditor]);

    useEffect(() => {
        setPage(1);
    }, [categoryFilter, tierFilter, searchQuery]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const skill of skills) if (skill.category) set.add(skill.category);
        return Array.from(set).sort();
    }, [skills]);

    const filtered = useMemo(() => {
        const term = searchQuery.trim().toLowerCase();
        return skills.filter(skill => {
            if (categoryFilter !== 'all' && skill.category !== categoryFilter) return false;
            if (tierFilter !== 'all' && skill.tier !== tierFilter) return false;
            if (term) {
                const haystack = [skill.name, skill.slug, skill.author, skill.headline, skill.headline_vi]
                    .filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(term)) return false;
            }
            return true;
        });
    }, [skills, categoryFilter, tierFilter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleFormSuccess = (updated: SkillDetail) => {
        setSkills(prev => prev.map(s => (s.slug === updated.slug ? { ...s, ...updated } : s)));
        // Trang công khai đọc từ sessionStorage — xoá để lần sau thấy bản mới
        sessionStorage.removeItem('alpha_skills_cache_v3');
        sessionStorage.removeItem('alpha_skills_cache_ts_v3');
    };

    const confirmDelete = async () => {
        if (!deleteTarget || !token) return;
        setDeleting(true);
        try {
            await deleteSkill(deleteTarget.slug, token);
            setSkills(prev => prev.filter(s => s.slug !== deleteTarget.slug));
            sessionStorage.removeItem('alpha_skills_cache_v3');
            sessionStorage.removeItem('alpha_skills_cache_ts_v3');
            setDeleteTarget(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('workflow.skillsAdmin.errors.deleteFailed'));
            setDeleteTarget(null);
        } finally {
            setDeleting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-6 md:p-8 flex-1 flex items-center justify-center text-center">
                <p className="text-[var(--text-tertiary)]">{t('workflow.skillsAdmin.adminOnly')}</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 mb-2">
                        {t('workflow.skillsAdmin.title')}
                    </h1>
                    <p className="text-[var(--text-secondary)]">{t('workflow.skillsAdmin.subtitle')}</p>
                </div>
                <a
                    href="/studio/ai-skills"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-sm font-bold text-[var(--text-primary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all"
                >
                    {t('workflow.skillsAdmin.openLibrary')}
                </a>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="all">{t('workflow.skillsAdmin.allCategories')}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <select
                    value={tierFilter}
                    onChange={e => setTierFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    <option value="all">{t('workflow.skillsAdmin.allTiers')}</option>
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Bronze">Bronze</option>
                </select>
                <div className="ml-auto text-sm text-[var(--text-tertiary)] self-center">
                    {filtered.length} {t('workflow.skillsAdmin.results')}
                </div>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            )}

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center mb-6">
                    {error}
                    <button onClick={fetchSkills} className="ml-4 underline hover:no-underline">
                        {t('workflow.skillsAdmin.retry')}
                    </button>
                </div>
            )}

            {!isLoading && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {pageItems.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
                                {t('workflow.skillsAdmin.empty')}
                            </div>
                        ) : (
                            pageItems.map(skill => (
                                <div
                                    key={skill.slug}
                                    className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-4 flex flex-col gap-3 hover:border-[var(--accent-primary)]/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-[var(--text-primary)] truncate">{skill.name}</h3>
                                            <p className="text-xs font-mono text-[var(--text-tertiary)] truncate">/{skill.slug}</p>
                                        </div>
                                        {skill.tier && (
                                            <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded border flex items-center gap-1 ${TIER_BADGES[skill.tier.toLowerCase()] || 'border-[var(--border-primary)] text-[var(--text-secondary)]'}`}>
                                                {skill.tier}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                                        {(language === 'vi' ? skill.headline_vi : skill.headline) || skill.headline || skill.headline_vi}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-tertiary)]">
                                        <span
                                            className="px-2 py-0.5 rounded border font-semibold"
                                            style={{ backgroundColor: `${ACCENT}14`, borderColor: `${ACCENT}40`, color: ACCENT }}
                                        >
                                            {skill.category}
                                        </span>
                                        {skill.author && <span>@{skill.author}</span>}
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-[var(--border-primary)]">
                                        <button
                                            onClick={() => openEditor(skill.slug)}
                                            disabled={loadingSlug === skill.slug}
                                            style={{ backgroundColor: ACCENT }}
                                            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            {loadingSlug === skill.slug
                                                ? t('workflow.skillsAdmin.loading')
                                                : t('workflow.skillsAdmin.edit')}
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(skill)}
                                            className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm font-semibold text-[var(--text-secondary)] hover:border-red-500/50 hover:text-red-400 transition-colors"
                                            title={t('workflow.skillsAdmin.delete')}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 hover:border-[var(--accent-primary)]"
                            >
                                {t('workflow.skillsAdmin.prev')}
                            </button>
                            <span className="px-4 py-2 text-[var(--text-secondary)]">{page} / {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 hover:border-[var(--accent-primary)]"
                            >
                                {t('workflow.skillsAdmin.next')}
                            </button>
                        </div>
                    )}
                </>
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    mode="code"
                    deleting={deleting}
                    itemName={deleteTarget.name}
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <SkillFormModal
                isOpen={!!editingSkill}
                onClose={() => setEditingSkill(null)}
                editingSkill={editingSkill}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
};

export default SkillsView;
