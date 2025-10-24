import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import type { FC } from 'react';

// Types
import type {
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';
import {
  LineWidthValue,
  ShapeOutlineValue,
  ToolValue,
} from '../../util/toolType';

// Tools
import { Pen, Tool, Eraser, ColorExtract, ColorFill } from '../../util/tool';
import Shape from '../../util/tool/shape';

// Context & Utilities
import { DispatcherContext } from '../../context';
import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';
import Snapshot from '../../util/snapshot';
import {
  logCanvasClear,
  logCanvasUndo,
  logCanvasRedo,
} from '../../util/logger';
import { getCanvasCursorStyle } from '../../util/cursor/iconToCursor';

// Interfaces
interface CanvasProps {
  sendMessage: (data: any) => void;
  role: 'drawer' | 'guesser' | null;
  toolType: ToolType;
  shapeType: ShapeToolType;
  shapeOutlineType: ShapeOutlineType;
  lineWidthType: LineWidthType;
  mainColor: string;
  subColor: string;
  setColor: (value: string) => void;
  roomDrawData: any;
}

interface DrawMessage {
  type: 'canvas_action';
  content: {
    type: 'canvas_action';
    function:
      | 'draw_start'
      | 'draw_move'
      | 'draw_end'
      | 'canvas_clear'
      | 'canvas_Redo'
      | 'canvas_UNDO';
    normX?: number;
    normY?: number;
    toolType: ToolType;
    color?: string;
    lineWidth?: number;
    lineWidthType?: LineWidthType;
    shapeType?: ShapeToolType;
    shapeOutlineType?: ShapeOutlineType;
  };
}

interface CanvasCoordinates {
  x: number;
  y: number;
  normX: number;
  normY: number;
}

// Constants
export const LINE_WIDTH_FACTORS = {
  [LineWidthValue.THIN]: 1,
  [LineWidthValue.MIDDLE]: 2,
  [LineWidthValue.BOLD]: 3,
  [LineWidthValue.MAXBOLD]: 4,
} as const;

// Ekran boyutuna göre normalize edilmiş çizgi kalınlığı faktörü
const getNormalizedLineWidthFactor = (
  lineWidthType: LineWidthType,
  canvasWidth: number
): number => {
  const baseFactor = LINE_WIDTH_FACTORS[lineWidthType] || 1;
  const referenceWidth = 1200;
  const normalizedFactor = baseFactor * (canvasWidth / referenceWidth);

  return Math.max(0.5, Math.min(normalizedFactor, baseFactor * 2));
};
function throttle<T extends (...args: any[]) => void>(fn: T, limit: number): T {
  let lastRun = 0;
  return function (this: any, ...args: any[]) {
    const now = Date.now();
    if (now - lastRun >= limit) {
      fn.apply(this, args);
      lastRun = now;
    }
  } as T;
}
const Canvas: FC<CanvasProps> = ({
  role,
  toolType,
  lineWidthType,
  mainColor,
  subColor,
  setColor,
  shapeType,
  shapeOutlineType,
  roomDrawData,
  sendMessage,
}) => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef<Tool>(null);
  const remoteToolRef = useRef<Tool | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);
  const dprRef = useRef<number>(1);
  const canvasSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // State
  const [snapshot] = useState(() => new Snapshot());
  const dispatcherContext = useContext(DispatcherContext);

  // Utility Functions
  const getDevicePixelRatio = useCallback((): number => {
    return window.devicePixelRatio || 1;
  }, []);

  const scaleCoordinate = useCallback((coord: number, dpr: number): number => {
    return coord * dpr;
  }, []);

  const normalizeCoordinate = useCallback(
    (coord: number, canvasSize: number): number => {
      return coord / canvasSize;
    },
    []
  );

  const getCanvasCoordinates = useCallback(
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
    [scaleCoordinate, normalizeCoordinate]
  );

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

  // Tool Management
  const createToolInstance = useCallback((): Tool | undefined => {
    switch (toolType) {
      case ToolValue.PEN:
        return new Pen();
      case ToolValue.ERASER:
        return new Eraser();
      case ToolValue.COLOR_EXTRACT:
        return new ColorExtract(setColor);
      case ToolValue.COLOR_FILL:
        return new ColorFill();
      case ToolValue.SHAPE:
        return new Shape(
          shapeType,
          shapeOutlineType === ShapeOutlineValue.DOTTED
        );
      default:
        return undefined;
    }
  }, [toolType, shapeType, shapeOutlineType, setColor]);

  const createRemoteToolInstance = useCallback((action: any): Tool | null => {
    switch (action.toolType) {
      case ToolValue.PEN:
        return new Pen();
      case ToolValue.ERASER:
        return new Eraser();
      case ToolValue.COLOR_FILL:
        return new ColorFill();
      case ToolValue.SHAPE:
        const isDashed = action.shapeOutlineType === ShapeOutlineValue.DOTTED;
        return new Shape(action.shapeType, isDashed);
      default:
        return null;
    }
  }, []);

  // Canvas Setup - SADECE BOYUT DEĞİŞİKLİKLERİ İÇİN
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

      // Boyut değişmediyse ve ilk kurulum değilse çık
      if (
        !isInitialSetup &&
        canvas.width === realWidth &&
        canvas.height === realHeight
      ) {
        return;
      }

      // Mevcut içeriği sakla
      const currentImageData = isInitialSetup
        ? null
        : ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Canvas boyutlarını güncelle
      canvas.width = realWidth;
      canvas.height = realHeight;
      canvasSizeRef.current = { width: realWidth, height: realHeight };

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;

      // Transform'u sıfırla ve scale uygula
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      Tool.ctx = ctx;

      if (isInitialSetup || !isInitializedRef.current) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        isInitializedRef.current = true;
        snapshot.add(ctx.getImageData(0, 0, realWidth, realHeight));
      } else if (currentImageData) {
        ctx.putImageData(currentImageData, 0, 0);
      }

      console.log(`Canvas Setup - CSS: ${cssWidth}x${cssHeight}`);
    },
    [snapshot, getDevicePixelRatio]
  ); // SADECE bu iki bağımlılık

  // Tool Configuration - RENK VE ÇİZGİ KALINLIĞI AYARLARI (CANVAS'I SIFIRLAMADAN)
  useEffect(() => {
    // Tool instance oluştur
    const newTool = createToolInstance();
    if (newTool) {
      toolRef.current = newTool;
    }

    // Tool özelliklerini güncelle (CANVAS'I SIFIRLAMADAN)
    const canvas = canvasRef.current;
    if (canvas && Tool.ctx) {
      const rect = canvas.getBoundingClientRect();
      const normalizedLineWidth = getNormalizedLineWidthFactor(
        lineWidthType,
        rect.width
      );

      // SADECE Tool özelliklerini güncelle, canvas'ı sıfırlama
      Tool.lineWidthFactor = normalizedLineWidth;
      Tool.mainColor = mainColor;
      Tool.subColor = subColor;

      console.log('Tool properties updated (no canvas reset):', {
        lineWidth: Tool.lineWidthFactor,
        mainColor: Tool.mainColor,
        subColor: Tool.subColor,
      });
    }
  }, [
    toolType,
    shapeType,
    shapeOutlineType,
    lineWidthType,
    mainColor,
    subColor,
    createToolInstance,
  ]);

  // Çizgi kalınlığı değişiminde tool özelliklerini güncelle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && Tool.ctx) {
      const rect = canvas.getBoundingClientRect();
      const normalizedLineWidth = getNormalizedLineWidthFactor(
        lineWidthType,
        rect.width
      );
      Tool.lineWidthFactor = normalizedLineWidth;

      console.log('Line width updated (no canvas reset):', {
        lineWidthType,
        canvasWidth: rect.width,
        normalizedLineWidth,
      });
    }
  }, [lineWidthType]);

  // Renk değişiminde tool özelliklerini güncelle
  useEffect(() => {
    if (Tool.ctx) {
      Tool.mainColor = mainColor;
      Tool.subColor = subColor;

      console.log('Colors updated (no canvas reset):', {
        mainColor,
        subColor,
      });
    }
  }, [mainColor, subColor]);

  // Rol değişiminde snapshot'ı sıfırla
  useEffect(() => {
    if (role) {
      snapshot.clear();
      console.log(`Role changed to ${role}, snapshot cleared`);

      const ctx = Tool.ctx;
      if (ctx) {
        const canvas = ctx.canvas;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    }
  }, [role, snapshot]);

  // Canvas Initialization & Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas(true);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          requestAnimationFrame(() => {
            setupCanvas(false);
          });
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.unobserve(canvas);
  }, [setupCanvas]);

  // Message Sending
  const sendDrawMessage = useCallback(
    (
      action: DrawMessage['content']['function'],
      coordinates?: { normX: number; normY: number }
    ) => {
      const canvas = canvasRef.current;
      let currentLineWidth = Tool.lineWidthFactor;

      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        currentLineWidth = getNormalizedLineWidthFactor(
          lineWidthType,
          rect.width
        );
      }

      const message: DrawMessage = {
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
    ]
  );
  const throttledSendDrawMove = useMemo(
    () => throttle(sendDrawMessage, 5),
    [sendDrawMessage]
  );
  // Canvas Actions
  const clearCanvas = useCallback(() => {
    const ctx = Tool.ctx;
    if (!ctx) return;

    const canvas = ctx.canvas;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    logCanvasClear(toolType);
    sendDrawMessage('canvas_clear');
    snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
  }, [toolType, sendDrawMessage, snapshot]);

  const handleUndo = useCallback(() => {
    const ctx = Tool.ctx;
    if (!ctx) return;

    const imageData = snapshot.back();
    if (imageData) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.putImageData(imageData, 0, 0);
      logCanvasUndo(toolType);
      sendDrawMessage('canvas_UNDO');
    }
  }, [toolType, sendDrawMessage, snapshot]);

  const handleRedo = useCallback(() => {
    const ctx = Tool.ctx;
    if (!ctx) return;

    const imageData = snapshot.forward();
    if (imageData) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.putImageData(imageData, 0, 0);
      logCanvasRedo(toolType);
      sendDrawMessage('canvas_Redo');
    }
  }, [toolType, sendDrawMessage, snapshot]);

  // Drawing Handlers

  const lastSentPoint = useRef<{ x: number; y: number } | null>(null);

  const handleDrawAction = useCallback(
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
        Tool.lineWidthFactor = normalizedLineWidth;
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
          break;
        case 'move':
          if (isDrawingRef.current) {
            toolRef.current.onMouseMove(event);
            if (!last || Math.hypot(x - last.x, y - last.y) > 5) {
              // 5px fark
              throttledSendDrawMove('draw_move', { normX, normY });
              // sendDrawMessage('draw_move', { normX, normY });
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
          break;
      }
    },
    [role, sendDrawMessage, snapshot, createDummyMouseEvent, lineWidthType]
  );

  // Event Handlers
  const createEventHandler = useCallback(
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
    [getCanvasCoordinates, handleDrawAction]
  );

  // Event Listeners
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

    Object.entries(eventHandlers).forEach(([type, handler]) => {
      canvas.addEventListener(type, handler as EventListener);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([type, handler]) => {
        canvas.removeEventListener(type, handler as EventListener);
      });
    };
  }, [createEventHandler]);

  // Dispatcher Events
  const dispatcherCallbacks = useMemo(
    () => ({
      clearCanvas,
      handleUndo,
      handleRedo,
    }),
    [clearCanvas, handleUndo, handleRedo]
  );

  useEffect(() => {
    const dispatcher = dispatcherContext.dispatcher;
    if (!dispatcher) return;

    dispatcher.on(CLEAR_EVENT, dispatcherCallbacks.clearCanvas);
    dispatcher.on(UNDO_EVENT, dispatcherCallbacks.handleUndo);
    dispatcher.on(REDO_EVENT, dispatcherCallbacks.handleRedo);

    return () => {
      dispatcher.off(CLEAR_EVENT, dispatcherCallbacks.clearCanvas);
      dispatcher.off(UNDO_EVENT, dispatcherCallbacks.handleUndo);
      dispatcher.off(REDO_EVENT, dispatcherCallbacks.handleRedo);
    };
  }, [dispatcherContext, dispatcherCallbacks]);
  const lastRemotePointRef = useRef<{ x: number; y: number } | null>(null);
  // Remote Drawing Processing
  const processRemoteDraw = useCallback(() => {
    if (!roomDrawData || !Tool.ctx || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const {
      function: actionType,
      normX,
      normY,
      color,
      lineWidth,
      lineWidthType: remoteLineWidthType,
      toolType: remoteToolType,
      shapeType: remoteShapeType,
      shapeOutlineType: remoteShapeOutlineType,
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

    let remoteNormalizedLineWidth = lineWidth;

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
              // İki nokta arasındaki mesafe
              const dx = current.x - last.x;
              const dy = current.y - last.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              // Her adımda kaç pikselde bir ara nokta oluşturulacak
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
              // İlk nokta ise direkt kullan
              remoteToolRef.current.onMouseMove(dummyEvent);
            }

            // Son noktayı güncelle
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
      Tool.mainColor = originalState.mainColor;
      Tool.lineWidthFactor = originalState.lineWidthFactor;
    }
  }, [
    roomDrawData,
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

  // Cursor Style
  const cursorStyle = useMemo(() => {
    return getCanvasCursorStyle(toolType, mainColor, subColor);
  }, [toolType, mainColor, subColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full  min-h-80 ${
        role !== 'drawer' ? 'pointer-events-none' : ''
      }`}
      style={{
        cursor: cursorStyle,
        touchAction: 'none',
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

export default Canvas;
