// src/components/DrawingCanvas/DrawingCanvas.utils.ts

import type { Point, StrokeData, Tool } from './DrawingCanvas.types';

// Hex renk kodunu RGB'ye dönüştürür
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Flood fill algoritmasının çekirdeği
export const floodFillInternal = (
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  startX: number,
  startY: number,
  fillColor: string
) => {
  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const pixels = imageData.data;

  const startPos = (startY * canvasWidth + startX) * 4;
  const startR = pixels[startPos];
  const startG = pixels[startPos + 1];
  const startB = pixels[startPos + 2];
  const startA = pixels[startPos + 3];

  const fillRGB = hexToRgb(fillColor);
  if (!fillRGB) return;

  const tolerance = 5; // Renk toleransı

  const matchStartColor = (pos: number) => {
    return (
      Math.abs(pixels[pos] - startR) <= tolerance &&
      Math.abs(pixels[pos + 1] - startG) <= tolerance &&
      Math.abs(pixels[pos + 2] - startB) <= tolerance &&
      Math.abs(pixels[pos + 3] - startA) <= tolerance
    );
  };

  const colorPixel = (pos: number) => {
    pixels[pos] = fillRGB.r;
    pixels[pos + 1] = fillRGB.g;
    pixels[pos + 2] = fillRGB.b;
    pixels[pos + 3] = 255; // Tamamen opak
  };

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

    const pos = (y * canvasWidth + x) * 4;
    if (!matchStartColor(pos)) continue;

    colorPixel(pos);

    // Komşu pikselleri stack'e ekle
    stack.push([x - 1, y]);
    stack.push([x + 1, y]);
    stack.push([x, y - 1]);
    stack.push([x, y + 1]);
  }

  ctx.putImageData(imageData, 0, 0);
};

// Canvas'ı yeniden çizen ana fonksiyon

export const redrawAllStrokes = (
  ctx: CanvasRenderingContext2D,

  canvasWidth: number,

  canvasHeight: number,

  allStrokes: StrokeData[],

  lastFillSnapshot: ImageData | null
) => {
  // Tuvali temizle (İlk beyaz temizliği koruyun)

  ctx.fillStyle = 'white';

  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  allStrokes.forEach((stroke) => {
    // 🚨 Boya Kovası Vuruşu Kontrolü

    if (
      stroke.tool === 'bucket' &&
      stroke.isBucketFill &&
      stroke.fillPosition
    ) {
      // A. PERFORMANS: Yerel snapshot varsa onu kullan (Kasma yok)

      if (lastFillSnapshot) {
        ctx.putImageData(lastFillSnapshot, 0, 0);
      } else {
        // B. SENKRONİZASYON: Uzak vuruş ise flood fill'i tekrar uygula

        try {
          floodFillInternal(
            ctx,

            canvasWidth,

            canvasHeight,

            stroke.fillPosition.x,

            stroke.fillPosition.y,

            stroke.color
          );
        } catch (error) {
          console.error('Uzak Flood Fill yeniden uygulama hatası:', error);
        }
      }
    } else {
      // 🚨 DÜZELTME: Sadece Boya Kovası olmayan (Pen, Circle, Line vb.) vuruşları çiz

      if (stroke.points.length === 0) return;

      ctx.strokeStyle = stroke.color;

      ctx.fillStyle = stroke.color;

      ctx.lineWidth = stroke.size;

      ctx.lineCap = 'round';

      ctx.lineJoin = 'round';

      ctx.beginPath();

      if (stroke.tool === 'line') {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        ctx.lineTo(stroke.points[1].x, stroke.points[1].y);

        if (stroke.filled) {
          ctx.lineWidth = stroke.size * 2;
        }
      } else if (stroke.tool === 'circle') {
        const start = stroke.points[0];

        const end = stroke.points[stroke.points.length - 1];

        const radius = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );

        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);

        if (stroke.filled) {
          ctx.fill();
        }
      } else if (stroke.tool === 'rectangle') {
        const start = stroke.points[0];

        const corner = stroke.points[2] || stroke.points[1];

        const width = corner.x - start.x;

        const height = corner.y - start.y;

        if (stroke.filled) {
          ctx.fillRect(start.x, start.y, width, height);
        }

        ctx.strokeRect(start.x, start.y, width, height);
      } else {
        // 'pen' ve 'eraser' için

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
      }

      ctx.stroke();
    } // 👈 else bloğu burada biter
  });
};

// Geçici şekilleri çizer (mouse hareket ederken)
export const drawTemporaryShape = (
  ctx: CanvasRenderingContext2D,
  startPoint: Point,
  endPoint: Point,
  tool: Tool,
  color: string,
  size: number,
  filled: boolean,
  redrawFunction: () => void // Yeniden çizme fonksiyonu
) => {
  redrawFunction(); // Önce mevcut her şeyi çiz

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (tool) {
    case 'line':
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endPoint.x, endPoint.y);
      if (filled) {
        ctx.lineWidth = size * 2;
      }
      ctx.stroke();
      break;

    case 'circle':
      const radius = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
          Math.pow(endPoint.y - startPoint.y, 2)
      );
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
      if (filled) {
        ctx.fill();
      }
      ctx.stroke();
      break;

    case 'rectangle':
      const width = endPoint.x - startPoint.x;
      const height = endPoint.y - startPoint.y;
      if (filled) {
        ctx.fillRect(startPoint.x, startPoint.y, width, height);
      }
      ctx.strokeRect(startPoint.x, startPoint.y, width, height);
      break;
    default:
      // Pen veya diğer araçlar için burada bir şey yapmaya gerek yok,
      // onlar farklı şekilde çiziliyor.
      break;
  }
};
