import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CandidateMatrix } from './CandidateMatrix';
import { Gift, RotateCcw, Download, ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import { useDrawSession } from '../context/DrawSessionContext';
import { exportDrawResultExcel } from '../utils/excel';

export const DrawStage: React.FC = () => {
  const {
    participants,
    prizes,
    currentPrizeId,
    setCurrentPrizeId,
    resetAll,
  } = useDrawStore();

  const { isDrawing, highlightId, prizeSlotsLeft } = useDrawSession();

  const pool = participants.filter((p) => p.eligible);

  const sortedPrizes = [...prizes].sort((a, b) => a.order - b.order);
  const winnerCount = sortedPrizes.reduce((sum, p) => sum + p.winners.length, 0);

  const [winnersPanelOpen, setWinnersPanelOpen] = useState(true);
  const [expandedPrizeIds, setExpandedPrizeIds] = useState<Record<string, boolean>>(() => ({
    [currentPrizeId]: true,
  }));

  const togglePrizeSection = (prizeId: string) => {
    setExpandedPrizeIds((prev) => ({ ...prev, [prizeId]: !prev[prizeId] }));
  };

  useEffect(() => {
    setExpandedPrizeIds((prev) =>
      prev[currentPrizeId] === undefined ? { ...prev, [currentPrizeId]: true } : prev
    );
  }, [currentPrizeId]);

  const handleExport = () => {
    if (participants.length === 0 && winnerCount === 0) {
      alert('目前無任何名單或抽獎紀錄可匯出');
      return;
    }
    exportDrawResultExcel(prizes, participants);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
          <span className="text-slate-400 text-sm shrink-0">目前獎項:</span>
          <select
            value={currentPrizeId}
            onChange={(e) => setCurrentPrizeId(e.target.value)}
            disabled={isDrawing || prizes.length === 0}
            className="w-full flex-1 min-w-0 bg-slate-900 border border-slate-700 px-4 py-2.5 rounded-lg text-base text-amber-300 font-semibold focus:outline-none focus:border-amber-400 disabled:opacity-50 truncate"
          >
            {[...prizes]
              .sort((a, b) => a.order - b.order)
              .map((prize) => (
                <option key={prize.id} value={prize.id}>
                  {prize.name} ({prize.winners.length}/{prize.quota})
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          onClick={handleExport}
          disabled={isDrawing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" /> 匯出結果
        </button>

        <button
          onClick={() => {
            if (confirm('確定要清空得獎紀錄並還原預設狀態？此操作不可逆。')) {
              resetAll();
            }
          }}
          disabled={isDrawing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-md text-xs disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5" /> 重設所有狀態
        </button>
        </div>
      </div>

      <main className="grid grid-cols-12 gap-4 lg:gap-6 flex-1 min-h-0 items-start">
        <section
          className={`col-span-12 lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md flex flex-col shrink-0 overflow-hidden ${
            winnersPanelOpen ? 'h-[280px] lg:h-[560px]' : 'h-auto'
          }`}
        >
          <button
            type="button"
            onClick={() => setWinnersPanelOpen((open) => !open)}
            className="flex items-center justify-between gap-2 p-4 border-b border-slate-800/80 text-left hover:bg-slate-800/30 transition shrink-0"
          >
            <div className="flex items-center gap-2 text-slate-300 min-w-0">
              <Gift className="w-5 h-5 text-amber-400 shrink-0" />
              <h2 className="font-semibold text-base text-slate-200 truncate">得獎名冊</h2>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                {winnerCount} 人
              </span>
            </div>
            {winnersPanelOpen ? (
              <PanelLeftClose className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
            )}
          </button>

          <AnimatePresence initial={false}>
            {winnersPanelOpen && (
              <motion.div
                key="winners-panel-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 pt-3 space-y-2">
                  {sortedPrizes.map((prize) => {
                    const isExpanded = expandedPrizeIds[prize.id] ?? false;
                    const isCurrent = prize.id === currentPrizeId;

                    return (
                      <div
                        key={prize.id}
                        className={`rounded-xl border overflow-hidden ${
                          isCurrent ? 'border-amber-500/40' : 'border-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => togglePrizeSection(prize.id)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 bg-slate-950/60 hover:bg-slate-800/50 text-left transition"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-200 truncate flex-1">
                            {prize.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                            {prize.winners.length}/{prize.quota}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-2 border-t border-slate-800/80">
                                {prize.winners.length === 0 ? (
                                  <p className="text-xs text-slate-500 py-2 text-center">尚無得獎者</p>
                                ) : (
                                  prize.winners.map((winner) => (
                                    <div
                                      key={winner.id}
                                      className="p-2.5 rounded-lg bg-gradient-to-r from-amber-500/10 to-amber-900/5 border border-amber-500/20"
                                    >
                                      <p className="font-semibold text-sm text-white">{winner.name}</p>
                                      <p className="text-[10px] text-slate-400">
                                        {winner.department} · {winner.id}
                                      </p>
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  {sortedPrizes.length === 0 && (
                    <div className="h-32 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm">
                      尚未設定獎項
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!winnersPanelOpen && winnerCount === 0 && (
            <p className="px-4 pb-3 text-xs text-slate-500">尚未抽出得獎者</p>
          )}
        </section>

        <section className="col-span-12 lg:col-span-9 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 lg:p-6 flex flex-col h-[min(560px,calc(100vh-240px))] min-h-[360px] shrink-0">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <span className="text-base font-medium text-slate-200">候選人員矩陣</span>
            <span className="text-sm bg-slate-800/80 px-3 py-1 rounded-md text-slate-300">
              候選: {pool.length} 人 · 本獎剩餘名額: {Math.max(prizeSlotsLeft, 0)}
            </span>
          </div>

          <CandidateMatrix pool={pool} highlightId={highlightId} isDrawing={isDrawing} />
        </section>
      </main>
    </div>
  );
};
