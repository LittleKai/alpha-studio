import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/context';
import { useTranslation } from '../i18n/context';
import { useTheme } from '../theme/context';
import SEOHead from '../components/ui/SEOHead';
import StudioBackButton from '../components/studio/StudioBackButton';
import { LED_STUDIO_API_BASE } from '../services/ledStudioService';
import { buildBreadcrumbJsonLd } from '../utils/seoMeta';

export default function LedStudioPage() {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const shareToken = searchParams.get('share');

  const syncWithIframe = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      {
        type: 'ALPHA_STUDIO_SYNC',
        theme,
        locale: language,
        token: token || null,
        user: user ? { id: user._id, name: user.name, role: user.role } : null,
        shareToken: shareToken || null,
        apiBaseUrl: LED_STUDIO_API_BASE
      },
      window.location.origin
    );
  };

  useEffect(() => {
    syncWithIframe();
  }, [theme, language, token, user, shareToken]);

  const iframeParams = new URLSearchParams();
  if (shareToken) iframeParams.set('share', shareToken);
  if (LED_STUDIO_API_BASE) iframeParams.set('apiBase', LED_STUDIO_API_BASE);
  const iframeQuery = iframeParams.toString();
  const iframeSrc = `/led-studio/index.html${iframeQuery ? `?${iframeQuery}` : ''}`;

  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden">
      <SEOHead
        title={t('studio.ledStudio.seoTitle')}
        description={t('studio.ledStudio.seoDesc')}
        path="/studio/led-studio"
        jsonLd={[
          buildBreadcrumbJsonLd([
            { name: t('common.home'), path: '/' },
            { name: 'Studio', path: '/studio' },
            { name: t('studio.ledStudio.breadcrumb'), path: '/studio/led-studio' }
          ])
        ]}
      />
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3">
          <StudioBackButton variant="inline" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
            {t('studio.ledStudio.badge')}
          </span>
        </div>
        <span className="text-xs text-[var(--text-secondary)] font-mono">
          WebGL2 · Meshopt · ILDA · OFL DMX512
        </span>
      </div>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        title="ALPHA Creative LED Stage Studio"
        onLoad={syncWithIframe}
        className="w-full flex-1 border-0 bg-[#07111f]"
        allow="autoplay; fullscreen; clipboard-read; clipboard-write"
      />
    </div>
  );
}
