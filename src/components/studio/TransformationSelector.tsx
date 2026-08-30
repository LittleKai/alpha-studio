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

interface ToolTone {
  icon: string;
  hoverText: string;
  bg: string;
  border: string;
  shadow: string;
}

const TOOL_TONES: Record<string, ToolTone> = {
  storyboard: {
    icon: 'text-amber-500 dark:text-amber-400',
    hoverText: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
    bg: 'bg-amber-500/10 group-hover:bg-amber-500/20',
    border: 'hover:border-amber-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]',
  },
  boothExtraction: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    hoverText: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    border: 'hover:border-emerald-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
  },
  zoomObject: {
    icon: 'text-sky-500 dark:text-sky-400',
    hoverText: 'group-hover:text-sky-500 dark:group-hover:text-sky-400',
    bg: 'bg-sky-500/10 group-hover:bg-sky-500/20',
    border: 'hover:border-sky-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(14,165,233,0.25)]',
  },
  stageEffect: {
    icon: 'text-violet-500 dark:text-violet-400',
    hoverText: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
    bg: 'bg-violet-500/10 group-hover:bg-violet-500/20',
    border: 'hover:border-violet-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
  },
  eventPerformance: {
    icon: 'text-rose-500 dark:text-rose-400',
    hoverText: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
    bg: 'bg-rose-500/10 group-hover:bg-rose-500/20',
    border: 'hover:border-rose-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(244,63,94,0.25)]',
  },
  productMockup: {
    icon: 'text-cyan-500 dark:text-cyan-400',
    hoverText: 'group-hover:text-cyan-500 dark:group-hover:text-cyan-400',
    bg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
    border: 'hover:border-cyan-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(6,182,212,0.25)]',
  },
  eventDesign3d: {
    icon: 'text-indigo-500 dark:text-indigo-400',
    hoverText: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
    bg: 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
    border: 'hover:border-indigo-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.25)]',
  },
  roomEmpty: {
    icon: 'text-teal-500 dark:text-teal-400',
    hoverText: 'group-hover:text-teal-500 dark:group-hover:text-teal-400',
    bg: 'bg-teal-500/10 group-hover:bg-teal-500/20',
    border: 'hover:border-teal-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(20,184,166,0.25)]',
  },
  cameraAngle: {
    icon: 'text-orange-500 dark:text-orange-400',
    hoverText: 'group-hover:text-orange-500 dark:group-hover:text-orange-400',
    bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
    border: 'hover:border-orange-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(249,115,22,0.25)]',
  },
  figurine: {
    icon: 'text-fuchsia-500 dark:text-fuchsia-400',
    hoverText: 'group-hover:text-fuchsia-500 dark:group-hover:text-fuchsia-400',
    bg: 'bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20',
    border: 'hover:border-fuchsia-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(217,70,239,0.25)]',
  },
  wireframe: {
    icon: 'text-blue-500 dark:text-blue-400',
    hoverText: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
    bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    border: 'hover:border-blue-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.25)]',
  },
  vectorFrom3d: {
    icon: 'text-lime-500 dark:text-lime-400',
    hoverText: 'group-hover:text-lime-500 dark:group-hover:text-lime-400',
    bg: 'bg-lime-500/10 group-hover:bg-lime-500/20',
    border: 'hover:border-lime-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(132,204,22,0.25)]',
  },
  pose: {
    icon: 'text-purple-500 dark:text-purple-400',
    hoverText: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
    bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    border: 'hover:border-purple-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.25)]',
  },
  expressionReference: {
    icon: 'text-yellow-500 dark:text-yellow-400',
    hoverText: 'group-hover:text-yellow-500 dark:group-hover:text-yellow-400',
    bg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
    border: 'hover:border-yellow-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(234,179,8,0.25)]',
  },
  lineArt: {
    icon: 'text-slate-600 dark:text-slate-300',
    hoverText: 'group-hover:text-slate-900 dark:group-hover:text-white',
    bg: 'bg-slate-500/10 group-hover:bg-slate-500/20',
    border: 'hover:border-slate-400/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(148,163,184,0.25)]',
  },
  colorPalette: {
    icon: 'text-violet-500 dark:text-violet-400',
    hoverText: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
    bg: 'bg-violet-500/10 group-hover:bg-violet-500/20',
    border: 'hover:border-violet-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.25)]',
  },
  plushie: {
    icon: 'text-pink-500 dark:text-pink-400',
    hoverText: 'group-hover:text-pink-500 dark:group-hover:text-pink-400',
    bg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
    border: 'hover:border-pink-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(236,72,153,0.25)]',
  },
  twoDToThreeD: {
    icon: 'text-emerald-500 dark:text-emerald-400',
    hoverText: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    border: 'hover:border-emerald-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]',
  },
  paintingProcess: {
    icon: 'text-rose-500 dark:text-rose-400',
    hoverText: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
    bg: 'bg-rose-500/10 group-hover:bg-rose-500/20',
    border: 'hover:border-rose-500/50',
    shadow: 'hover:shadow-[0_0_24px_rgba(244,63,94,0.25)]',
  },
};

