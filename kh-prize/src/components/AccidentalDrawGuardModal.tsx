import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface AccidentalDrawGuardModalProps {
  open: boolean;
}

/** 僅顯示提示；解除由全域 W 鍵監聽處理 */
export const AccidentalDrawGuardModal: React.FC<AccidentalDrawGuardModalProps> = ({ open }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-950/92 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="accidental-draw-guard-title"
      data-accidental-draw-guard
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-500/50 bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] text-center">
        <ShieldAlert className="w-12 h-12 text-amber-400 mx-auto mb-3" aria-hidden />
        <h2 id="accidental-draw-guard-title" className="text-lg font-bold text-amber-100 mb-2">
          偵測到連續誤觸抽獎
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          為避免重複啟動抽獎，已暫時鎖定「開始抽獎」（單抽與一連抽皆適用）。請確認現場無誤後再繼續。
        </p>
        <p className="text-base font-semibold text-amber-300 border border-amber-500/30 rounded-lg px-4 py-3 bg-amber-500/10">
          按 <kbd className="mx-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-600 text-slate-100 font-mono text-sm">W</kbd>{' '}
          解除鎖定（大小寫皆可）
        </p>
      </div>
    </div>
  );
};