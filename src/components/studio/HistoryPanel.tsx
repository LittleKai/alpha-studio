import React from 'react';
import { useTranslation } from '../../i18n/context';
import type { GeneratedContent } from '../../types';

interface HistoryItem {
  id: string;
  timestamp: Date;
  transformationKey: string;
  result: GeneratedContent;
  inputImageUrl: string;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onSelectItem,
  onClearHistory,
  isOpen,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-40 p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-l-lg hover:bg-[var(--bg-tertiary)] transition-colors shadow-lg"
        style={{ display: isOpen ? 'none' : 'block' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('studio.history')}
            </h3>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors"
                  title={t('studio.clearHistory')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={onToggle}
                className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--text-tertiary)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[var(--text-tertiary)]">
                  {t('studio.noHistory')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onSelectItem(item)}
                    className="group relative bg-[var(--bg-secondary)] rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--accent-primary)] transition-all"
                  >
                    <div className="flex gap-3 p-2">
                      {/* Input Thumbnail */}
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={item.inputImageUrl}
                          alt="Input"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Arrow */}
                      <div className="flex items-center text-[var(--text-tertiary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                      {/* Result Thumbnail */}
                      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        {item.result.imageUrl ? (
                          <img
                            src={item.result.imageUrl}
                            alt="Result"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                            <span className="text-xs text-[var(--text-tertiary)]">N/A</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Metadata */}
                    <div className="px-2 pb-2">
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {item.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default HistoryPanel;
export type { HistoryItem };
