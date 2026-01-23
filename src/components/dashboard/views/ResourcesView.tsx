import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../../i18n/context';
import { useAuth } from '../../../auth/context';
import { getResources, Resource, deleteResource, hideResource, unhideResource } from '../../../services/resourceService';
import { ResourceCard } from '../../cards';
import ResourceDetailModal from '../../modals/ResourceDetailModal';
import ResourceFormModal from '../../modals/ResourceFormModal';

interface ResourcesViewProps {
    searchQuery: string;
}

const ResourcesView: React.FC<ResourcesViewProps> = ({ searchQuery }) => {
    const { language } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const isMod = user?.role === 'admin' || user?.role === 'mod';

    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('-createdAt');

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Modals
    const [selectedResourceSlug, setSelectedResourceSlug] = useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);

    const resourceTypes = [
        { value: 'all', label: language === 'vi' ? 'Tất cả' : 'All Types' },
        { value: 'template', label: 'Template' },
        { value: 'dataset', label: 'Dataset' },
        { value: 'design-asset', label: 'Design Asset' },
        { value: 'project-file', label: 'Project File' },
        { value: '3d-model', label: '3D Model' },
        { value: 'font', label: 'Font' },
        { value: 'other', label: language === 'vi' ? 'Khác' : 'Other' }
    ];

    const sortOptions = [
        { value: '-createdAt', label: language === 'vi' ? 'Mới nhất' : 'Newest' },
        { value: 'createdAt', label: language === 'vi' ? 'Cũ nhất' : 'Oldest' },
        { value: 'popular', label: language === 'vi' ? 'Phổ biến nhất' : 'Most Popular' },
        { value: 'downloads', label: language === 'vi' ? 'Tải nhiều nhất' : 'Most Downloads' },
        { value: 'rating', label: language === 'vi' ? 'Đánh giá cao' : 'Top Rated' }
    ];

    const fetchResources = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const params: Record<string, string> = {
                page: page.toString(),
                limit: '12',
                sort: sortBy
            };

            if (typeFilter !== 'all') params.resourceType = typeFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await getResources(params);
            setResources(response.data);
            setTotalPages(response.pagination.pages);
            setTotal(response.pagination.total);
        } catch (err) {
            console.error('Error fetching resources:', err);
            setError(err instanceof Error ? err.message : 'Failed to load resources');
        } finally {
            setIsLoading(false);
        }
    }, [page, typeFilter, sortBy, searchQuery]);

    useEffect(() => {
        fetchResources();
    }, [fetchResources]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setPage(1);
    }, [typeFilter, sortBy, searchQuery]);

    const handleResourceClick = (resource: Resource) => {
        setSelectedResourceSlug(resource.slug);
        setShowDetailModal(true);
    };

    const handleCreateNew = () => {
        setEditingResource(null);
        setShowFormModal(true);
    };

    const handleEdit = (resource: Resource) => {
        setEditingResource(resource);
        setShowFormModal(true);
    };

    const handleDelete = async (resourceId: string) => {
        if (!confirm(language === 'vi' ? 'Bạn có chắc muốn xóa tài nguyên này?' : 'Are you sure you want to delete this resource?')) {
            return;
        }

        try {
            await deleteResource(resourceId);
            setResources(prev => prev.filter(r => r._id !== resourceId));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete resource');
        }
    };

    const handleHide = async (resourceId: string) => {
        try {
            await hideResource(resourceId, 'Content violation');
            setResources(prev => prev.map(r =>
                r._id === resourceId ? { ...r, status: 'hidden' as const } : r
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to hide resource');
        }
    };

    const handleUnhide = async (resourceId: string) => {
        try {
            await unhideResource(resourceId);
            setResources(prev => prev.map(r =>
                r._id === resourceId ? { ...r, status: 'published' as const } : r
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to unhide resource');
        }
    };

    const handleResourceUpdate = (updated: Partial<Resource>) => {
        if (selectedResourceSlug) {
            setResources(prev => prev.map(r =>
                r.slug === selectedResourceSlug ? { ...r, ...updated } : r
            ));
        }
    };

    const handleFormSuccess = (resource: Resource) => {
        if (editingResource) {
            setResources(prev => prev.map(r => r._id === resource._id ? resource : r));
        } else {
            setResources(prev => [resource, ...prev]);
        }
    };

    return (
        <div className="p-6 md:p-8 overflow-y-auto flex-1 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
                        {language === 'vi' ? 'Kho Tài Nguyên' : 'Resource Repository'}
                    </h1>
                    <p className="text-[var(--text-secondary)]">
                        {language === 'vi'
                            ? 'Tải về và chia sẻ templates, datasets, assets'
                            : 'Download and share templates, datasets, assets'
                        }
                    </p>
                </div>
                {isAuthenticated && (
                    <button
                        onClick={handleCreateNew}
                        className="bg-[var(--accent-primary)] text-black font-bold px-6 py-2.5 rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                    >
                        <span>+</span> {language === 'vi' ? 'Tải lên' : 'Upload'}
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    {resourceTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                >
                    {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                <div className="ml-auto text-sm text-[var(--text-tertiary)]">
                    {total} {language === 'vi' ? 'kết quả' : 'results'}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
                    {error}
                    <button onClick={fetchResources} className="ml-4 underline hover:no-underline">
                        {language === 'vi' ? 'Thử lại' : 'Retry'}
                    </button>
                </div>
            )}

            {/* Resources Grid */}
            {!isLoading && !error && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {resources.length === 0 ? (
                            <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">
                                {language === 'vi'
                                    ? 'Chưa có tài nguyên nào. Hãy là người đầu tiên chia sẻ!'
                                    : 'No resources yet. Be the first to share!'
                                }
                            </div>
                        ) : (
                            resources.map((resource) => (
                                <div key={resource._id} className="relative group">
                                    <ResourceCard
                                        resource={resource}
                                        onClick={() => handleResourceClick(resource)}
                                        onUpdate={(updated) => {
                                            setResources(prev => prev.map(r =>
                                                r._id === resource._id ? { ...r, ...updated } : r
                                            ));
                                        }}
                                    />
                                    {/* Owner/Mod Actions */}
                                    {(user?._id === resource.author._id || isMod) && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            {user?._id === resource.author._id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(resource); }}
                                                    className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                                                    title={language === 'vi' ? 'Sửa' : 'Edit'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {isMod && resource.status === 'published' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleHide(resource._id); }}
                                                    className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:text-yellow-400"
                                                    title={language === 'vi' ? 'Ẩn' : 'Hide'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                </button>
                                            )}
                                            {isMod && resource.status === 'hidden' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleUnhide(resource._id); }}
                                                    className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:text-green-400"
                                                    title={language === 'vi' ? 'Hiện' : 'Unhide'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {user?._id === resource.author._id && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(resource._id); }}
                                                    className="p-1.5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded text-[var(--text-secondary)] hover:text-red-400"
                                                    title={language === 'vi' ? 'Xóa' : 'Delete'}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 hover:border-[var(--accent-primary)]"
                            >
                                {language === 'vi' ? 'Trước' : 'Previous'}
                            </button>
                            <span className="px-4 py-2 text-[var(--text-secondary)]">
                                {page} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 hover:border-[var(--accent-primary)]"
                            >
                                {language === 'vi' ? 'Sau' : 'Next'}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            <ResourceDetailModal
                isOpen={showDetailModal}
                onClose={() => { setShowDetailModal(false); setSelectedResourceSlug(null); }}
                resourceSlug={selectedResourceSlug}
                onUpdate={handleResourceUpdate}
            />

            {/* Form Modal */}
            <ResourceFormModal
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingResource(null); }}
                editingResource={editingResource}
                onSuccess={handleFormSuccess}
            />
        </div>
    );
};

export default ResourcesView;
