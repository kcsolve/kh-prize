import React, { useCallback, useEffect, useRef, useState } from 'react';

export type PrizeNameFitContext = 'popup' | 'stageHeader' | 'advance';

interface PrizeNameFitTextProps {
  text: string;
  maxLines?: 1 | 2;
  isPresentationMode?: boolean;
  /** 抽獎模式下依版面調整字級上限 */
  context?: PrizeNameFitContext;
  align?: 'left' | 'center';
  className?: string;
  toneClassName?: string;
}

function getFontCaps(vw: number, isPresentationMode: boolean, context: PrizeNameFitContext) {
  if (!isPresentationMode) {
    return {
      max: Math.min(32, Math.max(16, vw * 0.038)),
      min: 13,
    };
  }

  switch (context) {
    case 'stageHeader':
      return {
        max: Math.min(76, Math.max(34, vw * 0.072)),
        min: 22,
      };
    case 'advance':
      return {
        max: Math.min(60, Math.max(28, vw * 0.058)),
        min: 18,
      };
    case 'popup':
    default:
      return {
        max: Math.min(68, Math.max(30, vw * 0.056)),
        min: 18,
      };
  }
}

/**
 * 依外層容器寬度與文字長度，盡量放大字級並避免溢出。
 * 上限隨視窗寬度比例調整（投影／全屏友善）。
 */
export const PrizeNameFitText: React.FC<PrizeNameFitTextProps> = ({
  text,
  maxLines = 2,
  isPresentationMode = false,
  context = 'popup',
  align = 'center',
  className = '',
  toneClassName = 'text-slate-400 font-semibold',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);
  const [fontSizePx, setFontSizePx] = useState<number | null>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) return;

    const vw = window.innerWidth;
    const { max: maxCap, min: minPx } = getFontCaps(vw, isPresentationMode, context);
    const lineHeight = 1.2;

    measure.style.width = `${containerWidth}px`;
    measure.style.lineHeight = String(lineHeight);
    measure.style.display = 'block';
    measure.style.overflow = 'visible';
    measure.style.webkitLineClamp = 'unset';
    measure.style.webkitBoxOrient = 'unset';

    let size = maxCap;

    if (maxLines === 1) {
      measure.style.whiteSpace = 'nowrap';
      measure.style.fontSize = `${size}px`;
      while (size > minPx && measure.scrollWidth > containerWidth + 1) {
        size -= 1;
        measure.style.fontSize = `${size}px`;
      }
    } else {
      measure.style.whiteSpace = 'normal';
      measure.style.fontSize = `${size}px`;
      const maxHeight = () => size * lineHeight * maxLines + 2;
      let guard = 0;
      while (size > minPx && measure.scrollHeight > maxHeight() && guard < 120) {
        size -= 1;
        measure.style.fontSize = `${size}px`;
        guard += 1;
      }
    }

    setFontSizePx(size);
  }, [text, maxLines, isPresentationMode, context]);

  useEffect(() => {
    fit();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => fit());
    ro.observe(container);
    window.addEventListener('resize', fit);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  const alignClass = align === 'left' ? 'text-left' : 'text-center';

  return (
    <div ref={containerRef} className={`w-full min-w-0 ${className}`}>
      <p
        ref={measureRef}
        className={`break-words leading-tight ${alignClass} ${toneClassName}`}
        style={{
          fontSize: fontSizePx != null ? `${fontSizePx}px` : undefined,
          lineHeight: 1.2,
          display: '-webkit-box',
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
        title={text}
      >
        {text}
      </p>
    </div>
  );
};