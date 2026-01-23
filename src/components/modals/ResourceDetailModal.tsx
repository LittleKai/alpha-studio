import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    Resource,
    getResourceBySlug,
    toggleResourceLike,
    toggleResourceBookmark,
    downloadResource,
    rateResource,
    formatFileSize
} from '../../services/resourceService';
import { LikeButton, BookmarkButton, RatingStars, CommentSection, ImageLightbox } from '../shared';

interface ResourceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceSlug: string | null;
    onUpdate?: (resource: Resource) => void;
}

const ResourceDetailModal: React.FC<ResourceDetailModalProps> = ({
    isOpen,
    onClose,
    resourceSlug,
    onUpdate
}) => {
    const { language } = useTranslation();
    const { isAuthenticated } = useAuth();

    const [resource, setResource] = useState<Resource | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    const [selectedPreview, setSelectedPreview] = useState<number>(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        if (isOpen && resourceSlug) {
            fetchResource();
        }
    }, [isOpen, resourceSlug]);

    const fetchResource = async () => {
        if (!resourceSlug) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await getResourceBySlug(resourceSlug);
            setResource(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load resource');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!resource || !isAuthenticated) return;
        try {
            const response = await toggleResourceLike(resource._id);
            const updated = {
                ...resource,
                isLiked: response.data.liked,
                likesCount: response.data.likesCount
            };
            setResource(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to like resource:', error);
        }
    };

    const handleBookmark = async () => {
        if (!resource || !isAuthenticated) return;
        try {
            const response = await toggleResourceBookmark(resource._id);
            const updated = {
                ...resource,
                isBookmarked: response.data.bookmarked,
                bookmarksCount: response.data.bookmarksCount
            };
            setResource(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to bookmark resource:', error);
        }
    };

    const handleDownload = async () => {
        if (!resource || !isAuthenticated) return;

        setDownloading(true);
        try {
            const response = await downloadResource(resource._id);

            // Open download link in new tab
            window.open(response.data.file.url, '_blank');

            const updated = { ...resource, downloadsCount: response.data.downloadsCount };
            setResource(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to download resource:', error);
            // Fallback: try direct download
            if (resource.file?.url) {
                window.open(resource.file.url, '_blank');
            }
        } finally {
            setDownloading(false);
        }
    };

    const handleRate = async (score: number) => {
        if (!resource || !isAuthenticated) return;
        try {
            const response = await rateResource(resource._id, score);
            const updated = {
                ...resource,
                userRating: response.data.userRating,
                rating: response.data.rating
            };
            setResource(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to rate resource:', error);
        }
    };

    const getLocalizedText = (obj: { vi?: string; en?: string } | undefined): string => {
        if (!obj) return '';
        if (language === 'vi') return obj.vi || obj.en || '';
        return obj.en || obj.vi || '';
    };

    const getResourceTypeLabel = (type: string): string => {
        const labels: Record<string, { vi: string; en: string }> = {
            'template': { vi: 'Template', en: 'Template' },
            'dataset': { vi: 'Dataset', en: 'Dataset' },
            'design-asset': { vi: 'Design Asset', en: 'Design Asset' },
            'project-file': { vi: 'Project File', en: 'Project File' },
            '3d-model': { vi: '3D Model', en: '3D Model' },
            'font': { vi: 'Font', en: 'Font' },
            'other': { vi: 'Khác', en: 'Other' }
        };
        return labels[type]?.[language] || type;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {language === 'vi' ? 'Chi tiết Tài nguyên' : 'Resource Details'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-20 text-red-400">{error}</div>
                    ) : resource ? (
                        <div className="p-6">
                            {/* Preview Images / Thumbnail */}
                            {(resource.previewImages && resource.previewImages.length > 0) || resource.thumbnail ? (
                                <div className="mb-6">
                                    <div
                                        className="relative h-64 md:h-80 bg-[var(--bg-secondary)] rounded-xl overflow-hidden cursor-pointer group"
                                        onClick={() => setLightboxOpen(true)}
                                    >
                                        <img
                                            src={resource.previewImages?.[selectedPreview]?.url || resource.thumbnail?.url}
                                            alt={getLocalizedText(resource.title)}
                                            className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </div>
                                    </div>
                                    {resource.previewImages && resource.previewImages.length > 1 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                                            {resource.previewImages.map((img, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedPreview(index)}
                                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                        selectedPreview === index
                                                            ? 'border-[var(--accent-primary)]'
                                                            : 'border-transparent opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <img src={img.url} alt={img.caption || `Preview ${index + 1}`} className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Image Lightbox */}
                                    <ImageLightbox
                                        images={
                                            resource.previewImages && resource.previewImages.length > 0
                                                ? resource.previewImages.map(img => ({ url: img.url, caption: img.caption }))
                                                : resource.thumbnail
                                                    ? [{ url: resource.thumbnail.url }]
                                                    : []
                                        }
                                        initialIndex={selectedPreview}
                                        isOpen={lightboxOpen}
                                        onClose={() => setLightboxOpen(false)}
                                    />
                                </div>
                            ) : null}

                            {/* Title & Meta */}
                            <div className="mb-6">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded text-xs font-bold">
                                        {getResourceTypeLabel(resource.resourceType)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded text-xs">
                                        {resource.file?.format?.toUpperCase() || 'FILE'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded text-xs">
                                        {formatFileSize(resource.file?.size || 0)}
                                    </span>
                                    {resource.isFeatured && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                                            Featured
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                    {getLocalizedText(resource.title)}
                                </h1>
                                <p className="text-[var(--text-primary)] opacity-80 whitespace-pre-wrap">
                                    {getLocalizedText(resource.description)}
                                </p>
                            </div>

                            {/* Author & Stats */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border-primary)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white font-bold">
                                        {resource.author.avatar ? (
                                            <img src={resource.author.avatar} alt={resource.author.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            resource.author.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{resource.author.name}</p>
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            {new Date(resource.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {resource.viewsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {resource.downloadsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {resource.commentsCount}
                                    </span>
                                </div>
                            </div>

                            {/* Download Button */}
                            <div className="mb-6">
                                <button
                                    onClick={handleDownload}
                                    disabled={!isAuthenticated || downloading}
                                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                                        isAuthenticated
                                            ? 'bg-[var(--accent-primary)] text-black hover:opacity-90'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] cursor-not-allowed'
                                    }`}
                                >
                                    {downloading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            {language === 'vi' ? 'Đang tải...' : 'Downloading...'}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            {isAuthenticated
                                                ? (language === 'vi' ? 'Tải xuống' : 'Download')
                                                : (language === 'vi' ? 'Đăng nhập để tải' : 'Login to download')
                                            }
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-4 mb-6 border-b border-[var(--border-primary)]">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`pb-3 px-1 font-semibold text-sm border-b-2 transition-colors ${
                                        activeTab === 'details'
                                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {language === 'vi' ? 'Chi tiết' : 'Details'}
                                </button>
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`pb-3 px-1 font-semibold text-sm border-b-2 transition-colors ${
                                        activeTab === 'comments'
                                            ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                            : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {language === 'vi' ? 'Bình luận' : 'Comments'} ({resource.commentsCount})
                                </button>
                            </div>

                            {activeTab === 'details' ? (
                                <>
                                    {/* Compatible Software */}
                                    {resource.compatibleSoftware && resource.compatibleSoftware.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-2">
                                                {language === 'vi' ? 'Phần mềm tương thích' : 'Compatible Software'}
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {resource.compatibleSoftware.map((software) => (
                                                    <span
                                                        key={software}
                                                        className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full text-sm"
                                                    >
                                                        {software}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {resource.tags && resource.tags.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-2">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {resource.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-full text-sm"
                                                    >
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* File Info */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2">
                                            {language === 'vi' ? 'Thông tin file' : 'File Information'}
                                        </h3>
                                        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-tertiary)]">{language === 'vi' ? 'Tên file' : 'Filename'}</span>
                                                <span className="text-[var(--text-primary)]">{resource.file?.filename}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-tertiary)]">{language === 'vi' ? 'Định dạng' : 'Format'}</span>
                                                <span className="text-[var(--text-primary)]">{resource.file?.format?.toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[var(--text-tertiary)]">{language === 'vi' ? 'Kích thước' : 'Size'}</span>
                                                <span className="text-[var(--text-primary)]">{formatFileSize(resource.file?.size || 0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2">
                                            {language === 'vi' ? 'Đánh giá' : 'Rating'}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <RatingStars
                                                rating={resource.rating.average}
                                                count={resource.rating.count}
                                                size="lg"
                                                interactive={isAuthenticated}
                                                userRating={resource.userRating}
                                                onRate={handleRate}
                                            />
                                            <span className="text-lg font-bold text-[var(--text-primary)]">
                                                {resource.rating.average.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <CommentSection
                                    targetType="resource"
                                    targetId={resource._id}
                                    commentsCount={resource.commentsCount}
                                />
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer Actions */}
                {resource && (
                    <div className="p-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LikeButton
                                isLiked={resource.isLiked || false}
                                likesCount={resource.likesCount}
                                onToggle={handleLike}
                                disabled={!isAuthenticated}
                            />
                            <BookmarkButton
                                isBookmarked={resource.isBookmarked || false}
                                bookmarksCount={resource.bookmarksCount}
                                onToggle={handleBookmark}
                                showCount
                                disabled={!isAuthenticated}
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg font-semibold hover:bg-[var(--border-primary)] transition-colors"
                        >
                            {language === 'vi' ? 'Đóng' : 'Close'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceDetailModal;
