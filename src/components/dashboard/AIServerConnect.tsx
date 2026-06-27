import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { useConfirm } from '../ui/ConfirmDialog';
import { connectToCloud, disconnectFromCloud, getActiveSession, type CloudSession } from '../../services/cloudService';

const SparkleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="sparkle"
  >
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
    ></path>
    <path
      className="path"
      strokeLinejoin="round"
      strokeLinecap="round"
      d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
    ></path>
  </svg>
);

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'disconnected' | 'error';

export default function AIServerConnect() {
  const { t } = useTranslation();
  const { confirm: confirmDialog } = useConfirm();
  const [state, setState] = useState<ConnectionState>('idle');
  const [session, setSession] = useState<CloudSession | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Check for existing active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await getActiveSession();
        if (response.data) {
          setSession(response.data);
          setState('connected');
        }
      } catch {
        // No active session, stay idle
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleConnect = async () => {
    setState('connecting');
    setErrorMessage('');
    try {
      const response = await connectToCloud();
      setSession(response.data.session);
      setState('connected');
    } catch (error: any) {
      setErrorMessage(error.message || t('server.error.description'));
      setState('error');
    }
  };

  const handleDisconnect = async () => {
    if (!await confirmDialog({ message: t('server.confirmDisconnect'), variant: 'danger' })) return;
    setState('disconnecting');
    try {
      await disconnectFromCloud();
      setSession(null);
      setState('disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
      setState('connected');
    }
  };

  const handleOpenDesktop = () => {
    if (session?.noVncUrl) {
      window.open(session.noVncUrl, '_blank');
    }
  };

  const getMachineName = () => {
    if (!session?.hostMachineId || typeof session.hostMachineId === 'string') return '';
    return session.hostMachineId.name;
  };

  const getMachineSpecs = () => {
    if (!session?.hostMachineId || typeof session.hostMachineId === 'string') return null;
    return session.hostMachineId.specs;
  };

  const formatStartTime = () => {
    if (!session?.startedAt) return '';
    return new Date(session.startedAt).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
          <p className="text-[var(--text-secondary)]">{t('server.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden text-[var(--text-primary)]">
      <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0,transparent_70%)] pointer-events-none"></div>

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in relative z-10">

          {/* IDLE STATE */}
          {state === 'idle' && (
            <>
              <div className="w-32 h-32 bg-blue-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">{t('server.idle.title')}</h1>
                <p className="text-[var(--text-secondary)] leading-relaxed">{t('server.idle.description')}</p>
              </div>
              <button
                onClick={handleConnect}
                className="mean-bird-button active relative w-full py-4 px-6 text-[var(--accent-color)] font-black rounded-2xl shadow-xl text-lg flex items-center justify-between"
              >
                <div className="dots_border"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {t('server.idle.connectBtn')}
                </span>
                <SparkleIcon />
              </button>
            </>
          )}

          {/* CONNECTING STATE */}
          {state === 'connecting' && (
            <>
              <div className="w-32 h-32 bg-[var(--accent-primary)]/10 rounded-[40px] flex items-center justify-center mx-auto border border-[var(--accent-primary)]/30">
                <div className="w-16 h-16 border-4 border-[var(--accent-primary)]/30 border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">{t('server.connecting.title')}</h1>
                <p className="text-[var(--text-secondary)] leading-relaxed">{t('server.connecting.description')}</p>
              </div>
            </>
          )}

          {/* CONNECTED STATE */}
          {(state === 'connected' || state === 'disconnecting') && session && (
            <>
              <div className="w-32 h-32 bg-green-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">{t('server.connected.title')}</h1>
                <p className="text-[var(--text-secondary)] leading-relaxed">{t('server.connected.description')}</p>
              </div>

              {/* Session Info Card */}
              <div className="glass-card rounded-2xl p-6 text-left space-y-4">
                <h3 className="text-sm font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{t('server.connected.sessionInfo')}</h3>
                <div className="space-y-3">
                  {getMachineName() && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">{t('server.connected.machine')}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{getMachineName()}</span>
                    </div>
                  )}
                  {getMachineSpecs() && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">GPU</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{getMachineSpecs()!.gpu || 'N/A'}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[var(--text-secondary)]">{t('server.connected.startedAt')}</span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">{formatStartTime()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {state === 'disconnecting' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-2xl opacity-70 cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin"></div>
                    {t('server.connected.disconnecting')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleOpenDesktop}
                      className="mean-bird-button active relative w-full py-4 px-6 text-[var(--accent-color)] font-black rounded-2xl shadow-xl text-lg flex items-center justify-between"
                    >
                      <div className="dots_border"></div>
                      <span className="relative z-10 flex items-center gap-2">
                        {t('server.connected.openBtn')}
                      </span>
                      <SparkleIcon />
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="w-full py-3 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-all"
                    >
                      {t('server.connected.disconnectBtn')}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* DISCONNECTED STATE */}
          {state === 'disconnected' && (
            <>
              <div className="w-32 h-32 bg-gray-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-gray-500/30 shadow-[0_0_50px_rgba(107,114,128,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 11-12.728 0M12 3v9" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">{t('server.disconnected.title')}</h1>
                <p className="text-[var(--text-secondary)] leading-relaxed">{t('server.disconnected.description')}</p>
              </div>
              <button
                onClick={handleConnect}
                className="mean-bird-button active relative w-full py-4 px-6 text-[var(--accent-color)] font-black rounded-2xl shadow-xl text-lg flex items-center justify-between"
              >
                <div className="dots_border"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {t('server.disconnected.reconnectBtn')}
                </span>
                <SparkleIcon />
              </button>
            </>
          )}

          {/* ERROR STATE */}
          {state === 'error' && (
            <>
              <div className="w-32 h-32 bg-red-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight">{t('server.error.title')}</h1>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {errorMessage || t('server.error.description')}
                </p>
              </div>
              <button
                onClick={handleConnect}
                className="mean-bird-button active relative w-full py-4 px-6 text-[var(--accent-color)] font-black rounded-2xl shadow-xl text-lg flex items-center justify-between"
              >
                <div className="dots_border"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {t('server.error.retryBtn')}
                </span>
                <SparkleIcon />
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
