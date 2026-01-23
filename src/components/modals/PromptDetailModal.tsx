import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    Prompt,
    getPromptBySlug,
    togglePromptLike,
    togglePromptBookmark,
    downloadPrompt,
    ratePrompt
} from '../../services/promptService';
import { LikeButton, BookmarkButton, RatingStars, CommentSection, ImageLightbox } from '../shared';

interface PromptDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptSlug: string | null;
    onUpdate?: (prompt: Prompt) => void;
}

const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
    isOpen,
    onClose,
    promptSlug,
    onUpdate
}) => {
    const { language } = useTranslation();
    const { isAuthenticated } = useAuth();

    const [prompt, setPrompt] = useState<Prompt | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => {
        if (isOpen && promptSlug) {
            fetchPrompt();
        }
    }, [isOpen, promptSlug]);

    const fetchPrompt = async () => {
        if (!promptSlug) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await getPromptBySlug(promptSlug);
            setPrompt(response.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load prompt');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async () => {
        if (!prompt || !isAuthenticated) return;
        try {
            const response = await togglePromptLike(prompt._id);
            const updated = {
                ...prompt,
                isLiked: response.data.liked,
                likesCount: response.data.likesCount
            };
            setPrompt(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to like prompt:', error);
        }
    };

    const handleBookmark = async () => {
        if (!prompt || !isAuthenticated) return;
        try {
            const response = await togglePromptBookmark(prompt._id);
            const updated = {
                ...prompt,
                isBookmarked: response.data.bookmarked,
                bookmarksCount: response.data.bookmarksCount
            };
            setPrompt(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to bookmark prompt:', error);
        }
    };

    const handleCopyPrompt = async () => {
        if (!prompt || !isAuthenticated) return;
        try {
            const response = await downloadPrompt(prompt._id);

            // Build content to copy - support multiple prompts
            let contentToCopy = '';
            if (prompt.promptContents && prompt.promptContents.length > 0) {
                contentToCopy = prompt.promptContents.map((p, index) => {
                    const label = p.label || `Prompt ${index + 1}`;
                    return `=== ${label} ===\n${p.content}`;
                }).join('\n\n');
            } else if (response.data.promptContent) {
                contentToCopy = response.data.promptContent;
            } else if (prompt.promptContent) {
                contentToCopy = prompt.promptContent;
            }

            await navigator.clipboard.writeText(contentToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            const updated = { ...prompt, downloadsCount: response.data.downloadsCount };
            setPrompt(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to copy prompt:', error);
            // Try to copy from local data
            let contentToCopy = '';
            if (prompt.promptContents && prompt.promptContents.length > 0) {
                contentToCopy = prompt.promptContents.map((p, index) => {
                    const label = p.label || `Prompt ${index + 1}`;
                    return `=== ${label} ===\n${p.content}`;
                }).join('\n\n');
            } else if (prompt.promptContent) {
                contentToCopy = prompt.promptContent;
            }

            if (contentToCopy) {
                await navigator.clipboard.writeText(contentToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    const handleRate = async (score: number) => {
        if (!prompt || !isAuthenticated) return;
        try {
            const response = await ratePrompt(prompt._id, score);
            const updated = {
                ...prompt,
                userRating: response.data.userRating,
                rating: response.data.rating
            };
            setPrompt(updated);
            onUpdate?.(updated);
        } catch (error) {
            console.error('Failed to rate prompt:', error);
        }
    };

    const getLocalizedText = (obj: { vi?: string; en?: string } | undefined): string => {
        if (!obj) return '';
        if (language === 'vi') return obj.vi || obj.en || '';
        return obj.en || obj.vi || '';
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-[var(--border-primary)] flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {language === 'vi' ? 'Chi tiết Prompt' : 'Prompt Details'}
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
                    ) : prompt ? (
                        <div className="p-6">
                            {/* Title & Meta */}
                            <div className="mb-6">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded text-xs font-bold">
                                        {getPlatformLabel(prompt.platform)}
                                    </span>
                                    <span className="px-2 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded text-xs">
                                        {prompt.category.replace('-', ' ')}
                                    </span>
                                    {prompt.isFeatured && (
                                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-bold">
                                            Featured
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                                    {getLocalizedText(prompt.title)}
                                </h1>
                                <p className="text-[var(--text-primary)] opacity-80 whitespace-pre-wrap">
                                    {getLocalizedText(prompt.description)}
                                </p>
                            </div>

                            {/* Author & Stats */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-[var(--border-primary)]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white font-bold">
                                        {prompt.author.avatar ? (
                                            <img src={prompt.author.avatar} alt={prompt.author.name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            prompt.author.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[var(--text-primary)]">{prompt.author.name}</p>
                                        <p className="text-xs text-[var(--text-tertiary)]">
                                            {new Date(prompt.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {prompt.viewsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        {prompt.downloadsCount}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                        {prompt.commentsCount}
                                    </span>
                                </div>
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
                                    {language === 'vi' ? 'Bình luận' : 'Comments'} ({prompt.commentsCount})
                                </button>
                            </div>

                            {activeTab === 'details' ? (
                                <>
                                    {/* Prompt Contents - Support multiple prompts */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-bold text-[var(--text-primary)]">
                                                {language === 'vi' ? 'Nội dung Prompt' : 'Prompt Content'}
                                            </h3>
                                            <button
                                                onClick={handleCopyPrompt}
                                                disabled={!isAuthenticated}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                                    copied
                                                        ? 'bg-green-500 text-white'
                                                        : 'bg-[var(--accent-primary)] text-black hover:opacity-90'
                                                } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {copied ? (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        {language === 'vi' ? 'Đã sao chép!' : 'Copied!'}
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                        </svg>
                                                        {language === 'vi' ? 'Sao chép tất cả' : 'Copy All'}
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Multiple Prompts */}
                                        {prompt.promptContents && prompt.promptContents.length > 0 ? (
                                            <div className="space-y-4">
                                                {prompt.promptContents.map((p, index) => (
                                                    <div key={index} className="relative">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded text-xs font-bold">
                                                                Prompt {index + 1}
                                                            </span>
                                                            {p.label && (
                                                                <span className="text-sm text-[var(--text-secondary)]">
                                                                    {p.label}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={async () => {
                                                                    await navigator.clipboard.writeText(p.content);
                                                                    setCopied(true);
                                                                    setTimeout(() => setCopied(false), 2000);
                                                                }}
                                                                className="ml-auto text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
                                                            >
                                                                {language === 'vi' ? 'Sao chép' : 'Copy'}
                                                            </button>
                                                        </div>
                                                        <pre className="bg-black/30 p-4 rounded-lg text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words font-mono border border-[var(--border-primary)]">
                                                            {p.content}
                                                        </pre>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : prompt.promptContent ? (
                                            // Legacy single prompt
                                            <pre className="bg-black/30 p-4 rounded-lg text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words font-mono border border-[var(--border-primary)]">
                                                {prompt.promptContent}
                                            </pre>
                                        ) : null}
                                    </div>

                                    {/* Notes */}
                                    {prompt.notes && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-2">
                                                {language === 'vi' ? 'Ghi chú' : 'Notes'}
                                            </h3>
                                            <div className="bg-[var(--bg-secondary)] p-4 rounded-lg text-sm text-[var(--text-primary)] opacity-90 whitespace-pre-wrap border border-[var(--border-primary)]">
                                                {prompt.notes}
                                            </div>
                                        </div>
                                    )}

                                    {/* Example Images */}
                                    {prompt.exampleImages && prompt.exampleImages.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-3">
                                                {language === 'vi' ? 'Hình ảnh minh họa' : 'Example Images'}
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {prompt.exampleImages.map((img, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative cursor-pointer group"
                                                        onClick={() => {
                                                            setLightboxIndex(index);
                                                            setLightboxOpen(true);
                                                        }}
                                                    >
                                                        <img
                                                            src={img.url}
                                                            alt={img.caption || `Example ${index + 1}`}
                                                            className="w-full h-40 object-cover rounded-lg transition-transform group-hover:scale-[1.02]"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                            </svg>
                                                        </div>
                                                        <span className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            img.type === 'input' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                                                        }`}>
                                                            {img.type === 'input' ? 'Input' : 'Output'}
                                                        </span>
                                                        {img.caption && (
                                                            <p className="text-xs text-[var(--text-tertiary)] mt-1">{img.caption}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Image Lightbox */}
                                            <ImageLightbox
                                                images={prompt.exampleImages.map(img => ({
                                                    url: img.url,
                                                    caption: img.caption,
                                                    type: img.type
                                                }))}
                                                initialIndex={lightboxIndex}
                                                isOpen={lightboxOpen}
                                                onClose={() => setLightboxOpen(false)}
                                            />
                                        </div>
                                    )}

                                    {/* Tags */}
                                    {prompt.tags && prompt.tags.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="font-bold text-[var(--text-primary)] mb-2">Tags</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {prompt.tags.map((tag) => (
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

                                    {/* Rating */}
                                    <div className="mb-6">
                                        <h3 className="font-bold text-[var(--text-primary)] mb-2">
                                            {language === 'vi' ? 'Đánh giá' : 'Rating'}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <RatingStars
                                                rating={prompt.rating.average}
                                                count={prompt.rating.count}
                                                size="lg"
                                                interactive={isAuthenticated}
                                                userRating={prompt.userRating}
                                                onRate={handleRate}
                                            />
                                            <span className="text-lg font-bold text-[var(--text-primary)]">
                                                {prompt.rating.average.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <CommentSection
                                    targetType="prompt"
                                    targetId={prompt._id}
                                    commentsCount={prompt.commentsCount}
                                />
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer Actions */}
                {prompt && (
                    <div className="p-4 border-t border-[var(--border-primary)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LikeButton
                                isLiked={prompt.isLiked || false}
                                likesCount={prompt.likesCount}
                                onToggle={handleLike}
                                disabled={!isAuthenticated}
                            />
                            <BookmarkButton
                                isBookmarked={prompt.isBookmarked || false}
                                bookmarksCount={prompt.bookmarksCount}
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

export default PromptDetailModal;
