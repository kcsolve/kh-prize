import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, Gift, Sparkles, RotateCcw } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  department: string;
}

interface WinnerRecord {
  prizeName: string;
  winner: Participant;
  timestamp: string;
}

// 模擬初始資料
const INITIAL_PARTICIPANTS: Participant[] = [
  { id: 'E001', name: '陳小明', department: '工程部' },
  { id: 'E002', name: '李大華', department: '市場部' },
  { id: 'E003', name: '張秀英', department: '人資部' },
  { id: 'E004', name: '王家豪', department: '產品部' },
  { id: 'E005', name: '林雅婷', department: '設計部' },
  { id: 'E006', name: '黃志偉', department: '營運部' },
  { id: 'E007', name: '何佩玲', department: '財務部' },
  { id: 'E008', name: '吳冠宇', department: '工程部' },
  { id: 'E009', name: '蔡美玲', department: '市場部' },
  { id: 'E010', name: '鄭建華', department: '客服部' },
  { id: 'E011', name: '謝淑娟', department: '行政部' },
  { id: 'E012', name: '劉子豪', department: '工程部' },
];

export const LuckyDraw: React.FC = () => {
  const [pool, setPool] = useState<Participant[]>(INITIAL_PARTICIPANTS);
  const [winners, setWinners] = useState<WinnerRecord[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [currentPrize] = useState<string>('特等獎: iPhone 16 Pro');

  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 安全隨機抽樣演算法 (Crypto Random)
  const selectRandomParticipant = (candidates: Participant[]): Participant => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomIndex = array[0] % candidates.length;
    return candidates[randomIndex];
  };

  // 2. 5秒閃爍動畫核心邏輯 (Ease-Out 頻率衰減)
  const runDrawAnimation = () => {
    if (pool.length === 0 || isDrawing) return;

    setIsDrawing(true);
    const durationMs = 5000;
    const startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease-out 遞增間隔：從 50ms 逐漸衰減至 350ms
      const currentDelay = 50 + Math.pow(progress, 3) * 300;

      // 隨機高亮其中一張卡片
      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setHighlightId(randomCandidate.id);

      if (progress < 1) {
        animationTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(loop);
        }, currentDelay);
      } else {
        // 動畫結束，正式由 Crypto API 確定最終得獎者
        finalizeWinner();
      }
    };

    requestAnimationFrame(loop);
  };

  // 3. 定格、剔除名單、結算中獎
  const finalizeWinner = () => {
    const finalWinner = selectRandomParticipant(pool);
    setHighlightId(finalWinner.id);

    // 觸發彩色碎紙特效
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
    });

    // 延遲更新狀態，保留定格感
    setTimeout(() => {
      setWinners((prev) => [
        {
          prizeName: currentPrize,
          winner: finalWinner,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);

      // 從可抽候選池中剔除，防止重複得獎
      setPool((prev) => prev.filter((p) => p.id !== finalWinner.id));
      setIsDrawing(false);
      setHighlightId(null);
    }, 800);
  };

  // 清除未完成的 timer
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  const handleReset = () => {
    setPool(INITIAL_PARTICIPANTS);
    setWinners([]);
    setHighlightId(null);
    setIsDrawing(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col justify-between">
      {/* 頂部標題列 */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <h1 className="text-2xl font-bold tracking-wider">ANNUAL GALA 2026 動態抽獎</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            目前獎項: <strong className="text-amber-300">{currentPrize}</strong>
          </span>
          <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300">
            候選人數: {pool.length} 人
          </span>
          <button
            onClick={handleReset}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition text-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重設
          </button>
        </div>
      </header>

      {/* 主體左右雙欄佈局 */}
      <main className="grid grid-cols-12 gap-8 flex-1">
        {/* 左欄：獎品得獎者 Slot (4 欄) */}
        <section className="col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Gift className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-lg text-slate-200">得獎名冊</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            <AnimatePresence>
              {winners.map((record, index) => (
                <motion.div
                  key={`${record.winner.id}-${index}`}
                  initial={{ opacity: 0, x: -30, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-900/10 border border-amber-500/30 flex justify-between items-center"
                >
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      {record.prizeName}
                    </span>
                    <p className="font-bold text-lg text-white mt-1">{record.winner.name}</p>
                    <p className="text-xs text-slate-400">
                      {record.winner.department} · {record.winner.id}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{record.timestamp}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            {winners.length === 0 && (
              <div className="h-40 border border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-500 text-sm">
                尚未抽出得獎者
              </div>
            )}
          </div>
        </section>

        {/* 右欄：參加者自適應網格矩陣 (8 欄) */}
        <section className="col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto max-h-[560px] p-1">
            <AnimatePresence>
              {pool.map((p) => {
                const isHighlighted = highlightId === p.id;
                return (
                  <motion.div
                    key={p.id}
                    layout
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className={`relative p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-100 ${
                      isHighlighted
                        ? 'bg-amber-400 border-amber-300 text-slate-950 scale-105 shadow-[0_0_25px_rgba(251,191,36,0.8)] z-10 font-bold'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">{p.name}</span>
                    <span
                      className={`text-[10px] ${isHighlighted ? 'text-slate-900' : 'text-slate-400'}`}
                    >
                      {p.department}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>
      </main>

      {/* 底部中央抽獎按鈕 */}
      <footer className="mt-8 flex justify-center">
        <button
          onClick={runDrawAnimation}
          disabled={isDrawing || pool.length === 0}
          className={`relative group px-12 py-4 rounded-full font-bold text-lg tracking-wider transition-all duration-300 ${
            isDrawing
              ? 'bg-amber-500 text-slate-950 cursor-not-allowed animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.6)]'
              : pool.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className={`w-5 h-5 ${isDrawing ? 'animate-spin' : ''}`} />
            {isDrawing ? '抽取中 (5s)...' : pool.length === 0 ? '名單已全數抽出' : '開始抽獎'}
          </span>
        </button>
      </footer>
    </div>
  );
};
