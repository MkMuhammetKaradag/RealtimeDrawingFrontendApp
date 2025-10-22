import React, { useRef, useEffect, useCallback, useState } from 'react';
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
  animationDuration?: number; // Yeni prop: animasyon süresi (ms)
  autoPlay?: boolean; // Yeni prop: otomatik oynatma
}

const getNormalizedLineWidthFactor = (
  lineWidthType: LineWidthType,
  canvasWidth: number
): number => {
  const baseFactor = LINE_WIDTH_FACTORS[lineWidthType] || 1;
  const referenceWidth = 1200;
  const normalizedFactor = baseFactor * (canvasWidth / referenceWidth);
  return Math.max(0.3, Math.min(normalizedFactor, baseFactor * 1.5));
};

const SimpleMiniCanvas: React.FC<SimpleMiniCanvasProps> = ({
  actions,
  width = 180,
  height = 120,
  roundId,
  className = '',
  animationDuration = 10000, // Default 10 saniye
  autoPlay = true, // Default olarak otomatik oynat
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolRef = useRef<Tool | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animasyon state'leri
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0);

  const [responsiveSize, setResponsiveSize] = React.useState({
    width,
    height,
  });

  // Filtrelenmiş çizim action'ları
  const drawingActions = React.useMemo(
    () =>
      actions.filter(
        (action) =>
          action.function.includes('draw') || action.function === 'canvas_clear'
      ),
    [actions]
  );

  const totalSteps = drawingActions.length;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const calculatedHeight = (containerWidth * 9) / 16;
        setResponsiveSize({
          width: containerWidth,
          height: Math.max(calculatedHeight, 80),
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

  // Çizim fonksiyonu - belirli bir adıma kadar çizer
  const drawUpToStep = useCallback(
    (step: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas'ı temizle
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, actualWidth, actualHeight);

      // İlk step'te sadece temizlik yap
      if (step === 0) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, actualWidth, actualHeight);
        return;
      }

      Tool.ctx = ctx;
      Tool.lineWidthFactor = 1;

      // Belirtilen adıma kadar çiz
      for (let i = 0; i < step; i++) {
        const action = drawingActions[i];
        if (!action) continue;

        // Clear action'ı özel işle
        if (action.function === 'canvas_clear') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, actualWidth, actualHeight);
          continue;
        }

        if (!action.normX || !action.normY) continue;

        const x = action.normX * actualWidth;
        const y = action.normY * actualHeight;

        const originalState = {
          mainColor: Tool.mainColor,
          subColor: Tool.subColor,
          lineWidthFactor: Tool.lineWidthFactor,
        };

        if (action.color) Tool.mainColor = action.color;
        const rect = canvas.getBoundingClientRect();

        if (action.lineWidthType) {
          Tool.lineWidthFactor = getNormalizedLineWidthFactor(
            action.lineWidthType as LineWidthType,
            rect.width
          );
        } else {
          Tool.lineWidthFactor = getNormalizedLineWidthFactor(
            'THIN',
            rect.width
          );
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

            default:
              break;
          }
        } catch (error) {
          console.error('Error drawing action:', error);
        } finally {
          Tool.mainColor = originalState.mainColor;
          Tool.subColor = originalState.subColor;
          Tool.lineWidthFactor = originalState.lineWidthFactor;
        }
      }

      // Debug border
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, actualWidth, actualHeight);
    },
    [
      drawingActions,
      actualWidth,
      actualHeight,
      createToolInstance,
      createDummyMouseEvent,
    ]
  );

  // Animasyon effect'i
  useEffect(() => {
    if (!isPlaying || totalSteps === 0) return;

    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / animationDuration, 1);

      const newStep = Math.floor(newProgress * totalSteps);

      setProgress(newProgress);
      setCurrentStep(newStep);

      if (newProgress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false); // Animasyon tamamlandığında durdur
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, totalSteps, animationDuration]);

  // Adım değiştiğinde çizimi güncelle
  useEffect(() => {
    drawUpToStep(currentStep);
  }, [currentStep, drawUpToStep]);

  // Boyut değiştiğinde çizimi sıfırla ve yeniden başlat
  useEffect(() => {
    setCurrentStep(0);
    setProgress(0);
    if (autoPlay) {
      setIsPlaying(true);
    }
  }, [actualWidth, actualHeight, autoPlay]);

  // Kontrol fonksiyonları
  const play = () => setIsPlaying(true);
  const pause = () => setIsPlaying(false);
  const restart = () => {
    setCurrentStep(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleProgressChange = (newProgress: number) => {
    const newStep = Math.floor(newProgress * totalSteps);
    setProgress(newProgress);
    setCurrentStep(newStep);
    setIsPlaying(false);
  };

  return (
    <div
      ref={containerRef}
      className={`
        relative 
        w-full 
        aspect-video
        max-w-full
        overflow-hidden
        rounded-lg 
        border border-gray-300 
        bg-white 
        shadow-sm
        touch-pan-x touch-pan-y
        ${className}
      `}
      style={{
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
          object-contain
          touch-action: none
        "
        style={{ touchAction: 'none' }}
      />

      {/* Kontroller */}
      <div
        className="
          absolute 
          bottom-0 left-0 right-0
          bg-gradient-to-t from-black/80 to-transparent
          p-3
          flex flex-col gap-2
        "
      >
        {/* Progress bar */}
        {/* <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => handleProgressChange(parseFloat(e.target.value))}
            // Sınıf listesini güncelledik:
            className="
                flex-1 
                h-2               
                 bg-gray-600 
                rounded-lg 
                appearance-none 
                cursor-pointer 
                slider-thumb 
              "
            style={{
              // Ayrıca, track'in tamamlanan kısmını renklendirmek için bir trick ekleyebiliriz (Tailwind'de zor bir stil)
              // Bu, input'un sol tarafını (progress'i) renklendirmeye yarar.
              backgroundSize: `${progress * 100}% 100%`,
              backgroundRepeat: 'no-repeat',
              backgroundImage:
                'linear-gradient(to right, #4f46e5 0%, #4f46e5 100%)', // Mor (indigo-600) bir renklendirme
            }}
          />
          <span className="text-white text-xs min-w-[40px]">
            {Math.round(progress * 100)}%
          </span>
        </div> */}
        {/* Kontrol butonları */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={isPlaying ? pause : play}
              className="
                p-1 
                text-white 
                hover:bg-white/20 
                rounded 
                transition-colors
                flex items-center justify-center
                w-8 h-8
              "
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            <button
              onClick={restart}
              className="
                p-1 
                text-white 
                hover:bg-white/20 
                rounded 
                transition-colors
                flex items-center justify-center
                w-8 h-8
              "
            >
              🔄
            </button>
          </div>

          {/* Bilgi */}
          <div className="text-white text-xs">
            {currentStep}/{totalSteps} işlem
            {roundId && ` • R${roundId}`}
          </div>
        </div>
      </div>

      {/* Oynatma durumu */}
      {!isPlaying && progress > 0 && progress < 1 && (
        <div
          className="
            absolute 
            top-1/2 left-1/2 
            transform -translate-x-1/2 -translate-y-1/2
            bg-black/70 
            text-white 
            px-3 py-2 
            rounded-lg 
            text-sm
            backdrop-blur-sm
          "
        >
          Duraklatıldı
        </div>
      )}
    </div>
  );
};

export default SimpleMiniCanvas;
