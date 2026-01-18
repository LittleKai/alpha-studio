import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    getJobs,
    getJobStats,
    deleteJob,
    publishJob,
    closeJob,
    Job,
    JobQueryParams,
    PaginationInfo
} from '../../services/jobService';
import JobCard from './JobCard';
import JobForm from './JobForm';
import JobStats from './JobStats';

interface JobManagementProps {
    onBack: () => void;
}

const JobManagement: React.FC<JobManagementProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // State
    const [jobs, setJobs] = useState<Job[]>([]);
    const [stats, setStats] = useState<{
        totalJobs: number;
        publishedJobs: number;
        draftJobs: number;
        closedJobs: number;
        totalApplications: number;
        byCategory: Record<string, number>;
        byJobType: Record<string, number>;
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
    const [categoryFilter, setCategoryFilter] = useState('');
    const [jobTypeFilter, setJobTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Load jobs
    const loadJobs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: JobQueryParams = {
                page: pagination.page,
                limit: pagination.limit,
                sort: sortBy
            };

            if (searchQuery) params.search = searchQuery;
            if (categoryFilter) params.category = categoryFilter;
            if (jobTypeFilter) params.jobType = jobTypeFilter;
            if (statusFilter) params.status = statusFilter;

            const response = await getJobs(params);
            setJobs(response.data);
            setPagination(response.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery, categoryFilter, jobTypeFilter, statusFilter, sortBy]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const data = await getJobStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadJobs();
        loadStats();
    }, [loadJobs, loadStats]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                loadJobs();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [categoryFilter, jobTypeFilter, statusFilter, sortBy]);

    // Handlers
    const handleCreateNew = useCallback(() => {
        setEditingJob(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((job: Job) => {
        setEditingJob(job);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteJob(id);
            setDeleteConfirm(null);
            loadJobs();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete job');
        }
    }, [loadJobs, loadStats]);

    const handlePublish = useCallback(async (id: string) => {
        try {
            await publishJob(id);
            loadJobs();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish job');
        }
    }, [loadJobs, loadStats]);

    const handleClose = useCallback(async (id: string) => {
        try {
            await closeJob(id);
            loadJobs();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to close job');
        }
    }, [loadJobs, loadStats]);

    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingJob(null);
        loadJobs();
        loadStats();
    }, [loadJobs, loadStats]);

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
                                {t('admin.jobs.title')}
                            </h1>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            {t('admin.jobs.createJob')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Stats */}
                <JobStats stats={stats} />

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
                                    placeholder={t('admin.jobs.searchPlaceholder')}
                                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.jobs.allCategories')}</option>
                            <option value="engineering">{t('admin.jobs.categories.engineering')}</option>
                            <option value="design">{t('admin.jobs.categories.design')}</option>
                            <option value="marketing">{t('admin.jobs.categories.marketing')}</option>
                            <option value="operations">{t('admin.jobs.categories.operations')}</option>
                            <option value="hr">{t('admin.jobs.categories.hr')}</option>
                            <option value="finance">{t('admin.jobs.categories.finance')}</option>
                            <option value="other">{t('admin.jobs.categories.other')}</option>
                        </select>

                        {/* Job Type Filter */}
                        <select
                            value={jobTypeFilter}
                            onChange={(e) => setJobTypeFilter(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.jobs.allTypes')}</option>
                            <option value="full-time">{t('admin.jobs.types.fullTime')}</option>
                            <option value="part-time">{t('admin.jobs.types.partTime')}</option>
                            <option value="contract">{t('admin.jobs.types.contract')}</option>
                            <option value="internship">{t('admin.jobs.types.internship')}</option>
                            <option value="remote">{t('admin.jobs.types.remote')}</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.jobs.allStatuses')}</option>
                            <option value="draft">{t('admin.jobs.status.draft')}</option>
                            <option value="published">{t('admin.jobs.status.published')}</option>
                            <option value="closed">{t('admin.jobs.status.closed')}</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="-createdAt">{t('admin.jobs.sort.newest')}</option>
                            <option value="createdAt">{t('admin.jobs.sort.oldest')}</option>
                            <option value="-applicationCount">{t('admin.jobs.sort.mostApplied')}</option>
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

                {/* Jobs Grid */}
                {!loading && jobs.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {jobs.map(job => (
                            <JobCard
                                key={job._id}
                                job={job}
                                onEdit={handleEdit}
                                onDelete={(id) => setDeleteConfirm(id)}
                                onPublish={handlePublish}
                                onClose={handleClose}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && jobs.length === 0 && (
                    <div className="text-center py-12">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-[var(--text-secondary)] mb-4">
                            {t('admin.jobs.noJobs')}
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            {t('admin.jobs.createFirst')}
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
                            {t('admin.jobs.pagination.prev')}
                        </button>
                        <span className="px-4 py-2 text-[var(--text-secondary)]">
                            {pagination.page} / {pagination.pages}
                        </span>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.pages}
                            className="px-4 py-2 bg-[var(--bg-secondary)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('admin.jobs.pagination.next')}
                        </button>
                    </div>
                )}
            </main>

            {/* Form Modal */}
            {showForm && (
                <JobForm
                    job={editingJob}
                    onClose={() => {
                        setShowForm(false);
                        setEditingJob(null);
                    }}
                    onSuccess={handleFormSuccess}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="w-full max-w-md bg-[var(--bg-primary)] rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                            {t('admin.jobs.deleteConfirm.title')}
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t('admin.jobs.deleteConfirm.message')}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg"
                            >
                                {t('admin.jobs.deleteConfirm.cancel')}
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg"
                            >
                                {t('admin.jobs.deleteConfirm.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobManagement;
