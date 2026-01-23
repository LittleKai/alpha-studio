import React from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { Prompt, togglePromptLike, togglePromptBookmark } from '../../services/promptService';
import { LikeButton, BookmarkButton, RatingStars } from '../shared';

interface PromptCardProps {
    prompt: Prompt;
    onClick?: () => void;
    onUpdate?: (updated: Partial<Prompt>) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onClick, onUpdate }) => {
    const { language } = useTranslation();
    const { isAuthenticated } = useAuth();

    const getLocalizedText = (obj: { vi?: string; en?: string } | undefined): string => {
        if (!obj) return '';
        if (language === 'vi') return obj.vi || obj.en || '';
        return obj.en || obj.vi || '';
    };

    const getCategoryColor = (category: string): string => {
        const colors: Record<string, string> = {
            'image-generation': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'text-generation': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'code': 'bg-green-500/20 text-green-400 border-green-500/30',
            'workflow': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'other': 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return colors[category] || colors.other;
    };

    const getPlatformColor = (platform: string): string => {
        const colors: Record<string, string> = {
            'midjourney': 'bg-indigo-500/10 text-indigo-400',
            'stable-diffusion': 'bg-pink-500/10 text-pink-400',
            'dalle': 'bg-cyan-500/10 text-cyan-400',
            'comfyui': 'bg-amber-500/10 text-amber-400',
            'chatgpt': 'bg-emerald-500/10 text-emerald-400',
            'claude': 'bg-orange-500/10 text-orange-400',
            'other': 'bg-gray-500/10 text-gray-400'
        };
        return colors[platform] || colors.other;
    };

    const getPlatformLabel = (platform: string): string => {
        const labels: Record<string, string> = {
            'midjourney': 'Midjourney',
            'stable-diffusion': 'Stable Diffusion',
            'dalle': 'DALL-E',
            'comfyui': 'ComfyUI',
            'chatgpt': 'ChatGPT',
            'claude': 'Claude',
            'other': 'Other'
        };
        return labels[platform] || platform;
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
            const response = await togglePromptLike(prompt._id);
            onUpdate?.({
                isLiked: response.data.liked,
                likesCount: response.data.likesCount
            });
        } catch (error) {
            console.error('Failed to like prompt:', error);
        }
    };

    const handleBookmark = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await togglePromptBookmark(prompt._id);
            onUpdate?.({
                isBookmarked: response.data.bookmarked,
                bookmarksCount: response.data.bookmarksCount
            });
        } catch (error) {
            console.error('Failed to bookmark prompt:', error);
        }
    };

    // Get first output example image for thumbnail
    const thumbnailImage = prompt.exampleImages?.find(img => img.type === 'output')?.url ||
                          prompt.exampleImages?.[0]?.url;

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
                        alt={getLocalizedText(prompt.title)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {prompt.isFeatured && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded">
                            Featured
                        </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                        <span className={`${getPlatformColor(prompt.platform)} px-2 py-0.5 rounded text-[10px] font-bold backdrop-blur-sm`}>
                            {getPlatformLabel(prompt.platform)}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="h-40 bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--border-primary)] flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
            )}

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                {/* Category & Time */}
                <div className="flex items-center justify-between mb-2">
                    <span className={`${getCategoryColor(prompt.category)} px-2 py-0.5 rounded text-[10px] font-bold uppercase border`}>
                        {prompt.category.replace('-', ' ')}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)]">
                        {formatTimeAgo(prompt.createdAt)}
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-1 line-clamp-2 group-hover:text-[var(--accent-primary)] transition-colors">
                    {getLocalizedText(prompt.title)}
                </h3>

                {/* Description */}
                <p className="text-[14px] text-[var(--text-primary)] opacity-80 mb-3 line-clamp-3 flex-grow whitespace-pre-line">
                    {getLocalizedText(prompt.description) || prompt.promptContent?.substring(0, 100) + '...' || ''}
                </p>

                {/* Tags */}
                {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {prompt.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[12px] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] px-2 py-0.5 rounded"
                            >
                                #{tag}
                            </span>
                        ))}
                        {prompt.tags.length > 3 && (
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                +{prompt.tags.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Rating */}
                <div className="mb-3">
                    <RatingStars rating={prompt.rating.average} count={prompt.rating.count} size="sm" />
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-[var(--border-primary)] mt-auto">
                    <div className="flex items-center justify-between">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {prompt.author.avatar ? (
                                    <img src={prompt.author.avatar} alt={prompt.author.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    prompt.author.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <span className="text-xs text-[var(--text-primary)] opacity-80 truncate max-w-[80px]">
                                {prompt.author.name}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <LikeButton
                                isLiked={prompt.isLiked || false}
                                likesCount={prompt.likesCount}
                                onToggle={handleLike}
                                size="sm"
                                disabled={!isAuthenticated}
                            />
                            <BookmarkButton
                                isBookmarked={prompt.isBookmarked || false}
                                onToggle={handleBookmark}
                                size="sm"
                                disabled={!isAuthenticated}
                            />
                            <div className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] ml-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                {prompt.downloadsCount}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptCard;
