import React, { useState, useCallback } from 'react';
import { TRANSFORMATIONS } from '../../constants';
import { editImage } from '../../services/geminiService';
import type { GeneratedContent, Transformation } from '../../types';
import TransformationSelector from './TransformationSelector';
import ResultDisplay from './ResultDisplay';
import ImageEditorCanvas from './ImageEditorCanvas';
import { downloadImage } from '../../utils/fileUtils';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import { useTranslation } from '../../i18n/context';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';

interface StudioToolProps {
  onBack: () => void;
}

export default function StudioTool({ onBack }: StudioToolProps) {
  const { t } = useTranslation();

  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const handlePrimaryImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPrimaryImageUrl(dataUrl);
      setGeneratedContent(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTransformationSelect = useCallback((transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!selectedTransformation || !primaryImageUrl) {
      setError(t('app.error.uploadAndSelect'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const promptToUse = selectedTransformation.prompt;
      const imageParts = [{
        base64: primaryImageUrl.split(',')[1],
        mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
      }];

      const result = await editImage(promptToUse, imageParts, selectedTransformation.hasMask ? maskDataUrl : null);

      const finalResult = {
        ...result,
        originalImageUrl: primaryImageUrl,
        text: promptToUse
      };

      setGeneratedContent(finalResult);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : t('app.error.generic'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTransformation, primaryImageUrl, maskDataUrl, t]);

  const handleDownload = useCallback(() => {
    if (generatedContent?.imageUrl) {
      downloadImage(generatedContent.imageUrl, `alpha-studio-${Date.now()}.png`);
    }
  }, [generatedContent]);

  const handleClear = useCallback(() => {
    setGeneratedContent(null);
    setError(null);
  }, []);

  const handleUseAsInput = useCallback(() => {
    if (generatedContent?.imageUrl) {
      setPrimaryImageUrl(generatedContent.imageUrl);
      setGeneratedContent(null);
    }
  }, [generatedContent]);

  const handleClearImage = useCallback(() => {
    setPrimaryImageUrl(null);
    setGeneratedContent(null);
    setMaskDataUrl(null);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--bg-card-alpha)] backdrop-blur-md border-b border-[var(--border-primary)]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
              <span className="text-xl font-bold">Studio</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">{t('studio.uploadImage')}</h2>

              {!primaryImageUrl ? (
                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-[var(--border-primary)] rounded-xl cursor-pointer hover:border-[var(--accent-primary)] transition-colors bg-[var(--bg-secondary)]">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-4 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-[var(--text-secondary)]">
                      <span className="font-semibold">{t('studio.clickToUpload')}</span>
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">PNG, JPG, WEBP</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handlePrimaryImageSelect} />
                </label>
              ) : (
                <div className="relative">
                  <ImageEditorCanvas
                    imageUrl={primaryImageUrl}
                    onMaskChange={setMaskDataUrl}
                    maskEnabled={selectedTransformation?.hasMask ?? false}
                  />
                  <button
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Transformation Selector */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
              <TransformationSelector
                selectedTransformation={selectedTransformation}
                onSelect={handleTransformationSelect}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!primaryImageUrl || !selectedTransformation || isLoading}
              className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg shadow-[var(--accent-shadow)]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {t('studio.generating')}
                </span>
              ) : (
                t('studio.generate')
              )}
            </button>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">{t('studio.result')}</h2>
              <ResultDisplay
                result={generatedContent}
                isLoading={isLoading}
                error={error}
                onDownload={handleDownload}
                onClear={handleClear}
                onUseAsInput={handleUseAsInput}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <ImagePreviewModal
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}
    </div>
  );
}
