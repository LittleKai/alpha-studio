import React from 'react';
import { useTranslation } from '../../i18n/context';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-lg p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-center" role="alert">
      <p className="font-bold mb-1">Error</p>
      <p className="text-sm mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
        >
          {t('app.regenerate')}
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
