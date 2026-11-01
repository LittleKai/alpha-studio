import React from 'react';
import { useTranslation } from '../../i18n/context';

interface PageLoaderProps {
    /** Full viewport height for pages rendered without the shared Layout. */
    fullScreen?: boolean;
}

/** Route-level loading state. Inside Layout it only fills the content area so the header stays visible. */
const PageLoader: React.FC<PageLoaderProps> = ({ fullScreen = false }) => {
    const { t } = useTranslation();
    return (
        <div
            role="status"
            aria-live="polite"
            className={`${fullScreen ? 'min-h-screen bg-[var(--bg-primary)]' : 'min-h-[60vh]'} flex items-center justify-center`}
        >
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin motion-reduce:animate-none" />
                <p className="text-sm text-[var(--text-secondary)]">{t('common.loading')}</p>
            </div>
        </div>
    );
};

export default PageLoader;
