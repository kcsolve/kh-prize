import React from 'react';
import { Trophy, Volume2, VolumeX } from 'lucide-react';
import { useDrawStore } from './store/useDrawStore';
import { DrawStage } from './components/DrawStage';
import { PrizeManager } from './components/PrizeManager';
import { ParticipantManager } from './components/ParticipantManager';
import { DrawSessionProvider, DrawStartButton } from './context/DrawSessionContext';

const TABS = [
  { id: 'stage' as const, label: '抽獎舞台' },
  { id: 'prizes' as const, label: '獎品管理' },
  { id: 'participants' as const, label: '名單管理' },
];

export const LuckyDraw: React.FC = () => {
  const { hasHydrated, activeTab, setActiveTab, isMuted, toggleMute } = useDrawStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        正在自 IndexedDB 還原抽獎狀態...
      </div>
    );
  }

  return (
    <DrawSessionProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 flex flex-col">
        <header className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 lg:gap-6 items-center mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 lg:justify-self-start">
            <Trophy className="w-8 h-8 text-amber-400 shrink-0" />
            <div className="text-left min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-wider truncate">
                ANNUAL GALA 2026 動態抽獎
              </h1>
            </div>
          </div>

          <div className="flex justify-center py-1">
            {activeTab === 'stage' ? <DrawStartButton /> : <div className="h-[52px]" aria-hidden />}
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2 lg:justify-self-end">
            <nav className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 rounded-md bg-slate-800 text-slate-400 hover:text-slate-200"
              title={isMuted ? '開啟音效（預留）' : '靜音（預留）'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 'stage' && <DrawStage />}
          {activeTab === 'prizes' && <PrizeManager />}
          {activeTab === 'participants' && <ParticipantManager />}
        </div>
      </div>
    </DrawSessionProvider>
  );
};
