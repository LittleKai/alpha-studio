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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <StudioBackButton onClick={onBack} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent drop-shadow-sm">
            {t(headerTitleKey)}
          </h1>
          <p className="mt-2 text-base md:text-lg font-semibold text-[var(--text-primary)]">
            {t(headerSubtitleKey)}
          </p>
        </header>

        {mode === 'generate' && (
          <div className="flex gap-2 mb-6 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit">
            {(['image', 'video'] as GenTab[]).map(k => (
              <button
                key={k}
                onClick={() => setGenTab(k)}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                  genTab === k
                    ? 'bg-[var(--accent-primary)] text-black'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t(`studio.tabs.${k}`)}
              </button>
            ))}
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
