import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  ImageGenerateInput,
  ImageModel,
  ImageRatio,
  StudioGeneration,
  StudioGenerationItem,
  StudioUsage,
  VideoGenerateInput,
  VideoModel,
  VideoRatio,
} from '../../services/studioService';
import {
  cancelStudioGen,
  generateImage,
  generateVideo,
  getStudioProgress,
  getStudioUsage,
  newGenId,
  saveGeneration,
  StudioApiError,
  deleteRefImage,
} from '../../services/studioService';
import type { StudioProgress } from '../../services/studioService';
import { uploadToB2 } from '../../services/b2StorageService';
import ErrorMessage from '../ui/ErrorMessage';
import ImagePreviewModal from '../modals/ImagePreviewModal';
import StudioHistoryDrawer from './StudioHistoryDrawer';
import { useTranslation } from '../../i18n/context';
import { useAuth } from '../../auth/context';

// Exported so the parent (StudioTool) can hold this state at its level —
// keeps prompt + ref-image attachments alive when the user switches to the
// Edit tab (which unmounts StudioFlowGen) and back.
export interface ImageConfig {
  model: ImageModel;
  ratio: ImageRatio;
  refImages: { file: File; dataUrl: string }[];   // up to MAX_REF_IMAGES
}

export type VideoSubtype = 'Frames' | 'Ingredients';
export type VideoDuration = '4s' | '6s' | '8s';

export interface VideoConfig {
  model: VideoModel;
  ratio: VideoRatio;
  subtype: VideoSubtype;
  duration: VideoDuration;
  refImages: { file: File; dataUrl: string }[];
}

interface StudioFlowGenProps {
  mode: 'image' | 'video';
  onRequireLogin: () => void;
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  imageCfg: ImageConfig;
  setImageCfg: Dispatch<SetStateAction<ImageConfig>>;
  videoCfg: VideoConfig;
  setVideoCfg: Dispatch<SetStateAction<VideoConfig>>;
}

// Per-mode reference-image cap.
//   image             → 4 (free-form context refs)
//   video Frames      → 2 (start frame + optional end frame)
//   video Ingredients → 3 (multi-ref per Flow's UI)
function maxRefsFor(mode: 'image' | 'video', subtype: VideoSubtype): number {
  if (mode === 'image') return 4;
  if (subtype === 'Frames') return 2;
  return 3;     // Ingredients
}

const IMAGE_MODELS: { id: ImageModel; nameKey: string; descKey: string }[] = [
  { id: 'banana2', nameKey: 'studio.model.banana2.name', descKey: 'studio.model.banana2.desc' },
  { id: 'banana-pro', nameKey: 'studio.model.bananaPro.name', descKey: 'studio.model.bananaPro.desc' },
];

// veo-lite is the default — listed first so it surfaces at the top of the
// dropdown.
const VIDEO_MODELS: { id: VideoModel; nameKey: string; descKey: string }[] = [
  { id: 'veo-lite',    nameKey: 'studio.model.veoLite.name',    descKey: 'studio.model.veoLite.desc' },
  { id: 'veo-fast',    nameKey: 'studio.model.veoFast.name',    descKey: 'studio.model.veoFast.desc' },
  { id: 'veo-quality', nameKey: 'studio.model.veoQuality.name', descKey: 'studio.model.veoQuality.desc' },
  { id: 'veo-lite-lp', nameKey: 'studio.model.veoLiteLp.name',  descKey: 'studio.model.veoLiteLp.desc' },
  { id: 'veo-fast-lp', nameKey: 'studio.model.veoFastLp.name',  descKey: 'studio.model.veoFastLp.desc' },
];

const IMAGE_RATIOS: { value: ImageRatio; labelKey: string }[] = [
  { value: '1:1', labelKey: 'studio.aspect.square' },
  { value: '16:9', labelKey: 'studio.aspect.landscape' },
  { value: '9:16', labelKey: 'studio.aspect.portrait' },
  { value: '4:3', labelKey: 'studio.aspect.landscape43' },
  { value: '3:4', labelKey: 'studio.aspect.portrait34' },
];

