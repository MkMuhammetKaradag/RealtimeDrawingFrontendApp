import { useCallback } from 'react';

import Snapshot from '../util/snapshot';
import { logCanvasClear, logCanvasUndo, logCanvasRedo } from '../util/logger';
import { Tool } from '../util/tool';
import type { ToolType } from '../util/toolType';

interface UseCanvasCoreActionsProps {
  toolType: ToolType;
  snapshot: Snapshot;
  sendDrawMessage: (action: string) => void;
}

export const useCanvasCoreActions = ({
  toolType,
  snapshot,
  sendDrawMessage,
}: UseCanvasCoreActionsProps) => {
  const clearCanvas = useCallback(() => {
    const ctx = Tool.ctx;
    if (!ctx) return;

    // ... (Orijinal clearCanvas mantığı buraya gelir)
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

    // ... (Orijinal handleUndo mantığı buraya gelir)
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

    // ... (Orijinal handleRedo mantığı buraya gelir)
    const imageData = snapshot.forward();
    if (imageData) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.putImageData(imageData, 0, 0);
      logCanvasRedo(toolType);
      sendDrawMessage('canvas_Redo');
    }
  }, [toolType, sendDrawMessage, snapshot]);

  return { clearCanvas, handleUndo, handleRedo };
};
