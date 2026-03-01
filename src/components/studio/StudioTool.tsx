import { useState, useCallback, useEffect } from 'react';
import { editImage } from '../../services/geminiService';
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
import Login from '../ui/Login';
import { getStudioUsage, consumeStudioUse } from '../../services/studioService';
import type { StudioUsage } from '../../services/studioService';
import { STUDIO_MODELS } from '../../services/geminiService';
import type { StudioModel } from '../../services/geminiService';

interface StudioToolProps {
  onBack: () => void;
}

type AppState = 'selecting' | 'configuring' | 'result';

export default function StudioTool({ onBack }: StudioToolProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  // Auth / usage state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [usage, setUsage] = useState<StudioUsage | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);

  // Model selection
  const [selectedModel, setSelectedModel] = useState<StudioModel>('gemini-2.5-flash-image');

  // Fetch usage on mount when authenticated
  useEffect(() => {
    if (!isAuthenticated) { setUsage(null); return; }
    getStudioUsage().then(setUsage).catch(() => {});
  }, [isAuthenticated]);

  // App State
  const [appState, setAppState] = useState<AppState>('selecting');
  const [transformations, setTransformations] = useState<Transformation[]>(TRANSFORMATIONS);
  const [activeCategory, setActiveCategory] = useState<Transformation | null>(null);

  // Selected transformation
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);

  // Image states
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  // Storyboard states
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [characterImageUrls, setCharacterImageUrls] = useState<string[]>([]);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  // Controls state
  const [controlValues, setControlValues] = useState<Record<string, number>>({});
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  // Result states
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // History
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Initialize control values when transformation selected
  const initializeControlValues = useCallback((transformation: Transformation) => {
    const initialValues: Record<string, number> = {};
    transformation.controls?.forEach(control => {
      initialValues[control.key] = control.defaultValue;
    });
    setControlValues(initialValues);
  }, []);

  // Handle transformation selection
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

  // Handle image selection
  const handlePrimaryImageSelect = useCallback((_file: File | null, dataUrl: string) => {
    setPrimaryImageUrl(dataUrl);
    setMaskDataUrl(null);
  }, []);

  const handleSecondaryImageSelect = useCallback((_file: File | null, dataUrl: string) => {
    setSecondaryImageUrl(dataUrl);
  }, []);

  // Clear functions
  const clearPrimaryImage = useCallback(() => {
    setPrimaryImageUrl(null);
    setMaskDataUrl(null);
  }, []);

  const clearSecondaryImage = useCallback(() => {
    setSecondaryImageUrl(null);
  }, []);

  // Storyboard handlers
  const handleBackgroundSelect = useCallback((_file: File | null, dataUrl: string) => {
    setBackgroundImageUrl(dataUrl);
  }, []);

  const handleReferenceSelect = useCallback((_file: File | null, dataUrl: string) => {
    setReferenceImageUrl(dataUrl);
  }, []);

  // Build prompt with placeholders replaced
  const buildPrompt = useCallback((transformation: Transformation): string => {
    let prompt = transformation.prompt || '';

    // Replace control placeholders
    Object.entries(controlValues).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Replace custom prompt placeholder
    prompt = prompt.replace(/{{customPrompt}}/g, customPrompt || '');

    // For preset-based transformations
    if (transformation.isPresetBased && selectedPresetKey) {
      const selectedPreset = transformation.presets?.find(p => p.key === selectedPresetKey);
      if (selectedPreset) {
        prompt = selectedPreset.prompt + (customPrompt ? ` Additional instructions: ${customPrompt}` : '');
      }
    }

    return prompt;
  }, [controlValues, customPrompt, selectedPresetKey]);

  // Generate function
  const handleGenerate = useCallback(async () => {
    if (!selectedTransformation) return;

    // Auth check
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Daily limit check
    setLimitError(null);
    let updatedUsage: StudioUsage;
    try {
      updatedUsage = await consumeStudioUse();
      setUsage(updatedUsage);
    } catch (err: unknown) {
      const e = err as Error & { limitReached?: boolean };
      setLimitError(e.message || t('studio.dailyLimitDesc'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const promptToUse = buildPrompt(selectedTransformation);
      const imageParts: { base64: string; mimeType: string }[] = [];

      // Collect images based on transformation type
      if (selectedTransformation.isStoryboard) {
        // Storyboard: background + characters + reference
        if (backgroundImageUrl) {
          imageParts.push({
            base64: backgroundImageUrl.split(',')[1],
            mimeType: backgroundImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
        characterImageUrls.forEach(url => {
          imageParts.push({
            base64: url.split(',')[1],
            mimeType: url.split(';')[0].split(':')[1] ?? 'image/png'
          });
        });
        if (referenceImageUrl) {
          imageParts.push({
            base64: referenceImageUrl.split(',')[1],
            mimeType: referenceImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
      } else if (selectedTransformation.isMultiImage) {
        // Multi-image transformation
        if (primaryImageUrl) {
          imageParts.push({
            base64: primaryImageUrl.split(',')[1],
            mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
        if (secondaryImageUrl) {
          imageParts.push({
            base64: secondaryImageUrl.split(',')[1],
            mimeType: secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
      } else if (selectedTransformation.isPresetBased) {
        // Preset-based (like camera angle)
        if (primaryImageUrl) {
          imageParts.push({
            base64: primaryImageUrl.split(',')[1],
            mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
      } else {
        // Single image transformation
        if (primaryImageUrl) {
          imageParts.push({
            base64: primaryImageUrl.split(',')[1],
            mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
          });
        }
      }

      if (imageParts.length === 0) {
        throw new Error(t('app.error.uploadAndSelect'));
      }

      // Handle two-step transformations
      if (selectedTransformation.isTwoStep) {
        // Step 1: Generate line art
        const step1Result = await editImage(promptToUse, imageParts, null, selectedModel);
        const lineArtUrl = step1Result.imageUrl;

        if (!lineArtUrl) throw new Error('Step 1 failed');

        // Step 2: Apply color palette
        const step2Parts = [
          { base64: lineArtUrl.split(',')[1], mimeType: 'image/png' },
          ...(secondaryImageUrl ? [{ base64: secondaryImageUrl.split(',')[1], mimeType: secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png' }] : [])
        ];

        const step2Result = await editImage(selectedTransformation.stepTwoPrompt || '', step2Parts, null, selectedModel);

        const finalResult: GeneratedContent = {
          imageUrl: step2Result.imageUrl || '',
          secondaryImageUrl: lineArtUrl,
          originalImageUrl: primaryImageUrl,
          text: promptToUse
        };

        setGeneratedContent(finalResult);
        setHistory(prev => [finalResult, ...prev]);
      } else {
        // Single-step transformation
        const result = await editImage(
          promptToUse,
          imageParts,
          selectedTransformation.hasMask ? maskDataUrl : null,
          selectedModel
        );

        const finalResult: GeneratedContent = {
          imageUrl: result.imageUrl || '',
          originalImageUrl: primaryImageUrl,
          text: promptToUse
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
  }, [selectedTransformation, buildPrompt, primaryImageUrl, secondaryImageUrl, backgroundImageUrl, characterImageUrls, referenceImageUrl, maskDataUrl, t, isAuthenticated, selectedModel]);

  // Use result as input for new transformation
  const handleUseAsInput = useCallback((imageUrl: string) => {
    setPrimaryImageUrl(imageUrl);
    setSecondaryImageUrl(null);
    setMaskDataUrl(null);
    setGeneratedContent(null);
    setAppState('selecting');
  }, []);

  // Back to selection
  const handleBackToSelection = useCallback(() => {
    setAppState('selecting');
    setSelectedTransformation(null);
    setActiveCategory(null);
  }, []);

  // Download handler for history
  const handleDownload = useCallback((url: string, _type: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `alpha-studio-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Check if can generate
  const canGenerate = useCallback(() => {
    if (!selectedTransformation) return false;

    if (selectedTransformation.isStoryboard) {
      return !!backgroundImageUrl && characterImageUrls.length > 0 && !!referenceImageUrl;
    }

    if (selectedTransformation.isMultiImage) {
      return !!primaryImageUrl && (selectedTransformation.isSecondaryOptional || !!secondaryImageUrl);
    }

    if (selectedTransformation.hasCustomPrompt && !selectedTransformation.isCustomPromptOptional) {
      return !!primaryImageUrl && !!customPrompt.trim();
    }

    return !!primaryImageUrl;
  }, [selectedTransformation, primaryImageUrl, secondaryImageUrl, backgroundImageUrl, characterImageUrls, referenceImageUrl, customPrompt]);

  // Render configuration panel based on transformation type
  const renderConfigPanel = () => {
    if (!selectedTransformation) return null;

    return (
      <div className="flex flex-col gap-6">
        {/* Transformation Title */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 text-[var(--accent-primary)]"
              dangerouslySetInnerHTML={{ __html: selectedTransformation.icon }}
            />
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {t('transformationSelector.changeTool')}
          </button>
        </div>

        {/* Storyboard Mode */}
        {selectedTransformation.isStoryboard && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UploaderBox
              title={t(selectedTransformation.backgroundUploaderTitle || 'Background')}
              description={t(selectedTransformation.backgroundUploaderDescription || '')}
              imageUrl={backgroundImageUrl}
              onImageSelect={handleBackgroundSelect}
              onClear={() => setBackgroundImageUrl(null)}
            />
            <div className="md:col-span-1">
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

        {/* Multi-Image Mode */}
        {selectedTransformation.isMultiImage && !selectedTransformation.isStoryboard && (
          selectedTransformation.hasMask ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  {t(selectedTransformation.primaryUploaderTitle || 'Primary Image')}
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
                title={t(selectedTransformation.secondaryUploaderTitle || 'Secondary Image')}
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

        {/* Single Image with Mask */}
        {!selectedTransformation.isMultiImage && !selectedTransformation.isStoryboard && !selectedTransformation.isPresetBased && (
          <ImageEditorCanvas
            initialImageUrl={primaryImageUrl}
            onImageSelect={handlePrimaryImageSelect}
            onMaskChange={setMaskDataUrl}
            onClearImage={clearPrimaryImage}
            isMaskToolActive={selectedTransformation.hasMask ?? false}
          />
        )}

        {/* Preset-Based Mode (Camera Angle) */}
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
                  {preset.referenceImage && (
                    <img src={preset.referenceImage} alt={t(preset.labelKey)} className="w-10 h-10 opacity-70" />
                  )}
                  <span className="text-xs text-center">{t(preset.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Controls (Sliders) */}
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

        {/* Custom Prompt */}
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

        {/* Model Selector */}
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
                  }`}>
                    {model.badge}
                  </span>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">{t(model.descKey)}</span>
                {selectedModel === model.id && (
                  <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-[var(--accent-primary)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đang dùng
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="space-y-3">
          {/* Usage counter / auth prompt */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-2 p-3 bg-[rgba(249,115,22,0.08)] border border-[var(--accent-primary)] rounded-xl text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--accent-primary)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-[var(--text-secondary)]">{t('studio.loginRequiredDesc')}</span>
              <button
                onClick={() => setShowLoginModal(true)}
                className="ml-auto shrink-0 text-[var(--accent-primary)] font-semibold hover:underline"
              >
                {t('studio.loginRequired')}
              </button>
            </div>
          ) : usage && !usage.unlimited ? (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm border ${
              usage.remaining === 0
                ? 'bg-red-500/10 border-red-500/40 text-red-400'
                : usage.remaining === 1
                  ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500'
                  : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {t('studio.usageCounter')
                  .replace('{{used}}', String(usage.used))
                  .replace('{{limit}}', String(usage.limit))}
              </span>
            </div>
          ) : null}

          {/* Limit error */}
          {limitError && (
            <div className="p-3 bg-red-500/10 border border-red-500/40 rounded-xl text-sm text-red-400">
              {limitError}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!canGenerate() || isLoading || (!!usage && !usage.unlimited && usage.remaining === 0)}
            className="w-full py-4 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shadow-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                {t('studio.generating')}
              </span>
            ) : (
              t('studio.generate')
            )}
          </button>
        </div>

        {error && <ErrorMessage message={error} />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Floating Buttons */}
      <div className="fixed bottom-6 left-6 z-40 flex gap-2">
        <button
          onClick={onBack}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg hover:bg-[var(--bg-secondary)] transition-all hover:scale-105"
          title={t('common.back')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        {appState !== 'selecting' && (
          <button
            onClick={handleBackToSelection}
            className="p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg hover:bg-[var(--bg-secondary)] transition-all hover:scale-105"
            title={t('studio.newTransformation')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

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

      {/* Main Content */}
      <main className="min-h-screen">
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
      </main>

      {/* History Panel */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onUseImage={handleUseAsInput}
        onDownload={handleDownload}
      />

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <ImagePreviewModal
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <Login
          onLoginSuccess={() => {
            setShowLoginModal(false);
            getStudioUsage().then(setUsage).catch(() => {});
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
