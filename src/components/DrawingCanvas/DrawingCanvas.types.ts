// src/components/DrawingCanvas/DrawingCanvas.types.ts

export interface Point {
  x: number;
  y: number;
}

export type Tool =
  | 'pen'
  | 'eraser'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'bucket';

export interface StrokeData {
  strokeId: string;
  points: Point[];
  color: string;
  size: number;
  filled: boolean;
  tool: Tool;
  isBucketFill?: boolean;
  isGlobalFill?: boolean;
  fillPosition?: Point;
}

export interface RealtimePointPayload {
  type: string;
  point: Point;
  strokeId: string;
  color: string;
  size: number;
  tool: Tool;
  isBucketFill?: boolean;
  fillPosition?: Point;
  // Şekil çizimleri için eklenen proplar
  points?: Point[];
  isGlobalFill?: boolean;
  filled?: boolean;
}
export type PointerEvent =
  | React.MouseEvent<HTMLCanvasElement>
  | React.TouchEvent<HTMLCanvasElement>;
// DrawingCanvas bileşeninin kendi iç prop'ları,
// useDrawingLogic'ten gelenleri alacak şekilde ayarlandı.
export interface DrawingCanvasComponentProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canDraw: boolean;
  startDrawing: (event: PointerEvent) => void;
  stopDrawing: (event: PointerEvent) => void;
  draw: (event: PointerEvent) => void;
  canvasCursor: string;
}
