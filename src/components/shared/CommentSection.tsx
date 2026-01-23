import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import {
    getComments,
    getReplies,
    createComment,
    updateComment,
    deleteComment,
    toggleCommentLike,
    flagComment,
    Comment
} from '../../services/commentService';

interface CommentSectionProps {
    targetType: 'prompt' | 'resource';
    targetId: string;
    commentsCount?: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({
    targetType,
    targetId,
    commentsCount = 0
}) => {
    const { language } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [replies, setReplies] = useState<Record<string, Comment[]>>({});
    const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState(commentsCount);

    const fetchComments = useCallback(async (pageNum: number = 1) => {
        try {
            setIsLoading(true);
            const response = await getComments(targetType, targetId, { page: pageNum, limit: 10 });

            if (pageNum === 1) {
                setComments(response.data);
            } else {
                setComments(prev => [...prev, ...response.data]);
            }

            setTotalCount(response.pagination.total);
            setHasMore(response.pagination.page < response.pagination.pages);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load comments');
        } finally {
            setIsLoading(false);
        }
    }, [targetType, targetId]);

    useEffect(() => {
        fetchComments(1);
    }, [fetchComments]);

    const loadMoreComments = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchComments(nextPage);
    };

    const loadReplies = async (commentId: string) => {
        if (loadingReplies.has(commentId)) return;

        setLoadingReplies(prev => new Set(prev).add(commentId));
        try {
            const response = await getReplies(commentId);
            setReplies(prev => ({ ...prev, [commentId]: response.data }));
            setExpandedReplies(prev => new Set(prev).add(commentId));
        } catch (err) {
            console.error('Failed to load replies:', err);
        } finally {
            setLoadingReplies(prev => {
                const newSet = new Set(prev);
                newSet.delete(commentId);
                return newSet;
            });
        }
    };

