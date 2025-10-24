// Orijinal dosyanızdaki tipleri ve sabitleri buraya taşıyın
import { LineWidthValue, type LineWidthType } from '../util/toolType';

export const LINE_WIDTH_FACTORS = {
  [LineWidthValue.THIN]: 1,
  [LineWidthValue.MIDDLE]: 2,
  [LineWidthValue.BOLD]: 3,
  [LineWidthValue.MAXBOLD]: 4,
} as const;

export const getNormalizedLineWidthFactor = (
  lineWidthType: LineWidthType,
  canvasWidth: number
): number => {
  const baseFactor = LINE_WIDTH_FACTORS[lineWidthType] || 1;
  const referenceWidth = 1200;
  const normalizedFactor = baseFactor * (canvasWidth / referenceWidth);

  return Math.max(0.5, Math.min(normalizedFactor, baseFactor * 2));
};

// Throttle fonksiyonunu da buraya taşıyın
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  limit: number
): T {
  let lastRun = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      fn.apply(this, args);
      lastRun = now;
    }
  } as T;
}

// DrawMessage ve CanvasCoordinates tiplerini de buraya taşıyabilirsiniz.
