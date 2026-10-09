import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Check } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';

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
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-reveal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-gradient-to-b from-slate-900 to-slate-950 shadow-[0_0_60px_rgba(245,158,11,0.35)] overflow-hidden"
      >
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-4 text-center">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <p id="winner-reveal-title" className="text-sm text-amber-300/90 font-medium">
            恭喜得獎
          </p>
          <p className="text-xs text-slate-400 mt-1">{prizeName}</p>
        </div>

        <div className="px-6 py-8 text-center">
          <p className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-3">
            {winner.name}
          </p>
          <p className="text-base text-slate-400">
            {winner.department}
          </p>
          <p className="text-sm text-slate-500 font-mono mt-1">{winner.id}</p>
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-base transition shadow-lg"
          >
            <Check className="w-5 h-5" />
            確認並加入得獎名冊
          </button>
        </div>
      </motion.div>
    </div>
  );
};
