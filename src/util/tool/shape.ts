import { ShapeToolValue, ToolValue } from '../toolType';
import type { ShapeToolType } from '../toolType';
import Tool, {
  getMousePos,
  getTouchPos,
  hexToRgb,
  updateImageData,
} from './tool';
import type { Point } from './tool';
import { logShapeStart, logShapeMove, logShapeEnd } from '../logger';

/**
 * Şekil tipine göre çizilecek şeklin köşe noktalarını veya merkezini (daire için) hesaplar.
 * Başlangıç (sx, sy) ve bitiş (ex, ey) koordinatlarını kullanarak şekli tanımlar.
 * @param type - Şekil türü (LINE, RECT, CIRCLE vb.)
 * @param sx - Başlangıç X koordinatı
 * @param sy - Başlangıç Y koordinatı
 * @param ex - Bitiş X koordinatı
 * @param ey - Bitiş Y koordinatı
 * @returns Şeklin köşe noktalarını (Point) içeren bir dizi
 */
const getVertexs = (
  type: ShapeToolType,
  sx: number,
  sy: number,
  ex: number,
  ey: number
): Point[] => {
  const points: Point[] = [];
  // Şeklin orta noktalarını hesaplar
  const mx = 0.5 * (sx + ex),
    my = 0.5 * (sy + ey);

  switch (type) {
    case ShapeToolValue.LINE:
      points.push({ x: sx, y: sy });
      points.push({ x: ex, y: ey });
      break;
    case ShapeToolValue.RECT: // Dikdörtgen
      points.push({ x: sx, y: sy });
      points.push({ x: ex, y: sy });
      points.push({ x: ex, y: ey });
      points.push({ x: sx, y: ey });
      break;
    case ShapeToolValue.CIRCLE: // Daire/Elips (Merkez koordinatını döndürür)
      points.push({ x: 0.5 * (sx + ex), y: 0.5 * (sy + ey) });
      break;
    case ShapeToolValue.RHOMBUS: // Eşkenar Dörtgen
      points.push({ x: mx, y: sy });
      points.push({ x: ex, y: my });
      points.push({ x: mx, y: ey });
      points.push({ x: sx, y: my });
      break;
    case ShapeToolValue.TRIANGLE: // Üçgen
      points.push({ x: mx, y: sy });
      points.push({ x: sx, y: ey });
      points.push({ x: ex, y: ey });
      break;
    case ShapeToolValue.PENTAGON: // Beşgen (Beşgenin beş köşesi)
      // Köşe koordinatları karmaşık matematiksel hesaplamalara dayanır
      points.push({ x: mx, y: sy });
      points.push({ x: ex, y: my });
      points.push({ x: 0.5 * (mx + ex), y: ey });
      points.push({ x: 0.5 * (mx + sx), y: ey });
      points.push({ x: sx, y: my });
      break;
    case ShapeToolValue.SEXANGLE: // Altıgen
      // Altıgenin altı köşesi
      points.push({ x: mx, y: sy });
      points.push({ x: ex, y: 0.5 * (sy + my) });
      points.push({ x: ex, y: 0.5 * (ey + my) });
      points.push({ x: mx, y: ey });
      points.push({ x: sx, y: 0.5 * (ey + my) });
      points.push({ x: sx, y: 0.5 * (sy + my) });
      break;
    case ShapeToolValue.ARROW_TOP: // Yukarı Ok
      // Ok şeklini oluşturan 7 nokta
      points.push({ x: mx, y: sy });
      points.push({ x: ex, y: my });
      points.push({ x: ex - (1 / 3) * (ex - sx), y: my });
      points.push({ x: ex - (1 / 3) * (ex - sx), y: ey });
      points.push({ x: sx + (1 / 3) * (ex - sx), y: ey });
      points.push({ x: sx + (1 / 3) * (ex - sx), y: my });
      points.push({ x: sx, y: my });
      break;
    // Diğer ok türleri (ARROW_RIGHT, ARROW_DOWN, ARROW_LEFT) benzer mantıkla
    // dikdörtgen gövde ve üçgen başlıktan oluşur.
    case ShapeToolValue.FOUR_STAR: // Dört Köşeli Yıldız (8 köşe)
      const offsetX = 0.125 * (ex - sx), // Yatay ofset
        offsetY = 0.125 * (ey - sy); // Dikey ofset
      points.push({ x: mx, y: sy }); // Üst Köşe
      points.push({ x: mx + offsetX, y: my - offsetY }); // İç Köşe
      points.push({ x: ex, y: my }); // Sağ Köşe
      // ... diğer köşeler
      break;
    default:
      break;
  }
  return points;
};

