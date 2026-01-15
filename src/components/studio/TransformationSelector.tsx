import React from 'react';
import { useTranslation } from '../../i18n/context';
import { TRANSFORMATIONS } from '../../constants';
import type { Transformation } from '../../types';

interface TransformationSelectorProps {
  selectedTransformation: Transformation | null;
  onSelect: (transformation: Transformation) => void;
}

const TransformationSelector: React.FC<TransformationSelectorProps> = ({ selectedTransformation, onSelect }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {t('studio.selectTransformation')}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {TRANSFORMATIONS.map((transformation) => {
          const isSelected = selectedTransformation?.key === transformation.key;
          return (
            <button
              key={transformation.key}
              onClick={() => onSelect(transformation)}
              className={`group flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)]'
                  : 'border-transparent bg-[var(--bg-secondary)] hover:border-[var(--border-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors ${
                  isSelected ? 'text-[var(--accent-primary)]' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: transformation.icon }}
              />
              <span
                className={`text-xs font-medium text-center leading-tight ${
                  isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t(transformation.titleKey)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TransformationSelector;
