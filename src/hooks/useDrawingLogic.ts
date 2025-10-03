// src/hooks/useDrawingLogic.ts

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
} from 'react';
import type {
  Point,
  Tool,
  StrokeData,
  RealtimePointPayload,
  PointerEvent,
} from '../components/DrawingCanvas/DrawingCanvas.types';
import {
  redrawAllStrokes,
  floodFillInternal,
  drawTemporaryShape,
  hexToRgb,
} from '../components/DrawingCanvas/DrawingCanvas.utils';

interface UseDrawingLogicProps {
  canDraw: boolean;
  sendMessage: (data: any) => void;
  remoteDrawingPoint: RealtimePointPayload | null;
}

interface UseDrawingLogicReturn {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  filled: boolean;
  setFilled: (filled: boolean) => void;
  allStrokes: StrokeData[];
  setAllStrokes: React.Dispatch<React.SetStateAction<StrokeData[]>>;
  startDrawing: (event: PointerEvent) => void;
  stopDrawing: (event: PointerEvent) => void;
  draw: (event: PointerEvent) => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  exportData: () => void;
  handleJsonImport: (jsonString: string) => void;
  canvasCursor: string;
}

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 600;

export const useDrawingLogic = ({
  canDraw,
  sendMessage,
  remoteDrawingPoint,
}: UseDrawingLogicProps): UseDrawingLogicReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [allStrokes, setAllStrokes] = useState<StrokeData[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [filled, setFilled] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [activeStrokeId, setActiveStrokeId] = useState<string>('');
  const [lastFillSnapshot, setLastFillSnapshot] = useState<ImageData | null>(
    null
  );

  // Canvas'ı ilk yüklendiğinde ve boyut değiştiğinde ayarla
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Tüm vuruşları yeniden çizme fonksiyonu
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    redrawAllStrokes(
      ctx,
      canvas.width,
      canvas.height,
      allStrokes,
      lastFillSnapshot
    );
  }, [allStrokes, lastFillSnapshot]);

  // allStrokes değiştiğinde canvas'ı yeniden çiz
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Uzak sunucudan gelen noktayı canvas'a ekleme fonksiyonu
  const addRemotePointToCanvas = useCallback(
    (payload: RealtimePointPayload) => {
      let didBucketFillHappen = false; // Yeni bayrak
      setAllStrokes((prevStrokes) => {
        if (payload.isBucketFill && payload.fillPosition) {
          const newFillStroke: StrokeData = {
            strokeId: payload.strokeId,
            points: [],
            color: payload.color,
            size: 1,
            filled: true,
            tool: 'bucket',
            isBucketFill: true,
            fillPosition: payload.fillPosition,
          };
          // const existingBucketFillIndex = prevStrokes.findIndex(
          //   (s) =>
          //     s.tool === 'bucket' &&
          //     s.fillPosition?.x === payload.fillPosition?.x &&
          //     s.fillPosition?.y === payload.fillPosition?.y
          // );
          const existingBucketFillIndex = prevStrokes.findIndex(
            (s) => s.strokeId === payload.strokeId
          );

          if (existingBucketFillIndex !== -1) {
            const updatedStrokes = [...prevStrokes];
            updatedStrokes[existingBucketFillIndex] = newFillStroke;
            didBucketFillHappen = true; // Bayrağı ayarla
            return updatedStrokes;
          } else {
            didBucketFillHappen = true; // Bayrağı ayarla
            return [...prevStrokes, newFillStroke];
          }
        } else if (payload.type === 'shape_draw') {
          // Uzak istemciden gelen şekil çizimini ekle
          const newShapeStroke: StrokeData = {
            strokeId: payload.strokeId,
            points: [payload.point],
            color: payload.color,
            size: payload.size,
            filled: payload.fillPosition ? true : false,
            tool: payload.tool,
          };
          // Eğer zaten bu strokeId'ye sahip bir şekil varsa güncelle, yoksa ekle
          const existingShapeIndex = prevStrokes.findIndex(
            (s) => s.strokeId === payload.strokeId
          );
          if (existingShapeIndex !== -1) {
            const updatedStrokes = [...prevStrokes];
            updatedStrokes[existingShapeIndex] = newShapeStroke;
            return updatedStrokes;
          } else {
            return [...prevStrokes, newShapeStroke];
          }
        } else {
          // Normal çizim noktası ise
          const existingStrokeIndex = prevStrokes.findIndex(
            (s) => s.strokeId === payload.strokeId
          );

          if (existingStrokeIndex !== -1) {
            const newStrokes = [...prevStrokes];
            newStrokes[existingStrokeIndex] = {
              ...newStrokes[existingStrokeIndex],
              points: [
                ...newStrokes[existingStrokeIndex].points,
                payload.point,
              ],
            };
            return newStrokes;
          } else {
            return [
              ...prevStrokes,
              {
                points: [payload.point],
                color: payload.color,
                size: payload.size,
                filled: false,
                tool: payload.tool,
                strokeId: payload.strokeId,
              },
            ];
          }
        }
        // return prevStrokes;
      });
    },
    []
  );

  // remoteDrawingPoint prop'u değiştiğinde addRemotePointToCanvas'ı çağır
  useEffect(() => {
    if (remoteDrawingPoint) {
      console.log('Uzaktan gelen çizim noktası:', remoteDrawingPoint);
      addRemotePointToCanvas(remoteDrawingPoint);
    }
  }, [remoteDrawingPoint, addRemotePointToCanvas]);

  // Kalem/Silgi hareketi sırasında anlık noktaları gönder
  useEffect(() => {
    if (
      activeStrokeId &&
      currentStroke.length > 0 &&
      (tool === 'pen' || tool === 'eraser')
    ) {
      const lastPoint = currentStroke[currentStroke.length - 1];

      const payload: RealtimePointPayload = {
        type: 'draw',
        point: lastPoint,
        strokeId: activeStrokeId,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? size * 2 : size,
        tool: tool === 'eraser' ? 'eraser' : 'pen',
      };
      sendMessage({ type: 'player_move', content: payload });
    }
  }, [currentStroke, activeStrokeId, color, size, tool, sendMessage]);

  const getCanvasCoordinates = (event: PointerEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    // Olayın tipi TouchEvent mi yoksa MouseEvent mi kontrol et
    if ('touches' in event) {
      // Eğer TouchEvent ise, ilk dokunuşun koordinatlarını al
      if (event.touches.length === 0) return null; // Dokunuş yoksa
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      // Eğer MouseEvent ise, doğrudan clientX/Y kullan
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      x: Math.round(clientX - rect.left),
      y: Math.round(clientY - rect.top),
    };
  };

  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const newStrokeId = crypto.randomUUID();

      // Yerel olarak dolguyu uygula
      floodFillInternal(
        ctx,
        canvas.width,
        canvas.height,
        startX,
        startY,
        fillColor
      );
      const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setLastFillSnapshot(snapshot);
      const fillStroke: StrokeData = {
        strokeId: newStrokeId,
        points: [],
        color: fillColor,
        size: 1,
        filled: true,
        tool: 'bucket',
        isBucketFill: true,
        fillPosition: { x: startX, y: startY },
      };

      setAllStrokes((prev) => [...prev, fillStroke]);

      // Diğer istemcilere boya kovası olayını bildir
      const payload: RealtimePointPayload = {
        type: 'draw',
        strokeId: newStrokeId,
        point: { x: startX, y: startY },
        color: fillColor,
        size: 1,
        tool: 'bucket',
        isBucketFill: true,
        fillPosition: { x: startX, y: startY },
      };
      sendMessage({ type: 'player_move', content: payload });
      console.log('Boya Kovası Gönderildi:', payload);
    },
    [sendMessage, setLastFillSnapshot, redraw]
  );

  const startDrawing = (event: PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || !canDraw) return;

    const point = getCanvasCoordinates(event);
    if (!point) return;

    if (tool === 'bucket') {
      redraw();
      floodFill(point.x, point.y, color);
      return;
    }

    const newStrokeId = crypto.randomUUID();
    setActiveStrokeId(newStrokeId);
    setIsDrawing(true);
    setCurrentStroke([]);

    if (tool === 'line' || tool === 'circle' || tool === 'rectangle') {
      setStartPoint(point);
    } else {
      // Pen ve Eraser
      setCurrentStroke([point]);
      const payload: RealtimePointPayload = {
        type: 'draw',
        point: point,
        strokeId: newStrokeId,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? size * 2 : size,
        tool: tool === 'eraser' ? 'eraser' : 'pen',
      };
      sendMessage({ type: 'player_move', content: payload });
    }
  };

  const draw = useCallback(
    (event: PointerEvent) => {
      if (!isDrawing || !canDraw) return;

      const point = getCanvasCoordinates(event);
      if (!point) return;

      if (tool === 'pen' || tool === 'eraser') {
        setCurrentStroke((prev) => [...prev, point]);
        // Gerçek çizim burada yapılmıyor, useEffect içinde gönderilen noktalar ile redraw tetikleniyor.
        // Ancak mousemove sırasında anlık görsel feedback için canvas'a direkt çizebiliriz.
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx) return;

        const drawColor = tool === 'eraser' ? '#FFFFFF' : color;
        const drawSize = tool === 'eraser' ? size * 2 : size;
        const lastPoint =
          currentStroke.length > 0
            ? currentStroke[currentStroke.length - 1]
            : point;

        ctx.strokeStyle = drawColor;
        ctx.lineWidth = drawSize;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        // Eğer startDrawing'de point atılmadıysa, ilk nokta için draw'da nokta çizmek gerek
        if (currentStroke.length === 0) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, drawSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Şekil araçları aynı kalır...
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !startPoint) return;
        drawTemporaryShape(
          ctx,
          startPoint,
          point,
          tool,
          color,
          size,
          filled,
          redraw
        );
      }
    },
    [
      isDrawing,
      canDraw,
      tool,
      startPoint,
      color,
      size,
      filled,
      currentStroke, // Düzeltme için bağımlılık eklendi
      redraw,
    ]
  );

  const stopDrawing = (event: PointerEvent) => {
    if (!isDrawing || !canDraw) return;
    setIsDrawing(false);

    if (tool === 'line' || tool === 'circle' || tool === 'rectangle') {
      if (!startPoint) return;

      const endPoint = getCanvasCoordinates(event);
      if (!endPoint) return;

      let points: Point[] = [];
      switch (tool) {
        case 'line':
          points = [startPoint, endPoint];
          break;
        case 'circle':
          points = [startPoint, endPoint]; // Merkez ve bir nokta
          break;
        case 'rectangle':
          points = [
            startPoint,
            { x: endPoint.x, y: startPoint.y },
            endPoint,
            { x: startPoint.x, y: endPoint.y },
          ];
          break;
      }

      const finalStrokeData: StrokeData = {
        strokeId: activeStrokeId,
        points,
        color,
        size,
        filled,
        tool,
      };

      setAllStrokes((prev) => [...prev, finalStrokeData]);
      setStartPoint(null);
      console.log('Yeni Şekil Vuruşu:', finalStrokeData);

      sendMessage({
        type: 'player_move',
        content: {
          type: 'shape_draw',
          strokeId: activeStrokeId,
          points: points,
          color: color,
          size: size,
          filled: filled,
          tool: tool,
        },
      });
    } else {
      // Pen ve Eraser
      if (currentStroke.length > 0) {
        const finalStrokeData: StrokeData = {
          strokeId: activeStrokeId,
          points: currentStroke,
          color: tool === 'eraser' ? '#FFFFFF' : color,
          size: tool === 'eraser' ? size * 2 : size,
          filled,
          tool,
        };
        setAllStrokes((prev) => [...prev, finalStrokeData]);
        console.log('Yeni Çizim Vuruşu:', finalStrokeData);
      }
    }
    setActiveStrokeId('');
    setCurrentStroke([]);
    redraw(); // Çizimi tamamladıktan sonra son haliyle yeniden çiz
  };

  const clearCanvas = () => {
    setAllStrokes([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    sendMessage({ type: 'clear_canvas' });
  };

  const undoStroke = () => {
    if (allStrokes.length > 0) {
      const lastStroke = allStrokes[allStrokes.length - 1];
      setAllStrokes((prev) => prev.slice(0, -1));
      sendMessage({ type: 'undo_stroke', strokeId: lastStroke.strokeId });
    }
  };

  const exportData = () => {
    const exportableStrokes = allStrokes.map((stroke) => {
      // ImageData'yı dışa aktarmıyoruz
      const { ...exportableStroke } = stroke;
      return exportableStroke;
    });

    const dataStr = JSON.stringify(exportableStrokes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonImport = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data)) {
        // Yeni import edilen stroke'lara yeni bir strokeId atayarak çakışmaları önleyelim
        const importedStrokes = data.map((stroke: StrokeData) => ({
          ...stroke,
          strokeId: crypto.randomUUID(), // Yeni benzersiz ID
        }));
        setAllStrokes((prev) => [...prev, ...importedStrokes]);
      } else {
        alert('JSON verisi bir dizi olmalıdır.');
      }
    } catch (error) {
      alert('JSON parse hatası: ' + error);
      console.error('JSON import error:', error);
    }
  };

  const canvasCursor = canDraw
    ? tool === 'bucket'
      ? 'crosshair'
      : 'crosshair'
    : 'not-allowed';

  return {
    canvasRef,
    tool,
    setTool,
    color,
    setColor,
    size,
    setSize,
    filled,
    setFilled,
    allStrokes,
    setAllStrokes,
    startDrawing,
    stopDrawing,
    draw,
    clearCanvas,
    undoStroke,
    exportData,
    handleJsonImport,
    canvasCursor,
  };
};
