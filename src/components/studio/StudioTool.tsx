import React, { useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { editImage } from '../../services/geminiService';
import { fileToBase64, downloadImage, embedWatermark, addVisibleWatermark } from '../../utils/fileUtils';
import type { Transformation, GeneratedContent, Preset } from '../../types';

import ImageUploader from '../upload/ImageUploader';
import MultiImageUploader from '../upload/MultiImageUploader';
import MultiImageGridUploader from '../upload/MultiImageGridUploader';
import ImageEditorCanvas from './ImageEditorCanvas';
import TransformationSelector from './TransformationSelector';
import PromptSelector from './PromptSelector';
import ResultDisplay from './ResultDisplay';
import HistoryPanel, { HistoryItem } from './HistoryPanel';

interface StudioToolProps {
  onBack?: () => void;
}

const StudioTool: React.FC<StudioToolProps> = ({ onBack }) => {
  const { t } = useTranslation();

  // Image states
  const [primaryImage, setPrimaryImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [secondaryImage, setSecondaryImage] = useState<{ file: File; dataUrl: string } | null>(null);
  const [storyboardImages, setStoryboardImages] = useState<string[]>([]);

  // Transformation states
  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [controlValues, setControlValues] = useState<Record<string, number>>({});

  // Mask state
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);

  // Result states
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History states
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Reset states when transformation changes
  const handleTransformationSelect = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setCustomPrompt('');
    setSelectedPreset(null);
    setMaskDataUrl(null);
    setResult(null);
    setError(null);

    // Initialize control values with defaults
    const initialControls: Record<string, number> = {};
    transformation.controls?.forEach(control => {
      initialControls[control.key] = control.defaultValue;
    });
    setControlValues(initialControls);
  };

  const handleControlChange = (key: string, value: number) => {
    setControlValues(prev => ({ ...prev, [key]: value }));
  };

  // Build prompt with placeholders replaced
  const buildFinalPrompt = useCallback((): string => {
    if (!selectedTransformation) return '';

    let prompt = selectedTransformation.prompt || '';

    // Use preset prompt if available
    if (selectedTransformation.isPresetBased && selectedPreset) {
      prompt = selectedPreset.prompt;
    }

    // Replace control placeholders
    Object.entries(controlValues).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });

    // Replace custom prompt placeholder
    prompt = prompt.replace(/{{customPrompt}}/g, customPrompt);

    // Append custom prompt for preset-based transformations
    if (selectedTransformation.isPresetBased && customPrompt) {
      prompt += ` Additional instructions: ${customPrompt}`;
    }

    return prompt;
  }, [selectedTransformation, selectedPreset, controlValues, customPrompt]);

  // Generate image
  const handleGenerate = async () => {
    if (!selectedTransformation || !primaryImage) return;

    // Validation
    if (selectedTransformation.hasCustomPrompt && !selectedTransformation.isCustomPromptOptional && !customPrompt.trim()) {
      setError(t('studio.promptRequired'));
      return;
    }

    if (selectedTransformation.isPresetBased && !selectedPreset) {
      setError(t('studio.presetRequired'));
      return;
    }

    if (selectedTransformation.isMultiImage && !secondaryImage && !selectedTransformation.isSecondaryOptional) {
      setError(t('studio.secondImageRequired'));
      return;
    }

    if (selectedTransformation.isStoryboard && storyboardImages.length < 2) {
      setError(t('studio.minImagesRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageParts: { base64: string; mimeType: string }[] = [];

      // Handle storyboard (multiple images)
      if (selectedTransformation.isStoryboard) {
        for (const imgUrl of storyboardImages) {
          const base64 = imgUrl.split(',')[1];
          imageParts.push({ base64, mimeType: 'image/png' });
        }
      } else {
        // Primary image
        const primaryBase64 = await fileToBase64(primaryImage.file);
        imageParts.push(primaryBase64);

        // Secondary image if exists
        if (secondaryImage) {
          const secondaryBase64 = await fileToBase64(secondaryImage.file);
          imageParts.push(secondaryBase64);
        }
      }

      const finalPrompt = buildFinalPrompt();

      // Handle mask
      let maskBase64: string | null = null;
      if (selectedTransformation.hasMask && maskDataUrl) {
        maskBase64 = maskDataUrl.split(',')[1];
      }

      // Two-step transformation
      if (selectedTransformation.isTwoStep) {
        // Step 1
        const step1Result = await editImage(selectedTransformation.prompt || '', imageParts, null);

        if (!step1Result.imageUrl) {
          throw new Error(t('studio.step1Failed'));
        }

        // Step 2 with the result from step 1
        const step1Base64 = step1Result.imageUrl.split(',')[1];
        const step2ImageParts = [
          { base64: step1Base64, mimeType: 'image/png' },
          ...(secondaryImage ? [await fileToBase64(secondaryImage.file)] : [])
        ];

        const step2Result = await editImage(
          selectedTransformation.stepTwoPrompt || '',
          step2ImageParts,
          null
        );

        setResult(step2Result);
      } else {
        // Single step transformation
        const generatedResult = await editImage(finalPrompt, imageParts, maskBase64);
        setResult(generatedResult);
      }

      // Add to history
      if (result?.imageUrl) {
        const historyItem: HistoryItem = {
          id: Date.now().toString(),
          timestamp: new Date(),
          transformationKey: selectedTransformation.key,
          result: result,
          inputImageUrl: primaryImage.dataUrl,
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 20));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : t('studio.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!result?.imageUrl) return;

    try {
      // Add watermarks
      let finalImage = result.imageUrl;
      finalImage = await embedWatermark(finalImage, 'Alpha Studio');
      finalImage = await addVisibleWatermark(finalImage, 'Alpha Studio');

      const filename = `alpha-studio-${Date.now()}.png`;
      downloadImage(finalImage, filename);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  // Use result as new input
  const handleUseAsInput = () => {
    if (!result?.imageUrl) return;

    // Convert data URL to file
    fetch(result.imageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'result.png', { type: 'image/png' });
        setPrimaryImage({ file, dataUrl: result.imageUrl! });
        setResult(null);
        setMaskDataUrl(null);
      });
  };

  // Clear result
  const handleClearResult = () => {
    setResult(null);
    setError(null);
  };

  // History handlers
  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.result.imageUrl) {
      fetch(item.result.imageUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'history.png', { type: 'image/png' });
          setPrimaryImage({ file, dataUrl: item.result.imageUrl! });
        });
    }
    setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  // Check if can generate
  const canGenerate = Boolean(
    selectedTransformation &&
    (selectedTransformation.isStoryboard ? storyboardImages.length >= 2 : primaryImage) &&
    !isLoading
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-primary)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Alpha Studio</h1>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors relative"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-primary)] text-[var(--text-on-accent)] text-xs rounded-full flex items-center justify-center">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="flex flex-col gap-6">
            {/* Transformation Selector */}
            <TransformationSelector
              selectedTransformation={selectedTransformation}
              onSelect={handleTransformationSelect}
            />

            {/* Image Upload Section */}
            {selectedTransformation && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {t('studio.uploadImages')}
                </h3>

                {/* Storyboard Mode */}
                {selectedTransformation.isStoryboard ? (
                  <MultiImageGridUploader
                    imageUrls={storyboardImages}
                    onImagesChange={setStoryboardImages}
                    maxImages={5}
                  />
                ) : selectedTransformation.isMultiImage ? (
                  /* Multi Image Mode */
                  <MultiImageUploader
                    primaryImageUrl={primaryImage?.dataUrl || null}
                    secondaryImageUrl={secondaryImage?.dataUrl || null}
                    onPrimarySelect={(file, dataUrl) => setPrimaryImage({ file, dataUrl })}
                    onSecondarySelect={(file, dataUrl) => setSecondaryImage({ file, dataUrl })}
                    onClearPrimary={() => setPrimaryImage(null)}
                    onClearSecondary={() => setSecondaryImage(null)}
                    primaryTitle={selectedTransformation.primaryUploaderTitle ? t(selectedTransformation.primaryUploaderTitle) : undefined}
                    primaryDescription={selectedTransformation.primaryUploaderDescription ? t(selectedTransformation.primaryUploaderDescription) : undefined}
                    secondaryTitle={selectedTransformation.secondaryUploaderTitle ? t(selectedTransformation.secondaryUploaderTitle) : undefined}
                    secondaryDescription={selectedTransformation.secondaryUploaderDescription ? t(selectedTransformation.secondaryUploaderDescription) : undefined}
                  />
                ) : selectedTransformation.hasMask ? (
                  /* Single Image with Mask */
                  <>
                    <ImageUploader
                      imageUrl={primaryImage?.dataUrl || null}
                      onImageSelect={(file, dataUrl) => setPrimaryImage({ file, dataUrl })}
                      onClear={() => {
                        setPrimaryImage(null);
                        setMaskDataUrl(null);
                      }}
                    />
                    {primaryImage && (
                      <ImageEditorCanvas
                        imageUrl={primaryImage.dataUrl}
                        onMaskChange={setMaskDataUrl}
                        maskEnabled={true}
                      />
                    )}
                  </>
                ) : (
                  /* Single Image Mode */
                  <ImageUploader
                    imageUrl={primaryImage?.dataUrl || null}
                    onImageSelect={(file, dataUrl) => setPrimaryImage({ file, dataUrl })}
                    onClear={() => setPrimaryImage(null)}
                  />
                )}
              </div>
            )}

            {/* Prompt Selector */}
            {selectedTransformation && (selectedTransformation.hasCustomPrompt || selectedTransformation.isPresetBased || selectedTransformation.controls) && (
              <PromptSelector
                transformation={selectedTransformation}
                customPrompt={customPrompt}
                onCustomPromptChange={setCustomPrompt}
                selectedPreset={selectedPreset}
                onPresetSelect={setSelectedPreset}
                controlValues={controlValues}
                onControlChange={handleControlChange}
              />
            )}

            {/* Generate Button */}
            {selectedTransformation && (
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`w-full py-3 rounded-xl font-semibold text-[var(--text-on-accent)] transition-all ${
                  canGenerate
                    ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 shadow-lg shadow-[var(--accent-shadow)]'
                    : 'bg-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? t('studio.generating') : t('studio.generate')}
              </button>
            )}
          </div>

          {/* Right Column - Result */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {t('studio.result')}
            </h3>
            <ResultDisplay
              result={result}
              isLoading={isLoading}
              error={error}
              onDownload={handleDownload}
              onClear={handleClearResult}
              onUseAsInput={handleUseAsInput}
            />
          </div>
        </div>
      </main>

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onSelectItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
      />
    </div>
  );
};

export default StudioTool;