const VIDEO_RATIOS: { value: VideoRatio; labelKey: string }[] = [
  { value: '16:9', labelKey: 'studio.aspect.landscape' },
  { value: '9:16', labelKey: 'studio.aspect.portrait' },
];

// Camera/screenshot-style randomized filename. Pasted clipboard images
// arrive as "image.png" — that filename is both (a) unusable for picker
// matching in Flow's Frames dialog (every paste collides) and (b) a weak
// bot signal (real users paste files with varied OS-generated names).
//
// Output examples:
//   IMG_20260426_142309_a4b2.png
//   screenshot_2026-04-26_14h23m_e9f1.jpg
function randomImageFilename(originalName: string): string {
  const ext = (originalName.match(/\.[A-Za-z0-9]{2,5}$/)?.[0] || '.png').toLowerCase();
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const HH = pad(now.getHours());
  const MM = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  // 4-char hex suffix from crypto.getRandomValues so two pastes within
  // the same second still differ.
  let suffix = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    suffix = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    suffix = Math.random().toString(16).slice(2, 6);
  }
  // Pick one of two plausible patterns at random per call.
  const patterns = [
    `IMG_${yyyy}${mm}${dd}_${HH}${MM}${ss}_${suffix}${ext}`,
    `screenshot_${yyyy}-${mm}-${dd}_${HH}h${MM}m_${suffix}${ext}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)];
}


export default function StudioFlowGen({
  mode,
  onRequireLogin,
  prompt,
  setPrompt,
  imageCfg,
  setImageCfg,
  videoCfg,
  setVideoCfg,
}: StudioFlowGenProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const [usage, setUsage] = useState<StudioUsage | null>(null);

  const refreshUsage = useCallback(() => {
    if (!isAuthenticated) { setUsage(null); return; }
    getStudioUsage().then(setUsage).catch(() => {});
  }, [isAuthenticated]);
  useEffect(() => { refreshUsage(); }, [refreshUsage]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<StudioGeneration | null>(null);
  const [saveState, setSaveState] = useState<Record<number, 'idle' | 'saving' | 'saved' | 'failed'>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<StudioProgress | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Accumulated log lines shown below the composer during + after gen.
  // Survives across "result panel mounted" so the user can see what happened
  // even when looking at the result. Cleared at the START of every new gen.
  const [logLines, setLogLines] = useState<{ message: string; totalSeconds?: number }[]>([]);
  const [activeGenId, setActiveGenId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Local flag — set the moment the user clicks Cancel so the button
  // visibly switches to a "Đang hủy..." spinner (prevents double-click +
  // gives feedback even when the agent's gen call is still busy).
  const [cancelRequested, setCancelRequested] = useState(false);

  // Reset result when switching mode
  useEffect(() => { setGeneration(null); setError(null); setSaveState({}); }, [mode]);

  const remaining = useMemo(() => {
    if (!usage || usage.unlimited) return null;
    return mode === 'image' ? usage.image.remaining : usage.video.remaining;
  }, [usage, mode]);

  const handleGenerate = useCallback(async () => {
    if (!isAuthenticated) { onRequireLogin(); return; }
    if (!prompt.trim()) { setError(t('studio.promptRequired')); return; }

    if (mode === 'video') {
      // Frames subtype requires at least one frame (start). End frame
      // optional. Ingredients accepts 0+ refs.
      if (videoCfg.subtype === 'Frames' && videoCfg.refImages.length === 0) {
        setError(t('studio.error.framesNeedStart'));
        return;
      }
    }
    setError(null);
    setIsGenerating(true);
    setCancelRequested(false);
    setGeneration(null);
    setSaveState({});
    setLogLines([]);
    setProgress({ genId: '', progress: 0, status: 'starting', elapsedSeconds: 0 });

    const startedAt = Date.now();
    const append = (message: string) =>
      setLogLines(prev => [...prev, { message }]);

    // Poll /progress every 2s while generation is running. Cleared in
    // finally{} so the interval doesn't outlive the request.
    const genId = newGenId();
    setActiveGenId(genId);
    setProgress({ genId, progress: 0, status: 'starting', elapsedSeconds: 0 });
    let lastProgressBucket = -1;
    let lastPasteIdx = -1;
    let lastRetryAttempt = 0;
    const pollHandle = setInterval(() => {
      getStudioProgress(genId)
        .then(p => {
          setProgress(p);
          // Paste phase — emit one log per ref image as WAB clipboards them
          // into the Flow prompt area.
          if (p.status === 'pasting' && p.pasteCurrent && p.pasteTotal) {
            if (p.pasteCurrent > lastPasteIdx) {
              lastPasteIdx = p.pasteCurrent;
              setLogLines(prev => [
                ...prev,
                {
                  message: t('studio.log.pastingRef')
                    .replace('{i}', String(p.pasteCurrent))
                    .replace('{n}', String(p.pasteTotal)),
                },
              ]);
            }
          }
          // Retry phase — Flow rejected the result mid-gen with a "Failed"
          // tile (content moderation, third-party content). WAB clicks the
          // Retry button once; surface the event in the log so the user
          // knows why progress reset to 0%. retryAttempt is monotonic.
          if (
            p.status === 'retrying' &&
            p.retryAttempt &&
            p.retryAttempt > lastRetryAttempt
          ) {
            lastRetryAttempt = p.retryAttempt;
            // Reset bucket so the next progress tick after retry can log
            // milestones again from 0% upwards.
            lastProgressBucket = -1;
            setLogLines(prev => [
              ...prev,
              {
                message: t('studio.log.retrying')
                  .replace('{attempt}', String(p.retryAttempt))
                  .replace('{total}', String(p.retryTotal ?? 1))
                  .replace('{error}', (p.retryError || '').slice(0, 160)),
              },
            ]);
          }
          // Append one log line for every 20% bucket so the user sees
          // milestones without flooding (15+ lines for a 30s gen).
          if (p.status === 'generating') {
            const bucket = Math.floor(p.progress / 20);
            if (bucket > lastProgressBucket) {
              lastProgressBucket = bucket;
              setLogLines(prev => [
                ...prev,
                { message: t('studio.log.generating').replace('{pct}', String(p.progress)) },
              ]);
            }
          }
        })
        .catch(() => { /* swallow — request will surface real errors */ });
    }, 2000);

    // Upload each ref image to B2 (folder studio/refs/), then pass the array
    // of URLs to backend. Files cleaned up after gen completes (or by hourly
    // cron as a safety net).
    const refUrlsForCleanup: string[] = [];
    try {
      const refImages = mode === 'image' ? imageCfg.refImages : videoCfg.refImages;
      const refUrls: string[] = [];
      if (refImages.length > 0) {
        const authToken = localStorage.getItem('alpha_studio_token') || '';
        for (let i = 0; i < refImages.length; i++) {
          append(
            t('studio.log.uploadingRefN')
              .replace('{i}', String(i + 1))
              .replace('{n}', String(refImages.length))
          );
          // Rename clipboard "image.png" → camera-style random filename
          // before B2 upload, so flow-agent → WAB → Flow paste preserves
          // a unique, plausible-looking name (matches real user uploads
          // and lets the Frames dialog picker match by filename).
          const original = refImages[i].file;
          const renamed = new File(
            [original],
            randomImageFilename(original.name),
            { type: original.type || 'image/png', lastModified: original.lastModified },
          );
          const uploadResult = await uploadToB2(renamed, 'studio/refs', authToken);
          refUrls.push(uploadResult.url);
          refUrlsForCleanup.push(uploadResult.url);
        }
        append(t('studio.log.refUploaded'));
      }

      append(t('studio.log.sendingRequest'));
      let gen: StudioGeneration;
      if (mode === 'image') {
        const body: ImageGenerateInput = {
          prompt: prompt.trim(),
          model: imageCfg.model,
          ratio: imageCfg.ratio,
        };
        if (refUrls.length > 0) body.referenceImageUrls = refUrls;
        gen = await generateImage(body, genId);
      } else {
        const body: VideoGenerateInput = {
          prompt: prompt.trim(),
          model: videoCfg.model,
          ratio: videoCfg.ratio,
          subtype: videoCfg.subtype,
          duration: videoCfg.duration,
        };
        if (refUrls.length > 0) body.referenceImageUrls = refUrls;
        gen = await generateVideo(body, genId);
      }
      setGeneration(gen);
      refreshUsage();
      const totalSeconds = (Date.now() - startedAt) / 1000;
      setLogLines(prev => [
        ...prev,
        { message: t('studio.log.done'), totalSeconds },
      ]);
      // Keep the prompt so the user can iterate (tweak + regen). Only clear
      // the ref-image attachments since those were already uploaded to B2
      // and the URLs are short-lived; if the user wants the same refs they
      // re-attach (cheap UX, prevents accidental double-billing on B2).
      if (mode === 'image') setImageCfg(c => ({ ...c, refImages: [] }));
      else setVideoCfg(c => ({ ...c, refImages: [] }));
    } catch (err) {
      const totalSeconds = (Date.now() - startedAt) / 1000;
      let msg: string;
      if (err instanceof StudioApiError) {
        if (err.status === 429) msg = err.message;
        else if (err.status === 503) msg = t('studio.error.noServer');
        else if (err.status === 412) msg = err.message;
        else if (err.status === 422) msg = err.message;
        else if (err.status === 501) msg = err.message;
        else if (err.status === 502) msg = t('studio.error.agentFailed');
        else msg = err.message;
      } else {
        msg = err instanceof Error ? err.message : t('studio.unknownError');
      }
      setError(msg);
      setLogLines(prev => [...prev, { message: t('studio.log.failed'), totalSeconds }]);
    } finally {
      clearInterval(pollHandle);
      setIsGenerating(false);
      setCancelRequested(false);
      setProgress(null);
      setActiveGenId(null);
      // Best-effort cleanup of the temp B2 ref images. Cron sweeps anything
      // missed within the hour — never block the user on this.
      for (const url of refUrlsForCleanup) {
        deleteRefImage(url);
      }
    }
  }, [mode, prompt, imageCfg, videoCfg, isAuthenticated, t, refreshUsage, onRequireLogin]);

  const handleSave = useCallback(async (idx: number) => {
    if (!generation) return;
    setSaveState(prev => ({ ...prev, [idx]: 'saving' }));
    try {
      const result = await saveGeneration(generation.id, idx);
      setGeneration(prev => prev
        ? { ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, saved: true, b2Url: result.b2Url } : it) }
        : prev);
      setSaveState(prev => ({ ...prev, [idx]: 'saved' }));
    } catch (err) {
      console.error('Save error', err);
      setSaveState(prev => ({ ...prev, [idx]: 'failed' }));
    }
  }, [generation]);

  const handleCancel = useCallback(() => {
    if (!activeGenId || cancelRequested) return;
    setCancelRequested(true);
    cancelStudioGen(activeGenId);
    setLogLines(prev => [...prev, { message: t('studio.log.cancelling') }]);
    // Don't clear local state — the in-flight handleGenerate's finally{}
    // will run when the agent's gen request returns (with WABGenError).
  }, [activeGenId, cancelRequested, t]);

  const handleReset = useCallback(() => {
    setGeneration(null); setError(null); setSaveState({});
  }, []);

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderUsageBadge = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center gap-2 p-3 bg-[rgba(249,115,22,0.08)] border border-[var(--accent-primary)] rounded-xl text-sm">
          <span className="text-[var(--text-secondary)]">{t('studio.loginRequiredDesc')}</span>
          <button
            onClick={onRequireLogin}
            className="ml-auto text-[var(--accent-primary)] font-semibold hover:underline"
          >
            {t('studio.loginRequired')}
          </button>
        </div>
      );
    }
    if (!usage) return null;
    if (usage.unlimited) {
      return (
        <div className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-secondary)]">
          {t('studio.usage.unlimited')}
        </div>
      );
    }
    const slot = mode === 'image' ? usage.image : usage.video;
    const key = mode === 'image' ? 'studio.usage.imageRemaining' : 'studio.usage.videoRemaining';
    const msg = t(key)
      .replace('{{remaining}}', String(slot.remaining ?? 0))
      .replace('{{limit}}', String(slot.limit ?? 0));
    const tone = slot.remaining === 0
      ? 'bg-red-500/10 border-red-500/40 text-red-400'
      : slot.remaining === 1
        ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500'
        : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-secondary)]';
    return <div className={`p-3 rounded-xl text-sm border ${tone}`}>{msg}</div>;
  };

  // Map alpha-studio model id → emoji icon shown in the dropdown.
  const MODEL_EMOJI: Record<string, string> = {
    'banana2':     '🍌',
    'banana-pro':  '🍌',
    'veo':         '🎬',
    'veo-fast':    '🎬',
    'veo-quality': '🎬',
    'veo-lite':    '🎬',
    'veo-fast-lp': '🎬',
    'veo-lite-lp': '🎬',
    'veo-r2v':     '🎬',
  };

  const renderModelPicker = () => {
    const models = mode === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
    const selected = mode === 'image' ? imageCfg.model : videoCfg.model;
    const onChange = (val: string) => {
      if (mode === 'image') setImageCfg(c => ({ ...c, model: val as ImageModel }));
      else setVideoCfg(c => ({ ...c, model: val as VideoModel }));
    };
    return (
      <div className="relative">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2.5 pr-9 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-sm font-medium text-[var(--text-primary)] hover:border-[var(--border-secondary)] focus:border-[var(--accent-primary)] focus:outline-none cursor-pointer"
        >
          {models.map(m => (
            <option key={m.id} value={m.id}>
              {MODEL_EMOJI[m.id] || ''} {t(m.nameKey)}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
          viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.25 4.41a.75.75 0 01-1.08 0l-4.25-4.41a.75.75 0 01.02-1.06z"
            clipRule="evenodd" />
        </svg>
      </div>
    );
  };

  // Visual aspect-ratio glyph: a rectangle whose width:height matches the ratio.
  const ratioGlyph = (value: string) => {
    const presets: Record<string, [number, number]> = {
      '16:9': [16, 9],
      '4:3':  [12, 9],
      '1:1':  [10, 10],
      '3:4':  [9, 12],
      '9:16': [9, 16],
    };
    const [w, h] = presets[value] || [10, 10];
    const max = 16;
    return (
      <div
        className="border-[1.5px] border-current rounded-[3px]"
        style={{ width: `${w}px`, height: `${h}px`, maxWidth: `${max}px`, maxHeight: `${max}px` }}
      />
    );
  };

  const renderRatioPicker = () => {
    const ratios = mode === 'image' ? IMAGE_RATIOS : VIDEO_RATIOS;
    const selected = mode === 'image' ? imageCfg.ratio : videoCfg.ratio;
    return (
      <div className="flex gap-2 flex-wrap">
        {ratios.map(r => {
          const active = selected === r.value;
          return (
            <button
              key={r.value}
              onClick={() => mode === 'image'
                ? setImageCfg(c => ({ ...c, ratio: r.value as ImageRatio }))
                : setVideoCfg(c => ({ ...c, ratio: r.value as VideoRatio }))}
              className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-lg border transition-all ${
                active
                  ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.10)] text-[var(--accent-primary)]'
                  : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
              }`}
              title={r.value}
            >
              <span className="flex items-center justify-center h-4">{ratioGlyph(r.value)}</span>
              <span className="text-[10px] font-semibold leading-none">{r.value}</span>
            </button>
          );
        })}
      </div>
    );
  };


  const renderResult = () => {
    if (!generation) return null;
    const isVideo = generation.type === 'video';
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t('studio.result')}</h2>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-semibold text-[var(--accent-primary)] bg-[rgba(249,115,22,0.1)] hover:bg-[rgba(249,115,22,0.2)] border border-[var(--accent-primary)] rounded-lg transition-colors"
          >
            {t('studio.newGeneration')}
          </button>
        </div>

        <div className={`grid gap-4 ${generation.items.length > 1 ? 'md:grid-cols-2' : ''}`}>
          {generation.items.map((item) => (
            <FlowResultItem
              key={item.index}
              item={item}
              isVideo={isVideo}
              state={saveState[item.index] || 'idle'}
              onSave={() => handleSave(item.index)}
              onPreview={(url) => setPreviewUrl(url)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="flex flex-col gap-6">
      <div className="flex items-stretch gap-2">
        <div className="flex-1 min-w-0">{renderUsageBadge()}</div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="shrink-0 px-3 flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-secondary)] transition-colors"
            title={t('studio.history.title')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">{t('studio.history.title')}</span>
          </button>
        )}
      </div>

      {/* ─── Compact composer (Google Flow-like) ─────────────────────────── */}
      <div className="relative bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-3 focus-within:border-[var(--accent-primary)] transition-colors">
        {/* Reference image preview chips. Frames mode tags chip 0 as
            "Start" and chip 1 as "End" so users know the role of each. */}
        {(() => {
          const refs = mode === 'image' ? imageCfg.refImages : videoCfg.refImages;
          if (refs.length === 0) return null;
          const isFrames = mode === 'video' && videoCfg.subtype === 'Frames';
          return (
            <div className="mb-2 flex flex-wrap gap-2">
              {refs.map((img, i) => (
                <div key={i} className="relative inline-flex items-center flex-col gap-0.5">
                  <img
                    src={img.dataUrl}
                    className="h-14 w-14 object-cover rounded-lg border border-[var(--border-primary)]"
                  />
                  {isFrames && (
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {i === 0 ? t('studio.refImage.startFrame') : t('studio.refImage.endFrame')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (mode === 'image') setImageCfg(c => ({ ...c, refImages: c.refImages.filter((_, j) => j !== i) }));
                      else setVideoCfg(c => ({ ...c, refImages: c.refImages.filter((_, j) => j !== i) }));
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full text-xs text-[var(--text-secondary)] hover:text-red-500 flex items-center justify-center"
                    aria-label="remove reference image"
                  >×</button>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Prompt textarea */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('studio.promptPlaceholder')}
          rows={3}
          className="w-full bg-transparent border-0 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none resize-none text-sm"
        />

        {/* Frames-mode hint — explain image 1 / image 2 roles. Persists
            even when refs already attached so user keeps the context.
            Red to make the start-frame requirement visually obvious. */}
        {mode === 'video' && videoCfg.subtype === 'Frames' && (
          <p className="mt-1 text-xs text-red-500 leading-snug font-medium">
            {t('studio.video.framesHint')}
          </p>
        )}

        {mode === 'video' && (videoCfg.model === 'veo-fast-lp' || videoCfg.model === 'veo-lite-lp') && (
          <p className="mt-1 text-xs text-yellow-500 leading-snug font-medium">
            ⚠ {t('studio.video.lpWatermark')}
          </p>
        )}

        {/* Bottom action bar */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Left: add image — disabled when ref-image cap reached, or when
              the current mode/subtype doesn't accept refs at all (Video
              Standard). */}
          {(() => {
            const cap = maxRefsFor(mode, videoCfg.subtype);
            const current = mode === 'image' ? imageCfg.refImages : videoCfg.refImages;
            const full = cap === 0 || current.length >= cap;
            const disabled = full;
            return (
              <label
                className={`w-9 h-9 flex items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-[var(--text-secondary)] ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-[var(--border-secondary)] cursor-pointer'
                }`}
                title={
                  cap === 0 ? t('studio.refImage.notAllowed')
                    : full ? t('studio.refImage.full')
                      : t('studio.refImage.upload')
                }
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={disabled}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || disabled) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const url = String(reader.result || '');
                      const entry = { file, dataUrl: url };
                      if (mode === 'image') {
                        setImageCfg(c => ({ ...c, refImages: [...c.refImages, entry].slice(0, cap) }));
                      } else {
                        setVideoCfg(c => ({ ...c, refImages: [...c.refImages, entry].slice(0, cap) }));
                      }
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
            );
          })()}

          {/* Right: settings summary + send */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSettingsOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] hover:border-[var(--border-secondary)] text-sm font-medium text-[var(--text-primary)]"
            >
              <span>{MODEL_EMOJI[(mode === 'image' ? imageCfg.model : videoCfg.model)] || ''}</span>
              <span>
                {(mode === 'image' ? IMAGE_MODELS.find(m => m.id === imageCfg.model) : VIDEO_MODELS.find(m => m.id === videoCfg.model))
                  ? t((mode === 'image' ? IMAGE_MODELS.find(m => m.id === imageCfg.model)! : VIDEO_MODELS.find(m => m.id === videoCfg.model)!).nameKey)
                  : ''}
              </span>
              <span className="text-[var(--text-tertiary)] text-xs">
                {mode === 'image' ? imageCfg.ratio : videoCfg.ratio}
              </span>
              <svg className="w-3 h-3 text-[var(--text-tertiary)]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.25 4.41a.75.75 0 01-1.08 0l-4.25-4.41a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {isGenerating ? (
              // Cancel button replaces Send while a gen is in flight.
              // After click, switches to a spinner so the user gets
              // feedback even before the worker thread reaches its next
              // cancel-poll boundary.
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelRequested}
                className={`flex items-center justify-center rounded-full text-white transition-all ${
                  cancelRequested
                    ? 'px-3 h-9 bg-red-500/70 cursor-wait gap-1.5'
                    : 'w-9 h-9 bg-red-500 hover:bg-red-600'
                }`}
                aria-label={t('studio.cancel')}
                title={cancelRequested ? t('studio.log.cancelling') : t('studio.cancel')}
              >
                {cancelRequested ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3" />
                      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs font-medium">{t('studio.log.cancelling')}</span>
                  </>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  !prompt.trim()
                  || remaining === 0
                  || (mode === 'video' && videoCfg.subtype === 'Frames' && videoCfg.refImages.length === 0)
                }
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                aria-label={t('studio.generate')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Settings popover */}
        {settingsOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setSettingsOpen(false)} />
            <div className="absolute right-3 bottom-14 z-20 w-72 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-3 shadow-xl space-y-3">
              {/* Image/Video mode is selected by the parent tabs; not duplicated here. */}

              {/* Video subtype tabs (Frames / Ingredients).  Standard was
                  removed — Flow's text-only path is just Frames-with-no-end. */}
              {mode === 'video' && (
                <div className="grid grid-cols-2 gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg">
                  {(['Frames', 'Ingredients'] as VideoSubtype[]).map(st => {
                    const active = videoCfg.subtype === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setVideoCfg(c => ({
                          ...c, subtype: st,
                          // Reset refs when switching subtype — different
                          // caps + semantics for each.
                          refImages: [],
                        }))}
                        className={`py-1.5 text-xs font-semibold rounded ${
                          active ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow' : 'text-[var(--text-tertiary)]'
                        }`}
                      >{t(`studio.video.subtype.${st.toLowerCase()}`)}</button>
                    );
                  })}
                </div>
              )}

              {/* Aspect ratio */}
              {renderRatioPicker()}

              {/* Model dropdown */}
              {renderModelPicker()}

              {/* Video duration (4s / 6s / 8s) */}
              {mode === 'video' && (
                <div className="flex gap-2">
                  {(['4s', '6s', '8s'] as VideoDuration[]).map(d => {
                    const active = videoCfg.duration === d;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setVideoCfg(c => ({ ...c, duration: d }))}
                        className={`flex-1 h-9 text-sm font-semibold rounded-lg border transition-all ${
                          active
                            ? 'border-[var(--accent-primary)] bg-[rgba(249,115,22,0.10)] text-[var(--accent-primary)]'
                            : 'border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]'
                        }`}
                      >{d}</button>
                    );
                  })}
                </div>
              )}

              <div className="text-xs text-[var(--text-tertiary)] text-center pt-1 border-t border-[var(--border-primary)]">
                {t('studio.credits.note')}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Accumulated log — survives both during and after gen.  Each line
          shows a step; the FINAL line carries the total elapsed seconds. */}
      {logLines.length > 0 && (
        <div className="p-3 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl text-sm space-y-1">
          {logLines.map((line, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="text-[var(--text-secondary)]">{line.message}</span>
              {line.totalSeconds !== undefined && (
                <span className="text-xs font-mono text-[var(--text-tertiary)]">
                  {line.totalSeconds.toFixed(1)}s
                </span>
              )}
            </div>
          ))}
          {isGenerating && progress && progress.status !== 'starting' && (
            <div className="h-1 bg-[var(--bg-secondary)] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500"
                style={{ width: `${Math.max(2, Math.min(100, progress.progress))}%` }}
              />
            </div>
          )}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {/* Result panel BELOW composer + log so the user keeps the prompt UI
          in view (typical AI-tool layout). Cleared on next gen. */}
      {generation && (
        <>
          <div className="border-t border-[var(--border-primary)]" />
          {renderResult()}
        </>
      )}
    </div>
    {previewUrl && <ImagePreviewModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />}
    <StudioHistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}

// ─── Result item card (Flow variant) ───────────────────────────────────────

interface FlowResultItemProps {
  item: StudioGenerationItem;
  isVideo: boolean;
  state: 'idle' | 'saving' | 'saved' | 'failed';
  onSave: () => void;
  onPreview: (url: string) => void;
}

function FlowResultItem({ item, isVideo, state, onSave, onPreview }: FlowResultItemProps) {
  const { t } = useTranslation();

  // Always use the backend's previewUrl. The backend's /media/:genId/:idx
  // route 302-redirects to either the public B2 CDN URL (when saved) or a
  // freshly-signed Google CDN URL (Plan 4 lazy re-sign). One src, one path —
  // no client-side switch that breaks if B2 isn't reachable / CORS-friendly.
  const src = item.previewUrl;

  const handleDownload = async () => {
    // Cross-origin <a download> is often ignored by browsers (Google CDN strips
    // Content-Disposition), so fetch the bytes into a blob and trigger download
    // from a same-origin blob URL to preserve the filename.
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `alpha-studio-${item.index}-${Date.now()}.${item.ext || (isVideo ? 'mp4' : 'png')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-lg">
      <div className="aspect-square bg-black flex items-center justify-center">
        {isVideo ? (
          <video src={src} controls className="w-full h-full object-contain" />
        ) : (
          <img
            src={src}
            alt="Result"
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => onPreview(src)}
          />
        )}
      </div>

      <div className="p-3 flex gap-2">
        <button
          onClick={handleDownload}
          className="flex-1 py-2 text-xs font-semibold rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
        >
          {t('studio.download')}
        </button>
        <button
          onClick={onSave}
          disabled={state === 'saving' || state === 'saved' || item.saved}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
            state === 'saved' || item.saved
              ? 'bg-green-500/20 border border-green-500/40 text-green-400'
              : state === 'failed'
                ? 'bg-red-500/10 border border-red-500/40 text-red-400'
                : 'bg-[var(--accent-primary)] text-black hover:opacity-90'
          }`}
        >
          {state === 'saving' ? t('studio.save.saving')
            : state === 'saved' || item.saved ? t('studio.save.saved')
            : state === 'failed' ? t('studio.save.failed')
            : t('studio.save.cta')}
        </button>
      </div>
    </div>
  );
}
