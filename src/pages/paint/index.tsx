import React, { useState, useCallback, useEffect } from 'react';
import Toolbar from '../../components/toolBar';
import {
  ToolTypeContext,
  ShapeTypeContext,
  ShapeOutlineContext,
  LineWidthContext,
  ColorContext,
  DispatcherContext,
} from '../../context';
import type {
  ColorType,
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';
import {
  ColorValue,
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../../util/toolType';
import Dispatcher from '../../util/dispatcher';
import Canvas from '../../components/canvas';
import type { WebSocketMessage } from '../../hooks/useGameWebSocket';
import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';

interface PaintProps {
  role: 'drawer' | 'guesser' | null;
  gameStatus: 'idle' | 'started' | 'ended' | 'waiting';
  sendMessage: (data: any) => void;
  roomDrawData: WebSocketMessage | null;
}

const Paint: React.FC<PaintProps> = ({
  role,
  gameStatus,
  sendMessage,
  roomDrawData,
}) => {
  // State'ler
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

  // Dispatcher
  const [dispatcher] = useState(() => new Dispatcher());

  // Debug fonksiyonu
  const logAction = useCallback((action: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 Çizim Eylemi: ${action}`, details || '');
    }
  }, []);

  // Renk ve araç yönetimi fonksiyonları
  const setColor = useCallback(
    (value: string) => {
      if (activeColorType === ColorValue.MAIN) {
        setMainColor(value);
      } else {
        setSubColor(value);
      }
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

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sadece drawer rolündekiler ve oyun devam ederken kısayolları kullanabilsin
      if (role !== 'drawer' || gameStatus !== 'started') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            dispatcher.dispatch(e.shiftKey ? REDO_EVENT : UNDO_EVENT);
            logAction('Kısayol: ' + (e.shiftKey ? 'Redo' : 'Undo'));
            break;
          case 'y':
            e.preventDefault();
            dispatcher.dispatch(REDO_EVENT);
            logAction('Kısayol: Redo');
            break;
          case 'a':
            e.preventDefault();
            dispatcher.dispatch(CLEAR_EVENT);
            logAction('Kısayol: Clear');
            break;
          case 'e':
            e.preventDefault();
            setToolType(ToolValue.ERASER);
            logAction('Kısayol: Silgi');
            break;
          case 'p':
            e.preventDefault();
            setToolType(ToolValue.PEN);
            logAction('Kısayol: Kalem');
            break;
        }
      }

      // Basit kısayollar (Ctrl gerektirmeyen)
      switch (e.key) {
        case 'Escape':
          setToolType(ToolValue.PEN);
          logAction('Kısayol: Escape - Kalem modu');
          break;
        case ' ':
          // Boşluk tuşu - Renk değiştirme
          if (e.target === document.body) {
            e.preventDefault();
            swapColors();
            logAction('Kısayol: Boşluk - Renk değiştir');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatcher, role, gameStatus, swapColors, logAction]);

  // Oyun durumu değişikliklerini takip et
  useEffect(() => {
    if (gameStatus === 'started' && role === 'drawer') {
      logAction('Çizim modu aktif', { rol: role });
    } else if (gameStatus === 'ended') {
      logAction('Oyun bitti, çizim devre dışı');
    }
  }, [gameStatus, role, logAction]);

  // WebSocket verilerini takip et (debug için)
  useEffect(() => {
    if (roomDrawData && process.env.NODE_ENV === 'development') {
      logAction('WebSocket verisi alındı', roomDrawData);
    }
  }, [roomDrawData, logAction]);

  // Context değerleri
  const toolTypeContextValue = {
    type: toolType,
    setType: handleToolChange,
  };

  const shapeTypeContextValue = {
    type: shapeType,
    setType: handleShapeChange,
  };

  const shapeOutlineContextValue = {
    type: shapeOutlineType,
    setType: setShapeOutlineType,
  };

  const lineWidthContextValue = {
    type: lineWidthType,
    setType: handleLineWidthChange,
  };

  const colorContextValue = {
    mainColor,
    subColor,
    activeColor: activeColorType,
    setColor,
    setActiveColor: setActiveColorType,
    swapColors,
  };

  const dispatcherContextValue = { dispatcher };

  return (
    <ToolTypeContext.Provider value={toolTypeContextValue}>
      <ShapeTypeContext.Provider value={shapeTypeContextValue}>
        <ShapeOutlineContext.Provider value={shapeOutlineContextValue}>
          <LineWidthContext.Provider value={lineWidthContextValue}>
            <DispatcherContext.Provider value={dispatcherContextValue}>
              <ColorContext.Provider value={colorContextValue}>
                {gameStatus === 'started' && (
                  <div className="flex flex-col md:flex-row w-full h-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-600">
                    {/* Toolbar - Sadece drawer için ve mobilde daha kompakt */}
                    {role === 'drawer' && (
                      <div className="w-full md:w-48 lg:w-56 flex-shrink-0 bg-gray-700/80 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-600 shadow-lg p-3 md:p-4 transition-all duration-300 z-10">
                        <div className="flex flex-col gap-3 md:gap-4">
                          <Toolbar />
                          {/* Kısayol bilgisi - sadece masaüstünde */}
                          <div className="hidden md:block mt-4 pt-4 border-t border-gray-600">
                            <p className="text-xs text-gray-400 mb-2">
                              Kısayollar:
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Ctrl+Z: Geri Al</div>
                              <div>Ctrl+Y: İleri Al</div>
                              <div>Ctrl+A: Temizle</div>
                              <div>Esc: Kalem</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Canvas Alanı */}
                    <div className="flex-1 flex items-center justify-center relative   sm:min-h-0  min-h-80   üstü ve altı   bg-gray-900/50">
                      <Canvas
                        sendMessage={sendMessage}
                        roomDrawData={roomDrawData}
                        role={role}
                        toolType={toolType}
                        shapeType={shapeType}
                        shapeOutlineType={shapeOutlineType}
                        mainColor={mainColor}
                        subColor={subColor}
                        lineWidthType={lineWidthType}
                        setColor={setColor}
                      />
                    </div>
                  </div>
                )}

                {/* Oyun başlamadığında veya beklerken */}
                {(gameStatus === 'idle' || gameStatus === 'waiting') && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
                    <div className="text-center p-8">
                      <div className="text-6xl mb-4">
                        {gameStatus === 'idle' ? '🎮' : '⏳'}
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">
                        {gameStatus === 'idle'
                          ? 'Oyun Başlamadı'
                          : 'Yeni Tur Başlıyor...'}
                      </h3>
                      <p className="text-gray-400">
                        {gameStatus === 'idle'
                          ? 'Oyun başlamasını bekleyin...'
                          : 'Hazırlanın, tur başlamak üzere!'}
                      </p>
                    </div>
                  </div>
                )}
              </ColorContext.Provider>
            </DispatcherContext.Provider>
          </LineWidthContext.Provider>
        </ShapeOutlineContext.Provider>
      </ShapeTypeContext.Provider>
    </ToolTypeContext.Provider>
  );
};

export default Paint;