// Tool sınıfından miras alan Shape sınıfı
class Shape extends Tool {
  private type: ShapeToolType; // Bu örneğin çizdiği şekil türü
  private saveImageData?: ImageData; // Şekil çizilmeden önceki Canvas görüntüsü
  private isMouseDown = false; // Farenin/Dokunmanın basılı olup olmadığı
  private mouseDownPos = { x: 0, y: 0 }; // Farenin/Dokunmanın başlangıç konumu
  private lineWidthBase = 1; // Çizgi kalınlığı için temel çarpan
  public isDashed = false; // Kesikli çizgi (Noktalı Kontür) mi?
  private dashLineStyle = [10, 10]; // Kesikli çizgi stili: [çizgi uzunluğu, boşluk uzunluğu]

  public constructor(type: ShapeToolType, dashed = false) {
    super();
    this.type = type;
    this.isDashed = dashed;
  }

  // Şekil tipini dinamik olarak ayarlar.
  public setType(type: ShapeToolType) {
    this.type = type;
  }

  /**
   * Şekil çizim işlemini başlatır.
   * @param pos - Başlangıç (tıklanan) konum
   * @param isTouch - İşlemin dokunmatik olup olmadığı
   */
  private operateStart(
    pos: { x: number; y: number },
    isTouch: boolean = false
  ) {
    // 1. Şekil çizilmeden önceki Canvas görüntüsünü kaydeder.
    // Bu, şekil hareket ettirilirken eski şeklin silinip yeni şeklin çizilebilmesi için gereklidir.
    this.saveImageData = Tool.ctx.getImageData(
      0,
      0,
      Tool.ctx.canvas.width,
      Tool.ctx.canvas.height
    );
    this.isMouseDown = true;
    this.mouseDownPos = pos;

    // 2. Çizim Context ayarlarını yapar
    Tool.ctx.strokeStyle = Tool.mainColor; // Çizgi rengi
    Tool.ctx.lineWidth = Tool.lineWidthFactor * this.lineWidthBase; // Çizgi kalınlığı
    Tool.ctx.fillStyle = Tool.subColor; // İç dolgu rengi (kullanılmıyor, ancak şekil dolgusunda kullanılabilir)

    // 3. Eğer kesikli çizgi modu aktifse, Canvas'a ayarı verir.
    if (this.isDashed) {
      Tool.ctx.setLineDash(this.dashLineStyle);
    }

    // 4. Şekil başlangıcını loglar (kaydeder)
    logShapeStart(
      ToolValue.SHAPE,
      this.type,
      pos,
      Tool.mainColor,
      Tool.lineWidthFactor * this.lineWidthBase,
      this.isDashed,
      isTouch
    );
  }

