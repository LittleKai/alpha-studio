import { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { LikeButton, RatingStars } from '../shared';
import {
    likeLibraryItem, rateLibraryItem,
    type EventLibraryItem, type LibraryReview
} from '../../services/eventLibraryService';
import { cdnFromUrl } from '../../services/cloudinaryAssets';

const ACCENT = '#7c5cff';

function formatWhen(iso: string, language: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

/** Một review đã đăng: sao + nhận xét + người viết. */
function ReviewRow({ review, language }: { review: LibraryReview; language: string }) {
    return (
        <div className="py-3 border-b border-[var(--border-primary)] last:border-b-0">
            <div className="flex items-center gap-2 mb-1.5">
                {review.author.avatar
                    ? <img src={cdnFromUrl(review.author.avatar, 'w_128')} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    : (
                        <span
                            className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: ACCENT }}
                        >
                            {(review.author.name || '?').charAt(0).toUpperCase()}
                        </span>
                    )}
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {review.author.name}
                </span>
                <span className="text-xs shrink-0 text-amber-500">
                    {'★'.repeat(review.score)}
                    <span className="text-[var(--text-tertiary)]">{'★'.repeat(5 - review.score)}</span>
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)] ml-auto shrink-0">
                    {formatWhen(review.createdAt, language)}
                </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{review.comment}</p>
        </div>
    );
}

/**
 * Khối tương tác dưới panel Phân loại: thích + đánh giá.
 *
 * KHÔNG có khối bình luận riêng — nhận xét đi kèm chính phiếu chấm, nên mỗi
 * người để lại đúng một review và sửa nó bằng cách chấm lại.
 */
export default function LibraryEngagement({
    item,
    initialLiked,
    initialScore,
    initialComment,
    initialReviews,
}: {
    item: EventLibraryItem;
    initialLiked: boolean;
    initialScore: number;
    initialComment: string;
    initialReviews: LibraryReview[];
}) {
    const { t, language } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const [liked, setLiked] = useState(initialLiked);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);
    const [rating, setRating] = useState(item.rating || { average: 0, count: 0 });
    const [myScore, setMyScore] = useState(initialScore);
    const [draft, setDraft] = useState(initialComment);
    const [reviews, setReviews] = useState<LibraryReview[]>(initialReviews);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const handleLike = async () => {
        if (!isAuthenticated) {
            setError(t('eventLibrary.engagement.loginRequired'));
            return;
        }
        setError('');
        try {
            const res = await likeLibraryItem(item.slug);
            setLiked(res.liked);
            setLikesCount(res.likesCount);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('eventLibrary.engagement.failed'));
        }
    };

    const submit = async (score: number, comment: string) => {
        if (!isAuthenticated) {
            setError(t('eventLibrary.engagement.loginRequired'));
            return;
        }
        setError('');
        setSaving(true);
        const previous = myScore;
        setMyScore(score);
        try {
            const res = await rateLibraryItem(item.slug, score, comment);
            setRating(res.rating);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);

            // Cập nhật review của chính mình tại chỗ — khỏi tải lại trang
            const trimmed = comment.trim();
            const mine: LibraryReview | null = trimmed ? {
                score,
                comment: trimmed,
                createdAt: new Date().toISOString(),
                author: { _id: user?._id || '', name: user?.name || '', avatar: user?.avatar || '' }
            } : null;
            setReviews(prev => {
                const others = prev.filter(r => r.author._id !== (user?._id || ''));
                return mine ? [mine, ...others] : others;
            });
        } catch (err) {
            setMyScore(previous);
            setError(err instanceof Error ? err.message : t('eventLibrary.engagement.failed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2 text-pink-600 dark:text-pink-400">
                <span className="w-1.5 h-4 rounded-full bg-pink-500" />
                {t('eventLibrary.engagement.title')}
            </h2>

            <div className="flex items-center justify-between gap-3">
                <LikeButton isLiked={liked} likesCount={likesCount} onToggle={handleLike} size="sm" />
                <span className="text-xs text-[var(--text-tertiary)]">
                    {item.stats.views} {t('eventLibrary.metrics.views')}
                </span>
            </div>

            {/* Chấm điểm và nhận xét là một hành động, không tách rời */}
            <div className="space-y-2 pt-3 border-t border-[var(--border-primary)]">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    {myScore > 0 ? t('eventLibrary.engagement.editReview') : t('eventLibrary.engagement.rate')}
                </p>
                <RatingStars
                    rating={rating.average}
                    count={rating.count}
                    userRating={myScore || null}
                    interactive
                    onRate={score => submit(score, draft)}
                    size="sm"
                    showCount
                />
                <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder={t('eventLibrary.engagement.commentPlaceholder')}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[var(--text-tertiary)]">
                        {myScore < 1 ? t('eventLibrary.engagement.pickStarsFirst') : ''}
                    </span>
                    <button
                        onClick={() => submit(myScore, draft)}
                        disabled={saving || myScore < 1}
                        style={{ backgroundColor: ACCENT }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? t('eventLibrary.engagement.saving')
                            : saved
                                ? t('eventLibrary.engagement.saved')
                                : t('eventLibrary.engagement.submit')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-500">
                    {error}
                </div>
            )}

            {reviews.length > 0 && (
                <div className="pt-2 border-t border-[var(--border-primary)]">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1">
                        {t('eventLibrary.engagement.reviews').replace('{count}', String(reviews.length))}
                    </p>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {reviews.map((review, idx) => (
                            <ReviewRow key={`${review.author._id}-${idx}`} review={review} language={language} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
