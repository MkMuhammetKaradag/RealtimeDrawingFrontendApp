import { useCallback, useRef, useMemo, useEffect } from 'react';
import { Tool } from '../util/tool';
import Snapshot from '../util/snapshot';
import {
  ToolValue,
  type LineWidthType,
  type ShapeOutlineType,
  type ShapeToolType,
  type ToolType,
} from '../util/toolType';
import { getNormalizedLineWidthFactor, throttle } from '../util/utils';

interface CanvasCoordinates {
  x: number;
  y: number;
  normX: number;
  normY: number;
}

interface UseCanvasDrawingProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  dprRef: React.MutableRefObject<number>;
  role: 'drawer' | 'guesser' | null;
  toolRef: React.MutableRefObject<Tool | null>;
  sendMessage: (data: any) => void;
  toolType: ToolType;
  lineWidthType: LineWidthType;
  mainColor: string;
  subColor: string;
  shapeType: ShapeToolType;
  shapeOutlineType: ShapeOutlineType;
  snapshot: Snapshot;
  createDummyMouseEvent: (x: number, y: number, type: string) => MouseEvent;
}

export const useCanvasDrawing = ({
  canvasRef,
  dprRef,
  role,
  toolRef,
  sendMessage,
  toolType,
  lineWidthType,
  mainColor,
  subColor,
  shapeType,
  shapeOutlineType,
  snapshot,
  createDummyMouseEvent,
}: UseCanvasDrawingProps) => {
  const isDrawingRef = useRef<boolean>(false);
  const lastSentPoint = useRef<{ x: number; y: number } | null>(null);

  const scaleCoordinate = useCallback(
    (coord: number, dpr: number): number => coord * dpr,
    []
  );
  const normalizeCoordinate = useCallback(
    (coord: number, canvasSize: number): number => coord / canvasSize,
    []
  );

  const getCanvasCoordinates = useCallback(
    // ... (Orijinal getCanvasCoordinates mantığı buraya gelir)
    (
      canvas: HTMLCanvasElement,
      clientX: number,
      clientY: number
    ): CanvasCoordinates | null => {
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;

      const cssX = clientX - rect.left;
      const cssY = clientY - rect.top;

      const x = scaleCoordinate(cssX, dpr);
      const y = scaleCoordinate(cssY, dpr);

      const normX = normalizeCoordinate(cssX, rect.width);
      const normY = normalizeCoordinate(cssY, rect.height);

      return { x, y, normX, normY };
    },
    [scaleCoordinate, normalizeCoordinate, dprRef]
  );

  // Mesaj Gönderme
  const sendDrawMessage = useCallback(
    // ... (Orijinal sendDrawMessage mantığı buraya gelir)
    (action: string, coordinates?: { normX: number; normY: number }) => {
      const canvas = canvasRef.current;
      let currentLineWidth = Tool.lineWidthFactor;

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        currentLineWidth = getNormalizedLineWidthFactor(
          lineWidthType,
          rect.width
        );
      }

      const message = {
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: action,
          toolType,
          color: toolType === ToolValue.ERASER ? subColor : mainColor,
          lineWidth: currentLineWidth,
          lineWidthType: lineWidthType,
          ...coordinates,
          ...(toolType === ToolValue.SHAPE && {
            shapeType,
            shapeOutlineType,
          }),
        },
      };

      sendMessage(message);
    },
    [
      toolType,
      shapeType,
      shapeOutlineType,
      mainColor,
      subColor,
      sendMessage,
      lineWidthType,
      canvasRef,
    ]
  );

  const throttledSendDrawMove = useMemo(
    () => throttle(sendDrawMessage, 5),
    [sendDrawMessage]
  );

  const handleDrawAction = useCallback(
    // ... (Orijinal handleDrawAction mantığı buraya gelir)
    (
      action: 'start' | 'move' | 'end',
      x: number,
      y: number,
      normX: number,
      normY: number
    ) => {
      if (!toolRef.current) return;
      if (action === 'start' && role !== 'drawer') return;

      if (Tool.ctx) {
        const canvas = Tool.ctx.canvas;
        const cssWidth = canvas.clientWidth;
        const normalizedLineWidth = getNormalizedLineWidthFactor(
          lineWidthType,
          cssWidth
        );
        Tool.lineWidthFactor = normalizedLineWidth; // Güncel kalınlığı yerel çizim için ayarla
      }

      const eventType =
        action === 'start'
          ? 'mousedown'
          : action === 'move'
          ? 'mousemove'
          : 'mouseup';
      const event = createDummyMouseEvent(x, y, eventType);
      const last = lastSentPoint.current;

      switch (action) {
        case 'start':
          toolRef.current.onMouseDown(event);
          isDrawingRef.current = true;
          sendDrawMessage('draw_start', { normX, normY });
          lastSentPoint.current = { x, y }; // İlk noktayı kaydet
          break;
        case 'move':
          if (isDrawingRef.current) {
            toolRef.current.onMouseMove(event);
            if (!last || Math.hypot(x - last.x, y - last.y) > 5) {
              throttledSendDrawMove('draw_move', { normX, normY });
              lastSentPoint.current = { x, y };
            }
          }
          break;
        case 'end':
          if (isDrawingRef.current) {
            toolRef.current.onMouseUp(event);
            isDrawingRef.current = false;
            sendDrawMessage('draw_end', { normX, normY });

            const ctx = Tool.ctx;
            if (ctx) {
              snapshot.add(
                ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
              );
            }
          }
          lastSentPoint.current = null; // Bitişte sıfırla
          break;
      }
    },
    [
      role,
      sendDrawMessage,
      snapshot,
      createDummyMouseEvent,
      lineWidthType,
      toolRef,
      throttledSendDrawMove,
    ]
  );

  const createEventHandler = useCallback(
    // ... (Orijinal createEventHandler mantığı buraya gelir)
    (action: 'start' | 'move' | 'end') => (event: MouseEvent | TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let clientX: number, clientY: number;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else {
        const touch =
          action === 'end' ? event.changedTouches[0] : event.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
        event.preventDefault();
      }

      const coords = getCanvasCoordinates(canvas, clientX, clientY);
      if (!coords) return;

      const { x, y, normX, normY } = coords;
      handleDrawAction(action, x, y, normX, normY);
    },
    [canvasRef, getCanvasCoordinates, handleDrawAction]
  );

  // Event Listeners (Mouse/Touch)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const eventHandlers = {
      mousedown: createEventHandler('start'),
      mousemove: createEventHandler('move'),
      mouseup: createEventHandler('end'),
      touchstart: createEventHandler('start'),
      touchmove: createEventHandler('move'),
      touchend: createEventHandler('end'),
    };

    // ... (Orijinal useEffect event listener ekleme/kaldırma mantığı buraya gelir)
    Object.entries(eventHandlers).forEach(([type, handler]) => {
      canvas.addEventListener(type, handler as EventListener);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([type, handler]) => {
        canvas.removeEventListener(type, handler as EventListener);
      });
    };
  }, [canvasRef, createEventHandler]);

  return { isDrawingRef, sendDrawMessage };
};
