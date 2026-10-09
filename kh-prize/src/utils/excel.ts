import * as XLSX from 'xlsx';
import type { Participant, Prize } from '../store/useDrawStore';

/** 獎品匯入欄位（第一列標題） */
export const PRIZE_EXCEL_COLUMNS = ['抽獎順序', '獎品名稱', '總數量', '備註'] as const;

/** 參加者匯入欄位（第一列標題） */
export const PARTICIPANT_EXCEL_COLUMNS = ['工號', '姓名', '部門'] as const;

const dateFileSuffix = () => new Date().toISOString().slice(0, 10);

/**
 * 解析獎品 Excel（欄位：抽獎順序、獎品名稱、總數量、備註；或 Order / PrizeName / Quota）
 */
export const parsePrizesExcel = (file: File): Promise<Prize[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (rows.length === 0) {
          throw new Error('未在檔案中找到有效獎品資料');
        }

        const imported: Prize[] = rows.map((r, i) => ({
          id: `prize-imported-${Date.now()}-${i}`,
          order: Number(r['抽獎順序'] || r['Order'] || i + 1),
          name: String(r['獎品名稱'] || r['PrizeName'] || `獎品 ${i + 1}`),
          quota: Math.max(1, Number(r['總數量'] || r['Quota'] || 1)),
          winners: [],
          note: r['備註'] ? String(r['備註']) : '',
        }));

        resolve(imported);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/** 匯出目前獎品列表（可再次匯入；不含得獎者） */
export const exportPrizesExcel = (prizes: Prize[]) => {
  const rows = [...prizes]
    .sort((a, b) => a.order - b.order)
    .map((p) => ({
      抽獎順序: p.order,
      獎品名稱: p.name,
      總數量: p.quota,
      備註: p.note ?? '',
    }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, '獎品列表');
  XLSX.writeFile(wb, `獎品列表_${dateFileSuffix()}.xlsx`);
};

/** 下載獎品匯入空白範本 */
export const downloadPrizeImportTemplate = () => {
  const rows = [
    { 抽獎順序: 1, 獎品名稱: '特等獎: 範例獎品', 總數量: 1, 備註: '' },
    { 抽獎順序: 2, 獎品名稱: '頭獎: 範例獎品', 總數量: 3, 備註: '可填備註' },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '獎品列表');
  XLSX.writeFile(wb, '獎品匯入範本.xlsx');
};

/** 匯出參加者名單（匯入相容格式） */
export const exportParticipantsExcel = (participants: Participant[]) => {
  const rows = participants.map((p) => ({
    工號: p.id,
    姓名: p.name,
    部門: p.department,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '參加者名單');
  XLSX.writeFile(wb, `參加者名單_${dateFileSuffix()}.xlsx`);
};

/** 下載參加者匯入空白範本 */
export const downloadParticipantImportTemplate = () => {
  const rows = [
    { 工號: 'E001', 姓名: '陳小明', 部門: '工程部' },
    { 工號: 'E002', 姓名: '李大華', 部門: '市場部' },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '參加者名單');
  XLSX.writeFile(wb, '參加者匯入範本.xlsx');
};

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

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        const parsed: Participant[] = jsonData.map((row, index) => ({
          id: String(row['編號'] || row['工號'] || row['ID'] || row['id'] || `P${index + 1}`),
          name: String(row['姓名'] || row['Name'] || row['name'] || `參加者${index + 1}`),
          department: String(row['部門'] || row['Department'] || row['department'] || '未分組'),
          eligible: true,
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
export const exportDrawResultExcel = (prizes: Prize[], participants: Participant[]) => {
  const workbook = XLSX.utils.book_new();

  const winnersData = prizes.flatMap((prize) =>
    prize.winners.map((winner) => ({
      獎項名稱: prize.name,
      '工號/編號': winner.id,
      姓名: winner.name,
      部門: winner.department,
    }))
  );
  const wsWinners = XLSX.utils.json_to_sheet(winnersData);
  XLSX.utils.book_append_sheet(workbook, wsWinners, '得獎總表');

  const fullStatusData = participants.map((p) => ({
    '工號/編號': p.id,
    姓名: p.name,
    部門: p.department,
    狀態: p.wonPrizeId ? '已中獎' : p.eligible ? '可抽獎' : '無資格',
    獲得獎項: p.wonPrizeName || '-',
  }));
  const wsFull = XLSX.utils.json_to_sheet(fullStatusData);
  XLSX.utils.book_append_sheet(workbook, wsFull, '完整紀錄與剩餘名單');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `抽獎結果報告_${dateStr}.xlsx`);
};
