import React, { useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/context';
import { useAuth } from '../auth/context';

const VocabPage: React.FC = () => {
    const { t } = useTranslation();
    const { token } = useAuth();
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleIframeLoad = () => {
            if (iframeRef.current && iframeRef.current.contentWindow && token) {
                // Post the token to the iframe
                iframeRef.current.contentWindow.postMessage(
                    { type: 'AUTH_TOKEN', token },
                    '*'
                );
            }
        };

        const iframe = iframeRef.current;
        if (iframe) {
            iframe.addEventListener('load', handleIframeLoad);
            return () => {
                iframe.removeEventListener('load', handleIframeLoad);
            };
        }
    }, [token]);

    return (
        <div className="w-full h-full min-h-[calc(100vh-80px)] flex flex-col bg-[var(--bg-primary)]">
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