    const toggleReplies = (commentId: string) => {
        if (expandedReplies.has(commentId)) {
            setExpandedReplies(prev => {
                const newSet = new Set(prev);
                newSet.delete(commentId);
                return newSet;
            });
        } else {
            loadReplies(commentId);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting || !isAuthenticated) return;

        setIsSubmitting(true);
        try {
            const response = await createComment(targetType, targetId, newComment.trim());
            setComments(prev => [response.data, ...prev]);
            setNewComment('');
            setTotalCount(prev => prev + 1);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to post comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReply = async (parentId: string) => {
        if (!replyContent.trim() || isSubmitting || !isAuthenticated) return;

        setIsSubmitting(true);
        try {
            const response = await createComment(targetType, targetId, replyContent.trim(), parentId);
            setReplies(prev => ({
                ...prev,
                [parentId]: [...(prev[parentId] || []), response.data]
            }));
            setReplyContent('');
            setReplyingTo(null);
            setExpandedReplies(prev => new Set(prev).add(parentId));

            // Update reply count in parent comment
            setComments(prev => prev.map(c =>
                c._id === parentId
                    ? { ...c, repliesCount: (c.repliesCount || 0) + 1 }
                    : c
            ));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to post reply');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateComment = async (commentId: string) => {
        if (!editContent.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await updateComment(commentId, editContent.trim());
            setComments(prev => prev.map(c => c._id === commentId ? response.data : c));

            // Also update in replies if it's a reply
            Object.keys(replies).forEach(parentId => {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId]?.map(r => r._id === commentId ? response.data : r) || []
                }));
            });

            setEditingId(null);
            setEditContent('');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update comment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string, parentId?: string) => {
        if (!confirm(language === 'vi' ? 'Bạn có chắc muốn xóa bình luận này?' : 'Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await deleteComment(commentId);

            if (parentId) {
                // It's a reply
                setReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId]?.filter(r => r._id !== commentId) || []
                }));
                setComments(prev => prev.map(c =>
                    c._id === parentId
                        ? { ...c, repliesCount: Math.max(0, (c.repliesCount || 0) - 1) }
                        : c
                ));
            } else {
                // It's a top-level comment
                setComments(prev => prev.filter(c => c._id !== commentId));
                setTotalCount(prev => prev - 1);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete comment');
        }
    };

    const handleLikeComment = async (commentId: string, parentId?: string) => {
        if (!isAuthenticated) return;

        try {
            const response = await toggleCommentLike(commentId);
            const updateLikes = (comment: Comment): Comment => {
                if (comment._id === commentId) {
                    return {
                        ...comment,
                        likesCount: response.data.likesCount,
                        likes: response.data.liked
                            ? [...comment.likes, user!._id]
                            : comment.likes.filter(id => id !== user!._id)
                    };
                }
                return comment;
            };

            if (parentId) {
                setReplies(prev => ({
                    ...prev,
                    [parentId]: prev[parentId]?.map(updateLikes) || []
                }));
            } else {
                setComments(prev => prev.map(updateLikes));
            }
        } catch (err) {
            console.error('Failed to like comment:', err);
        }
    };

    const handleFlagComment = async (commentId: string) => {
        if (!confirm(language === 'vi' ? 'Báo cáo bình luận này vi phạm?' : 'Report this comment as inappropriate?')) {
            return;
        }

        try {
            await flagComment(commentId);
            alert(language === 'vi' ? 'Đã báo cáo bình luận' : 'Comment reported');
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to report comment');
        }
    };

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return language === 'vi' ? 'Vừa xong' : 'Just now';
        if (diffMins < 60) return language === 'vi' ? `${diffMins} phút trước` : `${diffMins}m ago`;
        if (diffHours < 24) return language === 'vi' ? `${diffHours} giờ trước` : `${diffHours}h ago`;
        if (diffDays < 30) return language === 'vi' ? `${diffDays} ngày trước` : `${diffDays}d ago`;
        return date.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US');
    };

    const renderComment = (comment: Comment, isReply: boolean = false, parentId?: string) => {
        const isOwner = user && comment.author._id === user._id;
        const isLiked = user && comment.likes.includes(user._id);
        const isEditing = editingId === comment._id;

        return (
            <div key={comment._id} className={`${isReply ? 'ml-8 mt-3' : 'py-4 border-b border-[var(--border-primary)]'}`}>
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {comment.author.avatar ? (
                            <img src={comment.author.avatar} alt={comment.author.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            comment.author.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[var(--text-primary)] text-sm">
                                {comment.author.name}
                            </span>
                            <span className="text-xs text-[var(--text-tertiary)]">
                                {formatTimeAgo(comment.createdAt)}
                            </span>
                            {comment.isEdited && (
                                <span className="text-xs text-[var(--text-tertiary)] italic">
                                    ({language === 'vi' ? 'đã sửa' : 'edited'})
                                </span>
                            )}
                        </div>

                        {isEditing ? (
                            <div className="mt-2">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                                    rows={3}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleUpdateComment(comment._id)}
                                        disabled={isSubmitting}
                                        className="px-3 py-1 bg-[var(--accent-primary)] text-black rounded text-xs font-bold hover:opacity-90"
                                    >
                                        {language === 'vi' ? 'Lưu' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => { setEditingId(null); setEditContent(''); }}
                                        className="px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
                                    >
                                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-[var(--text-primary)] mt-1 whitespace-pre-wrap break-words">
                                    {comment.content}
                                </p>

                                <div className="flex items-center gap-4 mt-2">
                                    <button
                                        onClick={() => handleLikeComment(comment._id, parentId)}
                                        disabled={!isAuthenticated}
                                        className={`flex items-center gap-1 text-xs transition-colors ${
                                            isLiked ? 'text-red-500' : 'text-[var(--text-tertiary)] hover:text-red-400'
                                        } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {comment.likesCount > 0 && comment.likesCount}
                                    </button>

                                    {!isReply && isAuthenticated && (
                                        <button
                                            onClick={() => { setReplyingTo(comment._id); setReplyContent(''); }}
                                            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
                                        >
                                            {language === 'vi' ? 'Trả lời' : 'Reply'}
                                        </button>
                                    )}

                                    {isOwner && (
                                        <>
                                            <button
                                                onClick={() => { setEditingId(comment._id); setEditContent(comment.content); }}
                                                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
                                            >
                                                {language === 'vi' ? 'Sửa' : 'Edit'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComment(comment._id, parentId)}
                                                className="text-xs text-[var(--text-tertiary)] hover:text-red-400"
                                            >
                                                {language === 'vi' ? 'Xóa' : 'Delete'}
                                            </button>
                                        </>
                                    )}

                                    {!isOwner && isAuthenticated && (
                                        <button
                                            onClick={() => handleFlagComment(comment._id)}
                                            className="text-xs text-[var(--text-tertiary)] hover:text-yellow-400"
                                            title={language === 'vi' ? 'Báo cáo' : 'Report'}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Reply form */}
                        {replyingTo === comment._id && (
                            <div className="mt-3 pl-3 border-l-2 border-[var(--border-primary)]">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={language === 'vi' ? 'Viết trả lời...' : 'Write a reply...'}
                                    className="w-full p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                                    rows={2}
                                />
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => handleSubmitReply(comment._id)}
                                        disabled={isSubmitting || !replyContent.trim()}
                                        className="px-3 py-1 bg-[var(--accent-primary)] text-black rounded text-xs font-bold hover:opacity-90 disabled:opacity-50"
                                    >
                                        {language === 'vi' ? 'Gửi' : 'Reply'}
                                    </button>
                                    <button
                                        onClick={() => { setReplyingTo(null); setReplyContent(''); }}
                                        className="px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs"
                                    >
                                        {language === 'vi' ? 'Hủy' : 'Cancel'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Replies */}
                        {!isReply && (comment.repliesCount || 0) > 0 && (
                            <button
                                onClick={() => toggleReplies(comment._id)}
                                className="mt-2 text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1"
                            >
                                {loadingReplies.has(comment._id) ? (
                                    <span className="w-3 h-3 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                                ) : (
                                    <svg className={`w-3 h-3 transition-transform ${expandedReplies.has(comment._id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                                {expandedReplies.has(comment._id)
                                    ? (language === 'vi' ? 'Ẩn trả lời' : 'Hide replies')
                                    : (language === 'vi' ? `Xem ${comment.repliesCount} trả lời` : `View ${comment.repliesCount} replies`)
                                }
                            </button>
                        )}

                        {expandedReplies.has(comment._id) && replies[comment._id]?.map(reply =>
                            renderComment(reply, true, comment._id)
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {language === 'vi' ? 'Bình luận' : 'Comments'} ({totalCount})
            </h3>

            {/* New comment form */}
            {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className="space-y-3">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={language === 'vi' ? 'Viết bình luận...' : 'Write a comment...'}
                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] resize-none focus:outline-none focus:border-[var(--accent-primary)]"
                        rows={3}
                        maxLength={2000}
                    />
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-[var(--text-tertiary)]">
                            {newComment.length}/2000
                        </span>
                        <button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            className="px-4 py-2 bg-[var(--accent-primary)] text-black rounded-lg font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isSubmitting
                                ? (language === 'vi' ? 'Đang gửi...' : 'Posting...')
                                : (language === 'vi' ? 'Gửi bình luận' : 'Post Comment')
                            }
                        </button>
                    </div>
                </form>
            ) : (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-4 bg-[var(--bg-secondary)] rounded-lg">
                    {language === 'vi' ? 'Đăng nhập để bình luận' : 'Log in to comment'}
                </p>
            )}

            {/* Comments list */}
            {isLoading && comments.length === 0 ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                </div>
            ) : error ? (
                <p className="text-sm text-red-400 text-center py-4">{error}</p>
            ) : comments.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-8">
                    {language === 'vi' ? 'Chưa có bình luận nào' : 'No comments yet'}
                </p>
            ) : (
                <>
                    <div className="divide-y divide-[var(--border-primary)]">
                        {comments.map(comment => renderComment(comment))}
                    </div>

                    {hasMore && (
                        <button
                            onClick={loadMoreComments}
                            disabled={isLoading}
                            className="w-full py-2 text-sm text-[var(--accent-primary)] hover:underline disabled:opacity-50"
                        >
                            {isLoading
                                ? (language === 'vi' ? 'Đang tải...' : 'Loading...')
                                : (language === 'vi' ? 'Xem thêm bình luận' : 'Load more comments')
                            }
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default CommentSection;
