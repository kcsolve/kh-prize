import React from 'react';

export const ExcelFormatHint: React.FC<{ columns: readonly string[] }> = ({ columns }) => (
  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
    匯入格式：第一列標題需包含{' '}
    {columns.map((col, i) => (
      <span key={col}>
        {i > 0 && '、'}
        <code className="text-slate-400 bg-slate-950 px-1 rounded">{col}</code>
      </span>
    ))}
    （支援 .xlsx / .xls / .csv）
  </p>
);
