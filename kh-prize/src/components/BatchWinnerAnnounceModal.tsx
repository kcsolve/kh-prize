import React from 'react';
import { motion } from 'framer-motion';
import { Check, PartyPopper } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';
import { usePresentationMode } from '../context/PresentationModeContext';
import { getBatchWinnerListLayout } from '../utils/winnerModalTypography';

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
  const layout = getBatchWinnerListLayout(count, isPresentationMode);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-stretch sm:items-center justify-center p-1 sm:p-3 bg-slate-950/88 backdrop-blur-sm"
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
        className={`flex flex-col rounded-2xl border border-emerald-500/45 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden ${
          isPresentationMode
            ? 'w-full h-full max-h-[100dvh] sm:h-auto sm:max-h-[96dvh] sm:w-[min(98vw,80rem)]'
            : 'w-[min(96vw,56rem)] max-h-[min(92vh,880px)]'
        }`}
      >
        <div
          className={`bg-emerald-500/15 border-b border-emerald-500/30 shrink-0 ${
            isPresentationMode && count > 6 ? 'px-3 py-1.5' : 'px-4 py-2'
          }`}
        >
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center">
            <PartyPopper
              className={`text-emerald-400 shrink-0 ${isPresentationMode ? 'w-6 h-6' : 'w-5 h-5'}`}
              aria-hidden
            />
            <p
              id="batch-winner-title"
              className={`font-bold text-emerald-100 ${
                isPresentationMode ? 'text-xl sm:text-2xl' : 'text-lg'
              }`}
            >
              一連抽 · 得獎公佈
            </p>
            <span
              className={`text-emerald-300/90 font-medium ${
                isPresentationMode ? 'text-base sm:text-lg' : 'text-sm'
              }`}
            >
              共 {count} 位
            </span>
          </div>
          <p
            className={`text-slate-400 text-center line-clamp-2 ${
              isPresentationMode
                ? count > 6
                  ? 'text-sm mt-0'
                  : 'text-base sm:text-lg mt-0.5'
                : 'text-sm mt-0.5'
            }`}
          >
            {prizeName}
          </p>
        </div>

        <ul
          className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 sm:px-4 grid content-start auto-rows-auto ${layout.listGap} ${layout.gridClass}`}
        >
          {winners.map((winner, index) => (
            <li
              key={winner.id}
              className={`flex items-center rounded-lg border border-slate-700/80 bg-slate-950/70 ${layout.rowClass}`}
            >
              <span
                className={`shrink-0 rounded-full bg-emerald-500/30 text-emerald-200 font-bold flex items-center justify-center ${layout.badgeClass}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 text-left">
                <p className={`font-bold text-white leading-tight ${layout.nameClass}`} title={winner.name}>
                  {winner.name}
                </p>
                <p
                  className={`text-slate-400 leading-snug mt-0.5 ${layout.metaClass}`}
                  title={`${winner.department} · ${winner.id}`}
                >
                  <span className="break-words">{winner.department}</span>
                  <span className="text-slate-500"> · </span>
                  <span className="font-mono text-slate-500">{winner.id}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div
          className={`shrink-0 border-t border-slate-800/80 bg-slate-950/40 ${
            isPresentationMode ? 'px-4 py-2.5' : 'px-4 py-3'
          }`}
        >
          <button
            type="button"
            data-presentation-draw
            onClick={onConfirm}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg ${
              isPresentationMode ? 'py-3.5 text-lg sm:text-xl' : 'py-3 text-base'
            }`}
          >
            <Check className={isPresentationMode ? 'w-6 h-6' : 'w-5 h-5'} />
            確認並加入得獎名冊
          </button>
          {isPresentationMode && (
            <p className="mt-1 text-center text-[11px] text-slate-500">
              抽獎模式：遙控 Enter／空白／翻頁鍵可確認
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
