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
// import Snapshot from '../../util/snapshot'; // Snapshot burada kullanılmıyor, Canvas'ta olmalı
import Canvas from '../../components/canvas';
// WebSocketMessage artık GamePage.tsx'ten geliyor. Burada kullanılmıyorsa silinebilir.
// Ancak prop olarak geldiği için interface'i koruyalım.
import type { WebSocketMessage } from '../../hooks/useGameWebSocket';

import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';

/**
 * Bu bileşen, çizim araçlarının ve renklerin durumunu yönetir (State Provider),
 * bu durumu Context API aracılığıyla Toolbar ve Canvas bileşenlerine sağlar.
 */
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
  // Canvas referansı - Paint bileşeninde doğrudan kullanılmıyor, ancak Dispatcher için tutulabilir.
  // Ancak `Canvas` bileşeni kendi `canvasRef`'ini yönettiği için bu kaldırılabilir.
  // const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- ARAC VE AYAR DURUMLARI (STATE) ---
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

  // Tekil (Singleton) nesneler: Dispatcher (Olayları alt bileşenlere dağıtmak için)
  const [dispatcher] = useState(() => new Dispatcher());
  // const [snapshot] = useState(() => new Snapshot()); // Snapshot'ın yönetimi Canvas bileşeninde daha mantıklıdır.

  // --- KULLANILMAYAN VE SİLİNEN DURUMLAR ---
  // const [isDrawing, setIsDrawing] = useState(false); // Kullanılmıyor -> SİLİNDİ
  // const [canDraw] = useState(true); // Kullanılmıyor ve gereksiz -> SİLİNDİ

  // Konsol log fonksiyonu: Debug amaçlı tutulabilir
  const logAction = useCallback((action: string, details?: any) => {
    // console.log(`🎨 Çizim Eylemi: ${action}`, details ? details : ''); // Loglamayı kapat
  }, []);

  // --- RENK VE ARAÇ YÖNETİMİ FONKSİYONLARI ---

  /**
   * Seçili ana veya yardımcı rengi günceller.
   */
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

  /**
   * Ana ve yardımcı renkleri birbiriyle değiştirir (swap).
   */
  const swapColors = useCallback(() => {
    setMainColor(subColor);
    setSubColor(mainColor);
    logAction('Renkler değiştirildi', {
      yeniAna: subColor,
      yeniYardimci: mainColor,
    });
  }, [mainColor, subColor, logAction]);

  /**
   * Ana araç tipini günceller (Kalem, Silgi, Renk Seçici vb.).
   */
  const handleToolChange = useCallback((newTool: ToolType) => {
    setToolType(newTool);
    // logAction detayı gereksiz uzun, kaldırılabilir
  }, []);

  /**
   * Şekil aracını seçer ve şekil tipini günceller.
   */
  const handleShapeChange = useCallback((newShape: ShapeToolType) => {
    // Şekil seçildiğinde otomatik olarak aracı SHAPE olarak ayarla
    setToolType(ToolValue.SHAPE);
    setShapeType(newShape);
    // logAction detayı gereksiz uzun, kaldırılabilir
  }, []);

  /**
   * Çizgi kalınlığını günceller.
   */
  const handleLineWidthChange = useCallback((newWidth: LineWidthType) => {
    setLineWidthType(newWidth);
    // logAction detayı gereksiz uzun, kaldırılabilir
  }, []);

  // --- KULLANILMAYAN FONKSİYONLAR (Sadece Dispatcher'ı tetikledikleri için sildik) ---
  // Bu fonksiyonlar (clearCanvas, undo, redo) doğrudan `Toolbar` bileşeni içinde
  // Dispatcher'ı kullanmalıdır, burada tutulmaları gereksizdir.
  // const clearCanvas = useCallback(() => { dispatcher.dispatch(CLEAR_EVENT); }, [dispatcher]); // SİLİNDİ
  // const undo = useCallback(() => { dispatcher.dispatch(UNDO_EVENT); }, [dispatcher]);         // SİLİNDİ
  // const redo = useCallback(() => { dispatcher.dispatch(REDO_EVENT); }, [dispatcher]);         // SİLİNDİ

  // --- KLAVYE KISAYOLLARI (useEffect) ---
  useEffect(() => {
    // Sadece 'drawer' rolündekilerin kısayolları kullanmasına izin ver
    const handleKeyDown = (e: KeyboardEvent) => {
      if (role !== 'drawer') return;

      if (e.ctrlKey || e.metaKey) {
        // Ctrl veya Cmd tuşuna basılıyorsa
        switch (e.key.toLowerCase()) {
          case 'z': // Geri Al (Ctrl+Z)
            e.preventDefault();
            // Shift ile basıldıysa Redo, aksi halde Undo
            dispatcher.dispatch(e.shiftKey ? REDO_EVENT : UNDO_EVENT);
            break;
          case 'y': // İleri Al (Ctrl+Y)
            e.preventDefault();
            dispatcher.dispatch(REDO_EVENT);
            break;
          case 'a': // Temizle (Ctrl+A)
            e.preventDefault();
            dispatcher.dispatch(CLEAR_EVENT);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    logAction('Klavye kısayolları etkinleştirildi');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatcher, role, logAction]); // Bağımlılıklar: dispatcher ve role

  // --- RENDER (Context Sağlayıcıları ve Düzen) ---

  return (
    // Tüm çizim durumlarını Context API ile alt bileşenlere sağlıyoruz.
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
                  // Ana Çizim Çerçevesi: h-full yaparak dış GamePage container'ının yüksekliğini kullanır
                  <div className="flex flex-col md:flex-row w-full h-full bg-gray-50 rounded-xl shadow-2xl overflow-hidden">
                    {/* 1. TOOLBAR ALANI (SADECE DRAWER İÇİN) */}
                    {role === 'drawer' && (
                      <div className="w-full md:w-auto md:max-w-[200px] flex-shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 shadow-md md:shadow-xl p-2 md:p-4 transition-all duration-300 z-10">
                        {/* Toolbar bileşeni kendi içindeki düğmeleri dikey/yatay olarak yönetmeli */}
                        <Toolbar />
                      </div>
                    )}

                    {/* 2. CANVAS ALANI */}
                    {/* Canvas'ı merkezlemek ve esnek bir alan vermek için flex-grow kullanılır */}
                    <div className="w-full h-full flex-grow flex items-center justify-center relative">
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
                        // setColor (Renk seçici için) Canvas'a prop olarak geçirilmelidir.
                        setColor={setColor}
                        // Diğer dispatcher/snapshot gibi propslar Context'ten alınıyor.
                      />
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
