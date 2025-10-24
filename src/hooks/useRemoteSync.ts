import { useCallback, useEffect, useRef } from 'react';
import { Pen, Eraser, ColorFill, Tool } from '../util/tool';
import Shape from '../util/tool/shape';
import Snapshot from '../util/snapshot';
import { ShapeOutlineValue, ToolValue } from '../util/toolType';
import { getNormalizedLineWidthFactor } from '../util/utils';

// Diğer hook'lardan gelen bağımlılıkları tanımlayın
interface UseRemoteSyncProps {
  roomDrawData: any;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dprRef: React.MutableRefObject<number>;
  snapshot: Snapshot;
  clearCanvas: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  createDummyMouseEvent: (x: number, y: number, type: string) => MouseEvent;
}

export const useRemoteSync = ({
  roomDrawData,
  canvasRef,
  dprRef,
  snapshot,
  clearCanvas,
  handleUndo,
  handleRedo,
  createDummyMouseEvent,
}: UseRemoteSyncProps) => {
  const remoteToolRef = useRef<Tool | null>(null);
  const lastRemotePointRef = useRef<{ x: number; y: number } | null>(null);

  const scaleCoordinate = useCallback(
    (coord: number, dpr: number): number => coord * dpr,
    []
  );

  const createRemoteToolInstance = useCallback((action: any): Tool | null => {
    // ... (Orijinal createRemoteToolInstance mantığı buraya gelir)
    switch (action.toolType) {
      case ToolValue.PEN:
        return new Pen();
      case ToolValue.ERASER:
        return new Eraser();
      case ToolValue.COLOR_FILL:
        return new ColorFill();
      case ToolValue.SHAPE: {
        const isDashed = action.shapeOutlineType === ShapeOutlineValue.DOTTED;
        return new Shape(action.shapeType, isDashed);
      }
      default:
        return null;
    }
  }, []);

  const processRemoteDraw = useCallback(() => {
    if (!roomDrawData || !Tool.ctx || !canvasRef.current) return;

    // ... (Orijinal processRemoteDraw mantığının tamamı buraya gelir)
    const canvas = canvasRef.current;
    const {
      function: actionType,
      normX,
      normY,
      color,
      lineWidthType: remoteLineWidthType,
    } = roomDrawData.content;

    const rect = canvas.getBoundingClientRect();
    const dpr = dprRef.current;

    const cssX = normX * rect.width;
    const cssY = normY * rect.height;
    const x = scaleCoordinate(cssX, dpr);
    const y = scaleCoordinate(cssY, dpr);

    const originalState = {
      mainColor: Tool.mainColor,
      lineWidthFactor: Tool.lineWidthFactor,
    };

    let remoteNormalizedLineWidth = Tool.lineWidthFactor; // Varsayılanı koru

    if (remoteLineWidthType) {
      remoteNormalizedLineWidth = getNormalizedLineWidthFactor(
        remoteLineWidthType,
        rect.width
      );
    }

    Tool.mainColor = color;
    Tool.lineWidthFactor = remoteNormalizedLineWidth;

    try {
      const dummyEvent = createDummyMouseEvent(x, y, actionType);

      switch (actionType) {
        case 'draw_start':
          lastRemotePointRef.current = null;
          remoteToolRef.current = createRemoteToolInstance(
            roomDrawData.content
          );
          if (remoteToolRef.current) {
            remoteToolRef.current.onMouseDown(dummyEvent);
          }
          break;

        case 'draw_move':
          if (remoteToolRef.current?.isDrawing) {
            const last = lastRemotePointRef.current;
            const current = { x, y };

            if (last) {
              const dx = current.x - last.x;
              const dy = current.y - last.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const step = 3;

              for (let i = 0; i < distance; i += step) {
                const t = i / distance;
                const interpX = last.x + dx * t;
                const interpY = last.y + dy * t;

                const interpEvent = createDummyMouseEvent(
                  interpX,
                  interpY,
                  'draw_move'
                );
                remoteToolRef.current.onMouseMove(interpEvent);
              }
            } else {
              remoteToolRef.current.onMouseMove(dummyEvent);
            }
            lastRemotePointRef.current = current;
          }
          break;

        case 'draw_end':
          if (remoteToolRef.current) {
            remoteToolRef.current.onMouseUp(dummyEvent);
            snapshot.add(
              Tool.ctx.getImageData(
                0,
                0,
                Tool.ctx.canvas.width,
                Tool.ctx.canvas.height
              )
            );
            remoteToolRef.current = null;
          }
          lastRemotePointRef.current = null;
          break;

        case 'canvas_clear':
          clearCanvas();
          break;
        case 'canvas_Redo':
          handleRedo();
          break;
        case 'canvas_UNDO':
          handleUndo();
          break;

        default:
          console.warn('Unknown remote action:', actionType);
      }
    } catch (error) {
      console.error('Error processing remote draw:', error);
    } finally {
      // Yerel Tool ayarlarını geri yükle
      Tool.mainColor = originalState.mainColor;
      Tool.lineWidthFactor = originalState.lineWidthFactor;
    }
  }, [
    roomDrawData,
    canvasRef,
    dprRef,
    createRemoteToolInstance,
    clearCanvas,
    handleUndo,
    handleRedo,
    snapshot,
    scaleCoordinate,
    createDummyMouseEvent,
  ]);

  useEffect(() => {
    processRemoteDraw();
  }, [processRemoteDraw]);
};
