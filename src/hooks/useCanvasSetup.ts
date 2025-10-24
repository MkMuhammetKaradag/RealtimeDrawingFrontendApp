import { useCallback, useEffect, useRef } from 'react';

import Snapshot from '../util/snapshot';
import { Tool } from '../util/tool';

interface UseCanvasSetupProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  snapshot: Snapshot;
  role: 'drawer' | 'guesser' | null;
}

export const useCanvasSetup = ({
  canvasRef,
  snapshot,
  role,
}: UseCanvasSetupProps) => {
  const dprRef = useRef<number>(1);
  const isInitializedRef = useRef<boolean>(false);
  const canvasSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const getDevicePixelRatio = useCallback(
    (): number => window.devicePixelRatio || 1,
    []
  );

  const setupCanvas = useCallback(
    (isInitialSetup: boolean = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = getDevicePixelRatio();
      dprRef.current = dpr;

      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      const realWidth = cssWidth * dpr;
      const realHeight = cssHeight * dpr;

      if (
        !isInitialSetup &&
        canvas.width === realWidth &&
        canvas.height === realHeight
      ) {
        return;
      }

      // ... (Orijinal bileşendeki tüm setupCanvas mantığı buraya gelir)
      const currentImageData = isInitialSetup
        ? null
        : ctx.getImageData(0, 0, canvas.width, canvas.height);

      canvas.width = realWidth;
      canvas.height = realHeight;
      canvasSizeRef.current = { width: realWidth, height: realHeight };
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      Tool.ctx = ctx; // Tool'un bağlamını güncelle

      if (isInitialSetup || !isInitializedRef.current) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        isInitializedRef.current = true;
        snapshot.add(ctx.getImageData(0, 0, realWidth, realHeight));
      } else if (currentImageData) {
        ctx.putImageData(currentImageData, 0, 0);
      }
      // ...
    },
    [canvasRef, snapshot, getDevicePixelRatio]
  );

  // Initialization & Resize Observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas(true);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          requestAnimationFrame(() => setupCanvas(false));
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.unobserve(canvas);
  }, [canvasRef, setupCanvas]);

  // Rol değişiminde snapshot'ı sıfırlama mantığı
  useEffect(() => {
    if (role && Tool.ctx) {
      snapshot.clear();
      const canvas = Tool.ctx.canvas;
      Tool.ctx.fillStyle = 'white';
      Tool.ctx.fillRect(0, 0, canvas.width, canvas.height);
      snapshot.add(Tool.ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  }, [role, snapshot]);

  return { dprRef, setupCanvas };
};
