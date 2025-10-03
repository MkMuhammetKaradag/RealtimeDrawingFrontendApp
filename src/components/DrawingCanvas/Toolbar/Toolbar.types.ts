// src/components/Toolbar/Toolbar.types.ts

import type { Tool } from '../DrawingCanvas.types';

export interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  filled: boolean;
  setFilled: (filled: boolean) => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  exportData: () => void;
  toggleJsonInput: () => void; // JSON input'u göstermek/gizlemek için
  allStrokesCount: number; // Undo butonu için
}
