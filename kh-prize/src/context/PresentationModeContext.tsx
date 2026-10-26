import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import { useDrawSession } from './DrawSessionContext';

const REMOTE_DRAW_KEYS = new Set([
  'Enter',
  ' ',
  'PageDown',
  'PageUp',
  'ArrowRight',
  'NumpadEnter',
]);

interface PresentationModeContextValue {
  isPresentationMode: boolean;
  isNativeFullscreen: boolean;
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
  exitNativeFullscreen: () => void;
  requestExitPresentation: () => void;
  cancelExitPresentation: () => void;
  exitConfirmOpen: boolean;
}

const PresentationModeContext = createContext<PresentationModeContextValue | null>(null);

const PresentationRemoteListener: React.FC = () => {
  const {
    isPresentationMode,
    isNativeFullscreen,
    exitNativeFullscreen,
    requestExitPresentation,
    cancelExitPresentation,
    exitConfirmOpen,
  } = usePresentationMode();
  const {
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    canDraw,
    runDrawAnimation,
    confirmPendingWinner,
    isPrizeAdvanceOpen,
    dismissPrizeAdvance,
  } = useDrawSession();

  useEffect(() => {
    if (!isPresentationMode) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-safety-control]')) return;

        e.preventDefault();
        e.stopPropagation();

        if (exitConfirmOpen) {
          cancelExitPresentation();
          return;
        }

        if (isDrawing || isPreRevealPause || isAwaitingConfirm || isPrizeAdvanceOpen) return;

        if (isNativeFullscreen || document.fullscreenElement) {
          exitNativeFullscreen();
          return;
        }

        requestExitPresentation();
        return;
      }

      if (!REMOTE_DRAW_KEYS.has(e.key)) return;

      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-safety-control]')) return;

      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      e.preventDefault();
      e.stopPropagation();

      if (isPrizeAdvanceOpen) {
        dismissPrizeAdvance();
        return;
      }

      if (isAwaitingConfirm) {
        confirmPendingWinner();
        return;
      }

      if (isDrawing || isPreRevealPause || !canDraw) return;
      runDrawAnimation();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [
    isPresentationMode,
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    canDraw,
    runDrawAnimation,
    confirmPendingWinner,
    isPrizeAdvanceOpen,
    dismissPrizeAdvance,
    isNativeFullscreen,
    exitNativeFullscreen,
    requestExitPresentation,
    cancelExitPresentation,
    exitConfirmOpen,
  ]);

  return null;
};

export const PresentationExitConfirmModal: React.FC<{
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-presentation-title"
      data-safety-control
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
        <h2 id="exit-presentation-title" className="text-lg font-bold text-slate-100 mb-2">
          退出抽獎模式？
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          將離開全屏舞台、關閉瀏覽器全屏，並恢復獎品／名單等編輯功能。簡報遙控器也會停止觸發「開始抽獎」。
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            data-safety-control
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            取消
          </button>
          <button
            type="button"
            data-safety-control
            onClick={onConfirm}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            確定退出
          </button>
        </div>
      </div>
    </div>
  );
};

export const PresentationModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setActiveTab = useDrawStore((s) => s.setActiveTab);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  useEffect(() => {
    const sync = () => setIsNativeFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    sync();
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const exitNativeFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    }
  }, []);

  const enterPresentationMode = useCallback(() => {
    setActiveTab('stage');
    setIsPresentationMode(true);
  }, [setActiveTab]);

  const exitPresentationMode = useCallback(() => {
    setExitConfirmOpen(false);
    exitNativeFullscreen();
    setIsPresentationMode(false);
  }, [exitNativeFullscreen]);

  const requestExitPresentation = useCallback(() => {
    setExitConfirmOpen(true);
  }, []);

  const cancelExitPresentation = useCallback(() => {
    setExitConfirmOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isPresentationMode,
      isNativeFullscreen,
      enterPresentationMode,
      exitPresentationMode,
      exitNativeFullscreen,
      requestExitPresentation,
      cancelExitPresentation,
      exitConfirmOpen,
    }),
    [
      isPresentationMode,
      isNativeFullscreen,
      enterPresentationMode,
      exitPresentationMode,
      exitNativeFullscreen,
      requestExitPresentation,
      cancelExitPresentation,
      exitConfirmOpen,
    ]
  );

  return (
    <PresentationModeContext.Provider value={value}>{children}</PresentationModeContext.Provider>
  );
};

export { PresentationRemoteListener };

export const usePresentationMode = (): PresentationModeContextValue => {
  const ctx = useContext(PresentationModeContext);
  if (!ctx) {
    throw new Error('usePresentationMode must be used within PresentationModeProvider');
  }
  return ctx;
};

export const SafetyModeButton: React.FC = () => {
  const { isPresentationMode, enterPresentationMode, requestExitPresentation } =
    usePresentationMode();

  const handleClick = () => {
    if (isPresentationMode) {
      requestExitPresentation();
      return;
    }

    enterPresentationMode();
  };

  return (
    <button
      type="button"
      data-safety-control
      onClick={handleClick}
      title={
        isPresentationMode
          ? '退出抽獎模式（需確認）'
          : '進入抽獎模式：鎖定編輯，僅可開始抽獎'
      }
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition shrink-0 ${
        isPresentationMode
          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
      }`}
    >
      {isPresentationMode ? (
        <LockOpen className="w-3.5 h-3.5" aria-hidden />
      ) : (
        <Lock className="w-3.5 h-3.5" aria-hidden />
      )}
      抽獎模式
    </button>
  );
};
