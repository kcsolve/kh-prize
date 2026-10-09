import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Gift,
  Sparkles,
  RotateCcw,
  Upload,
  Download,
  Database,
} from 'lucide-react';
import { useDrawStore } from './store/useDrawStore';
import type { Participant } from './store/useDrawStore';
import { parseParticipantsExcel, exportDrawResultExcel } from './utils/excel';

export const LuckyDraw: React.FC = () => {
  const {
    pool,
    winners,
    currentPrize,
    hasHydrated,
    setPool,
    setCurrentPrize,
    recordWinner,
    resetAll,
  } = useDrawStore();

  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 安全隨機抽樣演算法
  const selectRandomParticipant = (candidates: Participant[]): Participant => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomIndex = array[0] % candidates.length;
    return candidates[randomIndex];
  };

  // 2. 5 秒 Ease-Out 動畫
  const runDrawAnimation = () => {
    if (pool.length === 0 || isDrawing) return;

    setIsDrawing(true);
    const durationMs = 5000;
    const startTime = performance.now();

    const loop = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const currentDelay = 50 + Math.pow(progress, 3) * 300;

      const randomCandidate = pool[Math.floor(Math.random() * pool.length)];
      setHighlightId(randomCandidate.id);

      if (progress < 1) {
        animationTimeoutRef.current = setTimeout(() => {
          requestAnimationFrame(loop);
        }, currentDelay);
      } else {
        finalizeWinner();
      }
    };

    requestAnimationFrame(loop);
  };

  // 3. 確定得獎者並持久化儲存
  const finalizeWinner = () => {
    const finalWinner = selectRandomParticipant(pool);
    setHighlightId(finalWinner.id);

    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.6 },
    });

    setTimeout(() => {
      // 寫入 Zustand Store，自動同步更新至 IndexedDB
      recordWinner(finalWinner, currentPrize);
      setIsDrawing(false);
      setHighlightId(null);
    }, 800);
  };

  // Excel 檔案上傳處理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newPool = await parseParticipantsExcel(file);
      setPool(newPool);
      alert(`成功匯入 ${newPool.length} 位參加者名單！`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '請確認 Excel 格式';
      alert(`匯入失敗：${message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 匯出報表
  const handleExport = () => {
    if (winners.length === 0 && pool.length === 0) {
      alert('目前無任何名單或抽獎紀錄可匯出');
      return;
    }
    exportDrawResultExcel(winners, pool);
  };

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    };
  }, []);

  // 尚未完成 IndexedDB 還原時顯示載入狀態
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center text-sm">
        正在自 IndexedDB 還原抽獎狀態...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col justify-between">
      {/* 隱藏的 File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* 頂部導航列 */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-bold tracking-wider">ANNUAL GALA 2026 動態抽獎</h1>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
              <Database className="w-3.5 h-3.5" /> IndexedDB 本地狀態即時同步中
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-slate-400">目前獎項:</span>
            <input
              type="text"
              value={currentPrize}
              onChange={(e) => setCurrentPrize(e.target.value)}
              className="bg-slate-900 border border-slate-700 px-3 py-1 rounded text-amber-300 font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition text-xs disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> 匯入名單 (.xlsx)
          </button>

          <button
            onClick={handleExport}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition text-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> 匯出結果
          </button>

          <button
            onClick={() => {
              if (confirm('確定要清空得獎紀錄並還原預設狀態？此操作不可逆。')) {
                resetAll();
              }
            }}
            disabled={isDrawing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 rounded-md transition text-xs disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 重設所有狀態
          </button>
        </div>
      </header>

      {/* 主體左右雙欄 */}
      <main className="grid grid-cols-12 gap-8 flex-1">
        {/* 左欄：得獎者清單 */}
        <section className="col-span-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Gift className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-lg text-slate-200">得獎名冊</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              已抽出: {winners.length} 人
            </span>
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
              <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-sm">
                尚未抽出得獎者
              </div>
            )}
          </div>
        </section>

        {/* 右欄：參加者候選池 */}
        <section className="col-span-8 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm text-slate-400">候選人員矩陣</span>
            <span className="text-xs bg-slate-800/80 px-2.5 py-1 rounded text-slate-300">
              剩餘名額: {pool.length} 人
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 overflow-y-auto max-h-[540px] p-1">
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
