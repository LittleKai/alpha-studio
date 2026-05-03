/**
 * AI Studio — Edit tab
 *
 * Gemini-SDK-based image editor. Restores the old transformation-driven
 * workflow (mask, multi-image, storyboard, two-step, preset) that the
 * Flow pipeline can't do. Uses /api/studio/use (legacy 3/day quota).
 */
import { useCallback, useEffect, useState } from 'react';
import { editImage, STUDIO_MODELS } from '../../services/geminiService';
import type { StudioModel } from '../../services/geminiService';
import type { GeneratedContent, Transformation } from '../../types';
import { TRANSFORMATIONS } from '../../constants';
import TransformationSelector from './TransformationSelector';
import ResultDisplay from './ResultDisplay';
import ImageEditorCanvas from './ImageEditorCanvas';
import HistoryPanel from './HistoryPanel';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import UploaderBox from '../upload/UploaderBox';
import MultiImageUploader from '../upload/MultiImageUploader';
import MultiImageGridUploader from '../upload/MultiImageGridUploader';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';
import { consumeStudioUse, getStudioUsage } from '../../services/studioService';
import type { StudioUsage } from '../../services/studioService';

interface StudioGeminiEditProps {
  onRequireLogin: () => void;
}

type AppState = 'selecting' | 'configuring' | 'result';

