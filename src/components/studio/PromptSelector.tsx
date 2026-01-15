import React from 'react';
import { useTranslation } from '../../i18n/context';
import type { Transformation, Preset, Control } from '../../types';

interface PromptSelectorProps {
  transformation: Transformation;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
  selectedPreset: Preset | null;
  onPresetSelect: (preset: Preset | null) => void;
  controlValues: Record<string, number>;
  onControlChange: (key: string, value: number) => void;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({
  transformation,
  customPrompt,
  onCustomPromptChange,
  selectedPreset,
  onPresetSelect,
  controlValues,
  onControlChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
      {/* Description */}
      {transformation.descriptionKey && (
        <p className="text-sm text-[var(--text-secondary)]">
          {t(transformation.descriptionKey)}
        </p>
      )}

      {/* Preset Selection */}
      {transformation.isPresetBased && transformation.presets && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {t('studio.selectPreset')}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {transformation.presets.map((preset) => {
              const isSelected = selectedPreset?.key === preset.key;
              return (
                <button
                  key={preset.key}
                  onClick={() => onPresetSelect(preset)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]'
                      : 'border-transparent bg-[var(--bg-tertiary)] hover:border-[var(--border-secondary)]'
                  }`}
                >
                  {preset.referenceImage && (
                    <img
                      src={preset.referenceImage}
                      alt={t(preset.labelKey)}
                      className="w-8 h-8 object-contain"
                    />
                  )}
                  <span className="text-xs text-[var(--text-secondary)] text-center">
                    {t(preset.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Controls (Sliders) */}
      {transformation.controls && transformation.controls.length > 0 && (
        <div className="flex flex-col gap-3">
          {transformation.controls.map((control: Control) => (
            <div key={control.key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  {t(control.labelKey)}
                </label>
                <span className="text-sm text-[var(--accent-primary)]">
                  {controlValues[control.key] ?? control.defaultValue}
                  {control.unit}
                </span>
              </div>
              <input
                type="range"
                min={control.min}
                max={control.max}
                value={controlValues[control.key] ?? control.defaultValue}
                onChange={(e) => onControlChange(control.key, Number(e.target.value))}
                className="w-full h-2 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Custom Prompt Input */}
      {transformation.hasCustomPrompt && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            {transformation.customPromptLabelKey
              ? t(transformation.customPromptLabelKey)
              : t('studio.customPrompt')}
            {transformation.isCustomPromptOptional && (
              <span className="text-[var(--text-tertiary)] ml-1">({t('studio.optional')})</span>
            )}
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder={
              transformation.customPromptPlaceholderKey
                ? t(transformation.customPromptPlaceholderKey)
                : t('studio.enterPrompt')
            }
            rows={3}
            className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
          />
        </div>
      )}
    </div>
  );
};

export default PromptSelector;
