import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    getCourses,
    getCourseStats,
    deleteCourse,
    publishCourse,
    unpublishCourse,
    archiveCourse,
    Course,
    CourseQueryParams,
    PaginationInfo
} from '../../services/courseService';
import CourseCard from './CourseCard';
import CourseForm from './CourseForm';
import CourseStats from './CourseStats';

interface CourseManagementProps {
    onBack: () => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    // State
    const [courses, setCourses] = useState<Course[]>([]);
    const [stats, setStats] = useState<{
        totalCourses: number;
        publishedCourses: number;
        draftCourses: number;
        archivedCourses: number;
        totalEnrollments: number;
        averageRating: number | string;
        byCategory: Record<string, number>;
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
    const [levelFilter, _setLevelFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [sortBy, setSortBy] = useState('-createdAt');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Load courses
    const loadCourses = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const params: CourseQueryParams = {
                page: pagination.page,
                limit: pagination.limit,
                sort: sortBy
            };

            if (searchQuery) params.search = searchQuery;
            if (categoryFilter) params.category = categoryFilter;
            if (levelFilter) params.level = levelFilter;
            if (statusFilter) params.status = statusFilter;

            const response = await getCourses(params);
            setCourses(response.data);
            setPagination(response.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, searchQuery, categoryFilter, levelFilter, statusFilter, sortBy]);

    // Load stats
    const loadStats = useCallback(async () => {
        try {
            const data = await getCourseStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadCourses();
        loadStats();
    }, [loadCourses, loadStats]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                loadCourses();
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle filter changes
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 1 }));
    }, [categoryFilter, levelFilter, statusFilter, sortBy]);

    // Handlers
    const handleCreateNew = useCallback(() => {
        setEditingCourse(null);
        setShowForm(true);
    }, []);

    const handleEdit = useCallback((course: Course) => {
        setEditingCourse(course);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteCourse(id);
            setDeleteConfirm(null);
            loadCourses();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete course');
        }
    }, [loadCourses, loadStats]);

    const handlePublish = useCallback(async (id: string) => {
        try {
            await publishCourse(id);
            loadCourses();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish course');
        }
    }, [loadCourses, loadStats]);

    const handleUnpublish = useCallback(async (id: string) => {
        try {
            await unpublishCourse(id);
            loadCourses();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to unpublish course');
        }
    }, [loadCourses, loadStats]);

    const handleArchive = useCallback(async (id: string) => {
        try {
            await archiveCourse(id);
            loadCourses();
            loadStats();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to archive course');
        }
    }, [loadCourses, loadStats]);

    const handleFormClose = useCallback(() => {
        setShowForm(false);
        setEditingCourse(null);
    }, []);

    const handleFormSuccess = useCallback(() => {
        setShowForm(false);
        setEditingCourse(null);
        loadCourses();
        loadStats();
    }, [loadCourses, loadStats]);

    const handlePageChange = useCallback((newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    }, []);

    // Check admin access
    if (user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="text-center">
                    <p className="text-[var(--text-secondary)]">{t('admin.courses.accessDenied')}</p>
                    <button
                        onClick={onBack}
                        className="mt-4 px-6 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-lg"
                    >
                        {t('app.back')}
                    </button>
                </div>
            </div>
        );
    }

    // Show form
    if (showForm) {
        return (
            <CourseForm
                course={editingCourse}
                onClose={handleFormClose}
                onSuccess={handleFormSuccess}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-40 glass-card border-b border-[var(--border-primary)]">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                {t('admin.courses.title')}
                            </h1>
                            <p className="text-sm text-[var(--text-secondary)]">
                                {t('admin.courses.subtitle')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        {t('admin.courses.createNew')}
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Stats */}
                {stats && <CourseStats stats={stats} />}

                {/* Filters */}
                <div className="glass-card rounded-2xl p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('admin.courses.searchPlaceholder')}
                                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                />
                            </div>
                        </div>

                        {/* Category */}
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.courses.allCategories')}</option>
                            <option value="ai-basic">{t('admin.courses.categories.aiBasic')}</option>
                            <option value="ai-advanced">{t('admin.courses.categories.aiAdvanced')}</option>
                            <option value="ai-studio">{t('admin.courses.categories.aiStudio')}</option>
                            <option value="ai-creative">{t('admin.courses.categories.aiCreative')}</option>
                        </select>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="">{t('admin.courses.allStatus')}</option>
                            <option value="draft">{t('admin.courses.draft')}</option>
                            <option value="published">{t('admin.courses.published')}</option>
                            <option value="archived">{t('admin.courses.archived')}</option>
                        </select>

                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                        >
                            <option value="-createdAt">{t('admin.courses.sortNewest')}</option>
                            <option value="createdAt">{t('admin.courses.sortOldest')}</option>
                            <option value="-enrolledCount">{t('admin.courses.sortPopular')}</option>
                            <option value="-rating">{t('admin.courses.sortRating')}</option>
                            <option value="-price">{t('admin.courses.sortPriceHigh')}</option>
                            <option value="price">{t('admin.courses.sortPriceLow')}</option>
                        </select>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                        {error}
                        <button
                            onClick={() => setError(null)}
                            className="ml-4 underline"
                        >
                            {t('admin.courses.dismiss')}
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                    </div>
                ) : courses.length === 0 ? (
                    <div className="text-center py-20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-[var(--text-tertiary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-[var(--text-secondary)] mb-4">{t('admin.courses.noCourses')}</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-xl"
                        >
                            {t('admin.courses.createFirst')}
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Course Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {courses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    onEdit={handleEdit}
                                    onDelete={(id) => setDeleteConfirm(id)}
                                    onPublish={handlePublish}
                                    onUnpublish={handleUnpublish}
                                    onArchive={handleArchive}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.pages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                    className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>

                                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                            page === pagination.page
                                                ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                                                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                    className="p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass-card rounded-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            {t('admin.courses.deleteConfirmTitle')}
                        </h3>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t('admin.courses.deleteConfirmMessage')}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
                            >
                                {t('admin.courses.form.cancel')}
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                            >
                                {t('admin.courses.deleteCourse')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;
