import React, { useState } from 'react';

interface RatingStarsProps {
    rating: number;
    count?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    userRating?: number | null;
    onRate?: (score: number) => void;
    showCount?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    count = 0,
    size = 'md',
    interactive = false,
    userRating = null,
    onRate,
    showCount = true
}) => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const sizeClasses = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    const displayRating = hoverRating ?? userRating ?? rating;

    const renderStar = (index: number) => {
        // Use Math.floor for display rating to show exact stars (3 = 3 full stars, not 3.5)
        const flooredRating = Math.floor(displayRating);
        const filled = index < flooredRating;
        // Only show half star if the decimal is >= 0.5 (e.g., 3.5 shows half, 3.2 shows empty)
        const hasHalf = displayRating - flooredRating >= 0.5;
        const halfFilled = !filled && index === flooredRating && hasHalf;

        return (
            <button
                key={index}
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onRate?.(index + 1)}
                onMouseEnter={() => interactive && setHoverRating(index + 1)}
                onMouseLeave={() => interactive && setHoverRating(null)}
                className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform focus:outline-none`}
            >
                <svg
                    className={`${sizeClasses[size]} ${filled || halfFilled ? 'text-yellow-400' : 'text-gray-500'}`}
                    fill={filled ? 'currentColor' : halfFilled ? 'url(#half)' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <defs>
                        <linearGradient id="half">
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                </svg>
            </button>
        );
    };

    return (
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
                {[0, 1, 2, 3, 4].map(renderStar)}
            </div>
            {showCount && count > 0 && (
                <span className="text-xs text-[var(--text-tertiary)] ml-1">
                    ({count})
                </span>
            )}
            {interactive && userRating && (
                <span className="text-xs text-yellow-400 ml-2">
                    Your rating: {userRating}
                </span>
            )}
        </div>
    );
};

export default RatingStars;
