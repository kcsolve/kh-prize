import React, { useRef } from 'react';
import { Plus, Upload, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import type { Prize } from '../store/useDrawStore';
import {
  parsePrizesExcel,
  exportPrizesExcel,
  downloadPrizeImportTemplate,
  PRIZE_EXCEL_COLUMNS,
} from '../utils/excel';
import { ExcelFormatHint } from './ExcelFormatHint';

export const PrizeManager: React.FC = () => {
  const { prizes, addPrize, updatePrize, deletePrize, setPrizes } = useDrawStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sortedPrizes = [...prizes].sort((a, b) => a.order - b.order);

  const handleAddNew = () => {
    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      order: prizes.length + 1,
      name: `新增獎項 ${prizes.length + 1}`,
      quota: 1,
      winners: [],
    };
    addPrize(newPrize);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parsePrizesExcel(file);
      setPrizes(imported);
      alert(`成功匯入 ${imported.length} 項獎品！`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '請確認格式';
      alert(`匯入失敗：${message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl h-full flex flex-col">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleExcelImport}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100">獎品設定與列表管理</h2>
          <p className="text-xs text-slate-400 mt-1">管理各獎品名稱、順序與名額配額</p>
          <ExcelFormatHint columns={PRIZE_EXCEL_COLUMNS} />
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadPrizeImportTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> 下載匯入範本
          </button>
          <button
            type="button"
            onClick={() => exportPrizesExcel(prizes)}
            disabled={prizes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> 匯出 Excel
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition"
          >
            <Upload className="w-3.5 h-3.5" /> 匯入 Excel
          </button>
          <button
            type="button"
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-md text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> 新增獎品
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase sticky top-0">
            <tr>
              <th className="p-3">抽獎順序</th>
              <th className="p-3">獎品名稱</th>
              <th className="p-3">總名額</th>
              <th className="p-3">已抽出數</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedPrizes.map((prize) => (
              <tr key={prize.id} className="hover:bg-slate-800/40">
                <td className="p-3">
                  <span className="inline-flex w-16 justify-center bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-center text-xs text-slate-400 tabular-nums">
                    {prize.order}
                  </span>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    value={prize.name}
                    onChange={(e) => updatePrize(prize.id, { name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="1"
                    value={prize.quota}
                    onChange={(e) => updatePrize(prize.id, { quota: Number(e.target.value) })}
                    className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center text-xs"
                  />
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${prize.winners.length >= prize.quota ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-300'}`}
                  >
                    {prize.winners.length} / {prize.quota}
                  </span>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`確定刪除「${prize.name}」？`)) deletePrize(prize.id);
                    }}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
