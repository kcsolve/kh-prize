import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

export interface Participant {
  id: string;
  name: string;
  department: string;
  eligible: boolean; // 是否具備抽獎資格
  wonPrizeId?: string; // 已獲得之獎品 ID
  wonPrizeName?: string;
}

export interface Prize {
  id: string;
  order: number;
  name: string;
  quota: number; // 總配額數量
  winners: Participant[]; // 已經抽中的人
  imageUrl?: string;
  note?: string;
}

interface DrawState {
  participants: Participant[];
  prizes: Prize[];
  currentPrizeId: string;
  activeTab: 'stage' | 'prizes' | 'participants';
  isMuted: boolean;
  hasHydrated: boolean;

  // Actions
  setActiveTab: (tab: 'stage' | 'prizes' | 'participants') => void;
  toggleMute: () => void;
  setParticipants: (list: Participant[]) => void;
  toggleParticipantEligibility: (id: string) => void;
  addParticipant: (input: { id: string; name: string; department: string }) => void;
  forfeitPrize: (participantId: string) => void;
  clearParticipants: () => void;

  setPrizes: (prizes: Prize[]) => void;
  addPrize: (prize: Prize) => void;
  updatePrize: (id: string, updated: Partial<Prize>) => void;
  deletePrize: (id: string) => void;
  setCurrentPrizeId: (id: string) => void;

  awardWinner: (prizeId: string, winner: Participant) => void;
  resetAll: () => void;
  setHasHydrated: (val: boolean) => void;
}

const idbStorage: StateStorage = {
  getItem: async (name: string) => (await get(name)) || null,
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

const DEFAULT_PRIZES: Prize[] = [
  { id: 'prize-1', order: 1, name: '特等獎: iPhone 16 Pro', quota: 1, winners: [] },
  { id: 'prize-2', order: 2, name: '頭獎: 5,000 元超市禮券', quota: 3, winners: [] },
  { id: 'prize-3', order: 3, name: '二獎: 藍牙降噪耳機', quota: 5, winners: [] },
];

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'E001', name: '陳小明', department: '工程部', eligible: true },
  { id: 'E002', name: '李大華', department: '市場部', eligible: true },
  { id: 'E003', name: '張秀英', department: '人資部', eligible: true },
  { id: 'E004', name: '王家豪', department: '產品部', eligible: true },
  { id: 'E005', name: '林雅婷', department: '設計部', eligible: true },
  { id: 'E006', name: '黃志偉', department: '營運部', eligible: true },
  { id: 'E007', name: '何佩玲', department: '財務部', eligible: true },
  { id: 'E008', name: '吳冠宇', department: '工程部', eligible: true },
];

export const useDrawStore = create<DrawState>()(
  persist(
    (set) => ({
      participants: DEFAULT_PARTICIPANTS,
      prizes: DEFAULT_PRIZES,
      currentPrizeId: 'prize-1',
      activeTab: 'stage',
      isMuted: false,
      hasHydrated: false,

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setParticipants: (list) => set({ participants: list }),
      toggleParticipantEligibility: (id) =>
        set((state) => ({
          participants: state.participants.map((p) =>
            p.id === id ? { ...p, eligible: !p.eligible } : p
          ),
        })),
      addParticipant: (input) =>
        set((state) => {
          const id = input.id.trim();
          if (!id || state.participants.some((p) => p.id === id)) {
            return state;
          }
          return {
            participants: [
              ...state.participants,
              {
                id,
                name: input.name.trim() || id,
                department: input.department.trim() || '未分組',
                eligible: true,
              },
            ],
          };
        }),

      forfeitPrize: (participantId) =>
        set((state) => {
          const person = state.participants.find((p) => p.id === participantId);
          if (!person?.wonPrizeId) return state;

          const prizeId = person.wonPrizeId;
          return {
            prizes: state.prizes.map((pz) =>
              pz.id === prizeId
                ? { ...pz, winners: pz.winners.filter((w) => w.id !== participantId) }
                : pz
            ),
            participants: state.participants.map((p) =>
              p.id === participantId
                ? {
                    id: p.id,
                    name: p.name,
                    department: p.department,
                    eligible: true,
                  }
                : p
            ),
          };
        }),

      clearParticipants: () => set({ participants: [] }),

      setPrizes: (prizes) => set({ prizes }),
      addPrize: (prize) => set((state) => ({ prizes: [...state.prizes, prize] })),
      updatePrize: (id, updated) =>
        set((state) => ({
          prizes: state.prizes.map((pz) => (pz.id === id ? { ...pz, ...updated } : pz)),
        })),
      deletePrize: (id) =>
        set((state) => {
          const prizes = state.prizes.filter((pz) => pz.id !== id);
          let currentPrizeId = state.currentPrizeId;
          if (currentPrizeId === id) {
            currentPrizeId = [...prizes].sort((a, b) => a.order - b.order)[0]?.id ?? '';
          }
          return { prizes, currentPrizeId };
        }),
      setCurrentPrizeId: (id) => set({ currentPrizeId: id }),

      awardWinner: (prizeId, winner) =>
        set((state) => {
          const targetPrize = state.prizes.find((p) => p.id === prizeId);
          const prizeName = targetPrize?.name || '神秘獎品';

          return {
            prizes: state.prizes.map((p) =>
              p.id === prizeId ? { ...p, winners: [...p.winners, winner] } : p
            ),
            participants: state.participants.map((p) =>
              p.id === winner.id
                ? { ...p, eligible: false, wonPrizeId: prizeId, wonPrizeName: prizeName }
                : p
            ),
          };
        }),

      resetAll: () =>
        set({
          participants: DEFAULT_PARTICIPANTS,
          prizes: DEFAULT_PRIZES,
          currentPrizeId: 'prize-1',
          activeTab: 'stage',
        }),

      setHasHydrated: (val) => set({ hasHydrated: val }),
    }),
    {
      name: 'kh-prize-storage',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        participants: state.participants,
        prizes: state.prizes,
        currentPrizeId: state.currentPrizeId,
        activeTab: state.activeTab,
        isMuted: state.isMuted,
      }),
      migrate: (persistedState, version) => {
        if (version >= 1) return persistedState as DrawState;

        const legacy = persistedState as {
          pool?: { id: string; name: string; department: string }[];
          winners?: {
            prizeName: string;
            winner: { id: string; name: string; department: string };
          }[];
          currentPrize?: string;
        };

        if (!legacy.pool) return persistedState as DrawState;

        const participants: Participant[] = legacy.pool.map((p) => ({
          ...p,
          eligible: true,
        }));

        for (const record of legacy.winners ?? []) {
          const idx = participants.findIndex((p) => p.id === record.winner.id);
          if (idx >= 0) {
            participants[idx] = {
              ...participants[idx],
              eligible: false,
              wonPrizeName: record.prizeName,
            };
          }
        }

        return {
          participants,
          prizes: DEFAULT_PRIZES,
          currentPrizeId: 'prize-1',
          activeTab: 'stage' as const,
          isMuted: false,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
