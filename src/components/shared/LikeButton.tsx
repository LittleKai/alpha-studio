import React, { useState } from 'react';

interface LikeButtonProps {
    isLiked: boolean;
    likesCount: number;
    onToggle: () => Promise<void>;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
    isLiked,
    likesCount,
    onToggle,
    size = 'md',
    showCount = true,
    disabled = false
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [localIsLiked, setLocalIsLiked] = useState(isLiked);
    const [localCount, setLocalCount] = useState(likesCount);

    // Sync with props when they change
    React.useEffect(() => {
        setLocalIsLiked(isLiked);
        setLocalCount(likesCount);
    }, [isLiked, likesCount]);

    const handleClick = async () => {
        if (isLoading || disabled) return;

        setIsLoading(true);
        // Optimistic update
        setLocalIsLiked(!localIsLiked);
        setLocalCount(prev => localIsLiked ? prev - 1 : prev + 1);

        try {
            await onToggle();
        } catch (error) {
            // Revert on error
            setLocalIsLiked(localIsLiked);
            setLocalCount(likesCount);
            console.error('Failed to toggle like:', error);
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
                localIsLiked
                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/10'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isLoading ? 'animate-pulse' : ''}`}
            title={localIsLiked ? 'Unlike' : 'Like'}
        >
            <svg
                className={`${sizeClasses[size]} transition-transform ${localIsLiked ? 'scale-110' : ''}`}
                fill={localIsLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            {showCount && (
                <span className="text-xs font-medium">{localCount}</span>
            )}
        </button>
    );
};

export default LikeButton;
