import { useCallback, useEffect, useRef } from 'react';
import { ColorExtract, ColorFill, Eraser, Pen, Tool } from '../util/tool';
import Shape from '../util/tool/shape';
import {
  ShapeOutlineValue,
  ToolValue,
  type LineWidthType,
  type ShapeOutlineType,
  type ShapeToolType,
  type ToolType,
} from '../util/toolType';
import { getNormalizedLineWidthFactor } from '../util/utils';

interface UseCanvasStateProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  toolType: ToolType;
  shapeType: ShapeToolType;
  shapeOutlineType: ShapeOutlineType;
  lineWidthType: LineWidthType;
  mainColor: string;
  subColor: string;
  setColor: (value: string) => void;
}

export const useCanvasStateAndTools = ({
  canvasRef,
  toolType,
  shapeType,
  shapeOutlineType,
  lineWidthType,
  mainColor,
  subColor,
  setColor,
}: UseCanvasStateProps) => {
  const toolRef = useRef<Tool | null>(null);

  const createToolInstance = useCallback((): Tool | null => {
    switch (toolType) {
      // ... (Orijinal createToolInstance mantığı buraya gelir)
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
        return null;
    }
  }, [toolType, shapeType, shapeOutlineType, setColor]);

  // Tool instance oluşturma ve özelliklerini güncelleme
  useEffect(() => {
    const newTool = createToolInstance();
    if (newTool) {
      toolRef.current = newTool;
    }

    const canvas = canvasRef.current;
    if (canvas && Tool.ctx) {
      const rect = canvas.getBoundingClientRect();
      const normalizedLineWidth = getNormalizedLineWidthFactor(
        lineWidthType,
        rect.width
      );

      // Tool özelliklerini güncelle
      Tool.lineWidthFactor = normalizedLineWidth;
      Tool.mainColor = mainColor;
      Tool.subColor = subColor;
    }
  }, [
    toolType,
    shapeType,
    shapeOutlineType,
    lineWidthType,
    mainColor,
    subColor,
    createToolInstance,
    canvasRef,
  ]);

  // Çizgi kalınlığı değişiminde tool özelliklerini güncelle (ayrı bir useEffect daha temizdir)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && Tool.ctx) {
      const rect = canvas.getBoundingClientRect();
      const normalizedLineWidth = getNormalizedLineWidthFactor(
        lineWidthType,
        rect.width
      );
      Tool.lineWidthFactor = normalizedLineWidth;
    }
  }, [lineWidthType, canvasRef]);

  // Renk değişiminde tool özelliklerini güncelle
  useEffect(() => {
    if (Tool.ctx) {
      Tool.mainColor = mainColor;
      Tool.subColor = subColor;
    }
  }, [mainColor, subColor]);

  return { toolRef };
};
