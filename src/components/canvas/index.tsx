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
import { formToJSON } from 'axios';
import type { WebSocketMessage } from '../../pages/GamePage/useGameWebSocket';

// Canvas bileşeninin alacağı (prop) türleri tanımlanıyor.
interface CanvasProps {
  sendMessage: (data: any) => void;
  role: 'drawer' | 'guesser' | null; // Kullanıcının oyundaki rolü (Çizen/Tahmin Eden)
  toolType: ToolType; // Seçili aracın türü (Kalem, Silgi vb.)
  shapeType: ShapeToolType; // Seçili şekil türü
  shapeOutlineType: ShapeOutlineType; // Şekil kontür tipi (Düz, Noktalı)
  lineWidthType: LineWidthType; // Çizgi kalınlığı tipi
  mainColor: string; // Ana çizim rengi
  subColor: string; // İkincil renk
  setColor: (value: string) => void; // Renk seçici aracı için renk ayarlama fonksiyonu
  roomDrawData: any;
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
    roomDrawData,
  } = props;

  // Şu anda kullanılan çizim aracının (Pen, Eraser, Shape vb.) state'i
  const [tool, setTool] = useState<Tool>();

  // Canvas DOM elementine erişmek için kullanılan React referansı
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Olayları (Event) yönetmek için Dispatcher Context'ten alınıyor.
  const dispatcherContext = useContext(DispatcherContext);

  // Geri al/Yinele (Undo/Redo) işlemleri için Canvas'ın anlık görüntülerini tutan Snapshot sınıfı
  const [snapshot] = useState(new Snapshot());
  const remoteToolRef = useRef<Tool | null>(null);
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
        setTool(new ColorExtract(setColor));
        break;
      case ToolValue.COLOR_FILL:
        setTool(new ColorFill());
        break;
      case ToolValue.SHAPE:
        setTool(
          new Shape(shapeType, shapeOutlineType === ShapeOutlineValue.DOTTED)
        );
        break;
      default:
        break;
    }
  }, [toolType, shapeType, shapeOutlineType, setColor]); // toolType veya shapeType değiştiğinde tetiklenir.

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
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

      // Cihazın Piksel Oranını Al
      const dpr = window.devicePixelRatio || 1;

      // Canvas'ın görünen (CSS) boyutlarını sakla
      const rect = canvas.getBoundingClientRect();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // Canvas'ın iç (piksel) çözünürlüğünü, CSS boyutlarının DPI katı olarak ayarla
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Canvas'ın çizim bağlamını (context) DPI oranında ölçeklendir.
      // Bu, tüm çizim işlemlerinin (mouse koordinatları, çizgi kalınlıkları) DPI'a uygun olmasını sağlar.
      ctx.scale(dpr, dpr);

      // --- Devam eden Canvas Kurulumu ---

      // Context'i Tool sınıfına atama (Ölçeklenmiş Context'i kullanmalı)
      Tool.ctx = ctx;

      // Canvas'ı beyaz ile doldur (Artık rect.width ve rect.height kullanıyoruz)
      ctx.fillStyle = 'white';
      // fillRect, zaten ölçeklenmiş olduğu için CSS boyutlarını kullanır:
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Başlangıç durumunu kaydederken piksel boyutlarını kullan
      snapshot.add(ctx.getImageData(0, 0, canvas.width, canvas.height));

      // --- Dispatcher Olay Kayıtları ---
      const dispatcher = dispatcherContext.dispatcher;

      // Canvas temizleme olayını kaydeder (CLEAR_EVENT).
      const clearCanvas = () => {
        console.log('temizleme');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          logCanvasClear(toolType); // Log kaydı
          props.sendMessage({
            type: 'canvas_action',
            content: {
              type: 'canvas_action',
              function: 'canvas_clear',
            },
          });
        }
      };
      dispatcher.on(CLEAR_EVENT, clearCanvas);

      // Canvas yineleme (Redo) olayını kaydeder (REDO_EVENT).
      const forwardAction = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.forward();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasRedo(toolType); // Log kaydı
            props.sendMessage({
              type: 'canvas_action',
              content: {
                type: 'canvas_action',
                function: 'canvas_Redo',
              },
            });
          }
        }
      };
      dispatcher.on(REDO_EVENT, forwardAction);

      // Canvas geri alma (Undo) olayını kaydeder (UNDO_EVENT).
      const back = () => {
        console.log('NABER');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = snapshot.back();
          if (imageData) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.putImageData(imageData, 0, 0);
            logCanvasUndo(toolType); // Log kaydı
            props.sendMessage({
              type: 'canvas_action',
              content: {
                type: 'canvas_action',
                function: 'canvas_UNDO',
              },
            });
          }
        }
      };
      dispatcher.on(UNDO_EVENT, back);
      // --- End Dispatcher Olay Kayıtları ---

      // // Pencere boyutu değiştiğinde Canvas'ı yeniden boyutlandırır.
      // window.addEventListener('resize', () => {
      //   // Mevcut çizimi kaydeder.
      //   const canvasData = Tool.ctx.getImageData(
      //     0,
      //     0,
      //     canvas.width,
      //     canvas.height
      //   );
      //   // Yeni boyutları ayarlar.
      //   canvas.height = canvas.clientHeight;
      //   canvas.width = canvas.clientWidth;

      //   // Context'i yeniden ayarlar ve yeni boyuta beyaz zemin çizer.
      //   Tool.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      //   Tool.ctx.fillStyle = 'white';
      //   Tool.ctx.fillRect(0, 0, canvas.width, canvas.height);

      //   // Kaydedilen çizimi yeni canvas'a yerleştirir.
      //   Tool.ctx.putImageData(canvasData, 0, 0);

      //   logCanvasResize(toolType, canvas.width, canvas.height); // Log kaydı
      // });

      // Bileşen kaldırıldığında olay dinleyicilerini temizler.
      return () => {
        dispatcher.off(CLEAR_EVENT, clearCanvas);
        dispatcher.off(UNDO_EVENT, back);
        dispatcher.off(REDO_EVENT, forwardAction);
        // Diğer dispatcher.off ve window.removeEventListener'lar da buraya eklenmeli
      };
    }
  }, [canvasRef, role]); // canvasRef ilk yüklendiğinde bir kere çalışır.

  useEffect(() => {
    if (!roomDrawData || !Tool.ctx || role === 'drawer') {
      return; // Drawer rolündeyse kendi çizimlerini tekrar çizmesin
    }

    const processRemoteDraw = async () => {
      const {
        function: actionType,
        toolType: remoteToolType,
        x,
        y,
        color,
        lineWidth,
        shapeType: remoteShapeType,
        shapeOutlineType: remoteShapeOutlineType,
      } = roomDrawData.content;

      // Geçici olarak Tool sınıfının statik özelliklerini uzak çizim için ayarlayın
      // Orijinal değerleri kaydetmek ve geri yüklemek, çakışmayı önlemek için iyi bir pratiktir.
      const originalMainColor = Tool.mainColor;
      const originalLineWidthFactor = Tool.lineWidthFactor;

      Tool.mainColor = color;
      Tool.lineWidthFactor = lineWidth;

      // MouseEvent benzeri bir obje oluşturma
      const dummyEvent: MouseEvent = {
        offsetX: x,
        offsetY: y,
        // Diğer gerekli MouseEvent özellikleri
        buttons: 1, // Sol tuşa basılı gibi
        type: actionType,
        clientX: x + Tool.ctx.canvas.offsetLeft, // Göreceli koordinatları absolute'a çevirme tahmini
        clientY: y + Tool.ctx.canvas.offsetTop,
        preventDefault: () => {},
      } as MouseEvent; // Type assertion

      switch (actionType) {
        case 'draw_start':
          remoteToolRef.current = createRemoteToolInstance(
            roomDrawData.content
          );
          if (remoteToolRef.current) {
            remoteToolRef.current.onMouseDown(dummyEvent);

            remoteToolRef.current.lastX = x;
            remoteToolRef.current.lastY = y;
          }
          break;
        case 'draw_move':
          if (remoteToolRef.current && remoteToolRef.current.isDrawing) {
            const lastX =
              remoteToolRef.current.lastX !== undefined
                ? remoteToolRef.current.lastX
                : x;
            const lastY =
              remoteToolRef.current.lastY !== undefined
                ? remoteToolRef.current.lastY
                : y;

            // Eğer Pen veya Eraser ise ve son noktalar mevcutsa, smooth çizim yap
            if (
              (remoteToolRef.current instanceof Pen ||
                remoteToolRef.current instanceof Eraser) &&
              lastX !== undefined &&
              lastY !== undefined
            ) {
              const ctx = Tool.ctx;
              ctx.beginPath();
              ctx.moveTo(lastX, lastY);
              ctx.lineTo(x, y);
              ctx.strokeStyle = Tool.mainColor;
              ctx.lineWidth = Tool.baseLineWidth * Tool.lineWidthFactor; // baseLineWidth'i Tool sınıfında tanımladığınızı varsayıyorum
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              ctx.stroke();
              ctx.closePath();
            } else {
              remoteToolRef.current.onMouseMove(dummyEvent); // Şekiller için normal onMouseMove
            }

            // Mevcut noktayı bir sonraki 'last' nokta olarak kaydet
            remoteToolRef.current.lastX = x;
            remoteToolRef.current.lastY = y;
          }
          break;
        case 'draw_end':
          if (remoteToolRef.current) {
            if (
              remoteToolRef.current instanceof Pen ||
              remoteToolRef.current instanceof Eraser
            ) {
              // Bitirme noktasını da interpolasyonla çiz, eğer gerekliyse
              const lastX =
                remoteToolRef.current.lastX !== undefined
                  ? remoteToolRef.current.lastX
                  : x;
              const lastY =
                remoteToolRef.current.lastY !== undefined
                  ? remoteToolRef.current.lastY
                  : y;
              if (lastX !== x || lastY !== y) {
                const ctx = Tool.ctx;
                ctx.beginPath();
                ctx.moveTo(lastX, lastY);
                ctx.lineTo(x, y);
                ctx.strokeStyle = Tool.mainColor;
                ctx.lineWidth = Tool.baseLineWidth * Tool.lineWidthFactor;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                ctx.closePath();
              }
            } else {
              remoteToolRef.current.onMouseUp(dummyEvent);
            }

            snapshot.add(
              Tool.ctx.getImageData(
                0,
                0,
                Tool.ctx.canvas.width,
                Tool.ctx.canvas.height
              )
            );
            remoteToolRef.current = null; // Aracı sıfırla
          }
          break;
        case 'canvas_clear':
          // Canvas temizleme işlemi
          const ctx = Tool.ctx;
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          // snapshot.clearAndAdd(
          //   ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
          // );
          break;
        case 'canvas_Redo':
          // Uzak Redo işlemi
          const redoImageData = snapshot.forward();
          if (redoImageData) {
            Tool.ctx.clearRect(
              0,
              0,
              Tool.ctx.canvas.width,
              Tool.ctx.canvas.height
            );
            Tool.ctx.putImageData(redoImageData, 0, 0);
          }
          break;
        case 'canvas_UNDO':
          // Uzak Undo işlemi
          const undoImageData = snapshot.back();
          if (undoImageData) {
            Tool.ctx.clearRect(
              0,
              0,
              Tool.ctx.canvas.width,
              Tool.ctx.canvas.height
            );
            Tool.ctx.putImageData(undoImageData, 0, 0);
          }
          break;
        default:
          break;
      }

      // Orijinal Tool statik özelliklerini geri yükle
      Tool.mainColor = originalMainColor;
      Tool.lineWidthFactor = originalLineWidthFactor;
    };

    processRemoteDraw();
  }, [roomDrawData, role, snapshot]);
  const createRemoteToolInstance = (action: any): Tool | null => {
    switch (action.toolType) {
      case ToolValue.PEN:
        return new Pen();
      case ToolValue.ERASER:
        return new Eraser();
      case ToolValue.COLOR_FILL:
        // ColorFill, onMouseDown'da tek bir tıklama ile işini bitirir.
        // Bu yüzden burada Tool.ctx'i geçirmemiz gerekebilir, ColorFill sınıfının yapısına bağlı.
        // Eğer ColorFill zaten Tool.ctx'i kullanıyorsa ekstra bir şey yapmaya gerek yok.
        const colorFillTool = new ColorFill();
        // Uzak color fill için doğrudan doldurma işlemini tetikleyebiliriz
        // Bunun için ColorFill'in bir "fill" metodu olmalı veya onMouseDown'u tetiklemeliyiz.
        // Eğer onMouseDown ile çalışıyorsa, dummyEvent'i kullanabiliriz.
        return colorFillTool;
      case ToolValue.SHAPE:
        const isDashed = action.shapeOutlineType === ShapeOutlineValue.DOTTED;
        return new Shape(action.shapeType, isDashed);
      default:
        return null;
    }
  };

  // --- Fare Olay Yöneticileri (Mouse Event Handlers) ---

  // Fare tıklandığında (çizime başlama)
  const onMouseDown = (event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (role === 'drawer' && tool && canvas) {
      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      const rect = canvas.getBoundingClientRect();

      // Canvas'a göre fare pozisyonunu hesapla
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Koordinatları DPI'a bölerek normalize et (ölçeklenmiş Context için)
      const dpr = window.devicePixelRatio || 1;

      // DPI'a göre normalize edilmiş koordinatlar
      const normalizedX = x / dpr; // (getMousePos'tan gelen veya hesaplanan)
      const normalizedY = y / dpr; // (getMousePos'tan gelen veya hesaplanan)

      tool.onMouseDown(event);
      // tool.onMouseDown(event);
      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_start', // İşlem tipi "draw_start" olarak güncellendi
          // x: event.offsetX,
          // y: event.offsetY,
          x: normalizedX, // Normalize edilmiş X
          y: normalizedY, // Normalize edilmiş Y
          toolType: props.toolType,
          color: colorToSend,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
          lineWidth: Tool.lineWidthFactor,
        },
      });
    }
  };

  // Fare hareket ettiğinde (çizimi sürdürme)
  const onMouseMove = (event: MouseEvent) => {
    if (role === 'drawer' && tool && tool.isDrawing) {
      tool.onMouseMove(event);
      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_move',
          x: event.offsetX,
          y: event.offsetY,
          toolType: props.toolType,
          color: colorToSend,
          lineWidth: Tool.lineWidthFactor,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
        },
      });
    }
  };

  // Fare bırakıldığında (çizimi bitirme)
  const onMouseUp = (event: MouseEvent) => {
    if (role === 'drawer' && tool) {
      tool.onMouseUp(event);
      const colorToSend = toolType === ToolValue.ERASER ? subColor : mainColor;
      props.sendMessage({
        type: 'canvas_action',
        content: {
          type: 'canvas_action',
          function: 'draw_end',
          x: event.offsetX,
          y: event.offsetY,
          toolType: props.toolType,
          color: colorToSend,
          lineWidth: Tool.lineWidthFactor,
          shapeType:
            props.toolType === ToolValue.SHAPE ? props.shapeType : undefined,
          shapeOutlineType:
            props.toolType === ToolValue.SHAPE
              ? props.shapeOutlineType
              : undefined,
        },
      });
      // Çizim bittiğinde snapshot'a sadece drawer rolündeyse kaydet
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
      className={`w-full h-full ${
        role !== 'drawer' ? 'pointer-events-none' : ''
      }`}
      ref={canvasRef}
    />
  );
};

export default Canvas;
