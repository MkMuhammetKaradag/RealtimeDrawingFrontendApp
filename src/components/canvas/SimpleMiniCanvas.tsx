import React, { useRef, useEffect, useCallback } from 'react';
import type { ParsedAction } from '../../pages/paint';
import { Tool } from '../../util/tool';
import { Pen, Eraser, ColorFill } from '../../util/tool';
import Shape from '../../util/tool/shape';

interface SimpleMiniCanvasProps {
  actions: ParsedAction[];
  width?: number;
  height?: number;
  roundId?: string | number;
}

const SimpleMiniCanvas: React.FC<SimpleMiniCanvasProps> = ({
  actions,
  width = 180,
  height = 120,
  roundId,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef<Tool | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Ana canvas'daki createDummyMouseEvent benzeri
  const createDummyMouseEvent = useCallback(
    (x: number, y: number, type: string): MouseEvent => {
      return {
        offsetX: x,
        offsetY: y,
        buttons: 1,
        type,
        clientX: x,
        clientY: y,
        preventDefault: () => {},
      } as unknown as MouseEvent;
    },
    []
  );

  // Tool instance oluşturma - ana canvas'daki gibi
  const createToolInstance = useCallback(
    (action: ParsedAction): Tool | null => {
      switch (action.toolType) {
        case 'PEN':
          return new Pen();
        case 'ERASER':
          return new Eraser();
        case 'COLOR_FILL':
          return new ColorFill();
        case 'SHAPE': {
          const isDashed = action.shapeOutlineType === 'DOTTED';
          if (!action.shapeType) return null;
          return new Shape(action.shapeType as any, isDashed);
        }
        default:
          return null;
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ✅ CANVAS'I HER ACTIONS DEĞİŞİMİNDE SIFIRLA
    // (yeni round = yeni actions dizisi)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Tool context'ini ayarla
    Tool.ctx = ctx;
    Tool.lineWidthFactor = 2;

    // Her action'ı ana canvas'daki gibi işle
    actions.forEach((action) => {
      if (!action.normX || !action.normY) return;

      const x = action.normX * width;
      const y = action.normY * height;

      // Orijinal state'i sakla
      const originalState = {
        mainColor: Tool.mainColor,
        subColor: Tool.subColor,
        lineWidthFactor: Tool.lineWidthFactor,
      };

      // Gelen action'ın özelliklerini uygula
      if (action.color) Tool.mainColor = action.color;
      if (action.lineWidth)
        Tool.lineWidthFactor = Math.max(1, action.lineWidth * 2);

      try {
        const dummyEvent = createDummyMouseEvent(x, y, action.function);

        switch (action.function) {
          case 'draw_start':
            toolRef.current = createToolInstance(action);
            if (toolRef.current) {
              toolRef.current.onMouseDown(dummyEvent);
            }
            break;

          case 'draw_move':
            if (toolRef.current) {
              toolRef.current.onMouseMove(dummyEvent);
            }
            break;

          case 'draw_end':
            if (toolRef.current) {
              toolRef.current.onMouseUp(dummyEvent);
              toolRef.current = null;
            }
            break;

          case 'canvas_clear':
            // Clear işlemi zaten yukarıda yapıldı
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error drawing action:', error);
      } finally {
        // Orijinal state'i geri yükle
        Tool.mainColor = originalState.mainColor;
        Tool.subColor = originalState.subColor;
        Tool.lineWidthFactor = originalState.lineWidthFactor;
      }
    });

    // Debug border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }, [
    actions,
    width,
    height,
    roundId,
    createToolInstance,
    createDummyMouseEvent,
  ]); // ✅ actions değiştiğinde sıfırlanacak

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-white rounded border border-gray-300 shadow-sm"
      />
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
        {actions.filter((a) => a.function.includes('draw')).length} işlem
      </div>
    </div>
  );
};

export default SimpleMiniCanvas;
