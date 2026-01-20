import React, { useState, useRef, useEffect } from 'react';
import type { GeneratedContent } from '../../types';
import { useTranslation } from '../../i18n/context';

interface ResultDisplayProps {
  content: GeneratedContent;
  onUseImageAsInput: (imageUrl: string) => void;
  onImageClick: (imageUrl: string) => void;
  onSaveToWorkflow?: (imageUrl: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  content,
  onUseImageAsInput,
  onImageClick,
  onSaveToWorkflow
}) => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'result' | 'slider'>('result');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPosition((x / rect.width) * 100);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleDownload = () => {
    if (!content.imageUrl) return;
    const link = document.createElement('a');
    link.href = content.imageUrl;
    link.download = `alpha-studio-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const ActionButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    isPrimary?: boolean;
  }> = ({ onClick, children, isPrimary }) => (
    <button
      onClick={onClick}
      className={`flex-1 py-3 px-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
        isPrimary
          ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-black'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      {/* Image Preview */}
      <div className="w-full aspect-square bg-black rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative">
        {viewMode === 'result' ? (
          <img
            src={content.imageUrl!}
            alt="Result"
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => onImageClick(content.imageUrl!)}
          />
        ) : (
          <div
            ref={sliderContainerRef}
            className="w-full h-full relative cursor-ew-resize select-none"
            onMouseDown={() => setIsDragging(true)}
          >
            <img
              src={content.originalImageUrl!}
              alt="Original"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src={content.imageUrl!}
                alt="Result"
                className="w-full h-full object-contain"
              />
            </div>
            <div
              className="absolute top-0 bottom-0 w-1 bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(249,115,22,0.5)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center text-black font-bold">
                ↔
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {/* View Mode Toggle */}
        {content.originalImageUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('result')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                viewMode === 'result'
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black'
                  : 'border-white/10 text-gray-500'
              }`}
            >
              {t('resultDisplay.resultView')}
            </button>
            <button
              onClick={() => setViewMode('slider')}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${
                viewMode === 'slider'
                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black'
                  : 'border-white/10 text-gray-500'
              }`}
            >
              {t('resultDisplay.compareView')}
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <ActionButton onClick={handleDownload}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{t('resultDisplay.actions.download')}</span>
          </ActionButton>
          {onSaveToWorkflow && (
            <ActionButton onClick={() => onSaveToWorkflow(content.imageUrl!)} isPrimary>
              <span>{t('resultDisplay.actions.saveToWorkflow')}</span>
            </ActionButton>
          )}
        </div>

        <ActionButton onClick={() => onUseImageAsInput(content.imageUrl!)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{t('resultDisplay.actions.useAsInput')}</span>
        </ActionButton>
      </div>
    </div>
  );
};

export default ResultDisplay;
