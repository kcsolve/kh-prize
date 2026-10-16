import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import type { Participant } from '../store/useDrawStore';
import { WinnerRevealModal } from '../components/WinnerRevealModal';
import {
  PrizeAdvanceModal,
  type PrizeAdvanceNotice,
} from '../components/PrizeAdvanceModal';
import { getNextDrawablePrize, isPrizeFull } from '../utils/prizeNavigation';

interface PendingReveal {
  winner: Participant;
  prizeName: string;
}

const PRE_REVEAL_PAUSE_MS = 3000;

interface DrawSessionContextValue {
  isDrawing: boolean;
  isPreRevealPause: boolean;
  isAwaitingConfirm: boolean;
  canDraw: boolean;
  prizeSlotsLeft: number;
  highlightId: string | null;
  runDrawAnimation: () => void;
  confirmPendingWinner: () => void;
  isPrizeAdvanceOpen: boolean;
  dismissPrizeAdvance: () => void;
}

const DrawSessionContext = createContext<DrawSessionContextValue | null>(null);

export const DrawSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { participants, prizes, currentPrizeId, awardWinner, setCurrentPrizeId } =
    useDrawStore();

  const currentPrize = prizes.find((p) => p.id === currentPrizeId);
  const pool = participants.filter((p) => p.eligible);
  const prizeSlotsLeft =
    currentPrize != null ? currentPrize.quota - currentPrize.winners.length : 0;

  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pendingReveal, setPendingReveal] = useState<PendingReveal | null>(null);
  const [isPreRevealPause, setIsPreRevealPause] = useState(false);
  const [prizeAdvanceNotice, setPrizeAdvanceNotice] = useState<PrizeAdvanceNotice | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const prizeNameRef = useRef(currentPrize?.name ?? '');

  useEffect(() => {
    prizeNameRef.current = currentPrize?.name ?? '';
  }, [currentPrize?.name]);

  const isAwaitingConfirm = pendingReveal != null;
  const isPrizeAdvanceOpen = prizeAdvanceNotice != null;
  const canDraw =
    pool.length > 0 &&
    prizeSlotsLeft > 0 &&
    currentPrize != null &&
    !isAwaitingConfirm &&
    !isPreRevealPause &&
    !isPrizeAdvanceOpen;

  const openAdvanceFromFullPrize = useCallback(
    (prizeId: string) => {
      const snapshot = useDrawStore.getState();
      const completed = snapshot.prizes.find((p) => p.id === prizeId);
      if (!completed || !isPrizeFull(completed)) return;

      const next = getNextDrawablePrize(snapshot.prizes, prizeId);
      if (next) {
        setCurrentPrizeId(next.id);
        setPrizeAdvanceNotice({
          completedPrizeName: completed.name,
          nextPrizeName: next.name,
        });
      } else {
        setPrizeAdvanceNotice({
          completedPrizeName: completed.name,
          nextPrizeName: null,
        });
      }
    },
    [setCurrentPrizeId]
  );

  const dismissPrizeAdvance = useCallback(() => {
    setPrizeAdvanceNotice(null);
  }, []);

  const selectRandomParticipant = (candidates: Participant[]): Participant => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return candidates[array[0] % candidates.length];
  };

  const finalizeWinner = useCallback(() => {
    const candidates = poolRef.current;
    if (candidates.length === 0) {
      setIsDrawing(false);
      return;
    }

    const finalWinner = selectRandomParticipant(candidates);
    setHighlightId(finalWinner.id);
    setIsDrawing(false);
    setIsPreRevealPause(true);

    if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
    preRevealTimeoutRef.current = setTimeout(() => {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.55 },
      });

      setPendingReveal({
        winner: finalWinner,
        prizeName: prizeNameRef.current,
      });
      setIsPreRevealPause(false);
      preRevealTimeoutRef.current = null;
    }, PRE_REVEAL_PAUSE_MS);
  }, []);

  const confirmPendingWinner = useCallback(() => {
    if (!pendingReveal) return;
    const prizeIdAtConfirm = currentPrizeId;
    awardWinner(prizeIdAtConfirm, pendingReveal.winner);
    setPendingReveal(null);
    setHighlightId(null);

    const updatedPrize = useDrawStore
      .getState()
      .prizes.find((p) => p.id === prizeIdAtConfirm);
    if (updatedPrize && isPrizeFull(updatedPrize)) {
      openAdvanceFromFullPrize(prizeIdAtConfirm);
    }
  }, [pendingReveal, awardWinner, currentPrizeId, openAdvanceFromFullPrize]);

  useEffect(() => {
    if (isDrawing || isAwaitingConfirm || isPreRevealPause || isPrizeAdvanceOpen) return;
    if (!currentPrize || !isPrizeFull(currentPrize)) return;
    const next = getNextDrawablePrize(prizes, currentPrizeId);
    if (!next) return;
    openAdvanceFromFullPrize(currentPrizeId);
  }, [
    currentPrizeId,
    currentPrize,
    isDrawing,
    isAwaitingConfirm,
    isPreRevealPause,
    isPrizeAdvanceOpen,
    openAdvanceFromFullPrize,
    prizes,
  ]);

  const runDrawAnimation = useCallback(() => {
    if (!canDraw || isDrawing || isAwaitingConfirm || isPreRevealPause) return;

    setIsDrawing(true);
    setPendingReveal(null);
    setIsPreRevealPause(false);
    if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
    const durationMs = 5000;
    const startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentDelay = 50 + Math.pow(progress, 3) * 300;

      const candidates = poolRef.current;
      if (candidates.length > 0) {
        const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        setHighlightId(randomCandidate.id);
      }

      if (progress < 1) {
        animationTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(loop);
        }, currentDelay);
      } else {
        finalizeWinner();
      }
    };

    requestAnimationFrame(loop);
  }, [canDraw, isDrawing, isAwaitingConfirm, isPreRevealPause, finalizeWinner]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
    };
  }, []);

  const value: DrawSessionContextValue = {
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    canDraw,
    prizeSlotsLeft,
    highlightId,
    runDrawAnimation,
    confirmPendingWinner,
    isPrizeAdvanceOpen,
    dismissPrizeAdvance,
  };

  return (
    <DrawSessionContext.Provider value={value}>
      {children}
      {pendingReveal && (
        <WinnerRevealModal
          winner={pendingReveal.winner}
          prizeName={pendingReveal.prizeName}
          onConfirm={confirmPendingWinner}
        />
      )}
      {prizeAdvanceNotice && (
        <PrizeAdvanceModal notice={prizeAdvanceNotice} onDismiss={dismissPrizeAdvance} />
      )}
    </DrawSessionContext.Provider>
  );
};

