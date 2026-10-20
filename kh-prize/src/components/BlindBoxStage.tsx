import React from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';

interface BlindBoxStageProps {
  pool: Participant[];
  highlightId: string | null;
  isDrawing: boolean;
  isPreRevealPause: boolean;
  isPopupOpen: boolean;
}

export const BlindBoxStage: React.FC<BlindBoxStageProps> = ({
  pool,
  highlightId,
  isDrawing,
  isPreRevealPause,
  isPopupOpen,
}) => {
  const focused = highlightId ? pool.find((p) => p.id === highlightId) : null;
  const isRevealed = isPreRevealPause && focused != null;

  return (
    <div className="flex flex-1 min-h-0 items-center justify-center py-6 px-4">
      <motion.div
        className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80"
        animate={
          isPopupOpen
            ? { opacity: 0, scale: 0.88, y: 16 }
            : isDrawing
              ? {
                  rotate: [0, -5, 5, -4, 4, 0],
                  y: [0, -6, 0, -4, 0],
                  opacity: 1,
                  scale: 1,
                }
              : isRevealed
                ? { rotate: 0, y: 0, opacity: 1, scale: [1, 1.06, 1.02] }
                : { rotate: 0, y: 0, opacity: 1, scale: 1 }
        }
        transition={
          isPopupOpen
            ? { duration: 0.32, ease: [0.22, 1, 0.36, 1] }
            : isDrawing
              ? { duration: 0.45, repeat: Infinity, ease: 'easeInOut' }
              : isRevealed
                ? { duration: 0.35, ease: 'easeOut' }
                : { duration: 0.3 }
        }
      >
        <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-600/90 via-amber-800/80 to-slate-900 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

          <div className="relative h-full flex flex-col items-center justify-center p-5 sm:p-6 text-center">
            {isRevealed ? (
              <motion.div
                key={focused?.id ?? 'reveal'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
                className="space-y-1"
              >
                <Sparkles className="w-7 h-7 text-amber-200 mx-auto mb-1 animate-pulse" />
                <p className="font-bold leading-tight text-2xl sm:text-3xl md:text-4xl text-white drop-shadow">
                  {focused?.name}
                </p>
                <p className="text-xs sm:text-sm text-amber-200/80">
                  {focused?.department} · {focused?.id}
                </p>
              </motion.div>
            ) : isDrawing ? (
              <motion.div
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 0.55, repeat: Infinity }}
                className="flex flex-col items-center"
              >
                <Gift className="w-16 h-16 sm:w-20 sm:h-20 text-amber-200/80 mb-3" strokeWidth={1.5} />
                <p className="text-4xl font-black tracking-[0.35em] text-amber-100/90">···</p>
              </motion.div>
            ) : (
              <>
                <Gift className="w-16 h-16 sm:w-20 sm:h-20 text-amber-200/90 mb-3" strokeWidth={1.5} />
                <p className="text-5xl sm:text-6xl font-black text-amber-100/90">?</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
