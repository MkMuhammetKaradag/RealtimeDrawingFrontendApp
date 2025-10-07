import type { ColorType } from '../toolType';
import { ColorValue, ToolValue } from '../toolType';
import Tool, {
  getMousePos,
  getTouchPos,
  hexToRgb,
  updateImageData,
} from './tool';
import type { Point } from './tool';
import {
  logDrawStart,
  logDrawMove,
  logDrawEnd,
  logEraseStart,
  logEraseMove,
  logEraseEnd,
} from '../logger';

/**
 * Kalem (Pen) aracını temsil eden sınıf.
 * Temel çizim işlemlerini ve koordinat takibini yönetir.
 */
class Pen extends Tool {
  protected lineWidthBase = 1; // Kalınlık çarpanı için temel değer
  protected drawColorType: ColorType = ColorValue.MAIN; // Hangi rengin (Ana/İkincil) kullanılacağını tutar.
  protected toolType: string = ToolValue.PEN; // Aracın tipi (loglama ve Erase (Silgi) için kullanılır)
  private mouseDown = false; // Farenin/Dokunmanın basılı olup olmadığını tutar.
  private saveImageData?: ImageData; // Çizim başlamadan önceki canvas görüntüsü (Undo/Redo için)
  private previousPos: Point = {
    // Çizim sırasında önceki noktayı tutar.
    x: 0,
    y: 0,
  };

  /**
   * Çizim/Silme işlemini başlatır.
   * @param pos - Başlangıç noktası
   */
  private operateStart(pos: Point) {
    if (!Tool.ctx) return; // Canvas Context (bağlam) yoksa işlemi durdur.

    // Çizim başlamadan önceki anlık görüntüyü kaydeder.
    this.saveImageData = Tool.ctx.getImageData(
      0,
      0,
      Tool.ctx.canvas.width,
      Tool.ctx.canvas.height
    );

    this.mouseDown = true;

    // Context ayarlamaları
    Tool.ctx.lineWidth = Tool.lineWidthFactor * this.lineWidthBase; // Çizgi kalınlığı
    Tool.ctx.strokeStyle =
      this.drawColorType === ColorValue.MAIN ? Tool.mainColor : Tool.subColor; // Çizgi rengi
    Tool.ctx.lineJoin = 'round'; // Çizgi birleşimlerini yuvarlar
    Tool.ctx.lineCap = 'round'; // Çizgi uçlarını yuvarlar
    Tool.ctx.beginPath(); // Yeni bir çizim yolu başlatır.
    this.previousPos = pos; // Başlangıç pozisyonunu kaydeder.

    // Loglama: Kalem mi Silgi mi olduğunu kontrol ederek ilgili logu kaydeder.
    if (this.toolType === ToolValue.ERASER) {
      logEraseStart(
        this.toolType as any,
        pos,
        Tool.lineWidthFactor * this.lineWidthBase,
        false // Dokunmatik değil
      );
    } else {
      logDrawStart(
        this.toolType as any,
        pos,
        this.drawColorType === ColorValue.MAIN ? Tool.mainColor : Tool.subColor,
        Tool.lineWidthFactor * this.lineWidthBase,
        false // Dokunmatik değil
      );
    }
  }

  /**
   * Çizim/Silme işlemini devam ettirir (fare/dokunma hareket ederken).
   * @param pos - Mevcut konum
   */
  private operateMove(pos: Point) {
    if (this.mouseDown) {
      // Çizim yolu hareketini başlatır (önceki noktadan).
      Tool.ctx.moveTo(this.previousPos.x, this.previousPos.y);

      // İkinci Dereceden Eğri (Quadratic Curve) hesaplaması:
      // Çizimin daha pürüzsüz ve yumuşak görünmesini sağlar.
      // Kontrol noktası (c, d), önceki ve mevcut noktaların ortasında yer alır.
      const c = 0.5 * (this.previousPos.x + pos.x);
      const d = 0.5 * (this.previousPos.y + pos.y);
      Tool.ctx.quadraticCurveTo(c, d, pos.x, pos.y);

      Tool.ctx.stroke(); // Çizimi yapar.
      this.previousPos = pos; // Mevcut noktayı sonraki hareket için önceki nokta olarak ayarlar.

      // Loglama: Çizim hareketini kaydeder.
      if (this.toolType === ToolValue.ERASER) {
        logEraseMove(this.toolType as any, pos, false);
      } else {
        logDrawMove(this.toolType as any, pos, false);
      }
    }
  }

