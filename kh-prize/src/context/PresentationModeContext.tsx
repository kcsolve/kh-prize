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
  enterPresentationMode: () => void;
  exitPresentationMode: () => void;
}

const PresentationModeContext = createContext<PresentationModeContextValue | null>(null);

const PresentationRemoteListener: React.FC = () => {
  const { isPresentationMode } = usePresentationMode();
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
  ]);

  return null;
};

export const PresentationModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const setActiveTab = useDrawStore((s) => s.setActiveTab);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const enterPresentationMode = useCallback(() => {
    setActiveTab('stage');
    setIsPresentationMode(true);
  }, [setActiveTab]);

  const exitPresentationMode = useCallback(() => {
    setIsPresentationMode(false);
  }, []);

  const value = useMemo(
    () => ({
      isPresentationMode,
      enterPresentationMode,
      exitPresentationMode,
    }),
    [isPresentationMode, enterPresentationMode, exitPresentationMode]
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
  const { isPresentationMode, enterPresentationMode, exitPresentationMode } =
    usePresentationMode();

  const handleClick = () => {
    if (isPresentationMode) {
      if (
        confirm(
          '確定退出抽獎模式？\n\n將恢復獎品／名單等所有編輯功能，簡報遙控器也會停止觸發「開始抽獎」。'
        )
      ) {
        exitPresentationMode();
      }
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
