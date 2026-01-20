import React, { useRef, useState } from 'react';
import type { Transformation } from '../../types';
import { useTranslation } from '../../i18n/context';

interface TransformationSelectorProps {
  transformations: Transformation[];
  onSelect: (transformation: Transformation) => void;
  hasPreviousResult: boolean;
  onOrderChange: (newOrder: Transformation[]) => void;
  activeCategory: Transformation | null;
  setActiveCategory: (category: Transformation | null) => void;
}

const TransformationSelector: React.FC<TransformationSelectorProps> = ({
  transformations,
  onSelect,
  hasPreviousResult,
  onOrderChange,
  activeCategory,
  setActiveCategory
}) => {
  const { t } = useTranslation();
  const dragItemIndex = useRef<number | null>(null);
  const dragOverItemIndex = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragItemIndex.current = index;
    setDragging(true);
    const target = e.currentTarget;
    setTimeout(() => {
      target.classList.add('opacity-40', 'scale-95');
    }, 0);
  };

  const handleDragEnter = (_e: React.DragEvent<HTMLButtonElement>, index: number) => {
    dragOverItemIndex.current = index;
  };

  const handleDragEnd = (e: React.DragEvent<HTMLButtonElement>) => {
    setDragging(false);
    e.currentTarget.classList.remove('opacity-40', 'scale-95');

    if (dragItemIndex.current !== null && dragOverItemIndex.current !== null && dragItemIndex.current !== dragOverItemIndex.current) {
      const newTransformations = [...transformations];
      const draggedItemContent = newTransformations.splice(dragItemIndex.current, 1)[0];
      newTransformations.splice(dragOverItemIndex.current, 0, draggedItemContent);
      onOrderChange(newTransformations);
    }

    dragItemIndex.current = null;
    dragOverItemIndex.current = null;
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const handleItemClick = (item: Transformation) => {
    if (item.items && item.items.length > 0) {
      setActiveCategory(item);
    } else {
      onSelect(item);
    }
  };

  const renderGrid = (items: Transformation[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5">
      {items.map((trans, index) => (
        <button
          key={trans.key}
          draggable={!activeCategory}
          onDragStart={(e) => !activeCategory && handleDragStart(e, index)}
          onDragEnter={(e) => !activeCategory && handleDragEnter(e, index)}
          onDragEnd={!activeCategory ? handleDragEnd : undefined}
          onDragOver={!activeCategory ? handleDragOver : undefined}
          onClick={() => handleItemClick(trans)}
          className={`group flex flex-col items-center justify-center text-center p-3 sm:p-4 aspect-square bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] ${
            !activeCategory ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
          } ${dragging && !activeCategory ? 'border-dashed' : ''} shadow-lg shadow-black/10`}
        >
          <div
            className="w-10 h-10 md:w-12 md:h-12 mb-3 text-[var(--accent-primary)] group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_6px_rgba(0,212,255,0.4)]"
            dangerouslySetInnerHTML={{ __html: trans.icon }}
          />
          <span className="font-bold text-[9px] sm:text-[10px] md:text-[11px] leading-tight uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-300 px-1 line-clamp-2">
            {t(trans.titleKey)}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in max-w-7xl">
      {!activeCategory ? (
        <>
          <h2 className="text-3xl sm:text-5xl font-black text-center mb-4 text-[var(--text-primary)] uppercase tracking-tighter drop-shadow-lg">
            {t('transformationSelector.title')}
          </h2>
          <p className="text-sm sm:text-lg text-center text-[var(--text-secondary)] mb-12 max-w-3xl mx-auto font-medium leading-relaxed opacity-80">
            {hasPreviousResult
              ? t('transformationSelector.descriptionWithResult')
              : t('transformationSelector.description')
            }
          </p>
          {renderGrid(transformations)}
        </>
      ) : (
        <div>
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 text-[var(--accent-primary)] hover:text-white transition-all duration-200 py-2.5 px-5 rounded-xl bg-white/5 border border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-black uppercase tracking-widest text-[10px]">{t('app.back')}</span>
            </button>
            <h2 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 uppercase tracking-tighter">
              <div className="w-9 h-9 text-[var(--accent-primary)]" dangerouslySetInnerHTML={{ __html: activeCategory.icon }} />
              {t(activeCategory.titleKey)}
            </h2>
          </div>
          {renderGrid(activeCategory.items || [])}
        </div>
      )}
    </div>
  );
};

export default TransformationSelector;
