import React, { useState } from 'react';

interface BookmarkButtonProps {
    isBookmarked: boolean;
    bookmarksCount?: number;
    onToggle: () => Promise<void>;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    disabled?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({
    isBookmarked,
    bookmarksCount = 0,
    onToggle,
    size = 'md',
    showCount = false,
    disabled = false
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [localIsBookmarked, setLocalIsBookmarked] = useState(isBookmarked);
    const [localCount, setLocalCount] = useState(bookmarksCount);

    // Sync with props when they change
    React.useEffect(() => {
        setLocalIsBookmarked(isBookmarked);
        setLocalCount(bookmarksCount);
    }, [isBookmarked, bookmarksCount]);

    const handleClick = async () => {
        if (isLoading || disabled) return;

        setIsLoading(true);
        // Optimistic update
        setLocalIsBookmarked(!localIsBookmarked);
        setLocalCount(prev => localIsBookmarked ? prev - 1 : prev + 1);

        try {
            await onToggle();
        } catch (error) {
            // Revert on error
            setLocalIsBookmarked(localIsBookmarked);
            setLocalCount(bookmarksCount);
            console.error('Failed to toggle bookmark:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    const buttonSizeClasses = {
        sm: 'p-1',
        md: 'p-1.5',
        lg: 'p-2'
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isLoading || disabled}
            className={`${buttonSizeClasses[size]} rounded-lg flex items-center gap-1.5 transition-all ${
                localIsBookmarked
                    ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-blue-400 hover:bg-blue-500/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isLoading ? 'animate-pulse' : ''}`}
            title={localIsBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
            <svg
                className={`${sizeClasses[size]} transition-transform ${localIsBookmarked ? 'scale-110' : ''}`}
                fill={localIsBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
            </svg>
            {showCount && localCount > 0 && (
                <span className="text-xs font-medium">{localCount}</span>
            )}
        </button>
    );
};

export default BookmarkButton;
