import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Sparkles } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import type { Participant } from '../store/useDrawStore';
import { WinnerRevealModal } from '../components/WinnerRevealModal';
import {
  BatchWinnerAnnounceModal,
  type BatchWinnerSummaryPayload,
} from '../components/BatchWinnerAnnounceModal';
import {
  PrizeAdvanceModal,
  type PrizeAdvanceNotice,
} from '../components/PrizeAdvanceModal';
import {
  getNextDrawablePrize,
  getRemainingPrizeSlots,
  isPrizeFull,
} from '../utils/prizeNavigation';
import { getDrawTiming } from '../utils/drawTiming';
import {
  PresentationExitConfirmModal,
  usePresentationMode,
} from './PresentationModeContext';
import { AccidentalDrawGuardModal } from '../components/AccidentalDrawGuardModal';

/** 兩次觸發抽獎間隔短於此值（ms）視為誤觸 */
const ACCIDENTAL_DRAW_GUARD_MS = 1000;

export const PRESENTATION_HOST_ATTR = 'data-presentation-host';

interface PendingReveal {
  winner: Participant;
  prizeId: string;
  prizeName: string;
}

interface BatchProgress {
  done: number;
  total: number;
}

interface DrawSessionContextValue {
  isDrawing: boolean;
  isPreRevealPause: boolean;
  isAwaitingConfirm: boolean;
  isBatchRunning: boolean;
  batchProgress: BatchProgress | null;
  canDraw: boolean;
  prizeSlotsLeft: number;
  highlightId: string | null;
  runDrawAnimation: () => void;
  confirmPendingWinner: () => void;
  abortDrawSession: () => void;
  isPrizeAdvanceOpen: boolean;
  dismissPrizeAdvance: () => void;
  isAccidentalDrawLocked: boolean;
  dismissAccidentalDrawLock: () => void;
}

const DrawSessionContext = createContext<DrawSessionContextValue | null>(null);

function pickMultipleWinners(candidates: Participant[], count: number): Participant[] {
  const remaining = [...candidates];
  const picked: Participant[] = [];
  const drawCount = Math.min(count, remaining.length);

  for (let i = 0; i < drawCount; i++) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const index = array[0] % remaining.length;
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}

