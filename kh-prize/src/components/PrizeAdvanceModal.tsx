import React from 'react';
import { motion } from 'framer-motion';
import { Check, Gift } from 'lucide-react';
import { usePresentationMode } from '../context/PresentationModeContext';
import { PrizeNameFitText } from './PrizeNameFitText';

export interface PrizeAdvanceNotice {
  completedPrizeName: string;
  nextPrizeName: string | null;
}

interface PrizeAdvanceModalProps {
  notice: PrizeAdvanceNotice;
  onDismiss: () => void;
}

export const PrizeAdvanceModal: React.FC<PrizeAdvanceModalProps> = ({ notice, onDismiss }) => {
  const { isPresentationMode } = usePresentationMode();
  const hasNext = notice.nextPrizeName != null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prize-advance-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`w-full rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 shadow-xl overflow-hidden ${
          isPresentationMode ? 'max-w-[min(98vw,44rem)]' : 'max-w-md'
        }`}
      >
        <div
          className={`px-6 border-b border-slate-800 text-center ${
            isPresentationMode ? 'py-6' : 'py-5'
          }`}
        >
          <Gift
            className={`text-amber-400 mx-auto mb-2 ${isPresentationMode ? 'w-12 h-12' : 'w-9 h-9'}`}
          />
          <p
            id="prize-advance-title"
            className={`font-semibold text-slate-100 ${
              isPresentationMode ? 'text-xl sm:text-2xl' : 'text-base'
            }`}
          >
            本獎項名額已滿
          </p>
        </div>

        <div className={`px-6 text-center space-y-4 ${isPresentationMode ? 'py-8' : 'py-6'}`}>
          {hasNext ? (
            <>
              <p className={`text-slate-300 ${isPresentationMode ? 'text-base sm:text-lg' : 'text-sm'}`}>
                將自動切換至下一份獎項
              </p>
              <PrizeNameFitText
                text={notice.nextPrizeName ?? ''}
                isPresentationMode={isPresentationMode}
                context="advance"
                maxLines={1}
                align="center"
                toneClassName="text-amber-300 font-bold"
              />
            </>
          ) : (
            <p className="text-sm text-slate-300">所有獎項名額皆已抽完，感謝參與！</p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            data-presentation-draw
            onClick={onDismiss}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-bold text-base transition"
          >
            <Check className="w-5 h-5" />
            {hasNext ? '知道了，繼續抽獎' : '知道了'}
          </button>
          {isPresentationMode && (
            <p className="mt-3 text-center text-[11px] text-slate-500">
              抽獎模式：按遙控 Enter／空白／翻頁鍵亦可關閉
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
