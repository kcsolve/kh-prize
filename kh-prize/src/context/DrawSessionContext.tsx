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

interface DrawSessionContextValue {
  isDrawing: boolean;
  canDraw: boolean;
  prizeSlotsLeft: number;
  highlightId: string | null;
  runDrawAnimation: () => void;
}

const DrawSessionContext = createContext<DrawSessionContextValue | null>(null);

export const DrawSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { participants, prizes, currentPrizeId, awardWinner } = useDrawStore();

  const currentPrize = prizes.find((p) => p.id === currentPrizeId);
  const pool = participants.filter((p) => p.eligible);
  const prizeSlotsLeft =
    currentPrize != null ? currentPrize.quota - currentPrize.winners.length : 0;
  const canDraw = pool.length > 0 && prizeSlotsLeft > 0 && currentPrize != null;

  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poolRef = useRef(pool);
  poolRef.current = pool;

  const selectRandomParticipant = (candidates: Participant[]): Participant => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return candidates[array[0] % candidates.length];
  };

  const finalizeWinner = useCallback(() => {
    const candidates = poolRef.current;
    if (candidates.length === 0) return;

    const finalWinner = selectRandomParticipant(candidates);
    setHighlightId(finalWinner.id);

    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      awardWinner(currentPrizeId, finalWinner);
      setIsDrawing(false);
      setHighlightId(null);
    }, 800);
  }, [awardWinner, currentPrizeId]);

  const runDrawAnimation = useCallback(() => {
    if (!canDraw || isDrawing) return;

    setIsDrawing(true);
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
  }, [canDraw, isDrawing, finalizeWinner]);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const value: DrawSessionContextValue = {
    isDrawing,
    canDraw,
    prizeSlotsLeft,
    highlightId,
    runDrawAnimation,
  };

  return <DrawSessionContext.Provider value={value}>{children}</DrawSessionContext.Provider>;
};

export const useDrawSession = (): DrawSessionContextValue => {
  const ctx = useContext(DrawSessionContext);
  if (!ctx) {
    throw new Error('useDrawSession must be used within DrawSessionProvider');
  }
  return ctx;
};

export const DrawStartButton: React.FC = () => {
  const { isDrawing, canDraw, prizeSlotsLeft, runDrawAnimation } = useDrawSession();

  return (
    <button
      type="button"
      onClick={runDrawAnimation}
      disabled={isDrawing || !canDraw}
      className={`relative px-8 md:px-12 py-3 md:py-3.5 rounded-full font-bold text-base md:text-lg tracking-wider transition-all duration-300 whitespace-nowrap ${
        isDrawing
          ? 'bg-amber-500 text-slate-950 cursor-not-allowed animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.6)]'
          : !canDraw
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105'
      }`}
    >
      <span className="flex items-center gap-2">
        <Sparkles className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
        {isDrawing
          ? '抽取中 (5s)...'
          : !canDraw
            ? prizeSlotsLeft <= 0
              ? '本獎項名額已滿'
              : '無可抽候選人'
            : '開始抽獎'}
      </span>
    </button>
  );
};
