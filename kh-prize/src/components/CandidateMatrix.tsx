import React, { useEffect, useRef, useState } from 'react';
import { LayoutGrid, List, Minimize2, Square } from 'lucide-react';
import type { Participant } from '../store/useDrawStore';

/** 單頁內展示全部候選人，以密度切換適應 100+ 人 */
type MatrixView = 'standard' | 'compact' | 'mini' | 'list';

interface CandidateMatrixProps {
  pool: Participant[];
  highlightId: string | null;
  isDrawing: boolean;
}

export const CandidateMatrix: React.FC<CandidateMatrixProps> = ({
  pool,
  highlightId,
  isDrawing,
}) => {
  const [view, setView] = useState<MatrixView>(() =>
    pool.length >= 100 ? 'compact' : 'standard'
  );
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  const highlightedPerson = highlightId ? pool.find((p) => p.id === highlightId) : null;

  useEffect(() => {
    if (!highlightId) return;
    const el = cellRefs.current.get(highlightId);
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [highlightId, view]);

  const setCellRef = (id: string) => (el: HTMLElement | null) => {
    if (el) cellRefs.current.set(id, el);
    else cellRefs.current.delete(id);
  };

  const viewButtons: { id: MatrixView; label: string; icon: React.ReactNode }[] = [
    { id: 'standard', label: '標準', icon: <Square className="w-3.5 h-3.5" /> },
    { id: 'compact', label: '精簡', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'mini', label: '迷你', icon: <Minimize2 className="w-3.5 h-3.5" /> },
    { id: 'list', label: '列表', icon: <List className="w-3.5 h-3.5" /> },
  ];

  const highlightClass = (active: boolean) =>
    active
      ? 'bg-amber-400 border-amber-300 text-slate-950 scale-[1.03] shadow-[0_0_20px_rgba(251,191,36,0.75)] z-10 font-bold'
      : 'bg-slate-800/80 border-slate-700/60 text-slate-300';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="text-xs text-slate-500">共 {pool.length} 人 · 單頁捲動瀏覽</span>
        <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
          {viewButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setView(btn.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                view === btn.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {pool.length >= 100 && view === 'standard' && (
        <p className="text-[11px] text-amber-400/90 mb-2">
          人數較多，建議切換「精簡」或「迷你」以在同一畫面看到更多候選人。
        </p>
      )}

      {isDrawing && highlightedPerson && (
        <div className="py-2.5 px-4 mb-2 rounded-xl bg-amber-400/95 text-slate-950 text-center shadow-lg shrink-0">
          <p className="text-[10px] font-medium opacity-80">抽選聚焦</p>
          <p className="text-lg font-bold leading-tight">{highlightedPerson.name}</p>
          <p className="text-xs">
            {highlightedPerson.department} · {highlightedPerson.id}
          </p>
        </div>
      )}

      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 min-h-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-500 text-xs sticky top-0 z-[1]">
              <tr>
                <th className="p-1.5 pl-3 w-24">工號</th>
                <th className="p-1.5">姓名</th>
                <th className="p-1.5">部門</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {pool.map((p) => {
                const isHighlighted = highlightId === p.id;
                return (
                  <tr
                    key={p.id}
                    ref={setCellRef(p.id) as React.Ref<HTMLTableRowElement>}
                    className={`transition-colors duration-100 ${
                      isHighlighted
                        ? 'bg-amber-400/90 text-slate-950 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    <td className="p-1.5 pl-3 font-mono text-[11px]">{p.id}</td>
                    <td className="p-1.5 text-sm">{p.name}</td>
                    <td className="p-1.5 text-xs text-slate-400">{p.department}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className={`overflow-y-auto flex-1 min-h-0 p-1 content-start grid gap-1.5 ${
            view === 'mini'
              ? 'grid-cols-[repeat(auto-fill,minmax(3.25rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))]'
              : view === 'compact'
                ? 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2'
                : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3'
          }`}
        >
          {pool.map((p) => {
            const isHighlighted = highlightId === p.id;
            if (view === 'mini') {
              return (
                <div
                  key={p.id}
                  ref={setCellRef(p.id)}
                  title={`${p.name} · ${p.department}`}
                  className={`rounded-md border px-1 py-1 text-center transition-all duration-100 truncate ${highlightClass(isHighlighted)}`}
                >
                  <span className="text-[10px] leading-tight block truncate">{p.name}</span>
                </div>
              );
            }
            const compact = view === 'compact';
            return (
              <div
                key={p.id}
                ref={setCellRef(p.id)}
                className={`rounded-xl border flex flex-col items-center justify-center text-center transition-all duration-100 ${
                  compact ? 'p-1.5 min-h-[48px]' : 'p-3 min-h-[68px]'
                } ${highlightClass(isHighlighted)}`}
              >
                <span
                  className={`font-semibold leading-tight ${compact ? 'text-xs' : 'text-sm md:text-base'}`}
                >
                  {p.name}
                </span>
                <span
                  className={`truncate max-w-full ${compact ? 'text-[9px] mt-0.5' : 'text-xs mt-1'} ${
                    isHighlighted ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {p.department}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {pool.length === 0 && (
        <p className="text-center text-slate-500 text-sm py-8">目前無可抽候選人</p>
      )}
    </div>
  );
};