export const useDrawSession = (): DrawSessionContextValue => {
  const ctx = useContext(DrawSessionContext);
  if (!ctx) {
    throw new Error('useDrawSession must be used within DrawSessionProvider');
  }
  return ctx;
};

export const DrawStartButton: React.FC = () => {
  const {
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    canDraw,
    prizeSlotsLeft,
    runDrawAnimation,
  } = useDrawSession();

  const disabled = isDrawing || isPreRevealPause || isAwaitingConfirm || !canDraw;

  return (
    <button
      type="button"
      data-presentation-draw
      onClick={runDrawAnimation}
      disabled={disabled}
      className={`relative px-8 md:px-12 py-3 md:py-3.5 rounded-full font-bold text-base md:text-lg tracking-wider transition-all duration-300 whitespace-nowrap ${
        isDrawing || isPreRevealPause
          ? 'bg-amber-500 text-slate-950 cursor-not-allowed animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.6)]'
          : isAwaitingConfirm
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : !canDraw
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105'
      }`}
    >
      <span className="flex items-center gap-2">
        <Sparkles className={`w-5 h-5 ${isDrawing || isPreRevealPause ? 'animate-spin' : ''}`} />
        {isDrawing
          ? '抽取中 (5s)...'
          : isPreRevealPause
            ? '定格揭曉 (3s)...'
            : isAwaitingConfirm
            ? '請確認得獎者'
            : !canDraw
              ? prizeSlotsLeft <= 0
                ? '本獎項名額已滿'
                : '無可抽候選人'
              : '開始抽獎'}
      </span>
    </button>
  );
};
