// src/hooks/useDrawingToolState.ts

import { useState, useCallback, useEffect, useMemo } from 'react';
import Dispatcher from '../util/dispatcher';
import {
  ColorValue,
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../util/toolType';
import type {
  ColorType,
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../util/toolType';
import { CLEAR_EVENT, REDO_EVENT, UNDO_EVENT } from '../util/dispatcher/event';
import type { GameStatus, PlayerRole } from '../types/game.interface';

interface UseDrawingToolStateProps {
  role: PlayerRole;
  gameStatus: GameStatus;
}

const useDrawingToolState = ({
  role,
  gameStatus,
}: UseDrawingToolStateProps) => {
  // 1. STATE'LER
  const [toolType, setToolType] = useState<ToolType>(ToolValue.PEN);
  const [shapeType, setShapeType] = useState<ShapeToolType>(
    ShapeToolValue.LINE
  );
  const [shapeOutlineType, setShapeOutlineType] = useState<ShapeOutlineType>(
    ShapeOutlineValue.SOLID
  );
  const [lineWidthType, setLineWidthType] = useState<LineWidthType>(
    LineWidthValue.THIN
  );
  const [activeColorType, setActiveColorType] = useState<ColorType>(
    ColorValue.MAIN
  );
  const [mainColor, setMainColor] = useState<string>('#000000');
  const [subColor, setSubColor] = useState<string>('#FFFFFF');
  const [dispatcher] = useState(() => new Dispatcher());

  // Debug fonksiyonu
  const logAction = useCallback((action: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      // console.log(`🎨 Çizim Eylemi: ${action}`, details || '');
    }
  }, []);

  // 2. HANDLER'LAR
  const setColor = useCallback(
    (value: string) => {
      if (activeColorType === ColorValue.MAIN) setMainColor(value);
      else setSubColor(value);
      logAction('Renk değiştirildi', { aktif: activeColorType, yeni: value });
    },
    [activeColorType, logAction]
  );

  const swapColors = useCallback(() => {
    setMainColor(subColor);
    setSubColor(mainColor);
    logAction('Renkler değiştirildi', {
      yeniAna: subColor,
      yeniYardimci: mainColor,
    });
  }, [mainColor, subColor, logAction]);

  const handleToolChange = useCallback(
    (newTool: ToolType) => {
      setToolType(newTool);
      logAction('Araç değiştirildi', { yeniAraç: newTool });
    },
    [logAction]
  );

  const handleShapeChange = useCallback(
    (newShape: ShapeToolType) => {
      setToolType(ToolValue.SHAPE);
      setShapeType(newShape);
      logAction('Şekil değiştirildi', { yeniŞekil: newShape });
    },
    [logAction]
  );

  const handleLineWidthChange = useCallback(
    (newWidth: LineWidthType) => {
      setLineWidthType(newWidth);
      logAction('Çizgi kalınlığı değiştirildi', { yeniKalınlık: newWidth });
    },
    [logAction]
  );

  // 3. KLAVYE KISAYOLLARI
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (role !== 'drawer' || gameStatus !== 'started') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            dispatcher.dispatch(e.shiftKey ? REDO_EVENT : UNDO_EVENT);
            break;
          case 'y':
            e.preventDefault();
            dispatcher.dispatch(REDO_EVENT);
            break;
          case 'a':
            e.preventDefault();
            dispatcher.dispatch(CLEAR_EVENT);
            break;
          case 'e':
            e.preventDefault();
            setToolType(ToolValue.ERASER);
            break;
          case 'p':
            e.preventDefault();
            setToolType(ToolValue.PEN);
            break;
        }
      }
      if (e.key === 'Escape') setToolType(ToolValue.PEN);
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        swapColors();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatcher, role, gameStatus, swapColors]);

  // Context değerlerini birleştir
  const contextValues = useMemo(
    () => ({
      toolTypeContextValue: { type: toolType, setType: handleToolChange },
      shapeTypeContextValue: { type: shapeType, setType: handleShapeChange },
      shapeOutlineContextValue: {
        type: shapeOutlineType,
        setType: setShapeOutlineType,
      },
      lineWidthContextValue: {
        type: lineWidthType,
        setType: handleLineWidthChange,
      },
      colorContextValue: {
        mainColor,
        subColor,
        activeColor: activeColorType,
        setColor,
        setActiveColor: setActiveColorType,
        swapColors,
      },
      dispatcherContextValue: { dispatcher },
    }),
    [
      toolType,
      handleToolChange,
      shapeType,
      handleShapeChange,
      shapeOutlineType,
      lineWidthType,
      handleLineWidthChange,
      mainColor,
      subColor,
      activeColorType,
      setColor,
      setActiveColorType,
      swapColors,
      dispatcher,
    ]
  );

  return {
    toolType,
    shapeType,
    shapeOutlineType,
    lineWidthType,
    mainColor,
    subColor,
    dispatcher,
    setColor,
    ...contextValues,
  };
};

export default useDrawingToolState;
