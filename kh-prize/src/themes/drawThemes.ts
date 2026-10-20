export type DrawThemeId = 'default' | 'christmas';

export const DRAW_THEME_OPTIONS: {
  id: DrawThemeId;
  label: string;
  description: string;
  swatch: [string, string];
}[] = [
  {
    id: 'default',
    label: '預設金燈',
    description: '深色舞台＋琥珀金強調，通用晚會風格。',
    swatch: ['#0f172a', '#f59e0b'],
  },
  {
    id: 'christmas',
    label: '聖誕酒紅',
    description: '酒紅底調＋鎏金按鈕與金邊光暈，適合節慶抽獎。',
    swatch: ['#16060c', '#eab308'],
  },
];

export function normalizeDrawTheme(value: unknown): DrawThemeId {
  return value === 'christmas' ? 'christmas' : 'default';
}