  /**
   * Şekil çizim işlemini sürdürür (fare/dokunma hareket ederken).
   * @param pos - Mevcut konum
   * @param isTouch - İşlemin dokunmatik olup olmadığı
   */
  private operateMove(pos: { x: number; y: number }, isTouch: boolean = false) {
    if (this.isMouseDown && this.saveImageData) {
      const ctx = Tool.ctx;

      // 1. Canvas'ı temizler
      ctx.clearRect(0, 0, Tool.ctx.canvas.width, Tool.ctx.canvas.height);

      // 2. Kaydedilen orijinal görüntüyü geri yükler
      ctx.putImageData(this.saveImageData, 0, 0);

      // 3. Yeni köşe noktalarını hesaplar
      const vertexs: Point[] = getVertexs(
        this.type,
        this.mouseDownPos.x,
        this.mouseDownPos.y,
        pos.x,
        pos.y
      );

      // 4. Şekli çizer
      if (this.type === ShapeToolValue.CIRCLE) {
        // Daire için özel ellipse metodu kullanılır
        ctx.beginPath();
        ctx.ellipse(
          vertexs[0].x, // Merkez X
          vertexs[0].y, // Merkez Y
          Math.abs(0.5 * (pos.x - this.mouseDownPos.x)), // Yarıçap X
          Math.abs(0.5 * (pos.y - this.mouseDownPos.y)), // Yarıçap Y
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      } else {
        // Tüm çokgenler için genel yol (path) çizimi kullanılır
        ctx.beginPath();
        ctx.moveTo(vertexs[0].x, vertexs[0].y);
        for (let i = 1; i < vertexs.length; i++) {
          ctx.lineTo(vertexs[i].x, vertexs[i].y);
        }
        ctx.closePath(); // Şekli kapatır (İlk noktaya geri döner)
        ctx.stroke(); // Çizgiyi çizer
      }

      // 5. Şekil hareketini loglar
      logShapeMove(ToolValue.SHAPE, this.type, this.mouseDownPos, pos, isTouch);
    }
  }

  /**
   * Şekil çizim işlemini sonlandırır (fare/dokunma bırakıldığında).
   * @param endPos - Bitiş konumu
   * @param isTouch - İşlemin dokunmatik olup olmadığı
   */
  private operateEnd(
    endPos?: { x: number; y: number },
    isTouch: boolean = false
  ) {
    // 1. Kesikli çizgi ayarını sıfırlar, böylece sonraki çizimler düz olur.
    Tool.ctx.setLineDash([]);

    // 2. Biten çizimin ImageData'sını alır
    let imageData = Tool.ctx.getImageData(
      0,
      0,
      Tool.ctx.canvas.width,
      Tool.ctx.canvas.height
    );

    const colorRgb = hexToRgb(Tool.mainColor);

    // 3. Şekli son bir kez çizer ve renklendirme yapar.
    if (colorRgb && this.saveImageData) {
      // updateImageData: Şeklin sadece çizilen alanını ana renge boyar.
      // Bu, çizgi kalınlığının renginin doğru olmasını sağlar.
      imageData = updateImageData(this.saveImageData, imageData, [
        colorRgb.r,
        colorRgb.g,
        colorRgb.b,
        colorRgb.a,
      ]);

      Tool.ctx.putImageData(imageData, 0, 0);
    }

    // 4. Şekil bitişini loglar
    if (endPos) {
      logShapeEnd(
        ToolValue.SHAPE,
        this.type,
        this.mouseDownPos,
        endPos,
        isTouch
      );
    }

    // 5. Durumu sıfırlar
    this.isMouseDown = false;
    this.saveImageData = undefined; // Geçici görüntüyü siler
  }

  // --- Tool Sınıfından Miras Alınan Fare Olay Yöneticileri ---

  public onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    const mousePos = getMousePos(Tool.ctx.canvas, event);
    this.operateStart(mousePos);
    this.isDrawing = true;
  }

  public onMouseMove(event: MouseEvent): void {
    event.preventDefault();
    const mousePos = getMousePos(Tool.ctx.canvas, event);
    this.operateMove(mousePos);
  }

  public onMouseUp(event: MouseEvent): void {
    event.preventDefault();
    const mousePos = getMousePos(Tool.ctx.canvas, event);
    this.operateEnd(mousePos, false);
    this.isDrawing = false;
  }

  // --- Tool Sınıfından Miras Alınan Dokunmatik Olay Yöneticileri ---

  public onTouchStart(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault(); // Varsayılan kaydırma hareketini engeller
    }
    const canvas = event.target as HTMLCanvasElement;
    const touchPos = getTouchPos(canvas, event);

    this.operateStart(touchPos, true);
  }

  public onTouchMove(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }
    const canvas = event.target as HTMLCanvasElement;
    const touchPos = getTouchPos(canvas, event);

    this.operateMove(touchPos, true);
  }

  public onTouchEnd(event: TouchEvent): void {
    if (event.cancelable) {
      event.preventDefault();
    }
    const canvas = event.target as HTMLCanvasElement;
    const touchPos = getTouchPos(canvas, event);
    this.operateEnd(touchPos, true);
  }
}

export default Shape;
