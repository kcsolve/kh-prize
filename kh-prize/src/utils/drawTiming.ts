import type { StageDisplayMode } from '../store/useDrawStore';

export function getDrawTiming(mode: StageDisplayMode): {
  drawDurationMs: number;
  preRevealPauseMs: number;
} {
  if (mode === 'blindbox') {
    return { drawDurationMs: 1000, preRevealPauseMs: 350 };
  }
  return { drawDurationMs: 5000, preRevealPauseMs: 3000 };
}

export function formatDrawSeconds(ms: number): string {
  const sec = ms / 1000;
  return Number.isInteger(sec) ? String(sec) : sec.toFixed(1);
}
