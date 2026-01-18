import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    getPartners,
    getPartnerStats,
    deletePartner,
    publishPartner,
    unpublishPartner,
    Partner,
    PartnerQueryParams,
    PaginationInfo
} from '../../services/partnerService';
import PartnerCard from './PartnerCard';
import PartnerForm from './PartnerForm';
import PartnerStats from './PartnerStats';

interface PartnerManagementProps {
    onBack: () => void;
}

const PartnerManagement: React.FC<PartnerManagementProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // State
    const [partners, setPartners] = useState<Partner[]>([]);
    const [stats, setStats] = useState<{
        totalPartners: number;
        publishedPartners: number;
        draftPartners: number;
        archivedPartners: number;
        featuredPartners: number;
        byType: Record<string, number>;
    } | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Load partners
    const loadPartners = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: PartnerQueryParams = {
                page: pagination.page,
                limit: pagination.limit,
                sort: sortBy
            };

            if (searchQuery) params.search = searchQuery;
            if (typeFilter) params.partnerType = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const response = await getPartners(params);
            setPartners(response.data);
            setPagination(response.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load partners');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery, typeFilter, statusFilter, sortBy]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const data = await getPartnerStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadPartners();
        loadStats();
    }, [loadPartners, loadStats]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                loadPartners();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [typeFilter, statusFilter, sortBy]);

    // Handlers
    const handleCreateNew = useCallback(() => {
        setEditingPartner(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((partner: Partner) => {
        setEditingPartner(partner);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deletePartner(id);
            setDeleteConfirm(null);
            loadPartners();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete partner');
        }
    }, [loadPartners, loadStats]);

    const handlePublish = useCallback(async (id: string) => {
        try {
            await publishPartner(id);
            loadPartners();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish partner');
        }
    }, [loadPartners, loadStats]);

    const handleUnpublish = useCallback(async (id: string) => {
        try {
            await unpublishPartner(id);
            loadPartners();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unpublish partner');
        }
    }, [loadPartners, loadStats]);

    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingPartner(null);
        loadPartners();
        loadStats();
    }, [loadPartners, loadStats]);

    // Access check
    if (user?.role !== 'admin' && user?.role !== 'mod') {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        {t('admin.accessDenied')}
                    </h2>
                    <button
                        onClick={onBack}
                        className="text-[var(--accent-primary)] hover:underline"
                    >
                        {t('admin.backToHome')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                {t('admin.partners.title')}
                            </h1>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {t('admin.partners.createPartner')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Stats */}
                <PartnerStats stats={stats} />

                {/* Filters */}
                <div className="glass-card rounded-2xl p-6 mb-8">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('admin.partners.searchPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.partners.allTypes')}</option>
                            <option value="technology">{t('admin.partners.types.technology')}</option>
                            <option value="education">{t('admin.partners.types.education')}</option>
                            <option value="enterprise">{t('admin.partners.types.enterprise')}</option>
                            <option value="startup">{t('admin.partners.types.startup')}</option>
                            <option value="government">{t('admin.partners.types.government')}</option>
                            <option value="other">{t('admin.partners.types.other')}</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.partners.allStatuses')}</option>
                            <option value="draft">{t('admin.partners.status.draft')}</option>
                            <option value="published">{t('admin.partners.status.published')}</option>
                            <option value="archived">{t('admin.partners.status.archived')}</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="-createdAt">{t('admin.partners.sort.newest')}</option>
                            <option value="createdAt">{t('admin.partners.sort.oldest')}</option>
                            <option value="companyName">{t('admin.partners.sort.nameAZ')}</option>
                            <option value="-companyName">{t('admin.partners.sort.nameZA')}</option>
                            <option value="order">{t('admin.partners.sort.order')}</option>
                        </select>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 underline"
                        >
                            {t('admin.dismiss')}
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
                    </div>
                )}

                {/* Partners Grid */}
                {!loading && partners.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {partners.map(partner => (
                            <PartnerCard
                                key={partner._id}
                                partner={partner}
                                onEdit={handleEdit}
                                onDelete={(id) => setDeleteConfirm(id)}
                                onPublish={handlePublish}
                                onUnpublish={handleUnpublish}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && partners.length === 0 && (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-[var(--text-secondary)] mb-4">
                            {t('admin.partners.noPartners')}
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            {t('admin.partners.createFirst')}
                        </button>
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination.pages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="px-4 py-2 bg-[var(--bg-secondary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('admin.partners.pagination.prev')}
                        </button>
                        <span className="px-4 py-2 text-[var(--text-secondary)]">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.pages}
                            className="px-4 py-2 bg-[var(--bg-secondary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('admin.partners.pagination.next')}
                        </button>
                    </div>
                )}
            </main>

            {/* Form Modal */}
            {showForm && (
                <PartnerForm
                    partner={editingPartner}
                    onClose={() => {
                        setShowForm(false);
                        setEditingPartner(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                            {t('admin.partners.deleteConfirm.title')}
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t('admin.partners.deleteConfirm.message')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg"
                            >
                                {t('admin.partners.deleteConfirm.cancel')}
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                            >
                                {t('admin.partners.deleteConfirm.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerManagement;
