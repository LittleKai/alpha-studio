/**
 * AI Studio — shell
 *
 * Three tabs:
 *   Image / Video → Flow pipeline (backend → flow-agent → Google Labs Flow)
 *   Edit          → Gemini SDK direct (mask, multi-image, storyboard)
 */
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from '../../i18n/context';
import Login from '../ui/Login';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { ImageConfig, VideoConfig } from './StudioFlowGen';

const StudioFlowGen = lazy(() => import('./StudioFlowGen'));
const StudioGeminiEdit = lazy(() => import('./StudioGeminiEdit'));

type Tab = 'image' | 'video' | 'edit';

interface StudioToolProps {
  onBack: () => void;
}

export default function StudioTool({ onBack }: StudioToolProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('image');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lifted state — kept here so prompt + ref-image attachments survive
  // when the user switches to the Edit tab (which unmounts StudioFlowGen)
  // and back. Image and video configs are independent (different caps,
  // different default model), but `prompt` is intentionally shared so
  // users can iterate on the same idea across image/video modes.
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

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Back button */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={onBack}
          className="p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg hover:bg-[var(--bg-secondary)] transition-all hover:scale-105"
          title={t('common.back')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent drop-shadow-sm">
            {t('studio.title')}
          </h1>
          <p className="mt-2 text-base md:text-lg font-semibold text-[var(--text-primary)]">
            {t('studio.subtitle')}
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-[var(--bg-secondary)] rounded-xl w-fit">
          {(['image', 'video', 'edit'] as Tab[]).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === k
                  ? 'bg-[var(--accent-primary)] text-black'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t(`studio.tabs.${k}`)}
            </button>
          ))}
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="md" />
          </div>
        }>
          {tab === 'edit' ? (
            <StudioGeminiEdit onRequireLogin={() => setShowLoginModal(true)} />
          ) : (
            <StudioFlowGen
              mode={tab}
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
