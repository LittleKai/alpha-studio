import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/context';
import type { ServerApp } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

interface AIServerConnectProps {
  onBack: () => void;
}

// Mock server apps data
const MOCK_SERVERS: ServerApp[] = [
  {
    id: '1',
    name: 'Gemini 2.5 Flash',
    icon: '🚀',
    status: 'online',
    description: 'Fast and efficient AI for image editing and generation',
    costPerHour: 0.5,
  },
  {
    id: '2',
    name: 'Gemini 2.5 Pro',
    icon: '⚡',
    status: 'online',
    description: 'Advanced AI with higher quality outputs',
    costPerHour: 1.0,
  },
  {
    id: '3',
    name: 'Stable Diffusion XL',
    icon: '🎨',
    status: 'busy',
    description: 'Open-source image generation model',
    costPerHour: 0.8,
  },
  {
    id: '4',
    name: 'DALL-E 3',
    icon: '🖼️',
    status: 'offline',
    description: 'OpenAI image generation',
    costPerHour: 1.5,
  },
  {
    id: '5',
    name: 'Midjourney API',
    icon: '✨',
    status: 'online',
    description: 'High-quality artistic image generation',
    costPerHour: 2.0,
  },
];

const AIServerConnect: React.FC<AIServerConnectProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedServer, setConnectedServer] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  // Simulate loading servers
  useEffect(() => {
    const timer = setTimeout(() => {
      setServers(MOCK_SERVERS);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async (serverId: string) => {
    setIsConnecting(serverId);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setConnectedServer(serverId);
    setIsConnecting(null);
  };

  const handleDisconnect = () => {
    setConnectedServer(null);
  };

  const getStatusColor = (status: ServerApp['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ServerApp['status']) => {
    switch (status) {
      case 'online':
        return t('server.online');
      case 'busy':
        return t('server.busy');
      case 'offline':
        return t('server.offline');
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-primary)]/80 backdrop-blur-lg border-b border-[var(--border-primary)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{t('server.title')}</h1>
            <p className="text-sm text-[var(--text-secondary)]">{t('server.subtitle')}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Connection Status */}
        {connectedServer && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium">
                {t('server.connectedTo')} {servers.find(s => s.id === connectedServer)?.name}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
            >
              {t('server.disconnect')}
            </button>
          </div>
        )}

        {/* Server List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-[var(--text-secondary)]">{t('server.loading')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {servers.map((server) => {
              const isConnected = connectedServer === server.id;
              const isCurrentlyConnecting = isConnecting === server.id;

              return (
                <div
                  key={server.id}
                  className={`p-4 bg-[var(--bg-secondary)] rounded-xl border-2 transition-all ${
                    isConnected
                      ? 'border-green-500'
                      : 'border-transparent hover:border-[var(--border-secondary)]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-xl flex items-center justify-center text-2xl">
                      {server.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">{server.name}</h3>
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`} />
                        <span className="text-xs text-[var(--text-tertiary)]">
                          {getStatusText(server.status)}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">{server.description}</p>
                      <p className="text-sm text-[var(--accent-primary)]">
                        ${server.costPerHour.toFixed(2)}/{t('server.perHour')}
                      </p>
                    </div>

                    {/* Action */}
                    <div>
                      {isConnected ? (
                        <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                          {t('server.connected')}
                        </span>
                      ) : server.status === 'offline' ? (
                        <span className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-lg text-sm">
                          {t('server.unavailable')}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleConnect(server.id)}
                          disabled={isCurrentlyConnecting || server.status === 'busy'}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isCurrentlyConnecting
                              ? 'bg-[var(--accent-primary)]/50 text-white cursor-wait'
                              : server.status === 'busy'
                              ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                              : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)]'
                          }`}
                        >
                          {isCurrentlyConnecting ? (
                            <span className="flex items-center gap-2">
                              <LoadingSpinner size="sm" />
                              {t('server.connecting')}
                            </span>
                          ) : server.status === 'busy' ? (
                            t('server.busy')
                          ) : (
                            t('server.connect')
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <h3 className="font-semibold text-blue-400 mb-2">{t('server.infoTitle')}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{t('server.infoDescription')}</p>
        </div>
      </main>
    </div>
  );
};

export default AIServerConnect;
