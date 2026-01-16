import React, { useState, useCallback, useEffect } from 'react';
import { TRANSFORMATIONS } from '../../constants';
import { editImage } from '../../services/geminiService';
import type { GeneratedContent, Transformation, WorkflowDocument } from '../../types';
import TransformationSelector from './TransformationSelector';
import ResultDisplay from './ResultDisplay';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import ImageEditorCanvas from './ImageEditorCanvas';
import { dataUrlToFile, embedWatermark, loadImage, resizeImageToMatch, addVisibleWatermark, downloadImage } from '../../utils/fileUtils';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import MultiImageUploader from '../upload/MultiImageUploader';
import MultiImageGridUploader from '../upload/MultiImageGridUploader';
import UploaderBox from '../upload/UploaderBox';
import HistoryPanel from './HistoryPanel';
import { useTranslation } from '../../i18n/context';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import ThemeSwitcher from '../ui/ThemeSwitcher';

type ActiveTool = 'mask' | 'none';

interface StudioToolProps {
  onClose: () => void;
  onAddDocument: (doc: WorkflowDocument) => void;
}

const StudioTool: React.FC<StudioToolProps> = ({ onClose, onAddDocument }) => {
  const { t } = useTranslation();
  const [transformations, setTransformations] = useState<Transformation[]>(() => {
    try {
      const savedOrder = localStorage.getItem('transformationOrder');
      if (savedOrder) {
        const orderedKeys = JSON.parse(savedOrder) as string[];
        const transformationMap = new Map(TRANSFORMATIONS.map(t => [t.key, t]));

        const orderedTransformations = orderedKeys
          .map(key => transformationMap.get(key))
          .filter((t): t is Transformation => !!t);

        const savedKeysSet = new Set(orderedKeys);
        const newTransformations = TRANSFORMATIONS.filter(t => !savedKeysSet.has(t.key));

        return [...orderedTransformations, ...newTransformations];
      }
    } catch (e) {
      console.error("Failed to load or parse transformation order from localStorage", e);
    }
    return TRANSFORMATIONS;
  });

  const [selectedTransformation, setSelectedTransformation] = useState<Transformation | null>(null);
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string | null>(null);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [secondaryImageUrl, setSecondaryImageUrl] = useState<string | null>(null);
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<Transformation | null>(null);

  // State for Camera Angle controls
  const [cameraControls, setCameraControls] = useState<{ [key: string]: number }>({});
  // State for custom text prompt
  const [customPrompt, setCustomPrompt] = useState<string>('');
  // State for preset-based transformations
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);

  // State for Storyboard feature
  const [storyboardBackground, setStoryboardBackground] = useState<string | null>(null);
  const [storyboardReference, setStoryboardReference] = useState<string | null>(null);
  const [storyboardCharacters, setStoryboardCharacters] = useState<string[]>([]);

  // State for Camera Angle extra references
  const [cameraAngleReferences, setCameraAngleReferences] = useState<string[]>([]);

  useEffect(() => {
    try {
      const orderToSave = transformations.map(t => t.key);
      localStorage.setItem('transformationOrder', JSON.stringify(orderToSave));
    } catch (e) {
      console.error("Failed to save transformation order to localStorage", e);
    }
  }, [transformations]);

  // Cleanup blob URLs on unmount or when dependencies change
  useEffect(() => {
    return () => {
        history.forEach(item => {
            if (item.videoUrl) { // This check remains for backwards compatibility with potential history items
                URL.revokeObjectURL(item.videoUrl);
            }
        });
        if (generatedContent?.videoUrl) {
            URL.revokeObjectURL(generatedContent.videoUrl);
        }
    };
  }, [history, generatedContent]);

  const handleSelectTransformation = (transformation: Transformation) => {
    setSelectedTransformation(transformation);
    setGeneratedContent(null);
    setError(null);
    setCustomPrompt('');
    setSelectedPresetKey(null);
    setCameraControls({});
    setStoryboardBackground(null);
    setStoryboardReference(null);
    setStoryboardCharacters([]);
    setCameraAngleReferences([]);
  };

  const handlePrimaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setPrimaryFile(file);
    setPrimaryImageUrl(dataUrl);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setActiveTool('none');
  }, []);

  const handleSecondaryImageSelect = useCallback((file: File, dataUrl: string) => {
    setSecondaryFile(file);
    setSecondaryImageUrl(dataUrl);
    setGeneratedContent(null);
    setError(null);
  }, []);

  const handleClearPrimaryImage = () => {
    setPrimaryImageUrl(null);
    setPrimaryFile(null);
    setGeneratedContent(null);
    setError(null);
    setMaskDataUrl(null);
    setActiveTool('none');
  };

  const handleClearSecondaryImage = () => {
    setSecondaryImageUrl(null);
    setSecondaryFile(null);
  };

  const applyWatermarks = useCallback(async (imageUrl: string | null) => {
    if (!imageUrl) return null;
    try {
      const invisiblyWatermarked = await embedWatermark(imageUrl, "Alpha Studio");
      const visiblyWatermarked = await addVisibleWatermark(invisiblyWatermarked, "Alpha Studio");
      return visiblyWatermarked;
    } catch (err) {
      console.error("Failed to apply watermarks", err);
      return imageUrl; // Return original image on any watermarking failure
    }
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!selectedTransformation) {
        setError(t('app.error.uploadAndSelect'));
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setLoadingMessage('');

    try {
        if (selectedTransformation.isStoryboard) {
            if (!storyboardBackground || !storyboardReference || !customPrompt.trim()) {
                setError(t('app.error.storyboardInputs'));
                setIsLoading(false);
                return;
            }

            const imageParts = [];

            // 1. Background
            imageParts.push({
                base64: storyboardBackground.split(',')[1],
                mimeType: storyboardBackground.split(';')[0].split(':')[1] ?? 'image/png'
            });

            // 2. Characters
            for (const charUrl of storyboardCharacters) {
                imageParts.push({
                    base64: charUrl.split(',')[1],
                    mimeType: charUrl.split(';')[0].split(':')[1] ?? 'image/png'
                });
            }

            // 3. Reference
            imageParts.push({
                base64: storyboardReference.split(',')[1],
                mimeType: storyboardReference.split(';')[0].split(':')[1] ?? 'image/png'
            });

            const promptToUse = selectedTransformation.prompt!.replace('{{customPrompt}}', customPrompt);

            setLoadingMessage(t('app.loading.default'));
            const result = await editImage(promptToUse, imageParts, null);

            result.imageUrl = await applyWatermarks(result.imageUrl);
            const finalResult = { ...result, originalImageUrl: storyboardBackground, text: promptToUse };

            setGeneratedContent(finalResult);
            setHistory(prev => [finalResult, ...prev]);

            return; // End execution for storyboard
        }

        let promptToUse = '';

        if (selectedTransformation.isPresetBased) {
            if (!primaryImageUrl || !selectedPresetKey) {
                setError(t('app.error.uploadAndSelect'));
                setIsLoading(false);
                return;
            }
            const selectedPreset = selectedTransformation.presets?.find(p => p.key === selectedPresetKey);
            if (!selectedPreset) throw new Error("Selected preset not found");

            promptToUse = selectedPreset.prompt;

            if (selectedPreset.control) {
                const control = selectedPreset.control;
                const placeholder = `{{${control.key}}}`;
                const value = cameraControls[control.key] ?? control.defaultValue;
                promptToUse = promptToUse.replace(new RegExp(placeholder, 'g'), String(value));
            }

            // Append custom prompt if available
            if (customPrompt.trim()) {
                promptToUse += `. ${customPrompt}`;
            }

        } else {
            promptToUse = selectedTransformation.prompt!;
            if (selectedTransformation.controls) {
                if (!primaryImageUrl) {
                    setError(t('app.error.uploadAndSelect'));
                    setIsLoading(false);
                    return;
                }
                let dynamicPrompt = promptToUse;
                selectedTransformation.controls.forEach(control => {
                    const placeholder = `{{${control.key}}}`;
                    const value = cameraControls[control.key] ?? control.defaultValue;
                    dynamicPrompt = dynamicPrompt.replace(new RegExp(placeholder, 'g'), String(value));
                });
                promptToUse = dynamicPrompt;
            }

            if (selectedTransformation.hasCustomPrompt) {
                if (!customPrompt.trim() && !selectedTransformation.isCustomPromptOptional) {
                    setError(t('app.error.enterPrompt'));
                    setIsLoading(false);
                    return;
                }
                promptToUse = promptToUse.replace('{{customPrompt}}', customPrompt);
            }
        }

        const maskBase64 = maskDataUrl ? maskDataUrl.split(',')[1] : null;

        if (selectedTransformation.isTwoStep) {
            if (!primaryImageUrl || !secondaryImageUrl) {
                setError(t('app.error.uploadBoth'));
                setIsLoading(false);
                return;
            }
            setLoadingMessage(t('app.loading.step1'));
            const primaryPart = [{ base64: primaryImageUrl.split(',')[1], mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png' }];
            const stepOneResult = await editImage(promptToUse, primaryPart, null);

            if (!stepOneResult.imageUrl) throw new Error("Step 1 (line art) failed to generate an image.");

            stepOneResult.imageUrl = await applyWatermarks(stepOneResult.imageUrl);

            setLoadingMessage(t('app.loading.step2'));
            const stepOneImageBase64 = stepOneResult.imageUrl.split(',')[1];
            const stepOneImageMimeType = stepOneResult.imageUrl.split(';')[0].split(':')[1] ?? 'image/png';

            const primaryImage = await loadImage(primaryImageUrl);
            const resizedSecondaryImageUrl = await resizeImageToMatch(secondaryImageUrl, primaryImage);

            const stepTwoParts = [
                { base64: stepOneImageBase64, mimeType: stepOneImageMimeType },
                { base64: resizedSecondaryImageUrl.split(',')[1], mimeType: resizedSecondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png' }
            ];

            const stepTwoResult = await editImage(selectedTransformation.stepTwoPrompt!, stepTwoParts, null);

            stepTwoResult.imageUrl = await applyWatermarks(stepTwoResult.imageUrl);

            const finalResult = { ...stepTwoResult, secondaryImageUrl: stepOneResult.imageUrl, originalImageUrl: primaryImageUrl, text: promptToUse };
            setGeneratedContent(finalResult);
            setHistory(prev => [finalResult, ...prev]);

        } else {
             if (!primaryImageUrl) {
                setError(t('app.error.uploadAndSelect'));
                setIsLoading(false);
                return;
             }
             if (selectedTransformation.isMultiImage && !selectedTransformation.isSecondaryOptional && !secondaryImageUrl) {
                setError(t('app.error.uploadBoth'));
                setIsLoading(false);
                return;
             }

            let imageParts = [{
                base64: primaryImageUrl.split(',')[1],
                mimeType: primaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
            }];
            if (selectedTransformation.isMultiImage && secondaryImageUrl) {
                imageParts.push({
                    base64: secondaryImageUrl.split(',')[1],
                    mimeType: secondaryImageUrl.split(';')[0].split(':')[1] ?? 'image/png'
                });
            }

            // Handle Camera Angle additional references
            if (selectedTransformation.key === 'cameraAngle' && cameraAngleReferences.length > 0) {
                 for (const refUrl of cameraAngleReferences) {
                    imageParts.push({
                        base64: refUrl.split(',')[1],
                        mimeType: refUrl.split(';')[0].split(':')[1] ?? 'image/png'
                    });
                }
            }

            setLoadingMessage(t('app.loading.default'));
            const result = await editImage(promptToUse, imageParts, maskBase64);

            result.imageUrl = await applyWatermarks(result.imageUrl);
            const finalResult = { ...result, originalImageUrl: primaryImageUrl, text: promptToUse };

            setGeneratedContent(finalResult);
            setHistory(prev => [finalResult, ...prev]);
        }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('app.error.unknown'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [
    primaryImageUrl, secondaryImageUrl, selectedTransformation, maskDataUrl, t, applyWatermarks,
    cameraControls, customPrompt, selectedPresetKey,
    storyboardBackground, storyboardCharacters, storyboardReference,
    cameraAngleReferences
  ]);

  const handleUseImageAsInput = useCallback(async (imageUrl: string) => {
    if (!imageUrl) return;

    try {
      const newFile = await dataUrlToFile(imageUrl, `edited-${Date.now()}.png`);
      setPrimaryFile(newFile);
      setPrimaryImageUrl(imageUrl);
      setGeneratedContent(null);
      setError(null);
      setMaskDataUrl(null);
      setActiveTool('none');
      setSecondaryFile(null);
      setSecondaryImageUrl(null);
      setSelectedTransformation(null);
      setActiveCategory(null);
      setCameraControls({});
      setCustomPrompt('');
      setSelectedPresetKey(null);
      setStoryboardBackground(null);
      setStoryboardReference(null);
      setStoryboardCharacters([]);
      setCameraAngleReferences([]);
    } catch (err) {
      console.error("Failed to use image as input:", err);
      setError(t('app.error.useAsInputFailed'));
    }
  }, [t]);

  const handleSaveToWorkflow = (imageUrl: string) => {
    const filename = `Studio_Generate_${Date.now()}.png`;
    const newDoc: WorkflowDocument = {
        id: Date.now().toString(),
        name: filename,
        type: 'PNG',
        size: '1.2 MB', // Mock size
        uploadDate: new Date().toISOString().split('T')[0],
        uploader: 'Studio User',
        department: 'creative',
        status: 'pending',
        url: imageUrl
    };
    onAddDocument(newDoc);
    alert(t('resultDisplay.actions.savedToWorkflow'));
  };

  const toggleHistoryPanel = () => setIsHistoryPanelOpen(prev => !prev);

  const handleUseHistoryImageAsInput = (imageUrl: string) => {
      handleUseImageAsInput(imageUrl);
      setIsHistoryPanelOpen(false);
  };

  const handleDownloadFromHistory = (url: string, type: string) => {
      const fileExtension = type.includes('video') ? 'mp4' : (url.split(';')[0].split('/')[1] || 'png');
      const filename = `${type}-${Date.now()}.${fileExtension}`;
      downloadImage(url, filename);
  };

  const handleBackToSelection = () => {
    setSelectedTransformation(null);
  };

  const handleResetApp = () => {
    setSelectedTransformation(null);
    setPrimaryImageUrl(null);
    setPrimaryFile(null);
    setSecondaryImageUrl(null);
    setSecondaryFile(null);
    setGeneratedContent(null);
    setError(null);
    setIsLoading(false);
    setMaskDataUrl(null);
    setActiveTool('none');
    setActiveCategory(null);
    setCameraControls({});
    setCustomPrompt('');
    setSelectedPresetKey(null);
    setStoryboardBackground(null);
    setStoryboardReference(null);
    setStoryboardCharacters([]);
    setCameraAngleReferences([]);
  };

  const handleOpenPreview = (url: string) => setPreviewImageUrl(url);
  const handleClosePreview = () => setPreviewImageUrl(null);

  const toggleMaskTool = () => {
    setActiveTool(current => (current === 'mask' ? 'none' : 'mask'));
  };

  let isGenerateDisabled = isLoading || !selectedTransformation;
  if (selectedTransformation) {
    if (selectedTransformation.isStoryboard) {
        isGenerateDisabled = isLoading || !storyboardBackground || !storyboardReference;
    } else if (selectedTransformation.isMultiImage && !selectedTransformation.isSecondaryOptional) {
        isGenerateDisabled = isLoading || !primaryImageUrl || !secondaryImageUrl;
    } else if (selectedTransformation.isPresetBased) {
        isGenerateDisabled = isLoading || !primaryImageUrl || !selectedPresetKey;
    } else {
        isGenerateDisabled = isLoading || !primaryImageUrl;
    }

    // For cameraAngle, custom prompt is optional if a preset is selected, so we don't block validation on custom prompt only
    if (selectedTransformation.hasCustomPrompt && !selectedTransformation.isPresetBased && !selectedTransformation.isCustomPromptOptional) {
        isGenerateDisabled = isGenerateDisabled || !customPrompt.trim();
    }
  }

  const renderInputUI = () => {
    if (!selectedTransformation) return null;

    if (selectedTransformation.isStoryboard) {
      return (
        <div className="flex flex-col gap-6">
            <UploaderBox
                title={t(selectedTransformation.backgroundUploaderTitle!)}
                description={t(selectedTransformation.backgroundUploaderDescription!)}
                imageUrl={storyboardBackground}
                onImageSelect={(_, dataUrl) => setStoryboardBackground(dataUrl)}
                onClear={() => setStoryboardBackground(null)}
            />
            <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t(selectedTransformation.characterUploaderTitle!)}</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">{t(selectedTransformation.characterUploaderDescription!)}</p>
                <MultiImageGridUploader
                    imageUrls={storyboardCharacters}
                    onImagesChange={setStoryboardCharacters}
                    maxImages={3}
                />
            </div>
            <UploaderBox
                title={t(selectedTransformation.referenceUploaderTitle!)}
                description={t(selectedTransformation.referenceUploaderDescription!)}
                imageUrl={storyboardReference}
                onImageSelect={(_, dataUrl) => setStoryboardReference(dataUrl)}
                onClear={() => setStoryboardReference(null)}
            />
             {selectedTransformation.hasCustomPrompt && (
                <div className="animate-fade-in-fast">
                  <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t(selectedTransformation.customPromptLabelKey!)}
                  </label>
                  <textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                    rows={3}
                  />
                </div>
              )}
        </div>
      );
    }

    if (selectedTransformation.isPresetBased) {
      return (
        <>
          <ImageEditorCanvas
            onImageSelect={handlePrimaryImageSelect}
            initialImageUrl={primaryImageUrl}
            onMaskChange={() => {}}
            onClearImage={handleClearPrimaryImage}
            isMaskToolActive={false}
          />
          {primaryImageUrl && (
            <div className="mt-4 space-y-4 animate-fade-in-fast">
              <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{t(selectedTransformation.descriptionKey!)}</p>

              <div className="grid grid-cols-1 gap-2">
                {selectedTransformation.presets?.map(preset => (
                  <div key={preset.key}>
                    <button
                      onClick={() => {
                        setSelectedPresetKey(preset.key);
                        if (preset.control) {
                          setCameraControls({ [preset.control.key]: preset.control.defaultValue });
                        } else {
                          setCameraControls({});
                        }
                      }}
                      className={`w-full text-left py-2 px-3 text-sm font-semibold rounded-md transition-all duration-200 ${
                        selectedPresetKey === preset.key
                          ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)] shadow-md shadow-[var(--accent-shadow)]'
                          : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)]'
                      }`}
                    >
                      {t(preset.labelKey)}
                    </button>
                    {selectedPresetKey === preset.key && preset.control && (
                      <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-lg animate-fade-in-fast flex items-center gap-4 border border-[var(--border-primary)]">
                        {preset.referenceImage && (
                          <div className="flex-shrink-0 w-16 h-16 bg-[var(--bg-primary)] rounded-md flex items-center justify-center p-2">
                            <img src={preset.referenceImage} alt={t(preset.labelKey)} className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className="flex-grow">
                          <div className="flex justify-between items-center mb-1">
                            <label htmlFor={preset.control.key} className="text-sm font-medium text-[var(--text-primary)]">{t(preset.control.labelKey)}</label>
                            <span className="text-xs font-mono bg-[var(--bg-primary)] px-2 py-1 rounded">
                              {cameraControls[preset.control.key] ?? preset.control.defaultValue}{preset.control.unit}
                            </span>
                          </div>
                          <input
                            id={preset.control.key}
                            type="range"
                            min={preset.control.min}
                            max={preset.control.max}
                            value={cameraControls[preset.control.key] ?? preset.control.defaultValue}
                            onChange={(e) => setCameraControls(prev => ({ ...prev, [preset.control.key]: Number(e.target.value) }))}
                            className="w-full h-2 bg-[var(--text-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

               {/* Add Reference Images Upload for Camera Angle if needed */}
               {selectedTransformation.referenceUploaderTitle && (
                    <div className="mt-4">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t(selectedTransformation.referenceUploaderTitle)}</h3>
                        <p className="text-xs text-[var(--text-tertiary)] mb-2">{t(selectedTransformation.referenceUploaderDescription!)}</p>
                        <MultiImageGridUploader
                            imageUrls={cameraAngleReferences}
                            onImagesChange={setCameraAngleReferences}
                            maxImages={3}
                        />
                    </div>
               )}

              {/* Add Custom Prompt for Camera Angle if needed */}
              {selectedTransformation.hasCustomPrompt && (
                <div className="mt-4">
                  <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t(selectedTransformation.customPromptLabelKey!)}
                  </label>
                  <textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </>
      );
    }

    if (selectedTransformation.controls && !selectedTransformation.isMultiImage) {
      return (
        <>
          <ImageEditorCanvas
            onImageSelect={handlePrimaryImageSelect}
            initialImageUrl={primaryImageUrl}
            onMaskChange={() => {}} // No-op, no mask for this feature
            onClearImage={handleClearPrimaryImage}
            isMaskToolActive={false} // Mask is never active
          />
          {primaryImageUrl && (
            <div className="mt-4 space-y-4 animate-fade-in-fast">
              {selectedTransformation.controls.map(control => (
                <div key={control.key}>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor={control.key} className="text-sm font-medium text-[var(--text-primary)]">{t(control.labelKey)}</label>
                    <span className="text-xs font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded">
                      {cameraControls[control.key] ?? control.defaultValue}{control.unit}
                    </span>
                  </div>
                  <input
                    id={control.key}
                    type="range"
                    min={control.min}
                    max={control.max}
                    value={cameraControls[control.key] ?? control.defaultValue}
                    onChange={(e) => setCameraControls(prev => ({ ...prev, [control.key]: Number(e.target.value) }))}
                    className="w-full h-2 bg-[var(--text-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                  />
                </div>
              ))}
               {/* Custom Prompt for single image controls */}
              {selectedTransformation.hasCustomPrompt && (
                <div className="mt-4">
                  <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t(selectedTransformation.customPromptLabelKey!)}
                  </label>
                  <textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </>
      );
    }

    if (selectedTransformation.isMultiImage) {
        if (selectedTransformation.hasMask) {
             return (
                <div className="flex flex-col gap-6">
                    <div>
                        <ImageEditorCanvas
                            onImageSelect={handlePrimaryImageSelect}
                            initialImageUrl={primaryImageUrl}
                            onMaskChange={setMaskDataUrl}
                            onClearImage={handleClearPrimaryImage}
                            isMaskToolActive={activeTool === 'mask'}
                        />
                        {primaryImageUrl && (
                            <div className="mt-4">
                                <button
                                    onClick={toggleMaskTool}
                                    className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
                                        activeTool === 'mask' ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)]' : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)]'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                    <span>{t('imageEditor.drawMask')}</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <UploaderBox
                        title={t(selectedTransformation.secondaryUploaderTitle!)}
                        description={t(selectedTransformation.secondaryUploaderDescription!)}
                        imageUrl={secondaryImageUrl}
                        onImageSelect={handleSecondaryImageSelect}
                        onClear={handleClearSecondaryImage}
                    />

                    {selectedTransformation.controls && (
                      <div className="space-y-4 animate-fade-in-fast">
                        {selectedTransformation.controls.map(control => (
                          <div key={control.key}>
                            <div className="flex justify-between items-center mb-1">
                              <label htmlFor={control.key} className="text-sm font-medium text-[var(--text-primary)]">{t(control.labelKey)}</label>
                              <span className="text-xs font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded">
                                {cameraControls[control.key] ?? control.defaultValue}{control.unit}
                              </span>
                            </div>
                            <input
                              id={control.key}
                              type="range"
                              min={control.min}
                              max={control.max}
                              value={cameraControls[control.key] ?? control.defaultValue}
                              onChange={(e) => setCameraControls(prev => ({ ...prev, [control.key]: Number(e.target.value) }))}
                              className="w-full h-2 bg-[var(--text-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedTransformation.hasCustomPrompt && (
                        <div className="animate-fade-in-fast">
                          <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                            {t(selectedTransformation.customPromptLabelKey!)}
                          </label>
                          <textarea
                            id="custom-prompt"
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                            rows={3}
                          />
                        </div>
                      )}
                </div>
            );
        }
      return (
        <div className="flex flex-col gap-4">
            <MultiImageUploader
              onPrimarySelect={handlePrimaryImageSelect}
              onSecondarySelect={handleSecondaryImageSelect}
              primaryImageUrl={primaryImageUrl}
              secondaryImageUrl={secondaryImageUrl}
              onClearPrimary={handleClearPrimaryImage}
              onClearSecondary={handleClearSecondaryImage}
              primaryTitle={selectedTransformation.primaryUploaderTitle ? t(selectedTransformation.primaryUploaderTitle) : undefined}
              primaryDescription={selectedTransformation.primaryUploaderDescription ? t(selectedTransformation.primaryUploaderDescription) : undefined}
              secondaryTitle={selectedTransformation.secondaryUploaderTitle ? t(selectedTransformation.secondaryUploaderTitle) : undefined}
              secondaryDescription={selectedTransformation.secondaryUploaderDescription ? t(selectedTransformation.secondaryUploaderDescription) : undefined}
            />
            {selectedTransformation.hasCustomPrompt && (
                <div className="animate-fade-in-fast">
                  <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
                    {t(selectedTransformation.customPromptLabelKey!)}
                  </label>
                  <textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
                    rows={3}
                  />
                </div>
              )}
        </div>
      );
    }

    return (
      <>
        <ImageEditorCanvas
          onImageSelect={handlePrimaryImageSelect}
          initialImageUrl={primaryImageUrl}
          onMaskChange={setMaskDataUrl}
          onClearImage={handleClearPrimaryImage}
          isMaskToolActive={activeTool === 'mask'}
        />
        {primaryImageUrl && selectedTransformation.hasMask && (
          <div className="mt-4">
            <button
              onClick={toggleMaskTool}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-md transition-colors duration-200 ${
                activeTool === 'mask' ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--text-on-accent)]' : 'bg-[rgba(107,114,128,0.2)] hover:bg-[rgba(107,114,128,0.4)]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
              <span>{t('imageEditor.drawMask')}</span>
            </button>
          </div>
        )}
        {primaryImageUrl && selectedTransformation.hasCustomPrompt && (
          <div className="mt-4 animate-fade-in-fast">
            <label htmlFor="custom-prompt" className="block text-sm font-semibold text-[var(--text-primary)] mb-2">
              {t(selectedTransformation.customPromptLabelKey!)}
            </label>
            <textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={t(selectedTransformation.customPromptPlaceholderKey!)}
              className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-colors text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
              rows={3}
            />
          </div>
        )}
      </>
    );
  };

  const mainButtonText = t('app.generateImage');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans fixed inset-0 z-50 overflow-y-auto">
      <header className="bg-[var(--bg-card-alpha)] backdrop-blur-lg sticky top-0 z-20 p-4 border-b border-[var(--border-primary)]">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
             <button
                onClick={onClose}
                className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-[var(--text-primary)] bg-[rgba(107,114,128,0.2)] rounded-md hover:bg-red-500 hover:text-white transition-colors duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">{t('app.backToHome')}</span>
            </button>
            <h1
                className="text-xl md:text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 cursor-pointer"
                onClick={handleResetApp}
            >
                Alpha Studio <span className="font-light hidden sm:inline">| {t('app.workspace')}</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleHistoryPanel}
              className="flex items-center gap-2 py-2 px-3 text-sm font-semibold text-[var(--text-primary)] bg-[rgba(107,114,128,0.2)] rounded-md hover:bg-[rgba(107,114,128,0.4)] transition-colors duration-200"
              aria-label="Toggle generation history"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">{t('app.history')}</span>
            </button>
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main>
        {!selectedTransformation ? (
          <TransformationSelector
            transformations={transformations}
            onSelect={handleSelectTransformation}
            hasPreviousResult={!!primaryImageUrl}
            onOrderChange={setTransformations}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        ) : (
          <div className="container mx-auto p-2 sm:p-4 md:p-8 animate-fade-in">
            <div className="mb-8">
            <button
                onClick={handleBackToSelection}
                className="flex items-center gap-2 text-[var(--accent-primary)] hover:text-white transition-all duration-200 py-2 px-4 rounded-lg bg-white/5 border border-white/10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="font-bold uppercase tracking-widest text-[10px]">{t('app.chooseAnotherEffect')}</span>
            </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Column */}
              <div className="flex flex-col gap-6 p-6 bg-[var(--bg-card-alpha)] backdrop-blur-lg rounded-xl border border-[var(--border-primary)] shadow-2xl shadow-black/20">
                 <h2 className="text-xl font-black mb-1 text-white uppercase flex items-center gap-3">
                    <div className="w-8 h-8 text-[var(--accent-primary)]" dangerouslySetInnerHTML={{ __html: selectedTransformation.icon }} />
                    {t(selectedTransformation.titleKey)}
                </h2>
                <div>
                    <div className="mb-4">
                      <p className="text-[var(--text-secondary)] font-medium leading-relaxed">{t(selectedTransformation.descriptionKey!)}</p>
                    </div>

                    {renderInputUI()}

                    <button
                        onClick={handleGenerateImage}
                        disabled={isGenerateDisabled}
                        className="w-full mt-6 py-4 px-4 bg-[var(--accent-primary)] text-black font-black rounded-xl shadow-lg shadow-[var(--accent-shadow)] hover:scale-[1.02] active:scale-95 disabled:bg-[var(--bg-disabled)] disabled:text-[var(--text-disabled)] disabled:shadow-none disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 uppercase tracking-widest"
                    >
                        {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>{t('app.generating')}</span>
                        </>
                        ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>{mainButtonText}</span>
                        </>
                        )}
                    </button>
                </div>
              </div>

              {/* Output Column */}
              <div className="flex flex-col p-6 bg-[rgba(31,31,31,0.7)] backdrop-blur-lg rounded-xl border border-gray-800 shadow-2xl shadow-black/20">
                <h2 className="text-xl font-black mb-4 text-white uppercase self-start tracking-tight">{t('app.result')}</h2>
                {isLoading && <div className="flex-grow flex items-center justify-center"><LoadingSpinner message={loadingMessage} /></div>}
                {error && <div className="flex-grow flex items-center justify-center w-full"><ErrorMessage message={error} /></div>}

                {!isLoading && !error && generatedContent && (
                    <ResultDisplay
                        content={generatedContent}
                        onUseImageAsInput={handleUseImageAsInput}
                        onImageClick={handleOpenPreview}
                        onSaveToWorkflow={handleSaveToWorkflow}
                    />
                )}
                {!isLoading && !error && !generatedContent && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 gap-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-xs font-bold uppercase tracking-widest">{t('app.yourImageWillAppear')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <ImagePreviewModal imageUrl={previewImageUrl} onClose={handleClosePreview} />
      <HistoryPanel
        isOpen={isHistoryPanelOpen}
        onClose={toggleHistoryPanel}
        history={history}
        onUseImage={handleUseHistoryImageAsInput}
        onDownload={handleDownloadFromHistory}
      />
    </div>
  );
};

export default StudioTool;
