import React from 'react';
import { Maximize2, Minimize2, LockOpen } from 'lucide-react';
import { usePresentationMode } from '../context/PresentationModeContext';
import {
  ContinuousDrawToggle,
  DrawStartButton,
  PRESENTATION_HOST_ATTR,
} from '../context/DrawSessionContext';

function requestPresentationHostFullscreen() {
  const host = document.querySelector(`[${PRESENTATION_HOST_ATTR}]`) as HTMLElement | null;
  void (host ?? document.documentElement).requestFullscreen?.().catch(() => {});
}

interface PresentationStageChromeProps {
  prizeName: string;
  winnersCount: number;
  quota: number;
  poolSize: number;
  slotsLeft: number;
}

export const PresentationStageTopBar: React.FC<PresentationStageChromeProps> = ({
  prizeName,
  winnersCount,
  quota,
  poolSize,
  slotsLeft,
}) => {
  const { isNativeFullscreen, exitNativeFullscreen, requestExitPresentation } =
    usePresentationMode();

  return (
    <header className="relative z-[130] shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-8 py-4 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="flex-1 min-w-0 text-center sm:text-left">
        <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">目前獎項</p>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-300 leading-snug line-clamp-2">
          {prizeName}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          已抽出 {winnersCount}/{quota} · 候選 {poolSize} 人 · 剩餘名額 {Math.max(slotsLeft, 0)}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 shrink-0">
        <button
          type="button"
          data-safety-control
          onClick={(e) => {
            e.stopPropagation();
            if (document.fullscreenElement) {
              exitNativeFullscreen();
            } else {
              requestExitPresentation();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800/90 text-slate-200 hover:bg-slate-700"
          title={
            isNativeFullscreen
              ? 'Esc：先退出瀏覽器全屏'
              : '未在瀏覽器全屏時，等同退出抽獎模式'
          }
        >
          <Minimize2 className="w-3.5 h-3.5" aria-hidden />
          {isNativeFullscreen ? '退出全屏' : '結束全屏舞台'}
        </button>
        <button
          type="button"
          data-safety-control
          onClick={(e) => {
            e.stopPropagation();
            requestExitPresentation();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
          title="Esc 兩步：先退出瀏覽器全屏，再退出抽獎模式"
        >
          <LockOpen className="w-3.5 h-3.5" aria-hidden />
          退出抽獎模式
        </button>
        {!isNativeFullscreen && (
          <button
            type="button"
            data-safety-control
            onClick={requestPresentationHostFullscreen}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-700 bg-slate-800/90 text-slate-300 hover:bg-slate-700"
          >
            <Maximize2 className="w-3.5 h-3.5" aria-hidden />
            進入全屏
          </button>
        )}
      </div>
    </header>
  );
};

export const PresentationStageFooter: React.FC = () => (
  <footer className="shrink-0 flex flex-col items-center gap-3 px-4 sm:px-8 py-5 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
    <div className="flex flex-wrap items-center justify-center gap-4">
      <ContinuousDrawToggle />
      <DrawStartButton className="text-lg md:text-xl !px-10 md:!px-14 !py-4" />
    </div>
    <p className="text-[11px] text-slate-500 text-center max-w-md">
      Enter / 空白鍵：抽獎或確認 · Esc：退出全屏／抽獎模式
    </p>
  </footer>
);
