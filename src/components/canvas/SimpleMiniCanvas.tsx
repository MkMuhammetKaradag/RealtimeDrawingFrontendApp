import React, { useRef, useEffect, useCallback } from 'react';
import type { ParsedAction } from '../../pages/paint';
import { Tool } from '../../util/tool';
import { Pen, Eraser, ColorFill } from '../../util/tool';
import Shape from '../../util/tool/shape';
import { LINE_WIDTH_FACTORS } from '.';
import type { LineWidthType } from '../../util/toolType';

interface SimpleMiniCanvasProps {
  actions: ParsedAction[];
  width?: number;
  height?: number;
  roundId?: string | number;
  className?: string;
}

// Ana canvas'taki line width factors - aynısını kullanıyoruz

// Line width type için type tanımı

// Ana canvas'taki normalize fonksiyonunun mini canvas versiyonu
const getNormalizedLineWidthFactor = (
  lineWidthType: LineWidthType,
  canvasWidth: number
): number => {
  const baseFactor = LINE_WIDTH_FACTORS[lineWidthType] || 1;
  // Mini canvas için reference width daha küçük - ana canvas 1200 iken bu 400
  const referenceWidth = 1200;
  const normalizedFactor = baseFactor * (canvasWidth / referenceWidth);

  // Mini canvas için minimum ve maximum değerleri ayarla
  return Math.max(0.3, Math.min(normalizedFactor, baseFactor * 1.5));
};

const SimpleMiniCanvas: React.FC<SimpleMiniCanvasProps> = ({
  actions,
  width = 180,
  height = 120,
  roundId,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef<Tool | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive width ve height için state
  const [responsiveSize, setResponsiveSize] = React.useState({
    width,
    height,
  });

  // Container boyutuna göre responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Aspect ratio'yu koruyarak height hesapla (16:9 oranı)
        const calculatedHeight = (containerWidth * 9) / 16;

        setResponsiveSize({
          width: containerWidth,
          height: Math.max(calculatedHeight, 80), // Minimum height
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  const actualWidth = responsiveSize.width;
  const actualHeight = responsiveSize.height;

  // Ana canvas'daki createDummyMouseEvent benzeri
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

  // Tool instance oluşturma - ana canvas'daki gibi
  const createToolInstance = useCallback(
    (action: ParsedAction): Tool | null => {
      switch (action.toolType) {
        case 'PEN':
          return new Pen();
        case 'ERASER':
          return new Eraser();
        case 'COLOR_FILL':
          return new ColorFill();
        case 'SHAPE': {
          const isDashed = action.shapeOutlineType === 'DOTTED';
          if (!action.shapeType) return null;
          return new Shape(action.shapeType as any, isDashed);
        }
        default:
          return null;
      }
    },
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ✅ CANVAS'I HER ACTIONS DEĞİŞİMİNDE SIFIRLA
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, actualWidth, actualHeight);

    // Tool context'ini ayarla
    Tool.ctx = ctx;

    // Mini canvas için line width factor - daha küçük değerler
    Tool.lineWidthFactor = 1;

    // Her action'ı ana canvas'daki gibi işle
    actions.forEach((action) => {
      if (!action.normX || !action.normY) return;

      const x = action.normX * actualWidth;
      const y = action.normY * actualHeight;

      // Orijinal state'i sakla
      const originalState = {
        mainColor: Tool.mainColor,
        subColor: Tool.subColor,
        lineWidthFactor: Tool.lineWidthFactor,
      };

      // Gelen action'ın özelliklerini uygula
      if (action.color) Tool.mainColor = action.color;
      const rect = canvas.getBoundingClientRect();
      // ✅ ÇİZGİ KALINLIĞINI NORMALİZE ET
      if (action.lineWidthType) {
        // lineWidthType varsa onu kullan
        Tool.lineWidthFactor = getNormalizedLineWidthFactor(
          action.lineWidthType as LineWidthType,
          rect.width
        );
      } else {
        // Hiçbiri yoksa default thin
        Tool.lineWidthFactor = getNormalizedLineWidthFactor('THIN', rect.width);
      }

      try {
        const dummyEvent = createDummyMouseEvent(x, y, action.function);

        switch (action.function) {
          case 'draw_start':
            toolRef.current = createToolInstance(action);
            if (toolRef.current) {
              toolRef.current.onMouseDown(dummyEvent);
            }
            break;

          case 'draw_move':
            if (toolRef.current) {
              toolRef.current.onMouseMove(dummyEvent);
            }
            break;

          case 'draw_end':
            if (toolRef.current) {
              toolRef.current.onMouseUp(dummyEvent);
              toolRef.current = null;
            }
            break;

          case 'canvas_clear':
            // Clear işlemi zaten yukarıda yapıldı
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, actualWidth, actualHeight);
            break;

          default:
            break;
        }
      } catch (error) {
        console.error('Error drawing action:', error);
      } finally {
        // Orijinal state'i geri yükle
        Tool.mainColor = originalState.mainColor;
        Tool.subColor = originalState.subColor;
        Tool.lineWidthFactor = originalState.lineWidthFactor;
      }
    });

    // Debug border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, actualWidth, actualHeight);
  }, [
    actions,
    actualWidth,
    actualHeight,
    roundId,
    createToolInstance,
    createDummyMouseEvent,
  ]);

  return (
    <div
      ref={containerRef}
      className={`
        relative 
        w-full 
        aspect-video // 16:9 aspect ratio - Tailwind'in built-in class'ı
        max-w-full // Mobilde taşmayı engelle
        overflow-hidden // Taşan içeriği kes
        rounded-lg 
        border border-gray-300 
        bg-white 
        shadow-sm
        touch-pan-x touch-pan-y // Touch gesture desteği
        ${className}
      `}
      style={{
        // Custom width varsa uygula, yoksa responsive olsun
        maxWidth: width !== 180 ? `${width}px` : undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        width={actualWidth}
        height={actualHeight}
        className="
          w-full 
          h-full 
          object-contain // Resmi oranlı şekilde sığdır
          touch-action: none // Tailwind v3.4+ için touch-action kontrolü
        "
        // Eski Tailwind versiyonları için inline style
        style={{ touchAction: 'none' }}
      />

      {/* İşlem sayısı */}
      <div
        className="
        absolute 
        bottom-2 right-2 
        text-xs 
        text-gray-600 
        bg-white/90 
        backdrop-blur-sm
        px-2 py-1 
        rounded-md 
        border border-gray-200
        shadow-sm
      "
      >
        {actions.filter((a) => a.function.includes('draw')).length} işlem
        {roundId && ` • R${roundId}`}
      </div>

      {/* Mobil hint - sadece mobilde göster */}
      <div
        className="
        absolute 
        top-2 left-2 
        text-xs 
        text-gray-500 
        bg-white/90 
        backdrop-blur-sm
        px-2 py-1 
        rounded-md 
        border border-gray-200
        shadow-sm
        md:hidden // Medium ve üstü ekranlarda gizle
        flex items-center gap-1
      "
      >
        <span>📱</span>
        <span>Pinch to zoom</span>
      </div>
    </div>
  );
};

export default SimpleMiniCanvas;
