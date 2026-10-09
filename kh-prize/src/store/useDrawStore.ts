import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';

export interface Participant {
  id: string;
  name: string;
  department: string;
}

export interface WinnerRecord {
  prizeName: string;
  winner: Participant;
  timestamp: string;
}

interface DrawState {
  pool: Participant[];
  winners: WinnerRecord[];
  currentPrize: string;
  hasHydrated: boolean;
  setPool: (pool: Participant[]) => void;
  setCurrentPrize: (prize: string) => void;
  recordWinner: (winner: Participant, prizeName: string) => void;
  resetAll: () => void;
  setHasHydrated: (status: boolean) => void;
}

// 建立 idb-keyval 適配器，讓 Zustand 使用 IndexedDB 儲存
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'E001', name: '陳小明', department: '工程部' },
  { id: 'E002', name: '李大華', department: '市場部' },
  { id: 'E003', name: '張秀英', department: '人資部' },
  { id: 'E004', name: '王家豪', department: '產品部' },
  { id: 'E005', name: '林雅婷', department: '設計部' },
  { id: 'E006', name: '黃志偉', department: '營運部' },
];

export const useDrawStore = create<DrawState>()(
  persist(
    (set) => ({
      pool: DEFAULT_PARTICIPANTS,
      winners: [],
      currentPrize: '特等獎: iPhone 16 Pro',
      hasHydrated: false,

      setPool: (newPool) => set({ pool: newPool }),
      setCurrentPrize: (prize) => set({ currentPrize: prize }),

      // 抽出中獎者：加入得獎紀錄並自候選池剔除
      recordWinner: (winner, prizeName) =>
        set((state) => ({
          winners: [
            {
              prizeName,
              winner,
              timestamp: new Date().toLocaleTimeString(),
            },
            ...state.winners,
          ],
          pool: state.pool.filter((p) => p.id !== winner.id),
        })),

      resetAll: () =>
        set({
          pool: DEFAULT_PARTICIPANTS,
          winners: [],
          currentPrize: '特等獎: iPhone 16 Pro',
        }),

      setHasHydrated: (status) => set({ hasHydrated: status }),
    }),
    {
      name: 'kh-prize-storage',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
