import React from 'react';
import { Palette } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import { DRAW_THEME_OPTIONS, type DrawThemeId } from '../themes/drawThemes';

export const DrawThemeSelector: React.FC = () => {
  const drawTheme = useDrawStore((s) => s.drawTheme);
  const setDrawTheme = useDrawStore((s) => s.setDrawTheme);

  return (
    <section className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-950/60">
      <div className="flex items-center gap-2 mb-1">
        <Palette className="w-4 h-4 text-amber-400 shrink-0" />
        <h3 className="text-sm font-semibold text-slate-200">抽獎系統主題配色</h3>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        套用於整個抽獎系統（舞台、名單、得獎視窗等）；僅在此處切換。設定會儲存於本機。
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DRAW_THEME_OPTIONS.map((opt) => {
          const active = drawTheme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDrawTheme(opt.id as DrawThemeId)}
              className={`text-left p-3 rounded-xl border transition ${
                active
                  ? 'border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="flex h-6 w-10 rounded overflow-hidden border border-slate-700 shrink-0">
                  <span className="flex-1" style={{ background: opt.swatch[0] }} />
                  <span className="flex-1" style={{ background: opt.swatch[1] }} />
                </span>
                <span className="font-semibold text-sm text-slate-100">{opt.label}</span>
                {active && (
                  <span className="text-[10px] ml-auto px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    使用中
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
