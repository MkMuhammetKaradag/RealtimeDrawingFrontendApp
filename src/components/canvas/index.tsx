import React, {
  useRef,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import type { FC } from 'react';

// Orijinal tiplerin ve Context'lerin import edildiği varsayılır
import type {
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';

import Snapshot from '../../util/snapshot';
import { getCanvasCursorStyle } from '../../util/cursor/iconToCursor';

// Custom Hook'lar
import { useCanvasSetup } from '../../hooks/useCanvasSetup';
import { useCanvasStateAndTools } from '../../hooks/useCanvasStateAndTools';
import { useCanvasDrawing } from '../../hooks/useCanvasDrawing';
import { useCanvasCoreActions } from '../../hooks/useCanvasCoreActions';
import { useRemoteSync } from '../../hooks/useRemoteSync';
import { useDispatcherEvents } from '../../hooks/useDispatcherEvents';
import type { PlayerRole } from '../../types/game.interface';

// Interfaces (Aynı kalır)
interface CanvasProps {
  // ... (Orijinal CanvasProps buraya gelir)
  sendMessage: (data: any) => void;
  role: PlayerRole;
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
    sendMessage,
  } = props;

  // Refs & State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snapshot] = useState(() => new Snapshot());

  // Utility Hook: Dummy Event Oluşturma
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

  // Hook'lar
  const { dprRef } = useCanvasSetup({ canvasRef, snapshot, role });
  const { toolRef } = useCanvasStateAndTools({
    canvasRef,
    toolType,
    shapeType,
    shapeOutlineType,
    lineWidthType,
    mainColor,
    subColor,
    setColor,
  });

  // Çizim aksiyonlarını gönderme fonksiyonu, CoreActions'a bağımlı olduğu için
  // Drawing hook'unun içindeki sendDrawMessage'i kullanabiliriz.
  // Bağımlılık döngüsünü engellemek için tüm fonksiyonaliteyi tek bir yerde toplayın.
  const { isDrawingRef, sendDrawMessage } = useCanvasDrawing({
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
  });

  const { clearCanvas, handleUndo, handleRedo } = useCanvasCoreActions({
    toolType,
    snapshot,
    sendDrawMessage: (action: string) => sendDrawMessage(action),
  });

  useRemoteSync({
    roomDrawData,
    canvasRef,
    dprRef,
    snapshot,
    clearCanvas,
    handleUndo,
    handleRedo,
    createDummyMouseEvent,
  });

  useDispatcherEvents(
    useMemo(
      () => ({ clearCanvas, handleUndo, handleRedo }),
      [clearCanvas, handleUndo, handleRedo]
    )
  );

  // Cursor Style (Aynı kalır)
  const cursorStyle = useMemo(() => {
    return getCanvasCursorStyle(toolType, mainColor, subColor);
  }, [toolType, mainColor, subColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full min-h-80 ${
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
