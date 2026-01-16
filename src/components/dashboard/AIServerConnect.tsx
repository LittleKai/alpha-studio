import React, { useState } from 'react';
import { useTranslation } from '../../i18n/context';
import type { WorkflowDocument, ServerApp } from '../../types';

interface AIServerConnectProps {
  onBack: () => void;
  onAddDocument: (doc: WorkflowDocument) => void;
}

const AIServerConnect: React.FC<AIServerConnectProps> = ({ onBack, onAddDocument }) => {
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeApp, setActiveApp] = useState<ServerApp | null>(null);
  const [balance, setBalance] = useState(150); // Default balance for demo

  const apps: ServerApp[] = [
    { id: 'sd', name: 'Stable Diffusion Pro', icon: '🎨', status: 'online', description: 'Trình tạo ảnh AI kiểm soát sâu nhất', costPerHour: 15 },
    { id: 'comfy', name: 'ComfyUI Workflow', icon: '⚙️', status: 'online', description: 'Tối ưu quy trình AI bằng Node', costPerHour: 12 },
    { id: 'deepface', name: 'DeepFace Lab', icon: '🎭', status: 'online', description: 'Face Swap & Lip-Sync video chuyên nghiệp', costPerHour: 25 },
    { id: 'deepvoice', name: 'Deep Voice Studio', icon: '🎙️', status: 'online', description: 'Clone giọng nói & TTS cảm xúc thực', costPerHour: 18 },
    { id: 'runway', name: 'Runway Gen-3 Engine', icon: '🎬', status: 'online', description: 'Xử lý phim kỹ xảo Hollywood', costPerHour: 30 },
    { id: 'blender', name: 'Blender 4.2 AI', icon: '🧊', status: 'online', description: 'Dựng phối cảnh 3D tích hợp AI', costPerHour: 20 },
    { id: 'octane', name: 'C4D Octane Render', icon: '🚀', status: 'busy', description: 'Render Farm 3D tốc độ cực cao', costPerHour: 45 },
    { id: 'unreal', name: 'Unreal Engine 5.4', icon: '🎮', status: 'online', description: 'Không gian sự kiện ảo thời gian thực', costPerHour: 25 },
    { id: 'kling', name: 'Kling AI Video', icon: '📽️', status: 'online', description: 'Tạo video dài chất lượng cao', costPerHour: 35 },
  ];

  const handleConnect = () => {
    // Check if user has enough balance for at least 1 hour of the cheapest app (12 coins)
    if (balance < 12) {
        alert(t('server.billing.insufficient'));
        return;
    }

    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      // Simulate deduction
      setBalance(prev => Math.max(0, prev - 5));
    }, 2500);
  };

  const handleTopUp = () => {
      const amount = 100;
      if (confirm(`Nạp ${amount} Alpha Coin vào tài khoản?`)) {
          setBalance(prev => prev + amount);
      }
  };

  const handleSyncFile = (app: ServerApp) => {
    const newDoc: WorkflowDocument = {
      id: `cloud-${Date.now()}`,
      name: `Cloud_Result_${app.id}_${Date.now().toString().slice(-4)}.png`,
      type: 'PNG',
      size: '6.8 MB',
      uploadDate: new Date().toISOString().split('T')[0],
      uploader: 'Cloud Server Cluster',
      department: 'creative',
      status: 'approved'
    };
    onAddDocument(newDoc);
    alert(t('server.syncSuccess'));
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#050a18] text-white flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,212,255,0.05)_0,transparent_70%)]"></div>

        {/* Balance Display Top Right */}
        <div className="absolute top-6 right-6 z-20 flex items-center gap-4">
            <div className="glass-card px-4 py-2 rounded-full flex items-center gap-2 border-yellow-500/30">
                <span className="text-yellow-400 text-xl">🪙</span>
                <div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t('server.billing.balance')}</div>
                    <div className="font-mono font-bold text-lg leading-none">{balance}</div>
                </div>
            </div>
            <button
                onClick={handleTopUp}
                className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black px-4 py-2 rounded-full font-bold text-xs shadow-lg"
            >
                + {t('server.billing.topUp')}
            </button>
        </div>

        <div className="max-w-md w-full text-center space-y-10 animate-fade-in relative z-10">
          <div className="w-32 h-32 bg-blue-600/10 rounded-[40px] flex items-center justify-center mx-auto border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
            <span className="text-6xl">💻</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight">AI Cloud GPU</h1>
            <p className="text-[var(--text-secondary)] font-medium">Truy cập máy chủ RTX 4090 cấu hình siêu mạnh để chạy Stable Diffusion, DeepFace và Render 3D ngay trên trình duyệt.</p>
          </div>

          <div className="glass-card rounded-[32px] p-8 text-left space-y-6">
            <div className="space-y-4">
               <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                  <span>Resource Pool</span>
                  <span className="text-[var(--accent-primary)]">S1-Alpha-HN</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-primary)] w-3/4 animate-pulse"></div>
               </div>
               <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white">NVIDIA RTX 4090 x 4</span>
                  <span className="text-green-400">96GB VRAM</span>
               </div>
            </div>

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-5 bg-[var(--accent-primary)] text-black font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isConnecting ? (
                 <>
                   <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                   KẾT NỐI...
                 </>
              ) : t('server.btnConnect')}
            </button>
          </div>

          <button onClick={onBack} className="text-xs font-bold text-[var(--text-tertiary)] hover:text-white transition-colors uppercase tracking-widest">
             Quay lại Trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col overflow-hidden select-none font-sans">
      {/* OS Header */}
      <header className="h-12 bg-black/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 text-[10px] font-black tracking-[0.2em] uppercase">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[var(--accent-primary)]">Alpha Cloud OS v2.5</span>
          </div>
          <span className="text-gray-500 hidden sm:inline">GPU: 24.5GB / 96GB | Latency: 12ms</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-yellow-500">
             <span>🪙 {balance}</span>
          </div>
          <div className="w-px h-3 bg-white/20"></div>
          <span className="text-gray-500">USER: ALPHA_STUDENT_001</span>
          <button onClick={() => setIsConnected(false)} className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all">Ngắt kết nối</button>
        </div>
      </header>

      {/* OS Grid */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 content-start relative">
          {apps.map(app => (
            <div
              key={app.id}
              onClick={() => setActiveApp(app)}
              className="group flex flex-col items-center gap-4 cursor-pointer relative"
            >
              <div className="absolute top-0 right-0 z-10 bg-black/80 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  {app.costPerHour} {t('server.billing.costPerHour')}
              </div>
              <div className="w-24 h-24 glass-card rounded-[32px] flex items-center justify-center text-5xl group-hover:scale-110 group-hover:border-[var(--accent-primary)] group-hover:shadow-[0_0_30px_rgba(0,212,255,0.2)] transition-all duration-300 relative overflow-hidden">
                {app.icon}
                {app.status === 'busy' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-red-500 uppercase">Busy</span>
                    </div>
                )}
              </div>
              <span className="text-xs font-bold text-gray-400 group-hover:text-white text-center tracking-tight max-w-[120px]">{app.name}</span>
            </div>
          ))}
        </div>

        {/* Taskbar logic for Virtual Window */}
        {activeApp && (
          <div className="fixed inset-8 z-50 flex flex-col bg-[#0f172a] rounded-[32px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] animate-fade-in overflow-hidden">
            <div className="h-14 bg-black/40 flex items-center justify-between px-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{activeApp.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white">{activeApp.name}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] text-green-500 font-bold tracking-widest uppercase">Remote Control Active</span>
                     <span className="text-[9px] text-yellow-500 font-bold">• {activeApp.costPerHour} Coin/h</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSyncFile(activeApp)}
                  className="bg-green-600 hover:bg-green-500 text-[10px] px-4 py-2 rounded-xl font-black transition-all shadow-lg"
                >
                  ĐỒNG BỘ FILE
                </button>
                <button
                  onClick={() => setActiveApp(null)}
                  className="bg-white/5 hover:bg-red-600 text-[10px] px-4 py-2 rounded-xl font-black transition-all"
                >
                  ĐÓNG
                </button>
              </div>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

               {/* UI Mockup for the remote software */}
               <div className="text-center font-mono space-y-6">
                  <div className="w-20 h-20 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto border border-[var(--accent-primary)]/20">
                    <span className="text-4xl animate-pulse">⚡</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.3em]">Alpha Stream Engine</p>
                    <p className="text-[10px] text-gray-600">Đang nhận luồng 4K @60fps từ Node_S1</p>
                  </div>
                  <div className="text-xs text-[var(--accent-primary)] mt-4">
                      {activeApp.description}
                  </div>
               </div>

               {/* Interaction Hint */}
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px] pointer-events-none">
                  <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs shadow-xl">Sử dụng chuột và bàn phím để điều khiển</span>
               </div>
            </div>

            <div className="h-10 bg-black/60 px-6 flex items-center justify-between text-[9px] font-bold text-gray-500 uppercase tracking-widest">
               <span>Memory: 18.4GB / 24.0GB</span>
               <span>RTX 4090 Load: 68%</span>
            </div>
          </div>
        )}
      </main>

      {/* Taskbar */}
      <footer className="h-16 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-center gap-5 px-6 pb-2 overflow-x-auto">
        <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-blue-600 rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-lg hover:rotate-12 transition-all cursor-pointer flex-shrink-0">A</div>
        <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
        <div className="flex gap-4">
            {apps.map(app => (
            <div
                key={app.id}
                onClick={() => setActiveApp(app)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl transition-all cursor-pointer hover:bg-white/5 flex-shrink-0 ${activeApp?.id === app.id ? 'bg-white/10 border-b-4 border-[var(--accent-primary)]' : ''}`}
                title={app.name}
            >
                {app.icon}
            </div>
            ))}
        </div>
        <div className="w-px h-8 bg-white/10 mx-2 flex-shrink-0"></div>
        <div className="flex-1"></div>
        <div className="text-[10px] font-bold text-gray-500 text-right flex-shrink-0">
          <div>VN_NODE_ALPHA</div>
          <div className="text-green-500">SECURE CONNECTED</div>
        </div>
      </footer>
    </div>
  );
};

export default AIServerConnect;
