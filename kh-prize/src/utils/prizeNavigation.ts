import type { Prize } from '../store/useDrawStore';

export function isPrizeFull(prize: Prize): boolean {
  return prize.winners.length >= prize.quota;
}

/** 依 order 找下一個仍有名額的獎項（不含 currentId 本身） */
export function getNextDrawablePrize(prizes: Prize[], currentId: string): Prize | null {
  const sorted = [...prizes].sort((a, b) => a.order - b.order);
  if (sorted.length === 0) return null;

  const startIdx = sorted.findIndex((p) => p.id === currentId);
  const order =
    startIdx >= 0
      ? [...sorted.slice(startIdx + 1), ...sorted.slice(0, startIdx)]
      : sorted;

  return order.find((p) => !isPrizeFull(p)) ?? null;
}
