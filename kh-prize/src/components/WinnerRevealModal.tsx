import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';
import { usePresentationMode } from '../context/PresentationModeContext';
import { useDrawStore } from '../store/useDrawStore';

interface WinnerRevealModalProps {
  winner: Participant;
  prizeName: string;
  onConfirm: () => void;
}

export const WinnerRevealModal: React.FC<WinnerRevealModalProps> = ({
  winner,
  prizeName,
  onConfirm,
}) => {
  const { isPresentationMode } = usePresentationMode();
  const isBlindbox = useDrawStore((s) => s.stageDisplayMode) === 'blindbox';

  return (
    <motion.div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 backdrop-blur-sm ${
        isPresentationMode ? 'p-2 sm:p-4' : 'p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-reveal-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: isBlindbox ? 0.25 : 0.35 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: isBlindbox ? 0.92 : 0.85, y: isBlindbox ? 20 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          isBlindbox
            ? { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
            : { type: 'spring', stiffness: 320, damping: 26 }
        }
        className={`w-full rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.35)] overflow-hidden ${
          isPresentationMode
            ? 'max-w-[min(98vw,48rem)] min-h-[min(88dvh,720px)] flex flex-col justify-center'
            : 'max-w-md'
        }`}
      >
        <div
          className={`bg-amber-500/15 border-b border-amber-500/30 text-center ${
            isPresentationMode ? 'px-8 py-5' : 'px-6 py-4'
          }`}
        >
          <Trophy
            className={`text-amber-400 mx-auto mb-2 ${isPresentationMode ? 'w-14 h-14' : 'w-10 h-10'}`}
          />
          <p
            id="winner-reveal-title"
            className={`text-amber-300/90 font-medium ${
              isPresentationMode ? 'text-xl sm:text-2xl' : 'text-sm'
            }`}
          >
            恭喜得獎
          </p>
          <p
            className={`text-slate-400 mt-1 ${isPresentationMode ? 'text-base sm:text-lg' : 'text-xs'}`}
          >
            {prizeName}
          </p>
        </div>

        <div
          className={`text-center flex-1 flex flex-col justify-center ${
            isPresentationMode ? 'px-8 py-10 sm:py-14' : 'px-6 py-8'
          }`}
        >
          <p
            className={`font-bold text-white tracking-tight mb-3 leading-tight ${
              isPresentationMode
                ? 'text-5xl sm:text-6xl md:text-7xl lg:text-8xl'
                : 'text-4xl md:text-5xl'
            }`}
          >
            {winner.name}
          </p>
          <p
            className={`text-slate-400 ${isPresentationMode ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base'}`}
          >
            {winner.department}
          </p>
          <p
            className={`text-slate-500 font-mono mt-2 ${
              isPresentationMode ? 'text-lg sm:text-xl' : 'text-sm'
            }`}
          >
            {winner.id}
          </p>
        </div>

        <div className={isPresentationMode ? 'px-8 pb-8' : 'px-6 pb-6'}>
          <button
            type="button"
            data-presentation-draw
            onClick={onConfirm}
            className={`w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg ${
              isPresentationMode ? 'py-4 text-lg sm:text-xl' : 'py-3.5 text-base'
            }`}
          >
            <Check className={isPresentationMode ? 'w-6 h-6' : 'w-5 h-5'} />
            確認並加入得獎名冊
          </button>
          {isPresentationMode && (
            <p className="mt-3 text-center text-[11px] text-slate-500">
              抽獎模式：按遙控 Enter／空白／翻頁鍵亦可確認
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
