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

const LINE_WIDTH_FACTORS = {
  [LineWidthValue.THIN]: 1,

  [LineWidthValue.MIDDLE]: 2,

  [LineWidthValue.BOLD]: 3,

  [LineWidthValue.MAXBOLD]: 4,
} as const;

// Utility Functions

const getLineWidthFactor = (type: LineWidthType): number => {
  return LINE_WIDTH_FACTORS[type] || 1;
};

const createDummyMouseEvent = (
  x: number,

  y: number,

  type: string
): MouseEvent => {
  return {
    offsetX: x,

    offsetY: y,

    buttons: 1,

    type,

    clientX: x,

    clientY: y,

    preventDefault: () => {},
  } as unknown as MouseEvent;
};

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

  const toolTypeRef = useRef(toolType); // toolType için ref

  const isInitializedRef = useRef<boolean>(false);

  const dprRef = useRef<number>(1);

  const canvasSizeRef = useRef<{ width: number; height: number }>({
    width: 0,

    height: 0,
  }); // State

  const [snapshot] = useState(() => new Snapshot());

  const dispatcherContext = useContext(DispatcherContext);

  const previousToolTypeRef = useRef<ToolType>(toolType);

  const shouldPreserveCanvasRef = useRef<boolean>(true);

  const getDevicePixelRatio = useCallback((): number => {
    return window.devicePixelRatio || 1;
  }, []);

  const scaleCoordinate = useCallback(
    (coord: number, canvasSize: number, dpr: number): number => {
      return coord * dpr;
    },

    []
  );

  const normalizeCoordinate = useCallback(
    (coord: number, canvasSize: number, dpr: number): number => {
      return coord / (canvasSize * dpr);
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

      const dpr = dprRef.current; // CSS piksel koordinatları

      const cssX = clientX - rect.left;

      const cssY = clientY - rect.top; // Gerçek canvas koordinatları (DPR ile scale edilmiş)

      const x = scaleCoordinate(cssX, rect.width, dpr);

      const y = scaleCoordinate(cssY, rect.height, dpr); // Normalize koordinatlar (0-1 arası)

      const normX = normalizeCoordinate(cssX, rect.width, 1); // CSS boyutuna göre normalize

      const normY = normalizeCoordinate(cssY, rect.height, 1);

      return { x, y, normX, normY };
    },

    [scaleCoordinate, normalizeCoordinate]
  );

  useEffect(() => {
    toolTypeRef.current = toolType;
  }, [toolType]); // Tool Creation

  const createToolInstance = useCallback((): Tool | undefined => {
    console.log('Creating new tool instance:', toolType);

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
  }, []); // Tool Configuration Effects

  useEffect(() => {
    // Eğer tool değiştiyse ve canvas korunmalıysa

    if (
      previousToolTypeRef.current !== toolType &&
      shouldPreserveCanvasRef.current
    ) {
      console.log('Tool changed, preserving canvas content');

      const newTool = createToolInstance();

      if (newTool) {
        toolRef.current = newTool;
      }

      previousToolTypeRef.current = toolType;
    }
  }, [toolType, createToolInstance]);

  useEffect(() => {
    if (toolRef.current instanceof Shape) {
      // Mevcut shape tool'unun özelliklerini güncelle

      toolRef.current.isDashed = shapeOutlineType === ShapeOutlineValue.DOTTED;

      if (shapeType && toolRef.current.type !== shapeType) {
        toolRef.current.type = shapeType;
      }
    }
  }, [shapeOutlineType, shapeType]);

  useEffect(() => {
    Tool.lineWidthFactor = getLineWidthFactor(lineWidthType);
  }, [lineWidthType]);

  useEffect(() => {
    Tool.mainColor = mainColor;
  }, [mainColor]);

  useEffect(() => {
    Tool.subColor = subColor;
  }, [subColor]); // Canvas Setup

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

      // Eğer boyutlar aynıysa ve ilk kurulum değilse, sadece içeriği koru
      if (
        !isInitialSetup &&
        canvas.width === realWidth &&
        canvas.height === realHeight
      ) {
        return;
      }

      // Mevcut içeriği geçici olarak sakla
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
        // İlk kurulum - beyaz arkaplan
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        isInitializedRef.current = true;
        snapshot.add(ctx.getImageData(0, 0, realWidth, realHeight));
      } else if (currentImageData) {
        // Önceki içeriği geri yükle
        ctx.putImageData(currentImageData, 0, 0);
      }

      console.log(
        `Canvas Setup - Role: ${role}, CSS: ${cssWidth}x${cssHeight}`
      );
    },
    [snapshot, getDevicePixelRatio, role]
  ); // role'ü bağımlılığa ekleyin

  useEffect(() => {
    const initialTool = createToolInstance();

    if (initialTool) {
      toolRef.current = initialTool;

      previousToolTypeRef.current = toolType;
    }
  }, []); // Sadece mount'ta çalışsın // İlk kurulum ve resize observer - DEĞİŞMEDİ

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas(true);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          // Rol değişikliğinden hemen sonra boyutlandırma yap
          requestAnimationFrame(() => {
            setupCanvas(false);
          });
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => {
      resizeObserver.unobserve(canvas);
    };
  }, [setupCanvas]); // Canvas setup ve resize observer // Message Sending
  useEffect(() => {
    // Rol değiştiğinde canvas'ı yeniden boyutlandır
    const timer = setTimeout(() => {
      setupCanvas(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [role, setupCanvas]);
  const sendDrawMessage = useCallback(
    (
      action: DrawMessage['content']['function'],

      coordinates?: { normX: number; normY: number }
    ) => {
      const message: DrawMessage = {
        type: 'canvas_action',

        content: {
          type: 'canvas_action',

          function: action,

          toolType,

          color: toolType === ToolValue.ERASER ? subColor : mainColor,

          lineWidth: Tool.lineWidthFactor,

          ...coordinates,

          ...(toolType === ToolValue.SHAPE && {
            shapeType,

            shapeOutlineType,
          }),
        },
      };

      sendMessage(message);
    },

    [toolType, shapeType, shapeOutlineType, mainColor, subColor, sendMessage]
  ); // Canvas Actions

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;

    const ctx = Tool.ctx;

    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();

    const dpr = dprRef.current; // CSS boyutlarında temizle

    ctx.fillStyle = 'white';

    ctx.fillRect(0, 0, rect.width, rect.height);

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
  }, [toolType, sendDrawMessage, snapshot]); // Event Handlers

  const handleDrawStart = useCallback(
    (x: number, y: number, normX: number, normY: number) => {
      if (!toolRef.current || role !== 'drawer') return; // DPR'ye göre scale edilmiş koordinatları kullan

      const event = createDummyMouseEvent(x, y, 'mousedown');

      toolRef.current.onMouseDown(event);

      isDrawingRef.current = true;

      sendDrawMessage('draw_start', { normX, normY });
    },

    [role, sendDrawMessage]
  );

  const handleDrawMove = useCallback(
    (x: number, y: number, normX: number, normY: number) => {
      if (!toolRef.current || !isDrawingRef.current) return;

      const event = createDummyMouseEvent(x, y, 'mousemove');

      toolRef.current.onMouseMove(event);

      sendDrawMessage('draw_move', { normX, normY });
    },

    [sendDrawMessage]
  );

  const handleDrawEnd = useCallback(
    (x: number, y: number, normX: number, normY: number) => {
      if (!toolRef.current || !isDrawingRef.current) return;

      const event = createDummyMouseEvent(x, y, 'mouseup');

      toolRef.current.onMouseUp(event);

      isDrawingRef.current = false;

      sendDrawMessage('draw_end', { normX, normY }); // Çizim tamamlandığında snapshot'a ekle

      const ctx = Tool.ctx;

      if (ctx) {
        snapshot.add(
          ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
        );
      }
    },

    [sendDrawMessage, snapshot]
  ); // MOUSE EVENT HANDLERS - Güncellenmiş

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const coords = getCanvasCoordinates(canvas, event.clientX, event.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawStart(x, y, normX, normY);
    },

    [handleDrawStart, getCanvasCoordinates]
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const coords = getCanvasCoordinates(canvas, event.clientX, event.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawMove(x, y, normX, normY);
    },

    [handleDrawMove, getCanvasCoordinates]
  );

  const onMouseUp = useCallback(
    (event: MouseEvent) => {
      const canvas = canvasRef.current;

      if (!canvas) return;

      const coords = getCanvasCoordinates(canvas, event.clientX, event.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawEnd(x, y, normX, normY);
    },

    [handleDrawEnd, getCanvasCoordinates]
  ); // TOUCH EVENT HANDLERS - Güncellenmiş

  const onTouchStart = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      const canvas = canvasRef.current;

      if (!canvas) return;

      const touch = event.touches[0];

      const coords = getCanvasCoordinates(canvas, touch.clientX, touch.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawStart(x, y, normX, normY);
    },

    [handleDrawStart, getCanvasCoordinates]
  );

  const onTouchMove = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      const canvas = canvasRef.current;

      if (!canvas) return;

      const touch = event.touches[0];

      const coords = getCanvasCoordinates(canvas, touch.clientX, touch.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawMove(x, y, normX, normY);
    },

    [handleDrawMove, getCanvasCoordinates]
  );

  const onTouchEnd = useCallback(
    (event: TouchEvent) => {
      event.preventDefault();

      const canvas = canvasRef.current;

      if (!canvas) return;

      const touch = event.changedTouches[0];

      const coords = getCanvasCoordinates(canvas, touch.clientX, touch.clientY);

      if (!coords) return;

      const { x, y, normX, normY } = coords;

      handleDrawEnd(x, y, normX, normY);
    },

    [handleDrawEnd, getCanvasCoordinates]
  ); // Remote Drawing Processing

  const processRemoteDraw = useCallback(() => {
    if (!roomDrawData || !Tool.ctx || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const {
      function: actionType,

      normX,

      normY,

      color,

      lineWidth,

      toolType: remoteToolType,

      shapeType: remoteShapeType,

      shapeOutlineType: remoteShapeOutlineType,
    } = roomDrawData.content;

    const rect = canvas.getBoundingClientRect();

    const dpr = dprRef.current; // Normalize koordinatları gerçek canvas koordinatlarına çevir

    const cssX = normX * rect.width;

    const cssY = normY * rect.height;

    const x = scaleCoordinate(cssX, rect.width, dpr);

    const y = scaleCoordinate(cssY, rect.height, dpr); // Orijinal state'i sakla

    const originalState = {
      mainColor: Tool.mainColor,

      lineWidthFactor: Tool.lineWidthFactor,
    }; // Remote state'i uygula

    Tool.mainColor = color;

    Tool.lineWidthFactor = lineWidth;

    try {
      const dummyEvent = createDummyMouseEvent(x, y, actionType);

      switch (actionType) {
        case 'draw_start':
          remoteToolRef.current = createRemoteToolInstance(
            roomDrawData.content
          );

          if (remoteToolRef.current) {
            remoteToolRef.current.onMouseDown(dummyEvent);
          }

          break;

        case 'draw_move':
          if (remoteToolRef.current?.isDrawing) {
            remoteToolRef.current.onMouseMove(dummyEvent);
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

          break;

        case 'canvas_clear': // Clear canvas fonksiyonu aşağıda güncellendi
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
      // Orijinal state'i geri yükle

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
  ]); // Effects

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return; // Add event listeners

    const events = [
      { type: 'mousedown', handler: onMouseDown },

      { type: 'mousemove', handler: onMouseMove },

      { type: 'mouseup', handler: onMouseUp },

      { type: 'touchstart', handler: onTouchStart },

      { type: 'touchmove', handler: onTouchMove },

      { type: 'touchend', handler: onTouchEnd },
    ];

    events.forEach(({ type, handler }) => {
      canvas.addEventListener(type, handler as EventListener);
    });

    return () => {
      events.forEach(({ type, handler }) => {
        canvas.removeEventListener(type, handler as EventListener);
      });
    };
  }, [
    onMouseDown,

    onMouseMove,

    onMouseUp,

    onTouchStart,

    onTouchMove,

    onTouchEnd,
  ]);

  useEffect(() => {
    const dispatcher = dispatcherContext.dispatcher;

    if (!dispatcher) return; // Register global events

    dispatcher.on(CLEAR_EVENT, clearCanvas);

    dispatcher.on(UNDO_EVENT, handleUndo);

    dispatcher.on(REDO_EVENT, handleRedo);

    return () => {
      dispatcher.off(CLEAR_EVENT, clearCanvas);

      dispatcher.off(UNDO_EVENT, handleUndo);

      dispatcher.off(REDO_EVENT, handleRedo);
    };
  }, [dispatcherContext, clearCanvas, handleUndo, handleRedo]);

  useEffect(() => {
    processRemoteDraw();
  }, [processRemoteDraw]); // Cursor Style

  const cursorStyle = useMemo(() => {
    return getCanvasCursorStyle(toolType, mainColor, subColor);
  }, [toolType, mainColor, subColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${
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
