import Tool, { getMousePos, getTouchPos } from './tool';
import type { Point } from './tool';
import Color from 'color';
import { ToolValue } from '../toolType';
import { logFillStart, logFillEnd } from '../logger';

/**
 * Flood Fill Algoritması (Aynı kalacak)
 */
const efficentFloodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number]
) => {
  startX = Math.round(startX);
  startY = Math.round(startY);

  const pixelStack: [number, number][] = [[startX, startY]];
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const startPos = (startY * canvasWidth + startX) * 4;

  const colorLayer = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const startColor: [number, number, number] = [
    colorLayer.data[startPos],
    colorLayer.data[startPos + 1],
    colorLayer.data[startPos + 2],
  ];

  if (
    startColor[0] === fillColor[0] &&
    startColor[1] === fillColor[1] &&
    startColor[2] === fillColor[2]
  )
    return;

  while (pixelStack.length > 0) {
    const newPos = pixelStack.pop() as [number, number];
    const x = newPos[0];
    let y = newPos[1];

    let pixelPos = (y * canvasWidth + x) * 4;

    while (y-- >= 0 && matchColor(colorLayer, pixelPos, startColor)) {
      pixelPos -= canvasWidth * 4;
    }

    pixelPos += canvasWidth * 4;
    ++y;

    let reachLeft = false,
      reachRight = false;

    while (
      y++ < canvasHeight - 1 &&
      matchColor(colorLayer, pixelPos, startColor)
    ) {
      fillPixel(colorLayer, pixelPos, fillColor);

      if (x > 0) {
        if (matchColor(colorLayer, pixelPos - 4, startColor)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, y]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < canvasWidth - 1) {
        if (matchColor(colorLayer, pixelPos + 4, startColor)) {
          if (!reachRight) {
            pixelStack.push([x + 1, y]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      pixelPos += canvasWidth * 4;
    }
  }

  ctx.putImageData(colorLayer, 0, 0);
};

const matchColor = (
  colorLayer: ImageData,
  pixelPos: number,
  color: [number, number, number]
) => {
  const r = colorLayer.data[pixelPos];
  const g = colorLayer.data[pixelPos + 1];
  const b = colorLayer.data[pixelPos + 2];

  return r === color[0] && g === color[1] && b === color[2];
};

const fillPixel = (
  colorLayer: ImageData,
  pixelPos: number,
  color: [number, number, number]
) => {
  colorLayer.data[pixelPos] = color[0];
  colorLayer.data[pixelPos + 1] = color[1];
  colorLayer.data[pixelPos + 2] = color[2];
  return colorLayer;
};

class ColorFill extends Tool {
  /**
   * SADECE ColorFill için DPR dönüşümü
   * Diğer araçlar normal koordinatları kullanmaya devam edecek
   */
  private operateStart(pos: Point, isTouch: boolean = false) {
    if (!Tool.ctx) return;

    const canvas = Tool.ctx.canvas;
    const dpr = canvas.width / canvas.clientWidth;

    // SADECE ColorFill için: CSS koordinatlarını DPR ile çarp
    const x = Math.round(pos.x * dpr);
    const y = Math.round(pos.y * dpr);

    console.log('🎨 ColorFill (Özel DPR):', {
      inputPos: pos,
      outputPos: { x, y },
      dpr: dpr,
    });

    const color = new Color(Tool.mainColor);

    logFillStart(ToolValue.COLOR_FILL, pos, Tool.mainColor, isTouch);
    efficentFloodFill(Tool.ctx, x, y, [
      color.red(),
      color.green(),
      color.blue(),
    ]);
    logFillEnd(ToolValue.COLOR_FILL, pos, isTouch);
  }

  // --- Fare Olayları (Aynı) ---
  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const mousepos = getMousePos(Tool.ctx.canvas, event);
    this.operateStart(mousepos, false);
  }

  // --- Dokunmatik Olaylar (Aynı) ---
  public onTouchStart(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }
    const touchpos = getTouchPos(event.target as HTMLCanvasElement, event);
    this.operateStart(touchpos, true);
  }
}

export default ColorFill;
