import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';

const VocabPage: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const navigate = useNavigate();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const sendAuthToken = useCallback(() => {
        if (!iframeRef.current?.contentWindow || !token) return;

        iframeRef.current.contentWindow.postMessage(
            { type: 'AUTH_TOKEN', token },
            window.location.origin
        );
    }, [token]);

    useEffect(() => {
        const handleIframeLoad = () => sendAuthToken();

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleIframeLoad);
            return () => {
                iframe.removeEventListener('load', handleIframeLoad);
            };
        }
    }, [sendAuthToken]);

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
            <button
                onClick={() => navigate('/studio')}
                className="fixed top-20 left-4 z-40 inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-full shadow-lg text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('studio.hub.backToStudio')}
            </button>
            <div className="flex-1 w-full relative">
                <iframe
                    ref={iframeRef}
                    src="/vocab/index.html"
                    className="absolute inset-0 w-full h-full border-0"
                    title={t('workflow.vocab.title')}
                    allow="microphone; camera"
                />
            </div>
        </div>
    );
};

export default VocabPage;
