import Tool, { getPixelColorOnCanvas, getMousePos, getTouchPos } from './tool';
import { ToolValue } from '../toolType';
import { logColorExtract } from '../logger';

/**
 * Renk Çıkarma (Color Extract) aracını temsil eden sınıf (Göz Damlası Aracı).
 * Canvas üzerindeki bir pikselin rengini alıp, uygulamanın rengini bu renge ayarlar.
 */
class ColorExtract extends Tool {
  private setColor: (color: string) => void; // Uygulamanın rengini ayarlayan fonksiyon (prop olarak gelir)

  /**
   * Yapıcı metot (Constructor)
   * @param setColor - Çıkarılan rengi uygulamada ayarlamak için kullanılan callback fonksiyonu
   */
  public constructor(setColor: (color: string) => void) {
    super(); // Tool sınıfının yapıcısını çağırır.
    this.setColor = setColor;
  }

  /**
   * Renk çıkarma işlemini başlatır.
   * @param pos - Tıklanan/Dokunulan konum
   * @param isTouch - İşlemin dokunmatik olup olmadığı
   */
  private operateStart(
    pos: { x: number; y: number },
    isTouch: boolean = false
  ) {
    // 1. Tıklanan pozisyondaki pikselin rengini Hex formatında alır.
    const color = getPixelColorOnCanvas(Tool.ctx, pos.x, pos.y);

    // 2. Alınan rengi dışarıdan gelen fonksiyon aracılığıyla ayarlar (Ana Rengi günceller).
    this.setColor(color);

    // 3. Loglama: Renk çıkarma işlemini kaydeder.
    logColorExtract(ToolValue.COLOR_EXTRACT, pos, color, isTouch);
  }

  // --- Fare Olay Yöneticileri ---

  public onMouseDown(event: MouseEvent): void {
    event.preventDefault(); // Varsayılan tarayıcı davranışını engeller.
    const mousepos = getMousePos(Tool.ctx.canvas, event);
    this.operateStart(mousepos); // Fare konumuyla işlemi başlatır.
  }

  // onMouseMove ve onMouseUp bu araç için kullanılmaz, tek tık yeterlidir.

  // --- Dokunmatik Olay Yöneticileri ---

  public onTouchStart(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault(); // Varsayılan kaydırma/yakınlaştırma hareketini engeller.
    }
    const canvas = event.target as HTMLCanvasElement;
    const touchPos = getTouchPos(canvas, event);

    this.operateStart(touchPos, true); // Dokunma konumuyla ve isTouch=true ile işlemi başlatır.
  }

  // onTouchMove ve onTouchEnd bu araç için kullanılmaz.
}

export default ColorExtract;
