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

interface PaintProps {
  role: 'drawer' | 'guesser' | null;
  gameStatus: 'idle' | 'started' | 'ended';
  sendMessage: (data: any) => void;
}

const Paint: React.FC<PaintProps> = ({ role, gameStatus, sendMessage }) => {
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
    // console.log(`🎨 Çizim Eylemi: ${action}`, details ? details : '');
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

  // Çizim başlatma
  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!canDraw) return;

      setIsDrawing(true);
      logAction('Çizim başlatıldı');

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [canDraw, logAction]
  );

  // Çizim durdurma
  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      logAction('Çizim durduruldu');

      // Çizim bittiğinde snapshot'a kaydet
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
      }
    }
  }, [isDrawing, logAction, snapshot]);

  // Çizim yapma
  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (!isDrawing || !canDraw) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Çizim ayarları
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = mainColor;

      // Çizgi kalınlığı ayarlama
      const lineWidths: Record<LineWidthType, number> = {
        [LineWidthValue.THIN]: 2,
        [LineWidthValue.MIDDLE]: 4,
        [LineWidthValue.BOLD]: 8,
        [LineWidthValue.MAXBOLD]: 12,
      };
      ctx.lineWidth = lineWidths[lineWidthType] || 2;

      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, canDraw, mainColor, lineWidthType]
  );

  // Canvas temizleme
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Snapshot'a ekle
    snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
    logAction('Canvas temizlendi');
  }, [snapshot, logAction]);

  // Geri alma (Undo)
  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = snapshot.back();
    if (imageData) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
      logAction('Geri alındı (Undo)');
    } else {
      logAction('Geri alınamadı - geçmiş yok');
    }
  }, [snapshot, logAction]);

  // İleri alma (Redo)
  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = snapshot.forward();
    if (imageData) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imageData, 0, 0);
      logAction('İleri alındı (Redo)');
    } else {
      logAction('İleri alınamadı - gelecek yok');
    }
  }, [snapshot, logAction]);

  // Canvas cursor ayarlama
  const getCanvasCursor = useCallback(() => {
    const cursors: Record<ToolType, string> = {
      [ToolValue.PEN]: 'crosshair',
      [ToolValue.ERASER]: 'grab',
      [ToolValue.COLOR_EXTRACT]: 'crosshair',
      [ToolValue.COLOR_FILL]: 'crosshair',
      [ToolValue.SHAPE]: 'crosshair',
      [ToolValue.TEXT]: 'text',
      [ToolValue.MAGNIFYING]: 'zoom-in',
    };
    return cursors[toolType] || 'crosshair';
  }, [toolType]);

  // Canvas başlatma ve klavye kısayolları
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Canvas boyutlarını ayarla
      canvas.width = 800;
      canvas.height = 500;

      // Beyaz arka plan
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    }

    // Klavye kısayolları
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 'a':
            e.preventDefault();
            clearCanvas();
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
  }, [snapshot, logAction, undo, redo, clearCanvas]);

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
                {gameStatus !== 'started' && (
                  <div className="max-h-screen h-full">
                    {role !== 'drawer' && <Toolbar />}

                    <Canvas
                      role={'drawer'}
                      toolType={toolType}
                      shapeType={shapeType}
                      shapeOutlineType={shapeOutlineType}
                      mainColor={mainColor}
                      subColor={subColor}
                      lineWidthType={lineWidthType}
                      setColor={setColor}
                    />
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