  /**
   * Çizim/Silme işlemini sonlandırır.
   */
  private operateEnd() {
    if (this.mouseDown) {
      Tool.ctx.closePath(); // Çizim yolunu kapatır.
      this.mouseDown = false;

      // Çizimin bitmiş halinin ImageData'sını alır.
      let imageData = Tool.ctx.getImageData(
        0,
        0,
        Tool.ctx.canvas.width,
        Tool.ctx.canvas.height
      );

      // Çizim rengini RGB'ye dönüştürür.
      const colorRgb = hexToRgb(
        this.drawColorType === ColorValue.MAIN ? Tool.mainColor : Tool.subColor
      );

      // Canvas'ın son halini updateImageData ile işler.
      // Bu, çizgi kalınlığının renginin doğru şekilde yerleştirilmesini sağlar.
      if (colorRgb && this.saveImageData) {
        imageData = updateImageData(this.saveImageData, imageData, [
          colorRgb.r,
          colorRgb.g,
          colorRgb.b,
          colorRgb.a,
        ]);

        Tool.ctx.putImageData(imageData, 0, 0);
      }

      // Loglama: Çizim bitişini kaydeder.
      if (this.toolType === ToolValue.ERASER) {
        logEraseEnd(this.toolType as any, this.previousPos, false);
      } else {
        logDrawEnd(this.toolType as any, this.previousPos, false);
      }
    }
  }

  // --- Fare Olay Yöneticileri (Mouse Event Handlers) ---

  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const mousePos = getMousePos(Tool.ctx.canvas, event);
    this.operateStart(mousePos);
  }

  public onMouseUp(event: MouseEvent): void {
    event.preventDefault();
    this.operateEnd();
  }

  public onMouseMove(event: MouseEvent): void {
    event.preventDefault();
    const mousePos = getMousePos(Tool.ctx.canvas, event);
    this.operateMove(mousePos);
  }

  // --- Dokunmatik Olay Yöneticileri (Touch Event Handlers) ---

  public onTouchStart(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault(); // Varsayılan kaydırma/yakınlaştırma hareketini engeller.
    }
    const touchPos = getTouchPos(event.target as HTMLCanvasElement, event);

    // Touch için log çizim başlangıcı
    if (this.toolType === ToolValue.ERASER) {
      logEraseStart(
        this.toolType as any,
        touchPos,
        Tool.lineWidthFactor * this.lineWidthBase,
        true // Dokunmatik
      );
    } else {
      logDrawStart(
        this.toolType as any,
        touchPos,
        this.drawColorType === ColorValue.MAIN ? Tool.mainColor : Tool.subColor,
        Tool.lineWidthFactor * this.lineWidthBase,
        true // Dokunmatik
      );
    }

    this.operateStart(touchPos);
  }

  public onTouchMove(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }
    const touchPos = getTouchPos(event.target as HTMLCanvasElement, event);

    // Touch için log çizim hareketi
    if (this.toolType === ToolValue.ERASER) {
      logEraseMove(this.toolType as any, touchPos, true);
    } else {
      logDrawMove(this.toolType as any, touchPos, true);
    }

    this.operateMove(touchPos);
  }

  public onTouchEnd(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    // Touch için log çizim bitişi
    if (this.toolType === ToolValue.ERASER) {
      logEraseEnd(this.toolType as any, this.previousPos, true);
    } else {
      logDrawEnd(this.toolType as any, this.previousPos, true);
    }

    this.operateEnd();
  }
}

export default Pen;
