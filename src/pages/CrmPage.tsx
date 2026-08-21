import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';
import StudioBackButton from '../components/studio/StudioBackButton';

const CrmPage: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const sendAuthToken = useCallback(() => {
        if (!iframeRef.current?.contentWindow || !token) return;

        iframeRef.current.contentWindow.postMessage(
            { type: 'AUTH_TOKEN', token },
            window.location.origin
        );
    }, [token]);

    useEffect(() => {
        sendAuthToken();
    }, [sendAuthToken]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            if (event.source !== iframeRef.current?.contentWindow) return;
            if (event.data?.type === 'AUTH_READY') {
                sendAuthToken();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [sendAuthToken]);

    return (
        <div className="w-full h-full min-h-[calc(100vh-80px)] flex flex-col bg-[var(--bg-primary)]">
            <StudioBackButton className="!top-[11px] !left-4 md:!left-[190px] !z-[60]" />
            <div className="flex-1 w-full relative">
                <iframe
                    ref={iframeRef}
                    src="/crm/index.html"
                    className="absolute inset-0 w-full h-full border-0"
                    title={t('studio.hub.cards.crm.title')}
                    allow="microphone; camera"
                    onLoad={sendAuthToken}
                />
            </div>
        </div>
    );
};

export default CrmPage;