export default function StudioGeminiEdit({ onRequireLogin }: StudioGeminiEditProps) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isAdminOrMod = user?.role === 'admin' || user?.role === 'mod';

  const [usage, setUsage] = useState<StudioUsage | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<StudioModel>('gemini-2.5-flash-image');

  useEffect(() => {
    if (!isAuthenticated) { setUsage(null); return; }
    getStudioUsage().then(setUsage).catch(() => {});
  }, [isAuthenticated]);

  const [appState, setAppState] = useState<AppState>('selecting');
  const [transformations, setTransformations] = useState<Transformation[]>(TRANSFORMATIONS);
  const [activeCategory, setActiveCategory] = useState<Transformation | null>(null);

  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [characterImageUrls, setCharacterImageUrls] = useState<string[]>([]);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  const [controlValues, setControlValues] = useState<Record<string, number>>({});
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progressLog, setProgressLog] = useState<string>('');

  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const initializeControlValues = useCallback((transformation: Transformation) => {
    const initialValues: Record<string, number> = {};
    transformation.controls?.forEach(c => { initialValues[c.key] = c.defaultValue; });
    setControlValues(initialValues);
  }, []);

  const handleTransformationSelect = useCallback((transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setAppState('configuring');
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setCustomPrompt('');
    setSelectedPresetKey(transformation.presets?.[0]?.key || null);
    initializeControlValues(transformation);
  }, [initializeControlValues]);

  const handlePrimaryImageSelect = useCallback((_f: File | null, dataUrl: string) => {
    setPrimaryImageUrl(dataUrl); setMaskDataUrl(null);
  }, []);
  const handleSecondaryImageSelect = useCallback((_f: File | null, dataUrl: string) => {
    setSecondaryImageUrl(dataUrl);
  }, []);
  const clearPrimaryImage = useCallback(() => { setPrimaryImageUrl(null); setMaskDataUrl(null); }, []);
  const clearSecondaryImage = useCallback(() => setSecondaryImageUrl(null), []);
  const handleBackgroundSelect = useCallback((_f: File | null, dataUrl: string) => setBackgroundImageUrl(dataUrl), []);
  const handleReferenceSelect = useCallback((_f: File | null, dataUrl: string) => setReferenceImageUrl(dataUrl), []);

  const buildPrompt = useCallback((transformation: Transformation): string => {
    let p = transformation.prompt || '';
    Object.entries(controlValues).forEach(([k, v]) => {
      p = p.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
    p = p.replace(/{{customPrompt}}/g, customPrompt || '');
    if (transformation.isPresetBased && selectedPresetKey) {
      const preset = transformation.presets?.find(pr => pr.key === selectedPresetKey);
      if (preset) {
        p = preset.prompt + (customPrompt ? ` Additional instructions: ${customPrompt}` : '');
      }
    }
    return p;
  }, [controlValues, customPrompt, selectedPresetKey]);

  const handleGenerate = useCallback(async () => {
    if (!selectedTransformation) return;
    if (!isAuthenticated) { onRequireLogin(); return; }

    setLimitError(null);
    let updatedUsage: StudioUsage;

    if (!isAdminOrMod) {
      try {
        updatedUsage = await consumeStudioUse();
        setUsage(updatedUsage);
      } catch (err: unknown) {
        const e = err as Error & { limitReached?: boolean };
        setLimitError(e.message || t('studio.dailyLimitDesc'));
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    setProgressLog('');
    const appendProgress = (txt: string) => setProgressLog(prev => prev + txt);

    try {
      const promptToUse = buildPrompt(selectedTransformation);
      const imageParts: { base64: string; mimeType: string }[] = [];
      const takeParts = (url: string) => {
        imageParts.push({
          base64: url.split(',')[1],
          mimeType: url.split(';')[0].split(':')[1] ?? 'image/png',
        });
      };

      if (selectedTransformation.isStoryboard) {
        if (backgroundImageUrl) takeParts(backgroundImageUrl);
        characterImageUrls.forEach(takeParts);
        if (referenceImageUrl) takeParts(referenceImageUrl);
      } else if (selectedTransformation.isMultiImage) {
        if (primaryImageUrl) takeParts(primaryImageUrl);
        if (secondaryImageUrl) takeParts(secondaryImageUrl);
      } else if (primaryImageUrl) {
        takeParts(primaryImageUrl);
      }

      if (imageParts.length === 0) throw new Error(t('app.error.uploadAndSelect'));

      if (selectedTransformation.isTwoStep) {
        appendProgress('── Bước 1/2 ──\n');
        const step1 = await editImage(promptToUse, imageParts, null, selectedModel, appendProgress);
        const lineArtUrl = step1.imageUrl;
        if (!lineArtUrl) throw new Error(t('studio.step1Failed'));

        const step2Parts: { base64: string; mimeType: string }[] = [
          { base64: lineArtUrl.split(',')[1], mimeType: 'image/png' },
          ...(secondaryImageUrl
            ? [{
              base64: secondaryImageUrl.split(',')[1],
              mimeType: secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png',
            }]
            : []),
        ];
        appendProgress('── Bước 2/2 ──\n');
        const step2 = await editImage(selectedTransformation.stepTwoPrompt || '', step2Parts, null, selectedModel, appendProgress);

        const finalResult: GeneratedContent = {
          imageUrl: step2.imageUrl || '',
          secondaryImageUrl: lineArtUrl,
          originalImageUrl: primaryImageUrl,
          text: promptToUse,
        };
        setGeneratedContent(finalResult);
        setHistory(prev => [finalResult, ...prev]);
      } else {
        const result = await editImage(
          promptToUse,
          imageParts,
          selectedTransformation.hasMask ? maskDataUrl : null,
          selectedModel,
          appendProgress,
        );
        const finalResult: GeneratedContent = {
          imageUrl: result.imageUrl || '',
          originalImageUrl: primaryImageUrl,
          text: promptToUse,
        };
        setGeneratedContent(finalResult);
        setHistory(prev => [finalResult, ...prev]);
      }
      setAppState('result');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : t('app.error.generic'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTransformation, buildPrompt, primaryImageUrl, secondaryImageUrl, backgroundImageUrl,
      characterImageUrls, referenceImageUrl, maskDataUrl, t, isAuthenticated, selectedModel, onRequireLogin]);

  const handleUseAsInput = useCallback((imageUrl: string) => {
    setPrimaryImageUrl(imageUrl);
    setSecondaryImageUrl(null);
    setMaskDataUrl(null);
    setGeneratedContent(null);
    setAppState('selecting');
  }, []);

  const handleBackToSelection = useCallback(() => {
    setAppState('selecting');
    setSelectedTransformation(null);
    setActiveCategory(null);
  }, []);

  const handleDownload = useCallback((url: string, _type: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `alpha-studio-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const canGenerate = useCallback(() => {
    if (!selectedTransformation) return false;
    if (selectedTransformation.isStoryboard)
      return !!backgroundImageUrl && characterImageUrls.length > 0 && !!referenceImageUrl;
    if (selectedTransformation.isMultiImage)
      return !!primaryImageUrl && (selectedTransformation.isSecondaryOptional || !!secondaryImageUrl);
    if (selectedTransformation.hasCustomPrompt && !selectedTransformation.isCustomPromptOptional)
      return !!primaryImageUrl && !!customPrompt.trim();
    return !!primaryImageUrl;
  }, [selectedTransformation, primaryImageUrl, secondaryImageUrl, backgroundImageUrl,
      characterImageUrls, referenceImageUrl, customPrompt]);

  const renderConfigPanel = () => {
    if (!selectedTransformation) return null;
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 text-[var(--accent-primary)]" dangerouslySetInnerHTML={{ __html: selectedTransformation.icon }} />
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{t(selectedTransformation.titleKey)}</h2>
              {selectedTransformation.descriptionKey && (
                <p className="text-sm text-[var(--text-secondary)]">{t(selectedTransformation.descriptionKey)}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleBackToSelection}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)] hover:bg-[rgba(249,115,22,0.2)] border border-[var(--accent-primary)] rounded-lg transition-colors"
          >
            {t('transformationSelector.changeTool')}
          </button>
        </div>

        {selectedTransformation.isStoryboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UploaderBox
              title={t(selectedTransformation.backgroundUploaderTitle || 'Background')}
              description={t(selectedTransformation.backgroundUploaderDescription || '')}
              imageUrl={backgroundImageUrl}
              onImageSelect={handleBackgroundSelect}
              onClear={() => setBackgroundImageUrl(null)}
            />
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                {t(selectedTransformation.characterUploaderTitle || 'Characters')}
              </h3>
              <MultiImageGridUploader
                imageUrls={characterImageUrls}
                onImagesChange={setCharacterImageUrls}
                maxImages={3}
              />
            </div>
            <UploaderBox
              title={t(selectedTransformation.referenceUploaderTitle || 'Style Reference')}
              description={t(selectedTransformation.referenceUploaderDescription || '')}
              imageUrl={referenceImageUrl}
              onImageSelect={handleReferenceSelect}
              onClear={() => setReferenceImageUrl(null)}
            />
          </div>
        )}

        {selectedTransformation.isMultiImage && !selectedTransformation.isStoryboard && (
          selectedTransformation.hasMask ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t(selectedTransformation.primaryUploaderTitle || 'Primary')}
                </h3>
                <ImageEditorCanvas
                  initialImageUrl={primaryImageUrl}
                  onImageSelect={handlePrimaryImageSelect}
                  onMaskChange={setMaskDataUrl}
                  onClearImage={clearPrimaryImage}
                  isMaskToolActive={true}
                />
              </div>
              <UploaderBox
                title={t(selectedTransformation.secondaryUploaderTitle || 'Secondary')}
                description={t(selectedTransformation.secondaryUploaderDescription || '')}
                imageUrl={secondaryImageUrl}
                onImageSelect={handleSecondaryImageSelect}
                onClear={clearSecondaryImage}
              />
            </div>
          ) : (
            <MultiImageUploader
              primaryImageUrl={primaryImageUrl}
              secondaryImageUrl={secondaryImageUrl}
              onPrimarySelect={handlePrimaryImageSelect}
              onSecondarySelect={handleSecondaryImageSelect}
              onClearPrimary={clearPrimaryImage}
              onClearSecondary={clearSecondaryImage}
              primaryTitle={t(selectedTransformation.primaryUploaderTitle || '')}
              primaryDescription={t(selectedTransformation.primaryUploaderDescription || '')}
              secondaryTitle={t(selectedTransformation.secondaryUploaderTitle || '')}
              secondaryDescription={t(selectedTransformation.secondaryUploaderDescription || '')}
            />
          )
        )}

        {!selectedTransformation.isMultiImage && !selectedTransformation.isStoryboard && !selectedTransformation.isPresetBased && (
          <ImageEditorCanvas
            initialImageUrl={primaryImageUrl}
            onImageSelect={handlePrimaryImageSelect}
            onMaskChange={setMaskDataUrl}
            onClearImage={clearPrimaryImage}
            isMaskToolActive={selectedTransformation.hasMask ?? false}
          />
        )}

        {selectedTransformation.isPresetBased && (
          <div className="space-y-4">
            <ImageEditorCanvas
              initialImageUrl={primaryImageUrl}
              onImageSelect={handlePrimaryImageSelect}
              onMaskChange={setMaskDataUrl}
              onClearImage={clearPrimaryImage}
              isMaskToolActive={false}
            />
            <div className="grid grid-cols-5 gap-2">
              {selectedTransformation.presets?.map(preset => (
                <button
                  key={preset.key}
                  onClick={() => setSelectedPresetKey(preset.key)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedPresetKey === preset.key
                      ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]'
                      : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                  }`}
                >
                  {preset.referenceImage && <img src={preset.referenceImage} alt={t(preset.labelKey)} className="w-10 h-10 opacity-70" />}
                  <span className="text-xs text-center">{t(preset.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedTransformation.controls && selectedTransformation.controls.length > 0 && (
          <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
            {selectedTransformation.controls.map(control => (
              <div key={control.key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label className="text-[var(--text-secondary)]">{t(control.labelKey)}</label>
                  <span className="text-[var(--accent-primary)] font-mono">
                    {controlValues[control.key] || control.defaultValue}{control.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  value={controlValues[control.key] || control.defaultValue}
                  onChange={(e) => setControlValues(prev => ({ ...prev, [control.key]: Number(e.target.value) }))}
                  className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                />
              </div>
            ))}
          </div>
        )}

        {selectedTransformation.hasCustomPrompt && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">
              {t(selectedTransformation.customPromptLabelKey || 'studio.customPrompt')}
              {selectedTransformation.isCustomPromptOptional && (
                <span className="text-[var(--text-tertiary)]"> ({t('common.optional')})</span>
              )}
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t(selectedTransformation.customPromptPlaceholderKey || '')}
              className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[var(--accent-primary)] focus:outline-none resize-none"
              rows={3}
            />
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--text-secondary)]">{t('studio.model.label')}</p>
          <div className="grid grid-cols-2 gap-3">
            {STUDIO_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model.id)}
                className={`flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all ${
                  selectedModel === model.id
                    ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.08)]'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-secondary)] bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{t(model.nameKey)}</span>
                  <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    model.id === 'gemini-3.0-pro-image'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}>{model.badge}</span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{t(model.descKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 p-3 bg-[rgba(249,115,22,0.08)] border border-[var(--accent-primary)] rounded-xl text-sm">
              <span className="text-[var(--text-secondary)]">{t('studio.loginRequiredDesc')}</span>
              <button
                onClick={onRequireLogin}
                className="ml-auto shrink-0 text-[var(--accent-primary)] font-semibold hover:underline"
              >{t('studio.loginRequired')}</button>
            </div>
          ) : usage && !usage.unlimited ? (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
              usage.legacy.remaining === 0
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : usage.legacy.remaining === 1
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]'
            }`}>
              <span>
                {t('studio.usageCounter')
                  .replace('{{used}}', String(usage.legacy.used))
                  .replace('{{limit}}', String(usage.legacy.limit ?? ''))}
              </span>
            </div>
          ) : null}

          {limitError && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-sm text-red-400">
              {limitError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate() || isLoading || (!isAdminOrMod && !!usage && !usage.unlimited && usage.legacy.remaining === 0)}
            className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                {t('studio.generating')}
              </span>
            ) : t('studio.generate')}
          </button>

          {isLoading && progressLog && (
            <div className="mt-4 p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg max-h-48 overflow-y-auto">
              <div className="text-xs font-bold text-[var(--text-secondary)] mb-1">{t('studio.progressLog')}</div>
              <pre className="text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap break-words leading-relaxed">{progressLog}</pre>
            </div>
          )}
        </div>

        {error && <ErrorMessage message={error} />}
      </div>
    );
  };

  return (
    <>
      {appState === 'selecting' && (
        <TransformationSelector
          transformations={transformations}
          onSelect={handleTransformationSelect}
          hasPreviousResult={!!generatedContent}
          onOrderChange={setTransformations}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      )}

      {appState === 'configuring' && (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {renderConfigPanel()}
        </div>
      )}

      {appState === 'result' && generatedContent && (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <ResultDisplay
            content={generatedContent}
            onUseImageAsInput={handleUseAsInput}
            onImageClick={(url) => setPreviewImageUrl(url)}
          />
        </div>
      )}

      {/* History Button */}
      <button
        onClick={() => setIsHistoryOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg hover:bg-[var(--bg-secondary)] transition-all hover:scale-105"
        title={t('history.title')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-primary)] rounded-full text-xs font-bold flex items-center justify-center text-black">
            {history.length}
          </span>
        )}
      </button>

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onUseImage={handleUseAsInput}
        onDownload={handleDownload}
      />

      {previewImageUrl && (
        <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
      )}
    </>
  );
}
