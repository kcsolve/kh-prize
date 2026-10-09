import * as XLSX from 'xlsx';
import type { Participant, WinnerRecord } from '../store/useDrawStore';

/**
 * 解析使用者上傳的 Excel 檔案
 * 預期欄位: 編號/工號 (id), 姓名 (name), 部門 (department)
 */
export const parseParticipantsExcel = (file: File): Promise<Participant[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 轉換為 JSON 陣列
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsed: Participant[] = jsonData.map((row, index) => ({
          id: String(row['編號'] || row['工號'] || row['ID'] || row['id'] || `P${index + 1}`),
          name: String(row['姓名'] || row['Name'] || row['name'] || `參加者${index + 1}`),
          department: String(row['部門'] || row['Department'] || row['department'] || '未分組'),
        }));

        if (parsed.length === 0) {
          throw new Error('未在檔案中找到有效人員資料');
        }

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 匯出雙工作表 Excel 抽獎報告
 * Worksheet 1: 得獎總表
 * Worksheet 2: 完整名單與狀態 (未中獎 / 已中獎)
 */
export const exportDrawResultExcel = (
  winners: WinnerRecord[],
  remainingPool: Participant[]
) => {
  const workbook = XLSX.utils.book_new();

  // 1. Worksheet 1: 得獎總表
  const winnersData = winners.map((record) => ({
    抽獎時間: record.timestamp,
    獎項名稱: record.prizeName,
    '工號/編號': record.winner.id,
    姓名: record.winner.name,
    部門: record.winner.department,
  }));
  const wsWinners = XLSX.utils.json_to_sheet(winnersData);
  XLSX.utils.book_append_sheet(workbook, wsWinners, '得獎總表');

  // 2. Worksheet 2: 完整名單與抽獎狀態
  const fullStatusData = [
    ...winners.map((record) => ({
      '工號/編號': record.winner.id,
      姓名: record.winner.name,
      部門: record.winner.department,
      狀態: '已中獎',
      獲得獎項: record.prizeName,
    })),
    ...remainingPool.map((p) => ({
      '工號/編號': p.id,
      姓名: p.name,
      部門: p.department,
      狀態: '未中獎',
      獲得獎項: '-',
    })),
  ];
  const wsFull = XLSX.utils.json_to_sheet(fullStatusData);
  XLSX.utils.book_append_sheet(workbook, wsFull, '完整紀錄與剩餘名單');

  // 產出並下載檔案
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `抽獎結果報告_${dateStr}.xlsx`);
};
