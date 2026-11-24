import type { Participant, Prize } from '../store/useDrawStore';

/** 名單與各獎項 winners 雙向對齊，避免幽靈得獎或錯配 */
export function reconcileParticipantsWithPrizes(
  participants: Participant[],
  prizes: Prize[]
): { participants: Participant[]; prizes: Prize[] } {
  const participantById = new Map(participants.map((p) => [p.id, p]));
  const prizeById = new Map(prizes.map((p) => [p.id, p]));

  const cleanedPrizes = prizes.map((pz) => ({
    ...pz,
    winners: pz.winners.filter((w) => {
      const person = participantById.get(w.id);
      return person != null && person.wonPrizeId === pz.id;
    }),
  }));

  const winnerIdsByPrize = new Map<string, Set<string>>();
  for (const pz of cleanedPrizes) {
    winnerIdsByPrize.set(pz.id, new Set(pz.winners.map((w) => w.id)));
  }

  const cleanedParticipants = participants.map((p) => {
    if (!p.wonPrizeId) return p;

    const prize = prizeById.get(p.wonPrizeId);
    const inWinnerList = winnerIdsByPrize.get(p.wonPrizeId)?.has(p.id);

    if (!prize || !inWinnerList) {
      return {
        id: p.id,
        name: p.name,
        department: p.department,
        eligible: true,
      };
    }

    return {
      ...p,
      eligible: false,
      wonPrizeName: prize.name,
    };
  });

  return { participants: cleanedParticipants, prizes: cleanedPrizes };
}

export function normalizeImportedParticipants(list: Participant[]): Participant[] {
  return list.map((p) => ({
    id: String(p.id).trim(),
    name: (p.name ?? '').trim() || String(p.id).trim(),
    department: (p.department ?? '').trim() || '未分組',
    eligible: p.eligible !== false,
  })).filter((p) => p.id.length > 0);
}

export function pickValidCurrentPrizeId(prizes: Prize[], currentId: string): string {
  if (prizes.some((p) => p.id === currentId)) return currentId;
  const sorted = [...prizes].sort((a, b) => a.order - b.order);
  return sorted[0]?.id ?? '';
}