import React from 'react';

import { useEffect } from 'react';
import { useRef } from 'react';
import type {
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';
import {
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../../util/toolType';
import type { FC } from 'react';
import { useState } from 'react';
import { Pen, Tool, Eraser, ColorExtract, ColorFill } from '../../util/tool';
import Shape from '../../util/tool/shape';
import { useContext } from 'react';
import { DispatcherContext } from '../../context';
import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';
import Snapshot from '../../util/snapshot';
import {
  logCanvasClear,
  logCanvasUndo,
  logCanvasRedo,
  logCanvasResize,
} from '../../util/logger';

// Canvas bileşeninin alacağı (prop) türleri tanımlanıyor.
interface CanvasProps {
  role: 'drawer' | 'guesser' | null; // Kullanıcının oyundaki rolü (Çizen/Tahmin Eden)
  toolType: ToolType; // Seçili aracın türü (Kalem, Silgi vb.)
  shapeType: ShapeToolType; // Seçili şekil türü
  shapeOutlineType: ShapeOutlineType; // Şekil kontür tipi (Düz, Noktalı)
  lineWidthType: LineWidthType; // Çizgi kalınlığı tipi
  mainColor: string; // Ana çizim rengi
  subColor: string; // İkincil renk
  setColor: (value: string) => void; // Renk seçici aracı için renk ayarlama fonksiyonu
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
  } = props;

  // Şu anda kullanılan çizim aracının (Pen, Eraser, Shape vb.) state'i
  const [tool, setTool] = useState<Tool>();

  // Canvas DOM elementine erişmek için kullanılan React referansı
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Olayları (Event) yönetmek için Dispatcher Context'ten alınıyor.
  const dispatcherContext = useContext(DispatcherContext);

  // Geri al/Yinele (Undo/Redo) işlemleri için Canvas'ın anlık görüntülerini tutan Snapshot sınıfı
  const [snapshot] = useState(new Snapshot());

  // Seçili araç (toolType) değiştiğinde yeni aracı (Pen, Eraser, Shape vb.) ayarlayan useEffect.
  useEffect(() => {
    switch (toolType) {
      case ToolValue.PEN:
        setTool(new Pen());
        break;
      case ToolValue.ERASER:
        setTool(new Eraser());
        break;
      case ToolValue.COLOR_EXTRACT:
        setTool(new ColorExtract(setColor)); // Renk seçici aracı
        break;
      case ToolValue.COLOR_FILL:
        setTool(new ColorFill()); // Kova (doldurma) aracı
        break;
      case ToolValue.SHAPE:
        // Şekil aracı seçildiğinde, noktalı kontür ayarı yapılıyor.
        setTool(
          new Shape(shapeType, shapeOutlineType === ShapeOutlineValue.DOTTED)
        );
        break;
      default:
        break;
    }
  }, [toolType, shapeType]); // toolType veya shapeType değiştiğinde tetiklenir.

  // Şekil kontür tipi (noktalı/düz) değiştiğinde Shape aracını günceller.
  useEffect(() => {
    if (tool instanceof Shape) {
      tool.isDashed = shapeOutlineType === ShapeOutlineValue.DOTTED;
    }
  }, [shapeOutlineType]); // shapeOutlineType değiştiğinde tetiklenir.

  // Çizgi kalınlığı tipi (lineWidthType) değiştiğinde Tool sınıfındaki global çarpanı ayarlar.
  useEffect(() => {
    switch (lineWidthType) {
      case LineWidthValue.THIN:
        Tool.lineWidthFactor = 1;
        break;
      case LineWidthValue.MIDDLE:
        Tool.lineWidthFactor = 2;
        break;
      case LineWidthValue.BOLD:
        Tool.lineWidthFactor = 3;
        break;
      case LineWidthValue.MAXBOLD:
        Tool.lineWidthFactor = 4;
        break;
      default:
        break;
    }
  }, [lineWidthType]); // lineWidthType değiştiğinde tetiklenir.

  // Ana renk (mainColor) değiştiğinde Tool sınıfındaki global rengi günceller.
  useEffect(() => {
    Tool.mainColor = mainColor;
  }, [mainColor]);

  // İkincil renk (subColor) değiştiğinde Tool sınıfındaki global ikincil rengi günceller.
  useEffect(() => {
    Tool.subColor = subColor;
  }, [subColor]);

  // Canvas'ın ilk kurulumu, olay dinleyicilerinin kaydı ve boyutlandırma
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Canvas elementinin boyutlarını CSS boyutlarına göre ayarlar (çözünürlük)
      canvas.height = canvas.clientHeight;
      canvas.width = canvas.clientWidth;

      // 2D çizim bağlamını (context) Tool sınıfına global olarak atar.
      Tool.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      // Canvas'ı ilk başta beyaz ile doldurur (Renk çıkarmanın doğru çalışması için gereklidir).
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Başlangıç durumunu Snapshot'a kaydeder (Undo için ilk durum).
        snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }

      // --- Dispatcher Olay Kayıtları ---
      const dispatcher = dispatcherContext.dispatcher;

      // Canvas temizleme olayını kaydeder (CLEAR_EVENT).
      const callback = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          logCanvasClear(toolType); // Log kaydı
        }
      };
      dispatcher.on(CLEAR_EVENT, callback);

      // Canvas yineleme (Redo) olayını kaydeder (REDO_EVENT).
      const forward = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.forward();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasRedo(toolType); // Log kaydı
          }
        }
      };
      dispatcher.on(REDO_EVENT, forward);

      // Canvas geri alma (Undo) olayını kaydeder (UNDO_EVENT).
      const back = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.back();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasUndo(toolType); // Log kaydı
          }
        }
      };
      dispatcher.on(UNDO_EVENT, back);
      // --- End Dispatcher Olay Kayıtları ---

      // Pencere boyutu değiştiğinde Canvas'ı yeniden boyutlandırır.
      window.addEventListener('resize', () => {
        // Mevcut çizimi kaydeder.
        const canvasData = Tool.ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        // Yeni boyutları ayarlar.
        canvas.height = canvas.clientHeight;
        canvas.width = canvas.clientWidth;

        // Context'i yeniden ayarlar ve yeni boyuta beyaz zemin çizer.
        Tool.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
        Tool.ctx.fillStyle = 'white';
        Tool.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Kaydedilen çizimi yeni canvas'a yerleştirir.
        Tool.ctx.putImageData(canvasData, 0, 0);

        logCanvasResize(toolType, canvas.width, canvas.height); // Log kaydı
      });

      // Bileşen kaldırıldığında olay dinleyicilerini temizler.
      return () => {
        dispatcher.off(CLEAR_EVENT, callback);
        // Diğer dispatcher.off ve window.removeEventListener'lar da buraya eklenmeli
      };
    }
  }, [canvasRef]); // canvasRef ilk yüklendiğinde bir kere çalışır.

  // --- Fare Olay Yöneticileri (Mouse Event Handlers) ---

  // Fare tıklandığında (çizime başlama)
  const onMouseDown = (event: MouseEvent) => {
    // NOT: Role kontrolü (sadece drawer ise çiz) burada veya useEffect içindeki event kaydında yapılmalıdır.
    if (tool) {
      tool.onMouseDown(event);
    }
  };

  // Fare hareket ettiğinde (çizimi sürdürme)
  const onMouseMove = (event: MouseEvent) => {
    if (tool) {
      tool.onMouseMove(event);
    }
  };

  // Fare bırakıldığında (çizimi bitirme)
  const onMouseUp = (event: MouseEvent) => {
    if (tool) {
      tool.onMouseUp(event);

      // Çizim bittiğinde canvas'ın anlık görüntüsünü Snapshot'a kaydeder (Geri alma için).
      snapshot.add(
        Tool.ctx.getImageData(
          0,
          0,
          Tool.ctx.canvas.width,
          Tool.ctx.canvas.height
        )
      );
    }
  };

  // --- Dokunmatik Olay Yöneticileri (Touch Event Handlers) ---

  const onTouchStart = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchStart(event);
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchMove(event);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (tool) {
      tool.onTouchEnd(event);
    }

    // Dokunma ile çizim bittiğinde Snapshot'a kaydeder.
    snapshot.add(
      Tool.ctx.getImageData(0, 0, Tool.ctx.canvas.width, Tool.ctx.canvas.height)
    );
  };

  // Fare ve Dokunmatik Olay Dinleyicilerini Canvas'a ekleyen useEffect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Fare olaylarını kaydeder.
      canvas.addEventListener('mousedown', onMouseDown);
      canvas.addEventListener('mousemove', onMouseMove);
      canvas.addEventListener('mouseup', onMouseUp);

      // Dokunmatik olayları kaydeder.
      canvas.addEventListener('touchstart', onTouchStart);
      canvas.addEventListener('touchmove', onTouchMove);
      canvas.addEventListener('touchend', onTouchEnd);

      // Bileşen kaldırıldığında tüm olay dinleyicilerini temizler.
      return () => {
        canvas.removeEventListener('mousedown', onMouseDown);
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('mouseup', onMouseUp);

        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', onTouchEnd);
      };
    }
    // Bağımlılıklar: Event handler'lar değişimiyorsa (ki değişmemeli) bu array boş bırakılabilir,
    // ancak React'ın önerdiği yöntem olarak burada tutulmaları güvenlidir.
  }, [canvasRef, onMouseDown, onMouseMove, onMouseUp]);

  // --- Render (Ekrana Çizme) Kısmı ---
  return (
    <canvas
      // w-full: Tam genişlik kaplar.
      // role !== 'drawer' ise, 'pointer-events-none' sınıfı eklenir.
      // Bu, tahmin edenlerin (guesser) veya rolü atanmamış kullanıcıların canvas'a tıklamasını ve çizim yapmasını engeller.
      className={`w-full ${role !== 'drawer' ? 'pointer-events-none' : ''}`}
      ref={canvasRef}
    />
  );
};

export default Canvas;
