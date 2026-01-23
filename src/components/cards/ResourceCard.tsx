import React from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { Resource, toggleResourceLike, toggleResourceBookmark, formatFileSize } from '../../services/resourceService';
import { LikeButton, BookmarkButton, RatingStars } from '../shared';

interface ResourceCardProps {
    resource: Resource;
    onClick?: () => void;
    onUpdate?: (updated: Partial<Resource>) => void;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onClick, onUpdate }) => {
    const { language } = useTranslation();
    const { isAuthenticated } = useAuth();

    const getLocalizedText = (obj: { vi?: string; en?: string } | undefined): string => {
        if (!obj) return '';
        if (language === 'vi') return obj.vi || obj.en || '';
        return obj.en || obj.vi || '';
    };

    const getResourceTypeColor = (type: string): string => {
        const colors: Record<string, string> = {
            'template': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'dataset': 'bg-green-500/20 text-green-400 border-green-500/30',
            'design-asset': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'project-file': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            '3d-model': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
            'font': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            'other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return colors[type] || colors.other;
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

    const getFileIcon = (format?: string): React.ReactNode => {
        const iconClass = "w-8 h-8";
        const ext = format?.toLowerCase() || '';

        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
            return (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            );
        }

        if (['psd', 'ai', 'sketch', 'fig', 'xd'].includes(ext)) {
            return (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
        }

        if (['fbx', 'obj', 'blend', 'max', '3ds', 'c4d'].includes(ext)) {
            return (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            );
        }

        if (['ttf', 'otf', 'woff', 'woff2'].includes(ext)) {
            return (
                <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            );
        }

        return (
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        );
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays < 1) return language === 'vi' ? 'Hôm nay' : 'Today';
        if (diffDays < 7) return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
        if (diffDays < 30) return language === 'vi' ? `${Math.floor(diffDays / 7)} tuần trước` : `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    };

    const handleLike = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await toggleResourceLike(resource._id);
            onUpdate?.({
                isLiked: response.data.liked,
                likesCount: response.data.likesCount
            });
        } catch (error) {
            console.error('Failed to like resource:', error);
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await toggleResourceBookmark(resource._id);
            onUpdate?.({
                isBookmarked: response.data.bookmarked,
                bookmarksCount: response.data.bookmarksCount
            });
        } catch (error) {
            console.error('Failed to bookmark resource:', error);
        }
    };

    // Get thumbnail
    const thumbnailImage = resource.thumbnail?.url ||
                          resource.previewImages?.[0]?.url;

    return (
        <div
            className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden hover:border-[var(--accent-primary)] transition-all shadow-lg group cursor-pointer flex flex-col h-full"
            onClick={onClick}
        >
            {/* Thumbnail */}
            {thumbnailImage ? (
                <div className="relative h-40 overflow-hidden bg-[var(--bg-secondary)]">
                    <img
                        src={thumbnailImage}
                        alt={getLocalizedText(resource.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {resource.isFeatured && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
                            Featured
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded">
                        {resource.file?.format?.toUpperCase() || 'FILE'}
                    </div>
                </div>
            ) : (
                <div className="h-40 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--border-primary)] flex items-center justify-center text-[var(--text-tertiary)]">
                    {getFileIcon(resource.file?.format)}
                </div>
            )}

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Type & Time */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`${getResourceTypeColor(resource.resourceType)} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                        {getResourceTypeLabel(resource.resourceType)}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        {formatTimeAgo(resource.createdAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {getLocalizedText(resource.title)}
                </h3>

                {/* Description */}
                <p className="text-[14px] text-[var(--text-primary)] opacity-80 mb-3 line-clamp-3 flex-grow whitespace-pre-line">
                    {getLocalizedText(resource.description)}
                </p>

                {/* File info & Compatible software */}
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1 bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {formatFileSize(resource.file?.size || 0)}
                    </span>
                    {resource.compatibleSoftware && resource.compatibleSoftware.length > 0 && (
                        <span className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded truncate max-w-[100px]">
                            {resource.compatibleSoftware.slice(0, 2).join(', ')}
                            {resource.compatibleSoftware.length > 2 && '...'}
                        </span>
                    )}
                </div>

                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {resource.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[12px] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded"
                            >
                                #{tag}
                            </span>
                        ))}
                        {resource.tags.length > 3 && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                +{resource.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Rating */}
                <div className="mb-3">
                    <RatingStars rating={resource.rating.average} count={resource.rating.count} size="sm" />
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[var(--border-primary)] mt-auto">
                    <div className="flex items-center justify-between">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {resource.author.avatar ? (
                                    <img src={resource.author.avatar} alt={resource.author.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    resource.author.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <span className="text-xs text-[var(--text-primary)] opacity-80 truncate max-w-[80px]">
                                {resource.author.name}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <LikeButton
                                isLiked={resource.isLiked || false}
                                likesCount={resource.likesCount}
                                onToggle={handleLike}
                                size="sm"
                                disabled={!isAuthenticated}
                            />
                            <BookmarkButton
                                isBookmarked={resource.isBookmarked || false}
                                onToggle={handleBookmark}
                                size="sm"
                                disabled={!isAuthenticated}
                            />
                            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] ml-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {resource.downloadsCount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceCard;
