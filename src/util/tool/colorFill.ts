import Tool, { getMousePos, getTouchPos } from './tool';
import type { Point } from './tool';
import Color from 'color'; // Renk işlemlerini kolaylaştıran harici kütüphane
import { ToolValue } from '../toolType';
import { logFillStart, logFillEnd } from '../logger';

/**
 * Yüksek verimli Doldurma (Flood Fill) Algoritması
 * Referans: http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
 *
 * Tıklanan noktadan başlayarak aynı renkteki bitişik pikselleri doldurur.
 *
 * @param ctx - Canvas 2D Rendering Context
 * @param startX - Başlangıç X koordinatı
 * @param startY - Başlangıç Y koordinatı
 * @param fillColor - Doldurulacak yeni rengin [R, G, B] dizisi
 */
const efficentFloodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColor: [number, number, number]
) => {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // startX ve startY'nin tam sayı (integer) olduğundan emin olunur.
  // Bu, özellikle dokunmatik cihazlarda oluşabilecek ondalık koordinat hatalarını önler.
  if (isMobile) {
    startX = Math.round(startX);
    startY = Math.round(startY);
  }

  // Doldurma için ziyaret edilecek piksel koordinatlarının yığını (stack)
  const pixelStack: [number, number][] = [[startX, startY]];
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const startPos = (startY * canvasWidth + startX) * 4;
  // Tüm Canvas'ın ImageData'sını alır
  const colorLayer = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

  // Tıklanan pikselin orijinal rengini alır
  const startColor: [number, number, number] = [
    colorLayer.data[startPos],
    colorLayer.data[startPos + 1],
    colorLayer.data[startPos + 2],
  ];

  // Eğer tıklanan rengin zaten doldurma rengiyle aynıysa, hiçbir şey yapma.
  if (
    startColor[0] === fillColor[0] &&
    startColor[1] === fillColor[1] &&
    startColor[2] === fillColor[2]
  )
    return;

  // Pixel yığını boşalana kadar döngüyü sürdür.
  while (pixelStack.length > 0) {
    // Yığından bir piksel (x, y) çıkar
    const newPos = pixelStack.pop() as [number, number];

    const x = newPos[0];
    let y = newPos[1];

    // O anki y konumunun ImageData dizisindeki başlangıç indeksini hesaplar
    let pixelPos = (y * canvasWidth + x) * 4;

    // Y ekseninde yukarı doğru hareket ederek aynı renkteki tüm pikselleri bul.
    // 'y-- >= 0' kontrolü: Canvas sınırları içinde kalındığından ve rengin eşleştiğinden emin olur.
    while (y-- >= 0 && matchColor(colorLayer, pixelPos, startColor)) {
      pixelPos -= canvasWidth * 4; // Yukarıdaki satıra git (CanvasWidth * 4 = Bir satırın piksel verisi boyutu)
    }

    // Döngü bittiğinde, sınırın hemen altındaki ilk aynı renkli piksele geri dönülür.
    pixelPos += canvasWidth * 4;
    ++y;

    let reachLeft = false, // Sola doğru bir sonraki doldurulacak alan bulundu mu?
      reachRight = false; // Sağa doğru bir sonraki doldurulacak alan bulundu mu?

    // Y ekseninde aşağı doğru hareket ederek aynı renkteki tüm pikselleri doldur.
    while (
      y++ < canvasHeight - 1 &&
      matchColor(colorLayer, pixelPos, startColor)
    ) {
      fillPixel(colorLayer, pixelPos, fillColor); // Pikseli yeni renkle doldur

      // SOL YÖN KONTROLÜ
      if (x > 0) {
        // Sol sınırda değilsek
        // Solumuzdaki piksel başlangıç rengiyle eşleşiyorsa
        if (matchColor(colorLayer, pixelPos - 4, startColor)) {
          if (!reachLeft) {
            // Yeni bir doldurma alanı bulduk, yığına ekle ve bayrağı ayarla.
            pixelStack.push([x - 1, y]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          // Solumuzdaki piksel artık eşleşmiyorsa, alanın bittiğini belirt.
          reachLeft = false;
        }
      }

      // SAĞ YÖN KONTROLÜ
      if (x < canvasWidth - 1) {
        // Sağ sınırda değilsek
        // Sağımızdaki piksel başlangıç rengiyle eşleşiyorsa
        if (matchColor(colorLayer, pixelPos + 4, startColor)) {
          if (!reachRight) {
            // Yeni bir doldurma alanı bulduk, yığına ekle ve bayrağı ayarla.
            pixelStack.push([x + 1, y]);
            reachRight = true;
          }
        } else if (reachRight) {
          // Sağımızdaki piksel artık eşleşmiyorsa, alanın bittiğini belirt.
          reachRight = false;
        }
      }

      pixelPos += canvasWidth * 4; // Aşağıdaki satıra geç
    }
  }

  // İşlem bittiğinde, güncellenmiş ImageData'yı Canvas'a yansıtır.
  ctx.putImageData(colorLayer, 0, 0);
};

/**
 * İki konumdaki piksel renginin (R, G, B) aynı olup olmadığını kontrol eder.
 * @param colorLayer - ImageData objesi
 * @param pixelPos - Kontrol edilecek pikselin ImageData dizisindeki başlangıç indeksi
 * @param color - Karşılaştırılacak renk [R, G, B]
 * @returns Renkler eşleşiyorsa true, aksi halde false.
 */
const matchColor = (
  colorLayer: ImageData,
  pixelPos: number,
  color: [number, number, number]
) => {
  const r = colorLayer.data[pixelPos];
  const g = colorLayer.data[pixelPos + 1];
  const b = colorLayer.data[pixelPos + 2];
  // Alfa (şeffaflık) değeri burada kontrol edilmiyor.

  return r === color[0] && g === color[1] && b === color[2];
};

/**
 * Belirtilen ImageData'nın belirtilen konumundaki piksel rengini değiştirir.
 * @param colorLayer - Güncellenecek ImageData objesi
 * @param pixelPos - Güncellenecek pikselin başlangıç indeksi
 * @param color - Yeni renk [R, G, B]
 * @returns Güncellenmiş ImageData
 */
const fillPixel = (
  colorLayer: ImageData,
  pixelPos: number,
  color: [number, number, number]
) => {
  colorLayer.data[pixelPos] = color[0]; // Kırmızı
  colorLayer.data[pixelPos + 1] = color[1]; // Yeşil
  colorLayer.data[pixelPos + 2] = color[2]; // Mavi
  // Alfa (şeffaflık) değeri değiştirilmiyor.

  return colorLayer;
};

// Kova Doldurma (Color Fill) aracını temsil eden sınıf
class ColorFill extends Tool {
  /**
   * Doldurma işlemini başlatır. Fare/Dokunma olaylarından çağrılır.
   * @param pos - Tıklanan/Dokunulan konum
   */
  private operateStart(pos: Point, isTouch: boolean = false) {
    if (!Tool.ctx) return;

    const canvas = Tool.ctx.canvas;
    const dpr = canvas.width / canvas.clientWidth;

    // Koordinatları DPR ile çarp
    const x = Math.round(pos.x * dpr);
    const y = Math.round(pos.y * dpr);

    console.log('🚨 ACİL ÇÖZÜM - ColorFill:', {
      inputPos: pos,
      outputPos: { x, y },
      dpr: dpr,
    });

    const color = new Color(Tool.mainColor);
    efficentFloodFill(Tool.ctx, x, y, [
      color.red(),
      color.green(),
      color.blue(),
    ]);
  }
  // --- Fare Olay Yöneticileri ---

  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const mousepos = getMousePos(Tool.ctx.canvas, event);
    this.operateStart(mousepos);
  }

  // onMouseMove ve onMouseUp metodları bu araç için kullanılmaz.

  // --- Dokunmatik Olay Yöneticileri ---

  public onTouchStart(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }

    const canvas = event.target as HTMLCanvasElement;
    const touch = event.touches[0];

    // Canvas'ın gerçek boyutlarını ve DPR'yi al
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // CSS piksel koordinatları
    const cssX = touch.clientX - rect.left;
    const cssY = touch.clientY - rect.top;

    // Gerçek canvas koordinatlarına dönüştür (DPR'ye böl)
    const x = Math.round(cssX / dpr);
    const y = Math.round(cssY / dpr);

    console.log(
      `Mobile ColorFill - CSS: ${cssX},${cssY} Canvas: ${x},${y} DPR: ${dpr}`
    );

    // Touch için log
    logFillStart(ToolValue.COLOR_FILL, { x, y }, Tool.mainColor, true);

    const color = new Color(Tool.mainColor);
    efficentFloodFill(Tool.ctx, x, y, [
      color.red(),
      color.green(),
      color.blue(),
    ]);

    logFillEnd(ToolValue.COLOR_FILL, { x, y }, true);
  }

  // onTouchMove ve onTouchEnd metodları bu araç için kullanılmaz.
}

export default ColorFill;
