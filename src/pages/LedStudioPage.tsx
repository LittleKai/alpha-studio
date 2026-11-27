import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import SEOHead from '../components/ui/SEOHead';
import PageLoader from '../components/ui/PageLoader';
import LedStudioMyProjectsDrawer from '../components/studio/LedStudioMyProjectsDrawer';
import {
  LED_STUDIO_API_BASE,
  type LedStudioGateState,
  acquireLedStudioSessionTicket,
  resolveLedStudioTicketGate,
  listLedStudioWorkspaceProjects
} from '../services/ledStudioService';
import { buildBreadcrumbJsonLd } from '../utils/seoMeta';

const Login = lazy(() => import('../components/ui/Login'));

const TICKET_RENEW_INTERVAL_MS = 10 * 60 * 1000;

export default function LedStudioPage() {
  const { t, language } = useTranslation();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const shareToken = searchParams.get('share')?.trim() || null;

  const [gateState, setGateState] = useState<LedStudioGateState>('idle');
  const gateStateRef = useRef<LedStudioGateState>('idle');
  const [shareTitle, setShareTitle] = useState<string>('');
  const [sharePasswordInput, setSharePasswordInput] = useState<string>('');
  const [verifiedSharePassword, setVerifiedSharePassword] = useState<string>('');
  const verifiedSharePasswordRef = useRef<string>('');
  const prevShareTokenRef = useRef<string | null>(shareToken);
  const [passwordError, setPasswordError] = useState<boolean>(false);
  const [showLoginDialog, setShowLoginDialog] = useState<boolean>(false);
  const [workspaceReady, setWorkspaceReady] = useState<boolean>(false);
  const [projectsOpen, setProjectsOpen] = useState<boolean>(false);
  const [workspaceStatus, setWorkspaceStatus] = useState<{
    projectId: string | null;
    title: string;
    syncState: string;
  }>({ projectId: null, title: '', syncState: 'idle' });
  const prevWorkspaceStatusRef = useRef<{ projectId: string | null; syncState: string }>({
    projectId: null,
    syncState: 'idle'
  });
  const [slotSummary, setSlotSummary] = useState<{ used: number; max: number } | null>(null);

  const updateGateState = useCallback((next: LedStudioGateState) => {
    gateStateRef.current = next;
    setGateState(next);
  }, []);

  const syncWithIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const isRolePro = Boolean(user && ['admin', 'partner'].includes(user.role));
    const lumi = (user as { lumiStage?: { plan?: string; expiresAt?: string } } | null)?.lumiStage;
    const isSubActive = Boolean(
      lumi?.plan && lumi.plan !== 'free' && lumi.expiresAt && new Date(lumi.expiresAt).getTime() > Date.now()
    );
    win.postMessage(
      {
        type: 'ALPHA_STUDIO_SYNC',
        locale: language,
        token: token || null,
        user: user ? { id: user._id, name: user.name, role: user.role } : null,
        proActive: isRolePro || isSubActive,
        shareToken: shareToken || null,
        sharePassword: verifiedSharePassword || null,
        apiBaseUrl: LED_STUDIO_API_BASE,
        googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || null
      },
      window.location.origin
    );
  }, [language, token, user, shareToken, verifiedSharePassword]);

  useEffect(() => {
    if (shareToken || gateState !== 'ready' || !token) {
      setWorkspaceReady(false);
      return;
    }
    void listLedStudioWorkspaceProjects(token)
      .then((res) => setSlotSummary({ used: res.usedSlots, max: res.maxSlots }))
      .catch(() => {});

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'ALPHA_LED_WORKSPACE_STATUS') {
        setWorkspaceReady(true);
        const nextProjectId = msg.projectId || null;
        const nextSyncState = msg.syncState || 'idle';
        const prev = prevWorkspaceStatusRef.current;
        const shouldRefreshSlots =
          nextProjectId !== prev.projectId ||
          (nextSyncState === 'saved' && prev.syncState !== 'saved');
        prevWorkspaceStatusRef.current = { projectId: nextProjectId, syncState: nextSyncState };

        setWorkspaceStatus({
          projectId: nextProjectId,
          title: msg.title || '',
          syncState: nextSyncState
        });
        if (shouldRefreshSlots) {
          void listLedStudioWorkspaceProjects(token)
            .then((res) => setSlotSummary({ used: res.usedSlots, max: res.maxSlots }))
            .catch(() => {});
        }
      } else if (msg.type === 'ALPHA_LED_WORKSPACE_QUOTA_FULL') {
        setProjectsOpen(true);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [shareToken, gateState, token]);

  const requestTicket = useCallback(
    async (opts: { password?: string; silentRenewal?: boolean } = {}) => {
      const effectivePassword = opts.password ?? verifiedSharePasswordRef.current;
      if (!opts.silentRenewal) {
        updateGateState('verifying');
        setPasswordError(false);
      }

      const res = await acquireLedStudioSessionTicket({
        token: shareToken ? null : token,
        shareToken,
        password: effectivePassword || null
      });

      const outcome = resolveLedStudioTicketGate(res, {
        hasShareToken: Boolean(shareToken),
        silentRenewal: Boolean(opts.silentRenewal),
        currentGateState: gateStateRef.current
      });

      if (outcome.ok) {
        if (shareToken && effectivePassword) {
          verifiedSharePasswordRef.current = effectivePassword;
          setVerifiedSharePassword(effectivePassword);
          try {
            window.sessionStorage?.setItem(`lumi_share_pwd_${shareToken}`, effectivePassword);
          } catch {
            // ignore storage errors
          }
        }
        updateGateState('ready');
        return true;
      }

      if (outcome.title) setShareTitle(outcome.title);
      setPasswordError(outcome.passwordError);
      updateGateState(outcome.nextGateState);
      return false;
    },
    [shareToken, token, updateGateState]
  );

  // Acquire initial session ticket when authenticated or visiting a ?share= link
  useEffect(() => {
    const shareChanged = prevShareTokenRef.current !== shareToken;
    if (shareChanged) {
      prevShareTokenRef.current = shareToken;
      verifiedSharePasswordRef.current = '';
      setVerifiedSharePassword('');
      setShareTitle('');
      setSharePasswordInput('');
      setPasswordError(false);
    }

    if (shareToken) {
      void requestTicket({ silentRenewal: !shareChanged && gateStateRef.current === 'ready' });
      return;
    }
    if (authLoading) return;
    if (!isAuthenticated || !token) {
      updateGateState('idle');
      return;
    }
    void requestTicket({ silentRenewal: !shareChanged && gateStateRef.current === 'ready' });
  }, [shareToken, authLoading, isAuthenticated, token, requestTicket, updateGateState]);

  // Keep iframe synced when locale/auth changes
  useEffect(() => {
    if (gateState === 'ready') {
      syncWithIframe();
    }
  }, [gateState, syncWithIframe]);

  // Resilient ticket renewal: 10-min interval + visibilitychange + focus + online + iframe 403 retry handshake
  useEffect(() => {
    if (gateState !== 'ready') return;

    const renewSilently = () => {
      if (document.visibilityState === 'hidden') return;
      void requestTicket({ silentRenewal: true });
    };

    const intervalId = window.setInterval(renewSilently, TICKET_RENEW_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void requestTicket({ silentRenewal: true });
      }
    };
    const onFocusOrOnline = () => {
      void requestTicket({ silentRenewal: true });
    };
    const onMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'LUMI_REQUEST_TICKET_REFRESH') {
        const ok = await requestTicket({ silentRenewal: true });
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'LUMI_TICKET_REFRESHED', ok },
          window.location.origin
        );
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocusOrOnline);
    window.addEventListener('online', onFocusOrOnline);
    window.addEventListener('message', onMessage);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocusOrOnline);
      window.removeEventListener('online', onFocusOrOnline);
      window.removeEventListener('message', onMessage);
    };
  }, [gateState, requestTicket]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sharePasswordInput.trim();
    if (!trimmed) return;
    void requestTicket({ password: trimmed });
  };

  const seoHead = (
    <SEOHead
      title={t('studio.ledStudio.seoTitle')}
      description={t('studio.ledStudio.seoDesc')}
      path="/studio/led-studio"
      noindex={Boolean(shareToken)}
      jsonLd={[
        {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'LumiStage — LED Stage Studio 3D',
          applicationCategory: 'DesignApplication',
          operatingSystem: 'Web (WebGL2)',
          url: 'https://giaiphapsangtao.com/studio/led-studio',
          description: t('studio.ledStudio.seoDesc'),
          publisher: {
            '@type': 'Organization',
            name: 'Alpha Studio · GROUPLIFE'
          }
        },
        buildBreadcrumbJsonLd([
          { name: t('common.home'), path: '/' },
          { name: 'Studio', path: '/studio' },
          { name: t('studio.ledStudio.breadcrumb'), path: '/studio/led-studio' }
        ])
      ]}
    />
  );

  // 1. Active verified studio or share session -> mount protected 3D iframe
  if (gateState === 'ready') {
    const iframeParams = new URLSearchParams();
    if (shareToken) iframeParams.set('share', shareToken);
    if (LED_STUDIO_API_BASE) iframeParams.set('apiBase', LED_STUDIO_API_BASE);
    const iframeQuery = iframeParams.toString();
    const iframeSrc = `/led-studio/index.html${iframeQuery ? `?${iframeQuery}` : ''}`;

    const syncLabel =
      workspaceStatus.syncState === 'saving'
        ? t('studio.ledStudio.myProjects.statusSaving')
        : workspaceStatus.syncState === 'saved'
          ? t('studio.ledStudio.myProjects.statusSaved')
          : workspaceStatus.syncState === 'local_only'
            ? t('studio.ledStudio.myProjects.statusLocalOnly')
            : workspaceStatus.syncState === 'offline'
              ? t('studio.ledStudio.myProjects.statusOffline')
              : workspaceStatus.syncState === 'error'
                ? t('studio.ledStudio.myProjects.statusError')
                : t('studio.ledStudio.myProjects.statusIdle');

    return (
      <div className="flex flex-col h-[100dvh] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
        {seoHead}
        {!shareToken && isAuthenticated && workspaceReady && (
          <div className="h-10 px-3 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {workspaceStatus.title || 'LumiStage'}
              </span>
              <span className="px-2 py-0.5 rounded-full border border-[var(--border-primary)] text-[var(--text-secondary)]">
                {syncLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setProjectsOpen(true)}
                className="px-2.5 py-1 rounded-md border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] font-medium"
              >
                {t('studio.ledStudio.myProjects.title')}
                {slotSummary ? ` (${slotSummary.used}/${slotSummary.max})` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  iframeRef.current?.contentWindow?.postMessage(
                    { type: 'ALPHA_LED_WORKSPACE_COMMAND', action: 'newProject', mode: 'demo' },
                    window.location.origin
                  );
                }}
                className="px-2.5 py-1 rounded-md bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold"
              >
                {t('studio.ledStudio.myProjects.newBtn')}
              </button>
            </div>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="LumiStage — LED Stage Studio 3D (by Alpha Studio · GROUPLIFE)"
          onLoad={syncWithIframe}
          className="w-full flex-1 border-0 bg-[#07111f]"
          allow="autoplay; fullscreen; clipboard-read; clipboard-write"
        />
        {!shareToken && isAuthenticated && workspaceReady && (
          <LedStudioMyProjectsDrawer
            open={projectsOpen}
            onClose={() => setProjectsOpen(false)}
            activeProjectId={workspaceStatus.projectId}
            onOpenWorkspaceProject={(projectId) => {
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'ALPHA_LED_WORKSPACE_COMMAND', action: 'openProject', projectId },
                window.location.origin
              );
            }}
            onOpenLegacyProject={(projectId) => {
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'ALPHA_LED_LEGACY_OPEN', projectId },
                window.location.origin
              );
            }}
            onCreateNewProject={() => {
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'ALPHA_LED_WORKSPACE_COMMAND', action: 'newProject', mode: 'demo' },
                window.location.origin
              );
            }}
            onProjectDeleted={(deletedId) => {
              if (workspaceStatus.projectId === deletedId) {
                setWorkspaceStatus({ projectId: null, title: '', syncState: 'idle' });
                prevWorkspaceStatusRef.current = { projectId: null, syncState: 'idle' };
              }
              if (token) {
                void listLedStudioWorkspaceProjects(token)
                  .then((res) => setSlotSummary({ used: res.usedSlots, max: res.maxSlots }))
                  .catch(() => {});
              }
              iframeRef.current?.contentWindow?.postMessage(
                { type: 'ALPHA_LED_WORKSPACE_COMMAND', action: 'projectDeleted', projectId: deletedId },
                window.location.origin
              );
            }}
          />
        )}
      </div>
    );
  }

  // 2. Loading auth or verifying ticket
  if ((!shareToken && authLoading) || gateState === 'verifying') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
        {seoHead}
        <PageLoader />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          {shareToken ? t('studio.ledStudio.gate.verifyingShare') : t('studio.ledStudio.gate.verifyingSession')}
        </p>
      </div>
    );
  }

  // 3. Password-protected ?share= gate (verified BEFORE loading the 3 MB WebGL bundle)
  if (shareToken && gateState === 'password_required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
        {seoHead}
        <form onSubmit={handlePasswordSubmit} className="glass-card max-w-md w-full rounded-2xl p-6 space-y-4">
          <div className="text-xs font-bold tracking-wider uppercase text-[var(--accent-primary)]">
            {t('studio.ledStudio.badge')}
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {shareTitle || t('studio.ledStudio.gate.passwordTitle')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{t('studio.ledStudio.gate.passwordDesc')}</p>
          <input
            type="password"
            value={sharePasswordInput}
            onChange={(e) => setSharePasswordInput(e.target.value)}
            placeholder={t('studio.ledStudio.gate.passwordPlaceholder')}
            aria-label={t('studio.ledStudio.gate.passwordPlaceholder')}
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
          {passwordError && (
            <p className="text-sm text-red-500 dark:text-red-300">{t('studio.ledStudio.gate.invalidPassword')}</p>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 px-5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:opacity-95 transition-all"
            >
              {t('studio.ledStudio.gate.passwordSubmit')}
            </button>
            <Link
              to="/studio"
              className="py-2.5 px-4 rounded-xl border border-[var(--border-primary)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('studio.ledStudio.showcase.backBtn')}
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // 4. Invalid / expired ?share= or session ticket error (zero bundle bytes loaded)
  if (gateState === 'share_invalid' || gateState === 'share_pro_expired' || gateState === 'session_error') {
    const isShareErr = gateState === 'share_invalid' || gateState === 'share_pro_expired';
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)] px-4">
        {seoHead}
        <div className="glass-card max-w-md w-full rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            {isShareErr ? t('studio.ledStudio.gate.shareInvalidTitle') : t('studio.ledStudio.gate.sessionErrorTitle')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            {gateState === 'share_pro_expired'
              ? t('studio.ledStudio.gate.shareProExpiredDesc')
              : isShareErr
                ? t('studio.ledStudio.gate.shareInvalidDesc')
                : t('studio.ledStudio.gate.sessionErrorDesc')}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {!isShareErr && (
              <button
                type="button"
                onClick={() => void requestTicket()}
                className="py-2.5 px-5 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)]"
              >
                {t('studio.ledStudio.gate.retryBtn')}
              </button>
            )}
            <Link
              to="/studio"
              className="py-2.5 px-5 rounded-xl border border-[var(--border-primary)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {t('studio.ledStudio.showcase.backBtn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 5. Public SEO Flagship Product Showcase (for Googlebot & unauthenticated visitors — 0 MB WebGL bundle loaded)
  return (
    <main className="min-h-[calc(100vh-80px)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8">
      {seoHead}
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-4">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-sky-500/20 dark:bg-sky-500/30 border border-sky-500/40 text-sky-700 dark:text-sky-200">
            {t('studio.ledStudio.badge')}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
            {t('studio.ledStudio.showcase.heading')}
          </h1>
          <p className="max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
            {t('studio.ledStudio.showcase.subtitle')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <button
              type="button"
              onClick={() => setShowLoginDialog(true)}
              className="py-3 px-7 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-bold rounded-xl shadow-[var(--accent-shadow)] hover:scale-105 transition-all"
            >
              {t('studio.ledStudio.showcase.openBtn')}
            </button>
            <Link
              to="/studio"
              className="py-3 px-6 rounded-xl border border-[var(--border-primary)] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t('studio.ledStudio.showcase.backBtn')}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="glass-card rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('studio.ledStudio.showcase.pillar1Title')}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('studio.ledStudio.showcase.pillar1Desc')}
            </p>
          </section>
          <section className="glass-card rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('studio.ledStudio.showcase.pillar2Title')}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('studio.ledStudio.showcase.pillar2Desc')}
            </p>
          </section>
          <section className="glass-card rounded-2xl p-6 space-y-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t('studio.ledStudio.showcase.pillar3Title')}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t('studio.ledStudio.showcase.pillar3Desc')}
            </p>
          </section>
        </div>
      </div>

      {showLoginDialog && (
        <Suspense fallback={null}>
          <Login
            onLoginSuccess={() => setShowLoginDialog(false)}
            onClose={() => setShowLoginDialog(false)}
          />
        </Suspense>
      )}
    </main>
  );
}
