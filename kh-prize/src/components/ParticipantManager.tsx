import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  UserCheck,
  UserX,
  Download,
  FileSpreadsheet,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useDrawStore } from '../store/useDrawStore';
import {
  parseParticipantsExcel,
  exportParticipantsExcel,
  downloadParticipantImportTemplate,
  PARTICIPANT_EXCEL_COLUMNS,
} from '../utils/excel';
import { ExcelFormatHint } from './ExcelFormatHint';

export const ParticipantManager: React.FC = () => {
  const {
    participants,
    setParticipants,
    toggleParticipantEligibility,
    addParticipant,
    forfeitPrize,
    clearParticipants,
  } = useDrawStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newDepartment, setNewDepartment] = useState('');

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    const id = newId.trim();
    if (!id) {
      alert('請填寫工號');
      return;
    }
    if (participants.some((p) => p.id === id)) {
      alert('此工號已存在');
      return;
    }
    addParticipant({ id, name: newName, department: newDepartment });
    setNewId('');
    setNewName('');
    setNewDepartment('');
    setShowAddForm(false);
  };

  const handleForfeit = (id: string, name: string, prizeName: string) => {
    if (
      confirm(
        `確定「${name}」放棄「${prizeName}」？\n將移出得獎名單並回到候選人員矩陣（可再次抽獎）。`
      )
    ) {
      forfeitPrize(id);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const list = await parseParticipantsExcel(file);
      setParticipants(list);
      alert(`成功匯入 ${list.length} 位參加者！`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '請確認 Excel 格式';
      alert(`匯入失敗：${message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl h-full flex flex-col min-h-[480px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImport}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-slate-100">參加者名單管理</h2>
          <p className="text-xs text-slate-400 mt-1">匯入名單、切換抽獎資格（共 {participants.length} 人）</p>
          <ExcelFormatHint columns={PARTICIPANT_EXCEL_COLUMNS} />
          <p className="text-[11px] text-slate-600 mt-1">
            工號欄亦可用：編號、ID；姓名／部門亦支援 Name、Department
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={downloadParticipantImportTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> 下載匯入範本
          </button>
          <button
            type="button"
            onClick={() => exportParticipantsExcel(participants)}
            disabled={participants.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> 匯出 Excel
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-md text-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> 新增參加者
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
            onClick={() => {
              if (confirm('確定清空所有參加者？')) clearParticipants();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 border border-rose-800/50 text-rose-300 rounded-md text-xs transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> 清空名單
          </button>
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddParticipant}
          className="mb-4 p-4 rounded-xl border border-slate-800 bg-slate-950/80 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            工號 *
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              placeholder="E009"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            姓名
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              placeholder="王小明"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            部門
            <input
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200"
              placeholder="工程部"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium"
            >
              確認新增
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-md text-xs"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase sticky top-0">
            <tr>
              <th className="p-3">工號</th>
              <th className="p-3">姓名</th>
              <th className="p-3">部門</th>
              <th className="p-3">狀態</th>
              <th className="p-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {participants.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-mono text-xs">{p.id}</td>
                <td className="p-3">{p.name}</td>
                <td className="p-3 text-slate-400">{p.department}</td>
                <td className="p-3">
                  {p.wonPrizeName ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300">
                      已中獎 · {p.wonPrizeName}
                    </span>
                  ) : p.eligible ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300">
                      可抽獎
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      無資格
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {p.wonPrizeId ? (
                      <button
                        type="button"
                        onClick={() => handleForfeit(p.id, p.name, p.wonPrizeName ?? '獎品')}
                        className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-amber-950/50 text-amber-300 border border-amber-800/40 hover:bg-amber-900/40"
                        title="放棄獎品，返回候選池"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        放棄獎品
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleParticipantEligibility(p.id)}
                        className="text-slate-300 hover:text-amber-300 p-1"
                        title={p.eligible ? '取消資格' : '恢復資格'}
                      >
                        {p.eligible ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {participants.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-12">尚無參加者，請匯入 Excel</p>
        )}
      </div>
    </div>
  );
};
