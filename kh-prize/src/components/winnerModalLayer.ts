/** 得獎／一連抽名單 popup：蓋過投影頂欄 (z-130) 與舞台控件 */
export const WINNER_MODAL_Z_CLASS = 'z-[300]';

export const winnerModalOverlayClass = [
  'fixed inset-0',
  WINNER_MODAL_Z_CLASS,
  'flex items-center justify-center',
  'bg-slate-950/55 backdrop-blur-2xl backdrop-saturate-150',
  'isolate',
].join(' ');