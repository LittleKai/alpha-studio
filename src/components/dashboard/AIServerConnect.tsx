import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import { connectToCloud, disconnectFromCloud, getActiveSession, type CloudSession } from '../../services/cloudService';

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export default function AIServerConnect() {
  const { t } = useTranslation();
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
    if (!confirm(t('server.confirmDisconnect'))) return;
    try {
      await disconnectFromCloud();
      setSession(null);
      setState('disconnected');
    } catch (error: any) {
      console.error('Disconnect error:', error);
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
                className="w-full py-4 bg-[var(--accent-primary)] text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg"
              >
                {t('server.idle.connectBtn')}
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
          {state === 'connected' && session && (
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
                <button
                  onClick={handleOpenDesktop}
                  className="w-full py-4 bg-[var(--accent-primary)] text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg"
                >
                  {t('server.connected.openBtn')}
                </button>
                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 bg-red-500/10 text-red-500 font-bold rounded-2xl hover:bg-red-500/20 transition-all"
                >
                  {t('server.connected.disconnectBtn')}
                </button>
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
                className="w-full py-4 bg-[var(--accent-primary)] text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg"
              >
                {t('server.disconnected.reconnectBtn')}
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
                className="w-full py-4 bg-[var(--accent-primary)] text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg"
              >
                {t('server.error.retryBtn')}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
