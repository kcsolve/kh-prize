import React from 'react';
import { motion } from 'framer-motion';
import { Check, PartyPopper } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';
import { usePresentationMode } from '../context/PresentationModeContext';

export interface BatchWinnerSummaryPayload {
  winners: Participant[];
  prizeId: string;
  prizeName: string;
}

interface BatchWinnerAnnounceModalProps {
  payload: BatchWinnerSummaryPayload;
  onConfirm: () => void;
}

export const BatchWinnerAnnounceModal: React.FC<BatchWinnerAnnounceModalProps> = ({
  payload,
  onConfirm,
}) => {
  const { isPresentationMode } = usePresentationMode();
  const { winners, prizeName } = payload;
  const count = winners.length;
  const useThreeColumns = count > 12;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/88 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-winner-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="w-[min(96vw,56rem)] max-h-[min(92vh,880px)] flex flex-col rounded-2xl border border-emerald-500/45 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden"
      >
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 shrink-0">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
            <PartyPopper className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden />
            <p id="batch-winner-title" className="text-lg font-bold text-emerald-100">
              一連抽 · 得獎公佈
            </p>
            <span className="text-sm text-emerald-300/90 font-medium">共 {count} 位</span>
          </div>
          <p className="text-sm text-slate-400 text-center mt-0.5 line-clamp-2">{prizeName}</p>
        </div>

        <ul
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-2 sm:px-4 grid gap-x-2 gap-y-1.5 content-start auto-rows-auto ${
            useThreeColumns ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2'
          }`}
        >
          {winners.map((winner, index) => (
            <li
              key={winner.id}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/70 px-2.5 py-2"
            >
              <span className="w-7 h-7 shrink-0 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p
                  className={`font-bold text-white leading-snug ${
                    useThreeColumns ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                  }`}
                  title={winner.name}
                >
                  {winner.name}
                </p>
                <p
                  className={`text-slate-400 leading-snug ${
                    useThreeColumns ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'
                  }`}
                  title={`${winner.department} · ${winner.id}`}
                >
                  <span className="break-all">{winner.department}</span>
                  <span className="text-slate-500"> · </span>
                  <span className="font-mono text-slate-500">{winner.id}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="px-4 py-3 shrink-0 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            data-presentation-draw
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition shadow-lg"
          >
            <Check className="w-5 h-5" />
            確認並加入得獎名冊
          </button>
          {isPresentationMode && (
            <p className="mt-1.5 text-center text-[11px] text-slate-500">
              抽獎模式：遙控 Enter／空白／翻頁鍵可確認
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
