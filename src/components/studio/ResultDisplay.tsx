import React from 'react';
import { useTranslation } from '../../i18n/context';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import type { GeneratedContent } from '../../types';

interface ResultDisplayProps {
  result: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  onDownload: () => void;
  onClear: () => void;
  onUseAsInput: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  isLoading,
  error,
  onDownload,
  onClear,
  onUseAsInput,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="w-full aspect-square bg-[var(--bg-secondary)] rounded-xl flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-[var(--text-secondary)] animate-pulse">{t('studio.generating')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full aspect-square bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center p-6">
        <ErrorMessage message={error} onRetry={onClear} />
      </div>
    );
  }

  if (!result || !result.imageUrl) {
    return (
      <div className="w-full aspect-square bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center border-2 border-dashed border-[var(--border-primary)]">
        <div className="text-center text-[var(--text-tertiary)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm">{t('studio.resultPlaceholder')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full bg-[var(--bg-secondary)] rounded-xl overflow-hidden group">
        <img
          src={result.imageUrl}
          alt="Generated result"
          className="w-full h-auto object-contain"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={onDownload}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            title={t('studio.download')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={onUseAsInput}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            title={t('studio.useAsInput')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-secondary)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {t('studio.download')}
        </button>
        <button
          onClick={onUseAsInput}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border-primary)]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('studio.useAsInput')}
        </button>
      </div>

      {result.text && (
        <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
          <p className="text-sm text-[var(--text-secondary)]">{result.text}</p>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
