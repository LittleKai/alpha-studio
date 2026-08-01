import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../theme/context';
import { useTranslation } from '../../i18n/context';
import {
  ACCENT_PRESETS,
  ACCENT_STORAGE_KEY,
  DEFAULT_PRESET_ID,
  applyAccent,
  deriveAccentTokens,
} from './colorUtils';

interface StoredAccent {
  id: string; // preset id or 'custom'
  primary: string;
  secondary?: string;
}

interface Props {
  scopeRef: React.RefObject<HTMLElement | null>;
}

const readStored = (): StoredAccent => {
  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const def = ACCENT_PRESETS.find((p) => p.id === DEFAULT_PRESET_ID)!;
  return { id: def.id, primary: def.primary, secondary: def.secondary };
};

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

const ThemeCustomizer: React.FC<Props> = ({ scopeRef }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState<StoredAccent>(readStored);
  const panelRef = useRef<HTMLDivElement>(null);

  // Write CSS vars onto the scoped root whenever the accent changes.
  useLayoutEffect(() => {
    const tokens = deriveAccentTokens(accent.primary, accent.id === 'custom' ? undefined : accent.secondary);
    applyAccent(scopeRef.current, tokens);
    try { localStorage.setItem(ACCENT_STORAGE_KEY, JSON.stringify(accent)); } catch { /* ignore */ }
  }, [accent, scopeRef]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const pickPreset = useCallback((id: string, primary: string, secondary: string) => {
    setAccent({ id, primary, secondary });
  }, []);

  const pickCustom = useCallback((primary: string) => {
    setAccent({ id: 'custom', primary });
  }, []);

  return (
    <>
      <button
        type="button"
        className="sc-fab"
        aria-label={t('landing.showcasePage.theme.title')}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13.5" cy="6.5" r="1.3" fill="currentColor" /><circle cx="17.5" cy="10.5" r="1.3" fill="currentColor" />
          <circle cx="8.5" cy="7.5" r="1.3" fill="currentColor" /><circle cx="6.5" cy="12.5" r="1.3" fill="currentColor" />
          <path d="M12 2a10 10 0 1 0 0 20c1.4 0 2-1 2-2 0-.7-.4-1.2-.9-1.7-.4-.5-.8-1-.8-1.6 0-1 .8-1.7 1.8-1.7H16a6 6 0 0 0 6-6c0-4.4-4.5-8-10-8z" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="sc-cust-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              className="sc-cust-panel"
              role="dialog"
              aria-label={t('landing.showcasePage.theme.title')}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="sc-cust-head">
                <span className="sc-cust-title">{t('landing.showcasePage.theme.title')}</span>
                <button type="button" className="sc-cust-close" aria-label={t('landing.showcasePage.theme.close')} onClick={() => setOpen(false)}>✕</button>
              </div>

              <div className="sc-cust-block">
                <span className="sc-cust-label">{t('landing.showcasePage.theme.mode')}</span>
                <div className="sc-mode-toggle" role="group">
                  <button
                    type="button"
                    className={`sc-mode-btn ${theme === 'light' ? 'is-active' : ''}`}
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                  >
                    <SunIcon /> {t('landing.showcasePage.theme.light')}
                  </button>
                  <button
                    type="button"
                    className={`sc-mode-btn ${theme === 'dark' ? 'is-active' : ''}`}
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                  >
                    <MoonIcon /> {t('landing.showcasePage.theme.dark')}
                  </button>
                </div>
              </div>

              <div className="sc-cust-block">
                <span className="sc-cust-label">{t('landing.showcasePage.theme.accent')}</span>
                <div className="sc-swatch-grid">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`sc-swatch ${accent.id === p.id ? 'is-active' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
                      aria-label={t(`landing.showcasePage.theme.presets.${p.id}`)}
                      aria-pressed={accent.id === p.id}
                      onClick={() => pickPreset(p.id, p.primary, p.secondary)}
                    />
                  ))}
                </div>
              </div>

              <div className="sc-cust-block">
                <span className="sc-cust-label">{t('landing.showcasePage.theme.custom')}</span>
                <label className={`sc-custom-row ${accent.id === 'custom' ? 'is-active' : ''}`}>
                  <span className="sc-custom-chip" style={{ background: accent.primary }} />
                  <span className="sc-custom-hex">{accent.primary.toUpperCase()}</span>
                  <input
                    type="color"
                    className="sc-custom-input"
                    value={accent.primary}
                    onChange={(e) => pickCustom(e.target.value)}
                    aria-label={t('landing.showcasePage.theme.custom')}
                  />
                </label>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ThemeCustomizer;