export const DrawSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isPresentationMode,
    exitConfirmOpen,
    cancelExitPresentation,
    exitPresentationMode,
  } = usePresentationMode();
  const presentationHostRef = useRef<HTMLDivElement>(null);
  const { participants, prizes, currentPrizeId, awardWinner, setCurrentPrizeId, stageDisplayMode } =
    useDrawStore();
  const timing = getDrawTiming(stageDisplayMode);
  const timingRef = useRef(timing);
  timingRef.current = timing;

  const currentPrize = prizes.find((p) => p.id === currentPrizeId);
  const pool = participants.filter((p) => p.eligible);
  const prizeSlotsLeft =
    currentPrize != null ? currentPrize.quota - currentPrize.winners.length : 0;

  const [isDrawing, setIsDrawing] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pendingReveal, setPendingReveal] = useState<PendingReveal | null>(null);
  const [pendingBatchSummary, setPendingBatchSummary] =
    useState<BatchWinnerSummaryPayload | null>(null);
  const [isPreRevealPause, setIsPreRevealPause] = useState(false);
  const [prizeAdvanceNotice, setPrizeAdvanceNotice] = useState<PrizeAdvanceNotice | null>(null);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [isAccidentalDrawLocked, setIsAccidentalDrawLocked] = useState(false);
  const lastDrawTriggerAtRef = useRef(0);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const prizeNameRef = useRef(currentPrize?.name ?? '');
  const currentPrizeIdRef = useRef(currentPrizeId);
  currentPrizeIdRef.current = currentPrizeId;
  const batchActiveRef = useRef(false);
  const batchRemainingRef = useRef(0);
  const batchSlotsAtStartRef = useRef(0);
  const batchProgressRef = useRef<BatchProgress | null>(null);
  const batchWinnersRef = useRef<Participant[]>([]);
  const runDrawAnimationRef = useRef<() => void>(() => {});
  /** 本輪抽獎開始時鎖定的獎項，避免動畫／確認期間錯配 */
  const drawSessionPrizeIdRef = useRef('');
  const drawSessionPrizeNameRef = useRef('');

  useEffect(() => {
    prizeNameRef.current = currentPrize?.name ?? '';
  }, [currentPrize?.name]);

  const isBatchRunning = batchProgress != null;

  batchProgressRef.current = batchProgress;

  const isAwaitingConfirm = pendingReveal != null || pendingBatchSummary != null;
  const isPrizeAdvanceOpen = prizeAdvanceNotice != null;
  const dismissAccidentalDrawLock = useCallback(() => {
    setIsAccidentalDrawLocked(false);
    lastDrawTriggerAtRef.current = 0;
  }, []);

  const canDraw =
    pool.length > 0 &&
    prizeSlotsLeft > 0 &&
    currentPrize != null &&
    !isAwaitingConfirm &&
    !isPreRevealPause &&
    !isPrizeAdvanceOpen &&
    !isAccidentalDrawLocked;

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

  const clearDrawTimers = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
    if (preRevealTimeoutRef.current) {
      clearTimeout(preRevealTimeoutRef.current);
      preRevealTimeoutRef.current = null;
    }
  }, []);

  const abortDrawSession = useCallback(() => {
    clearDrawTimers();
    batchActiveRef.current = false;
    batchRemainingRef.current = 0;
    batchSlotsAtStartRef.current = 0;
    batchWinnersRef.current = [];
    drawSessionPrizeIdRef.current = '';
    drawSessionPrizeNameRef.current = '';
    setIsDrawing(false);
    setHighlightId(null);
    setPendingReveal(null);
    setPendingBatchSummary(null);
    setIsPreRevealPause(false);
    setPrizeAdvanceNotice(null);
    setBatchProgress(null);
    setIsAccidentalDrawLocked(false);
    lastDrawTriggerAtRef.current = 0;
  }, [clearDrawTimers]);

  const selectRandomParticipant = (candidates: Participant[]): Participant => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return candidates[array[0] % candidates.length];
  };

  const finishBatch = useCallback(() => {
    batchActiveRef.current = false;
    batchRemainingRef.current = 0;
    batchSlotsAtStartRef.current = 0;
    batchWinnersRef.current = [];
    setBatchProgress(null);
  }, []);

  const showBatchSummaryPopup = useCallback(() => {
    const winners = [...batchWinnersRef.current];
    if (winners.length === 0) {
      finishBatch();
      return;
    }

    setHighlightId(null);
    setIsPreRevealPause(false);
    const lockedPrizeId = drawSessionPrizeIdRef.current || currentPrizeIdRef.current;
    const lockedPrize = useDrawStore.getState().prizes.find((p) => p.id === lockedPrizeId);
    setPendingBatchSummary({
      winners,
      prizeId: lockedPrizeId,
      prizeName: lockedPrize?.name ?? drawSessionPrizeNameRef.current ?? prizeNameRef.current,
    });
  }, [finishBatch]);

  const finalizeWinner = useCallback(() => {
    try {
    if (batchActiveRef.current) {
      const snap = useDrawStore.getState();
      const prizeId = drawSessionPrizeIdRef.current || currentPrizeIdRef.current;
      if (!snap.prizes.some((p) => p.id === prizeId)) {
        finishBatch();
        setIsDrawing(false);
        return;
      }
      const slotsLeftNow = getRemainingPrizeSlots(snap.prizes, prizeId);
      const planned = batchSlotsAtStartRef.current || batchRemainingRef.current;
      const totalToDraw = Math.min(
        planned,
        slotsLeftNow,
        poolRef.current.length
      );
      const winners = pickMultipleWinners(poolRef.current, totalToDraw);
      const isBlindbox = snap.stageDisplayMode === 'blindbox';

      batchWinnersRef.current = winners;
      setIsDrawing(false);
      setHighlightId(null);
      setBatchProgress({ done: winners.length, total: totalToDraw });

      if (winners.length === 0) {
        finishBatch();
        return;
      }

      const tailMs = isBlindbox ? 150 : 300;
      if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
      preRevealTimeoutRef.current = setTimeout(() => {
        showBatchSummaryPopup();
        preRevealTimeoutRef.current = null;
      }, tailMs);
      return;
    }

    const candidates = poolRef.current;
    if (candidates.length === 0) {
      setIsDrawing(false);
      return;
    }

    const finalWinner = selectRandomParticipant(candidates);
    const isBlindbox = useDrawStore.getState().stageDisplayMode === 'blindbox';
    setIsDrawing(false);

    setHighlightId(finalWinner.id);

    const openWinnerPopup = () => {
      const lockedPrizeId = drawSessionPrizeIdRef.current || currentPrizeIdRef.current;
      const lockedPrize = useDrawStore.getState().prizes.find((p) => p.id === lockedPrizeId);
      if (!lockedPrize) {
        setIsPreRevealPause(false);
        return;
      }

      setPendingReveal({
        winner: finalWinner,
        prizeId: lockedPrizeId,
        prizeName: drawSessionPrizeNameRef.current || lockedPrize.name,
      });
      setIsPreRevealPause(false);
      preRevealTimeoutRef.current = null;
    };

    const pauseMs = timingRef.current.preRevealPauseMs;
    if (isBlindbox && pauseMs <= 0) {
      openWinnerPopup();
      return;
    }

    setIsPreRevealPause(true);
    if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
    preRevealTimeoutRef.current = setTimeout(openWinnerPopup, pauseMs);
    } finally {
      if (!batchActiveRef.current) {
        setIsDrawing(false);
      }
    }
  }, [finishBatch, showBatchSummaryPopup]);

  const confirmPendingWinner = useCallback(() => {
    if (pendingBatchSummary) {
      const prizeIdAtConfirm = pendingBatchSummary.prizeId;
      const prizeExists = useDrawStore.getState().prizes.some((p) => p.id === prizeIdAtConfirm);
      if (!prizeExists) {
        setPendingBatchSummary(null);
        finishBatch();
        return;
      }

      const seen = new Set<string>();
      for (const winner of pendingBatchSummary.winners) {
        if (seen.has(winner.id)) continue;
        seen.add(winner.id);
        const slotsLeft = getRemainingPrizeSlots(
          useDrawStore.getState().prizes,
          prizeIdAtConfirm
        );
        if (slotsLeft <= 0) break;
        awardWinner(prizeIdAtConfirm, winner);
      }
      setPendingBatchSummary(null);
      setHighlightId(null);
      finishBatch();

      const updatedPrize = useDrawStore
        .getState()
        .prizes.find((p) => p.id === prizeIdAtConfirm);
      if (updatedPrize && isPrizeFull(updatedPrize)) {
        openAdvanceFromFullPrize(prizeIdAtConfirm);
      }
      return;
    }

    if (!pendingReveal) return;
    const prizeIdAtConfirm = pendingReveal.prizeId;
    if (!useDrawStore.getState().prizes.some((p) => p.id === prizeIdAtConfirm)) {
      setPendingReveal(null);
      setHighlightId(null);
      return;
    }
    awardWinner(prizeIdAtConfirm, pendingReveal.winner);
    setPendingReveal(null);
    setHighlightId(null);

    const updatedPrize = useDrawStore
      .getState()
      .prizes.find((p) => p.id === prizeIdAtConfirm);
    if (updatedPrize && isPrizeFull(updatedPrize)) {
      openAdvanceFromFullPrize(prizeIdAtConfirm);
    }
  }, [pendingBatchSummary, pendingReveal, awardWinner, openAdvanceFromFullPrize, finishBatch]);

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
    const now = Date.now();

    if (isAccidentalDrawLocked) return;

    const sinceLastTrigger = now - lastDrawTriggerAtRef.current;
    if (
      lastDrawTriggerAtRef.current > 0 &&
      sinceLastTrigger < ACCIDENTAL_DRAW_GUARD_MS
    ) {
      abortDrawSession();
      setIsAccidentalDrawLocked(true);
      lastDrawTriggerAtRef.current = now;
      return;
    }
    lastDrawTriggerAtRef.current = now;

    if (!canDraw || isDrawing || isAwaitingConfirm || isPreRevealPause) return;
    if (batchActiveRef.current) return;

    const snap = useDrawStore.getState();
    const lockedPrize = snap.prizes.find((p) => p.id === snap.currentPrizeId);
    if (!lockedPrize) return;

    drawSessionPrizeIdRef.current = lockedPrize.id;
    drawSessionPrizeNameRef.current = lockedPrize.name;

    const { continuousDrawEnabled } = snap;
    if (continuousDrawEnabled) {
      const slotsLeft = getRemainingPrizeSlots(snap.prizes, snap.currentPrizeId);
      if (slotsLeft <= 0) return;

      batchActiveRef.current = true;
      batchRemainingRef.current = slotsLeft;
      batchSlotsAtStartRef.current = slotsLeft;
      batchWinnersRef.current = [];
      setBatchProgress({ done: 0, total: slotsLeft });
    }

    setIsDrawing(true);
    setPendingReveal(null);
    setPendingBatchSummary(null);
    setIsPreRevealPause(false);
    if (preRevealTimeoutRef.current) clearTimeout(preRevealTimeoutRef.current);
    const { drawDurationMs } = timingRef.current;
    const isBlindbox = useDrawStore.getState().stageDisplayMode === 'blindbox';

    if (isBlindbox) {
      setHighlightId(null);
      animationTimeoutRef.current = setTimeout(() => {
        finalizeWinner();
      }, drawDurationMs);
      return;
    }

    const startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / drawDurationMs, 1);
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
  }, [
    canDraw,
    isDrawing,
    isAwaitingConfirm,
    isPreRevealPause,
    isAccidentalDrawLocked,
    abortDrawSession,
    finalizeWinner,
  ]);

  useEffect(() => {
    if (!isAccidentalDrawLocked) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const isUnlockKey =
        e.key.toLowerCase() === 'w' || e.code === 'KeyW';
      if (!isUnlockKey) return;
      e.preventDefault();
      e.stopPropagation();
      dismissAccidentalDrawLock();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isAccidentalDrawLocked, dismissAccidentalDrawLock]);

  runDrawAnimationRef.current = runDrawAnimation;

  useEffect(() => clearDrawTimers, [clearDrawTimers]);

  useEffect(() => {
    if (!isPresentationMode) return;
    const el = presentationHostRef.current;
    if (!el) return;

    const timer = window.setTimeout(() => {
      if (document.fullscreenElement) return;
      void el.requestFullscreen?.().catch(() => {});
    }, 150);

    return () => {
      window.clearTimeout(timer);
      if (document.fullscreenElement === el) {
        void document.exitFullscreen().catch(() => {});
      }
    };
  }, [isPresentationMode]);

  const value: DrawSessionContextValue = {
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    isBatchRunning,
    batchProgress,
    canDraw,
    prizeSlotsLeft,
    highlightId,
    runDrawAnimation,
    confirmPendingWinner,
    abortDrawSession,
    isPrizeAdvanceOpen,
    dismissPrizeAdvance,
    isAccidentalDrawLocked,
    dismissAccidentalDrawLock,
  };

  const modals = (
    <>
      {pendingBatchSummary && (
        <BatchWinnerAnnounceModal
          payload={pendingBatchSummary}
          onConfirm={confirmPendingWinner}
        />
      )}
      {pendingReveal && !pendingBatchSummary && (
        <WinnerRevealModal
          winner={pendingReveal.winner}
          prizeName={pendingReveal.prizeName}
          onConfirm={confirmPendingWinner}
        />
      )}
      {prizeAdvanceNotice && (
        <PrizeAdvanceModal notice={prizeAdvanceNotice} onDismiss={dismissPrizeAdvance} />
      )}
      <PresentationExitConfirmModal
        open={exitConfirmOpen}
        onCancel={cancelExitPresentation}
        onConfirm={exitPresentationMode}
      />
      <AccidentalDrawGuardModal open={isAccidentalDrawLocked} />
    </>
  );

  const winnerListModalOpen =
    pendingReveal != null || pendingBatchSummary != null;

  const stageBlurClass = winnerListModalOpen
    ? 'blur-2xl brightness-[0.42] saturate-[0.85] pointer-events-none select-none'
    : '';

  return (
    <DrawSessionContext.Provider value={value}>
      <div
        ref={presentationHostRef}
        {...{ [PRESENTATION_HOST_ATTR]: '' }}
        className={
          isPresentationMode
            ? 'fixed inset-0 z-[50] flex flex-col min-h-0 bg-slate-950 text-slate-100'
            : 'contents'
        }
      >
        {isPresentationMode ? (
          <div className={`flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden transition-[filter] duration-300 ${stageBlurClass}`}>
            {children}
          </div>
        ) : (
          <div className={winnerListModalOpen ? stageBlurClass : 'contents'}>{children}</div>
        )}
        {modals}
      </div>
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

export const ContinuousDrawToggle: React.FC = () => {
  const continuousDrawEnabled = useDrawStore((s) => s.continuousDrawEnabled);
  const setContinuousDrawEnabled = useDrawStore((s) => s.setContinuousDrawEnabled);
  const { isDrawing, isPreRevealPause, isAwaitingConfirm, isBatchRunning } = useDrawSession();

  const disabled = isDrawing || isPreRevealPause || isAwaitingConfirm || isBatchRunning;

  return (
    <label
      className={`flex items-center gap-2 select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      title={
        continuousDrawEnabled
          ? '已開啟：按一次「開始抽獎」將連續抽出本獎項剩餘名額'
          : '關閉：每次抽一位得獎者'
      }
    >
      <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">一連抽</span>
      <button
        type="button"
        role="switch"
        aria-checked={continuousDrawEnabled}
        disabled={disabled}
        onClick={() => !disabled && setContinuousDrawEnabled(!continuousDrawEnabled)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          continuousDrawEnabled ? 'bg-emerald-500' : 'bg-slate-700'
        } disabled:pointer-events-none`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            continuousDrawEnabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
};

export const DrawStartButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const {
    isDrawing,
    isPreRevealPause,
    isAwaitingConfirm,
    isBatchRunning,
    batchProgress,
    canDraw,
    prizeSlotsLeft,
    runDrawAnimation,
    isAccidentalDrawLocked,
  } = useDrawSession();
  const stageDisplayMode = useDrawStore((s) => s.stageDisplayMode);
  const { drawDurationMs, preRevealPauseMs } = getDrawTiming(stageDisplayMode);
  const drawSec = drawDurationMs / 1000;
  const pauseSec = preRevealPauseMs / 1000;
  const isBlindbox = stageDisplayMode === 'blindbox';

  const drawBusy =
    isDrawing ||
    isPreRevealPause ||
    isAwaitingConfirm ||
    !canDraw ||
    isBatchRunning;

  return (
    <button
      type="button"
      data-presentation-draw
      onClick={runDrawAnimation}
      disabled={isAccidentalDrawLocked}
      aria-disabled={drawBusy || isAccidentalDrawLocked}
      className={`relative px-8 md:px-12 py-3 md:py-3.5 rounded-full font-bold text-base md:text-lg tracking-wider transition-all duration-300 whitespace-nowrap ${className} ${
        isDrawing || isPreRevealPause
          ? 'bg-amber-500 text-slate-950 cursor-not-allowed animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.6)]'
          : isAccidentalDrawLocked
            ? 'bg-rose-950/60 text-rose-100 cursor-not-allowed border border-rose-500/40'
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
          ? isBatchRunning
            ? isBlindbox
              ? `一連抽 開盒中 (${drawSec}s)...`
              : `一連抽 抽取中 (${drawSec}s)...`
            : isBlindbox
              ? `開盒中 (${drawSec}s)...`
              : `抽取中 (${drawSec}s)...`
          : isPreRevealPause
            ? isBlindbox
              ? '揭曉…'
              : `定格揭曉 (${pauseSec}s)...`
            : isAwaitingConfirm
            ? isBatchRunning
              ? '請確認一連抽名單'
              : '請確認得獎者'
            : isAccidentalDrawLocked
              ? '請按 W（大小寫皆可）解除誤觸鎖定'
            : !canDraw
              ? prizeSlotsLeft <= 0
                ? '本獎項名額已滿'
                : '無可抽候選人'
              : isBatchRunning && batchProgress
                ? `一連抽 (${batchProgress.done}/${batchProgress.total})`
                : '開始抽獎'}
      </span>
    </button>
  );
};
