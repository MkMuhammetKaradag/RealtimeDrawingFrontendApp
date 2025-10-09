import React, {
  type JSX,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
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
import Snapshot from '../../util/snapshot';
import Canvas from '../../components/canvas';
import type { WebSocketMessage } from '../GamePage/useGameWebSocket';
import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';

interface PaintProps {
  role: 'drawer' | 'guesser' | null;
  gameStatus: 'idle' | 'started' | 'ended';
  sendMessage: (data: any) => void;
  roomDrawData: WebSocketMessage | null;
}

const Paint: React.FC<PaintProps> = ({
  role,
  gameStatus,
  sendMessage,
  roomDrawData,
}) => {
  // Canvas referansı
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Çizim durumu
  const [isDrawing, setIsDrawing] = useState(false);
  const [canDraw] = useState(true);

  // Araç ve ayar durumları
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
  const [dispatcher] = useState(new Dispatcher());
  const [snapshot] = useState(new Snapshot());

  // Konsol log fonksiyonu
  const logAction = useCallback((action: string, details?: any) => {
    console.log(`🎨 Çizim Eylemi: ${action}`, details ? details : '');
  }, []);

  // Renk ayarlama fonksiyonu
  const setColor = useCallback(
    (value: string) => {
      if (activeColorType === ColorValue.MAIN) {
        setMainColor(value);
        logAction('Ana renk değiştirildi', { renk: value });
      } else {
        setSubColor(value);
        logAction('Yardımcı renk değiştirildi', { renk: value });
      }
    },
    [activeColorType, logAction]
  );

  // YENİ: Renkleri değiştirme fonksiyonu
  const swapColors = useCallback(() => {
    const temp = mainColor;
    setMainColor(subColor);
    setSubColor(temp);
    logAction('Renkler değiştirildi', {
      yeniAnaRenk: subColor,
      yeniYardimciRenk: mainColor,
    });
  }, [mainColor, subColor, logAction]);

  // Araç tipi değiştirme
  const handleToolChange = useCallback(
    (newTool: ToolType) => {
      setToolType(newTool);
      const toolNames: Record<ToolType, string> = {
        [ToolValue.PEN]: 'Kalem',
        [ToolValue.ERASER]: 'Silgi',
        [ToolValue.COLOR_EXTRACT]: 'Renk Seçici',
        [ToolValue.COLOR_FILL]: 'Renk Doldurucu',
        [ToolValue.SHAPE]: 'Şekil',
        [ToolValue.TEXT]: 'Metin',
        [ToolValue.MAGNIFYING]: 'Büyüteç',
      };
      logAction('Araç değiştirildi', { yeniArac: toolNames[newTool] });
    },
    [logAction]
  );

  // Şekil tipi değiştirme
  const handleShapeChange = useCallback(
    (newShape: ShapeToolType) => {
      setToolType(ToolValue.SHAPE);
      setShapeType(newShape);
      const shapeNames: Record<ShapeToolType, string> = {
        [ShapeToolValue.LINE]: 'Çizgi',
        [ShapeToolValue.RECT]: 'Dikdörtgen',
        [ShapeToolValue.CIRCLE]: 'Daire',
        [ShapeToolValue.TRIANGLE]: 'Üçgen',
        [ShapeToolValue.RHOMBUS]: 'Eşkenar Dörtgen',
        [ShapeToolValue.PENTAGON]: 'Beşgen',
        [ShapeToolValue.SEXANGLE]: 'Altıgen',
        [ShapeToolValue.ARROW_TOP]: 'Yukarı Ok',
        [ShapeToolValue.ARROW_RIGHT]: 'Sağ Ok',
        [ShapeToolValue.ARROW_DOWN]: 'Aşağı Ok',
        [ShapeToolValue.ARROW_LEFT]: 'Sol Ok',
        [ShapeToolValue.FOUR_STAR]: 'Dört Köşeli Yıldız',
      };
      logAction('Şekil değiştirildi', { yeniSekil: shapeNames[newShape] });
    },
    [logAction]
  );

  // Çizgi kalınlığı değiştirme
  const handleLineWidthChange = useCallback(
    (newWidth: LineWidthType) => {
      setLineWidthType(newWidth);
      const widthNames: Record<LineWidthType, string> = {
        [LineWidthValue.THIN]: 'İnce',
        [LineWidthValue.MIDDLE]: 'Orta',
        [LineWidthValue.BOLD]: 'Kalın',
        [LineWidthValue.MAXBOLD]: 'Çok Kalın',
      };
      logAction('Çizgi kalınlığı değiştirildi', {
        yeniKalınlık: widthNames[newWidth],
      });
    },
    [logAction]
  );

  // Canvas temizleme
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Dispatcher'a olay göndermek için bu kod yerine, Canvas.tsx içindeki Dispatcher
    // olayı tetiklenmelidir. Ancak burada yerel temizlik yapmak istiyorsak bu kalabilir.
    // WebSocket mesajı göndermek için:
    dispatcher.dispatch(CLEAR_EVENT);
    logAction('Canvas temizlendi');
  }, [logAction, dispatcher]); // Snapshot'a ekleme Canvas.tsx'e taşındı.

  // Geri alma (Undo)
  const undo = useCallback(() => {
    // Canvas.tsx'e WebSocket mesajı gönderme görevi Canvas'tan yönetildi.
    // Biz burada sadece Dispatcher'ı tetikliyoruz.
    dispatcher.dispatch(UNDO_EVENT);
    logAction('Geri alındı (Undo)');
  }, [logAction, dispatcher]); // Snapshot kullanmak yerine dispatcher kullanıldı.

  // İleri alma (Redo)
  const redo = useCallback(() => {
    // Canvas.tsx'e WebSocket mesajı gönderme görevi Canvas'tan yönetildi.
    // Biz burada sadece Dispatcher'ı tetikliyoruz.
    dispatcher.dispatch(REDO_EVENT);
    logAction('İleri alındı (Redo)');
  }, [logAction, dispatcher]); // Snapshot kullanmak yerine dispatcher kullanıldı.

  // Canvas cursor ayarlama (Gerekli değil, Canvas.tsx içinde yönetiliyor)
  // const getCanvasCursor = useCallback(() => { ... }, [toolType]);

  // Canvas başlatma ve klavye kısayolları
  useEffect(() => {
    // Canvas.tsx'te boyut ve ilk arka plan zaten sabit 800x500 olarak ayarlandığı için
    // buradaki boyut ayarlama ve ilk snapshot kodu kaldırılabilir/yoruma alınabilir.
    // Ancak Canvas.tsx'teki useEffect içinde `canvasRef` kullanılmadığı için
    // bu CanvasRef'in burada kalması bir problem teşkil etmez.

    // Klavye kısayolları (Dispatcher'ı tetiklemesi için güncellendi)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (role !== 'drawer') return; // Sadece çizen çizebilir/undo/redo yapabilir

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              dispatcher.dispatch(REDO_EVENT);
            } else {
              dispatcher.dispatch(UNDO_EVENT);
            }
            break;
          case 'y':
            e.preventDefault();
            dispatcher.dispatch(REDO_EVENT);
            break;
          case 'a':
            e.preventDefault();
            dispatcher.dispatch(CLEAR_EVENT);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    logAction('Uygulama başlatıldı', {
      klavyeKisayollari: {
        'Ctrl+Z': 'Geri Al',
        'Ctrl+Shift+Z': 'İleri Al',
        'Ctrl+Y': 'İleri Al',
        'Ctrl+A': 'Temizle',
      },
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [logAction, dispatcher, role]); // Bağımlılıklar güncellendi

  return (
    <ToolTypeContext.Provider
      value={{ type: toolType, setType: handleToolChange }}
    >
      <ShapeTypeContext.Provider
        value={{
          type: shapeType,
          setType: handleShapeChange,
        }}
      >
        <ShapeOutlineContext.Provider
          value={{ type: shapeOutlineType, setType: setShapeOutlineType }}
        >
          <LineWidthContext.Provider
            value={{ type: lineWidthType, setType: handleLineWidthChange }}
          >
            <DispatcherContext.Provider value={{ dispatcher }}>
              <ColorContext.Provider
                value={{
                  mainColor,
                  subColor,
                  activeColor: activeColorType,
                  setColor,
                  setActiveColor: setActiveColorType,
                  swapColors,
                }}
              >
                {/* OYUN BAŞLADIĞINDA ÇİZİM ALANINI GÖSTER */}
                {gameStatus === 'started' && (
                  // 💡 KRİTİK DÜZENLEME: RESPONSIVE ÇERÇEVE
                  // Mobil: flex-col-reverse (Toolbar alta) | Masaüstü (md:): flex-row (Toolbar sola)

                  <div className="flex  md:flex-row w-full max-w-full h-full min-h-[50vh] md:min-h-[70vh] bg-gray-50 rounded-lg shadow-xl">
                    {/* 1. TOOLBAR ALANI (SADECE DRAWER İÇİN) */}
                    {role === 'drawer' && (
                      // Masaüstü: Sabit genişlik (max-w-xs), Kalın gölge
                      // Mobil: Tam genişlik, Yatay kaydırma
                      <div className="w-full  md:w-auto md:max-w-[200px] flex-shrink-0 bg-gray-100 md:bg-white border-t md:border-t-0 md:border-r border-gray-200 shadow-lg md:shadow-xl p-2 md:p-4 transition-all duration-300">
                        {/* Toolbar'ın kendisi dikey/yatay düzeni yönetmeli */}
                        <Toolbar />
                      </div>
                    )}

                    {/* 2. CANVAS ALANI */}
                    {/* flex-grow: Kalan tüm alanı kaplar */}
                    <div className="flex-grow flex items-center bg-red-200 justify-center overflow-auto">
                      {/* KRİTİK DÜZENLEME: max-w-4xl ve max-h-4xl sınırlamaları kaldırıldı. */}{' '}
                      <div className="w-full cur h-full  bg-yellow-100 flex items-center justify-center">
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
