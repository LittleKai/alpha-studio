import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/context';
import { getStudioHistory } from '../../services/studioService';
import type { StudioGeneration, StudioGenerationItem } from '../../services/studioService';

interface StudioHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface PreviewTarget {
  url: string;
  type: 'image' | 'video';
  title?: string;
}

const StudioHistoryDrawer: React.FC<StudioHistoryDrawerProps> = ({ open, onClose }) => {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<StudioGeneration[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [preview, setPreview] = useState<PreviewTarget | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const type = filter === 'all' ? undefined : filter;
      const rows = await getStudioHistory(50, type);
      setItems(rows);
    } catch (e: any) {
      setErr(e?.message || 'failed');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (open) fetchHistory();
  }, [open, fetchHistory]);

  // Esc to close (drawer first, preview second so preview Esc closes only the lightbox)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (preview) setPreview(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, preview, onClose]);

  if (!open) return null;

  const fmtDateTime = (iso: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const expiresLabel = (gen: StudioGeneration): { text: string; tone: string } => {
    if (!gen.expiresAt) return { text: '—', tone: 'text-[var(--text-tertiary)]' };
    const d = new Date(gen.expiresAt);
    const now = Date.now();
    const ms = d.getTime() - now;
    if (ms <= 0) {
      return { text: t('studio.history.expired'), tone: 'text-red-400' };
    }
    const hours = Math.floor(ms / 3600_000);
    const human = hours >= 24
      ? t('studio.history.expiresInDays').replace('{n}', String(Math.floor(hours / 24)))
      : t('studio.history.expiresInHours').replace('{n}', String(Math.max(1, hours)));
    const tone = hours < 6 ? 'text-yellow-500' : 'text-[var(--text-secondary)]';
    return { text: `${human} (${fmtDateTime(gen.expiresAt)})`, tone };
  };

  const openPreview = (gen: StudioGeneration, item: StudioGenerationItem) => {
    setPreview({
      url: item.previewUrl,
      type: gen.type,
      title: gen.prompt,
    });
  };

  return (
    <>
      {/* Drawer — z-[60] to sit above the sticky nav (z-50) in Layout.tsx */}
      <div className="fixed inset-0 z-[60] flex" role="dialog" aria-modal="true">
        {/* backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        {/* panel */}
        <div className="relative ml-auto w-full max-w-3xl h-full bg-[var(--bg-primary)] border-l border-[var(--border-primary)] shadow-2xl flex flex-col">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-primary)]">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {t('studio.history.title')}
              </h2>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                {t('studio.history.subtitle')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              aria-label="close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* filter chips */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-[var(--border-primary)]">
            {(['all', 'image', 'video'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t(`studio.history.filter.${f}`)}
              </button>
            ))}
            <button
              onClick={fetchHistory}
              className="ml-auto text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              disabled={loading}
            >
              {loading ? t('studio.history.loading') : t('studio.history.refresh')}
            </button>
          </div>

          {/* list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {err && (
              <div className="text-sm text-red-400 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                {err}
              </div>
            )}
            {!loading && items && items.length === 0 && (
              <div className="text-sm text-[var(--text-tertiary)] text-center py-12">
                {t('studio.history.empty')}
              </div>
            )}
            {items && items.map(gen => {
              const exp = expiresLabel(gen);
              return (
                <div
                  key={gen.id}
                  className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] p-3"
                >
                  {/* top row: badges + time */}
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className={`px-2 py-0.5 rounded font-medium ${
                      gen.type === 'video'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {gen.type === 'video' ? t('studio.tabs.video') : t('studio.tabs.image')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)]">
                      {gen.model}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-secondary)]">
                      {gen.aspectRatio}
                    </span>
                    <span className="ml-auto text-[var(--text-tertiary)]">
                      {fmtDateTime(gen.createdAt)}
                    </span>
                  </div>

                  {/* prompt */}
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2 mb-2 leading-snug">
                    {gen.prompt || '—'}
                  </p>

                  {/* thumbnails strip */}
                  {gen.items && gen.items.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                      {gen.items.map(item => (
                        <button
                          key={item.index}
                          onClick={() => openPreview(gen, item)}
                          className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-[var(--border-primary)] hover:border-[var(--accent-primary)] transition-colors group"
                          title={t('studio.history.openPreview')}
                        >
                          {gen.type === 'image' ? (
                            <img
                              src={item.previewUrl}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full bg-black flex items-center justify-center">
                              <svg className="w-7 h-7 text-white/80" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[10px] font-medium">
                              {t('studio.history.preview')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* meta: id + project + expires */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[var(--text-tertiary)] font-mono">
                    <div>
                      <span className="text-[var(--text-secondary)] font-sans not-italic">
                        {t('studio.history.id')}:
                      </span>{' '}
                      {gen.id}
                    </div>
                    <div className={exp.tone}>
                      <span className="text-[var(--text-secondary)] font-sans">
                        {t('studio.history.expires')}:
                      </span>{' '}
                      {exp.text}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[var(--text-secondary)] font-sans">
                        {t('studio.history.project')}:
                      </span>{' '}
                      {gen.projectTitle
                        ? <>{gen.projectTitle} <span className="opacity-60">({gen.projectId || '—'})</span></>
                        : (gen.projectId || '—')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* preview lightbox — z above drawer */}
      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setPreview(null)} />
          <div className="relative z-10 max-w-[90vw] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/80 line-clamp-1 max-w-[80vw]">{preview.title}</p>
              <button
                onClick={() => setPreview(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                aria-label="close"
              >
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {preview.type === 'image' ? (
                <img src={preview.url} className="max-w-[90vw] max-h-[80vh] object-contain" alt="" />
              ) : (
                <video
                  src={preview.url}
                  className="max-w-[90vw] max-h-[80vh]"
                  controls
                  autoPlay
                  playsInline
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudioHistoryDrawer;
