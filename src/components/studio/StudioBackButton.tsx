import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/context';

export interface StudioBackButtonProps {
    to?: string;
    label?: string;
    className?: string;
    variant?: 'floating' | 'inline';
    onClick?: () => void;
}

/**
 * Standardized Back button across all Studio tool pages (/studio/*).
 * Defaults to returning to /studio with consistent styling, SVG arrow,
 * theme variables, and hover/active states on both mobile and desktop.
 */
export const StudioBackButton: React.FC<StudioBackButtonProps> = ({
    to = '/studio',
    label,
    className = '',
    variant = 'floating',
    onClick,
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const text = label || t('studio.hub.backToStudio');

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else {
            navigate(to);
        }
    };

    const baseStyles = variant === 'floating'
        ? 'fixed top-20 left-4 z-40 inline-flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border-primary)] rounded-full shadow-lg text-xs md:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] hover:scale-105 active:scale-95 transition-all cursor-pointer select-none'
        : 'inline-flex items-center gap-2 px-3.5 py-1.5 md:px-4 md:py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl shadow-sm text-xs md:text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer select-none';

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={text}
            className={`${baseStyles} ${className}`.trim()}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="truncate">{text}</span>
        </button>
    );
};

export default StudioBackButton;
