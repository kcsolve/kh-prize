/** 依人數與是否全屏抽獎，調整 popup 名單字級以吃滿可用空間 */
export function getBatchWinnerListLayout(count: number, isPresentationMode: boolean) {
  if (!isPresentationMode) {
    const useThreeColumns = count > 12;
    return {
      gridClass: useThreeColumns
        ? 'grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-2',
      nameClass: useThreeColumns ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
      metaClass: useThreeColumns ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm',
      badgeClass: 'w-7 h-7 text-xs',
      rowClass: 'px-2.5 py-2 gap-2',
      listGap: 'gap-x-2 gap-y-1.5',
    };
  }

  if (count <= 3) {
    return {
      gridClass: 'grid-cols-1 max-w-3xl mx-auto w-full',
      nameClass: 'text-4xl sm:text-5xl md:text-6xl',
      metaClass: 'text-lg sm:text-xl md:text-2xl',
      badgeClass: 'w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl',
      rowClass: 'px-4 py-4 sm:py-5 gap-4',
      listGap: 'gap-y-3',
    };
  }
  if (count <= 8) {
    return {
      gridClass: 'grid-cols-1 sm:grid-cols-2',
      nameClass: 'text-3xl sm:text-4xl',
      metaClass: 'text-base sm:text-lg',
      badgeClass: 'w-10 h-10 sm:w-11 sm:h-11 text-base',
      rowClass: 'px-3 py-3 gap-3',
      listGap: 'gap-x-3 gap-y-2.5',
    };
  }
  if (count <= 15) {
    return {
      gridClass: 'grid-cols-2 lg:grid-cols-3',
      nameClass: 'text-2xl sm:text-3xl',
      metaClass: 'text-sm sm:text-base',
      badgeClass: 'w-9 h-9 text-sm',
      rowClass: 'px-3 py-2.5 gap-2.5',
      listGap: 'gap-x-2 gap-y-2',
    };
  }
  if (count <= 30) {
    return {
      gridClass: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      nameClass: 'text-xl sm:text-2xl',
      metaClass: 'text-xs sm:text-sm',
      badgeClass: 'w-8 h-8 text-xs',
      rowClass: 'px-2.5 py-2 gap-2',
      listGap: 'gap-x-2 gap-y-1.5',
    };
  }

  return {
    gridClass: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
    nameClass: 'text-lg sm:text-xl',
    metaClass: 'text-[11px] sm:text-xs',
    badgeClass: 'w-7 h-7 text-[11px]',
    rowClass: 'px-2 py-1.5 gap-2',
    listGap: 'gap-x-1.5 gap-y-1',
  };
}
