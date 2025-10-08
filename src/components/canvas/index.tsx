import React from 'react';
import { useEffect } from 'react';
import { useRef } from 'react';
import type {
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';
import {
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../../util/toolType';
import type { FC } from 'react';
import { useState } from 'react';
import { Pen, Tool, Eraser, ColorExtract, ColorFill } from '../../util/tool';
import Shape from '../../util/tool/shape';
import { useContext } from 'react';
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
  logCanvasResize,
} from '../../util/logger';

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

const Canvas: FC<CanvasProps> = (props) => {
  const {
    role,
    toolType,
    lineWidthType,
    mainColor,
    subColor,
    setColor,
    shapeType,
    shapeOutlineType,
    roomDrawData,
  } = props;

  const [tool, setTool] = useState<Tool>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatcherContext = useContext(DispatcherContext);
  const [snapshot] = useState(new Snapshot());
  const remoteToolRef = useRef<Tool | null>(null);

  // YARDIMCI FONKSİYON: Mutlak koordinatları normalize eder (0-1 arası)
  const normalizeCoordinates = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: x / rect.width, // 0-1 arası oran
      y: y / rect.height, // 0-1 arası oran
    };
  };

  // YARDIMCI FONKSİYON: Normalize koordinatları mutlak koordinatlara çevirir
  const denormalizeCoordinates = (normX: number, normY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: normX * rect.width, // Oranı gerçek piksel değerine çevir
      y: normY * rect.height, // Oranı gerçek piksel değerine çevir
    };
  };

  useEffect(() => {
    switch (toolType) {
      case ToolValue.PEN:
        setTool(new Pen());
        break;
      case ToolValue.ERASER:
        setTool(new Eraser());
        break;
      case ToolValue.COLOR_EXTRACT:
        setTool(new ColorExtract(setColor));
        break;
      case ToolValue.COLOR_FILL:
        setTool(new ColorFill());
        break;
      case ToolValue.SHAPE:
        setTool(
          new Shape(shapeType, shapeOutlineType === ShapeOutlineValue.DOTTED)
        );
        break;
      default:
        break;
    }
  }, [toolType, shapeType, shapeOutlineType, setColor]);

  useEffect(() => {
    if (tool instanceof Shape) {
      tool.isDashed = shapeOutlineType === ShapeOutlineValue.DOTTED;
    }
  }, [shapeOutlineType]);

  useEffect(() => {
    switch (lineWidthType) {
      case LineWidthValue.THIN:
        Tool.lineWidthFactor = 1;
        break;
      case LineWidthValue.MIDDLE:
        Tool.lineWidthFactor = 2;
        break;
      case LineWidthValue.BOLD:
        Tool.lineWidthFactor = 3;
        break;
      case LineWidthValue.MAXBOLD:
        Tool.lineWidthFactor = 4;
        break;
      default:
        break;
    }
  }, [lineWidthType]);

  useEffect(() => {
    Tool.mainColor = mainColor;
  }, [mainColor]);

  useEffect(() => {
    Tool.subColor = subColor;
  }, [subColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      Tool.ctx = ctx;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, rect.width, rect.height);
      snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));

      const dispatcher = dispatcherContext.dispatcher;

      const clearCanvas = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          logCanvasClear(toolType);
          props.sendMessage({
            type: 'canvas_action',
            content: {
              type: 'canvas_action',
              function: 'canvas_clear',
            },
          });
        }
      };
      dispatcher.on(CLEAR_EVENT, clearCanvas);

      const forwardAction = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.forward();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasRedo(toolType);
            props.sendMessage({
              type: 'canvas_action',
              content: {
                type: 'canvas_action',
                function: 'canvas_Redo',
              },
            });
          }
        }
      };
      dispatcher.on(REDO_EVENT, forwardAction);

      const back = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.back();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasUndo(toolType);
            props.sendMessage({
              type: 'canvas_action',
              content: {
                type: 'canvas_action',
                function: 'canvas_UNDO',
              },
            });
          }
        }
      };
      dispatcher.on(UNDO_EVENT, back);

      return () => {
        dispatcher.off(CLEAR_EVENT, clearCanvas);
        dispatcher.off(UNDO_EVENT, back);
        dispatcher.off(REDO_EVENT, forwardAction);
      };
    }
  }, [canvasRef, role]);

  useEffect(() => {
    if (!roomDrawData || !Tool.ctx || role === 'drawer') {
      return;
    }

    const processRemoteDraw = async () => {
      const {
        function: actionType,
        toolType: remoteToolType,
        normX, // Normalize edilmiş koordinatlar kullan
        normY,
        color,
        lineWidth,
        shapeType: remoteShapeType,
        shapeOutlineType: remoteShapeOutlineType,
      } = roomDrawData.content;

      // Normalize koordinatları bu cihazın canvas boyutuna göre dönüştür
      const { x, y } = denormalizeCoordinates(normX, normY);

      const originalMainColor = Tool.mainColor;
      const originalLineWidthFactor = Tool.lineWidthFactor;

      Tool.mainColor = color;
      Tool.lineWidthFactor = lineWidth;

      const dummyEvent: MouseEvent = {
        offsetX: x,
        offsetY: y,
        buttons: 1,
        type: actionType,
        clientX: x + Tool.ctx.canvas.offsetLeft,
        clientY: y + Tool.ctx.canvas.offsetTop,
        preventDefault: () => {},
      } as MouseEvent;

      switch (actionType) {
        case 'draw_start':
          remoteToolRef.current = createRemoteToolInstance(
            roomDrawData.content
          );
          if (remoteToolRef.current) {
            remoteToolRef.current.onMouseDown(dummyEvent);
            remoteToolRef.current.lastX = x;
            remoteToolRef.current.lastY = y;
          }
          break;
        case 'draw_move':
          if (remoteToolRef.current && remoteToolRef.current.isDrawing) {
            const lastX =
              remoteToolRef.current.lastX !== null
                ? remoteToolRef.current.lastX
                : x;
            const lastY =
              remoteToolRef.current.lastY !== null
                ? remoteToolRef.current.lastY
                : y;

            if (
              (remoteToolRef.current instanceof Pen ||
                remoteToolRef.current instanceof Eraser) &&
              lastX !== undefined &&
              lastY !== undefined
            ) {
              const ctx = Tool.ctx;
              ctx.beginPath();
              ctx.moveTo(lastX, lastY);
              ctx.lineTo(x, y);
              ctx.strokeStyle = Tool.mainColor;
              ctx.lineWidth = Tool.baseLineWidth * Tool.lineWidthFactor;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.stroke();
              ctx.closePath();
            } else {
              remoteToolRef.current.onMouseMove(dummyEvent);
            }

            remoteToolRef.current.lastX = x;
            remoteToolRef.current.lastY = y;
          }
          break;
        case 'draw_end':
          if (remoteToolRef.current) {
            if (
              remoteToolRef.current instanceof Pen ||
              remoteToolRef.current instanceof Eraser
            ) {
              const lastX =
                remoteToolRef.current.lastX !== null
                  ? remoteToolRef.current.lastX
                  : x;
              const lastY =
                remoteToolRef.current.lastY !== null
                  ? remoteToolRef.current.lastY
                  : y;
              if (lastX !== x || lastY !== y) {
                const ctx = Tool.ctx;
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = Tool.mainColor;
                ctx.lineWidth = Tool.baseLineWidth * Tool.lineWidthFactor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                ctx.closePath();
              }
            } else {
              remoteToolRef.current.onMouseUp(dummyEvent);
            }

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
        case 'canvas_clear':
          const ctx = Tool.ctx;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          break;
        case 'canvas_Redo':
          const redoImageData = snapshot.forward();
          if (redoImageData) {
            Tool.ctx.clearRect(
              0,
              0,
              Tool.ctx.canvas.width,
              Tool.ctx.canvas.height
            );
            Tool.ctx.putImageData(redoImageData, 0, 0);
          }
          break;
        case 'canvas_UNDO':
          const undoImageData = snapshot.back();
          if (undoImageData) {
            Tool.ctx.clearRect(
              0,
              0,
              Tool.ctx.canvas.width,
              Tool.ctx.canvas.height
            );
            Tool.ctx.putImageData(undoImageData, 0, 0);
          }
          break;
        default:
          break;
      }

      Tool.mainColor = originalMainColor;
      Tool.lineWidthFactor = originalLineWidthFactor;
    };

    processRemoteDraw();
  }, [roomDrawData, role, snapshot]);

  const createRemoteToolInstance = (action: any): Tool | null => {
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
  };

  const onMouseDown = (event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (role === 'drawer' && tool && canvas) {
      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      const rect = canvas.getBoundingClientRect();

      // Canvas içindeki pozisyon
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Normalize koordinatları hesapla (0-1 arası)
      const normalized = normalizeCoordinates(x, y);

      tool.onMouseDown(event);

      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_start',
          normX: normalized.x, // Normalize X (0-1 arası)
          normY: normalized.y, // Normalize Y (0-1 arası)
          toolType: props.toolType,
          color: colorToSend,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
          lineWidth: Tool.lineWidthFactor,
        },
      });
    }
  };

  const onMouseMove = (event: MouseEvent) => {
    if (role === 'drawer' && tool && tool.isDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      tool.onMouseMove(event);

      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      const rect = canvas.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const normalized = normalizeCoordinates(x, y);

      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_move',
          normX: normalized.x, // Normalize X
          normY: normalized.y, // Normalize Y
          toolType: props.toolType,
          color: colorToSend,
          lineWidth: Tool.lineWidthFactor,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
        },
      });
    }
  };

  const onMouseUp = (event: MouseEvent) => {
    if (role === 'drawer' && tool) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      tool.onMouseUp(event);

      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      const rect = canvas.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const normalized = normalizeCoordinates(x, y);

      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_end',
          normX: normalized.x, // Normalize X
          normY: normalized.y, // Normalize Y
          toolType: props.toolType,
          color: colorToSend,
          lineWidth: Tool.lineWidthFactor,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
        },
      });

      snapshot.add(
        Tool.ctx.getImageData(
          0,
          0,
          Tool.ctx.canvas.width,
          Tool.ctx.canvas.height
        )
      );
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchStart(event);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchMove(event);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchEnd(event);
    }
    snapshot.add(
      Tool.ctx.getImageData(0, 0, Tool.ctx.canvas.width, Tool.ctx.canvas.height)
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);
      canvas.addEventListener('touchstart', onTouchStart);
      canvas.addEventListener('touchmove', onTouchMove);
      canvas.addEventListener('touchend', onTouchEnd);

      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      };
    }
  }, [canvasRef, onMouseDown, onMouseMove, onMouseUp]);

  return (
    <canvas
      className={`w-full h-full ${
        role !== 'drawer' ? 'pointer-events-none' : ''
      }`}
      ref={canvasRef}
    />
  );
};

export default Canvas;