const DEFAULT_TONE: ToolTone = {
  icon: 'text-[var(--accent-primary)]',
  hoverText: 'group-hover:text-[var(--accent-primary)]',
  bg: 'bg-[var(--accent-primary)]/10 group-hover:bg-[var(--accent-primary)]/20',
  border: 'hover:border-[var(--accent-primary)]/50',
  shadow: 'hover:shadow-[0_0_24px_rgba(0,212,255,0.25)]',
};

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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 md:gap-5">
      {items.map((trans, index) => {
        const tone = TOOL_TONES[trans.key] || DEFAULT_TONE;
        return (
          <button
            key={trans.key}
            draggable={!activeCategory}
            onDragStart={(e) => !activeCategory && handleDragStart(e, index)}
            onDragEnter={(e) => !activeCategory && handleDragEnter(e, index)}
            onDragEnd={!activeCategory ? handleDragEnd : undefined}
            onDragOver={!activeCategory ? handleDragOver : undefined}
            onClick={() => handleItemClick(trans)}
            className={`group flex flex-col items-center justify-center text-center p-3.5 sm:p-5 aspect-square bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] ${tone.border} ${tone.shadow} transition-all duration-300 ease-out transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] relative overflow-hidden ${
              !activeCategory ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            } ${dragging && !activeCategory ? 'border-dashed' : ''} shadow-lg shadow-black/10`}
          >
            <div
              className={`w-12 h-12 md:w-14 md:h-14 mb-3 rounded-2xl flex items-center justify-center ${tone.bg} ${tone.icon} transition-all duration-300 group-hover:scale-110 p-2.5 shadow-inner`}
            >
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: trans.icon }}
              />
            </div>
            <span className={`font-black text-[10px] sm:text-[11px] md:text-xs leading-tight uppercase tracking-wider ${tone.icon} group-hover:scale-105 group-hover:brightness-125 transition-all duration-300 px-1 line-clamp-2`}>
              {t(trans.titleKey)}
            </span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 animate-fade-in max-w-7xl relative">
      {!activeCategory ? (
        <>
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent uppercase tracking-tight">
              {t('transformationSelector.title')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
              {hasPreviousResult
                ? t('transformationSelector.descriptionWithResult')
                : t('transformationSelector.description')
              }
            </p>
          </div>
          {renderGrid(transformations)}
        </>
      ) : (
        <div>
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 text-[var(--accent-primary)] hover:text-white transition-all duration-200 py-2.5 px-5 rounded-xl bg-white/5 border border-white/10 hover:bg-[var(--accent-primary)]/20 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="font-black uppercase tracking-widest text-[10px]">{t('app.back')}</span>
            </button>
            <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-primary)] to-[var(--accent-secondary)] bg-clip-text text-transparent flex items-center gap-3 uppercase tracking-tight">
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
