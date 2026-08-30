/**
 * AI Studio — tool shell
 *
 * Rendered for sub-routes of the /studio hub:
 *   mode='generate' → Flow pipeline with image / video sub-tabs
 *   mode='edit'     → Gemini SDK direct (mask, multi-image, storyboard)
 */
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import Login from '../ui/Login';
import LoadingSpinner from '../ui/LoadingSpinner';
import StudioBackButton from './StudioBackButton';
import type { ImageConfig, VideoConfig } from './StudioFlowGen';

const StudioFlowGen = lazy(() => import('./StudioFlowGen'));
const StudioGeminiEdit = lazy(() => import('./StudioGeminiEdit'));

type GenTab = 'image' | 'video';

interface StudioToolProps {
  onBack: () => void;
  mode: 'generate' | 'edit';
}

export default function StudioTool({ onBack, mode }: StudioToolProps) {
  const { t } = useTranslation();
  const [genTab, setGenTab] = useState<GenTab>('image');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lifted state — shared between image and video sub-tabs so prompt + ref
  // attachments survive when the user toggles between them.
  const [prompt, setPrompt] = useState<string>('');
  const [imageCfg, setImageCfg] = useState<ImageConfig>({
    model: 'banana2',
    ratio: '16:9',
    refImages: [],
  });
  const [videoCfg, setVideoCfg] = useState<VideoConfig>({
    model: 'veo-lite',
    ratio: '16:9',
    subtype: 'Ingredients',
    duration: '8s',
    refImages: [],
  });

  const headerSubtitleKey =
    mode === 'edit' ? 'studio.hub.cards.edit.desc' : 'studio.subtitle';
  const headerTitleKey =
    mode === 'edit' ? 'studio.hub.cards.edit.title' : 'studio.hub.cards.generate.title';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] relative overflow-hidden">
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--accent-primary)]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-[var(--accent-secondary)]/10 blur-3xl pointer-events-none rounded-full" />

      <StudioBackButton onClick={onBack} />

      <main className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent drop-shadow-sm">
            {t(headerTitleKey)}
          </h1>
          <p className="mt-2 text-base md:text-lg font-semibold text-[var(--text-primary)]">
            {t(headerSubtitleKey)}
          </p>
        </header>

        {mode === 'generate' && (
          <div className="flex gap-2 mb-6 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl w-fit shadow-sm">
            <button
              onClick={() => setGenTab('image')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                genTab === 'image'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <span>{t('studio.tabs.image')}</span>
            </button>

            <button
              onClick={() => setGenTab('video')}
              className={`flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                genTab === 'video'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/25 scale-[1.02]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              <span>{t('studio.tabs.video')}</span>
            </button>
          </div>
        )}

        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="md" />
          </div>
        }>
          {mode === 'edit' ? (
            <StudioGeminiEdit onRequireLogin={() => setShowLoginModal(true)} />
          ) : (
            <StudioFlowGen
              mode={genTab}
              onRequireLogin={() => setShowLoginModal(true)}
              prompt={prompt}
              setPrompt={setPrompt}
              imageCfg={imageCfg}
              setImageCfg={setImageCfg}
              videoCfg={videoCfg}
              setVideoCfg={setVideoCfg}
            />
          )}
        </Suspense>
      </main>

      {showLoginModal && (
        <Login
          onLoginSuccess={() => setShowLoginModal(false)}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}
