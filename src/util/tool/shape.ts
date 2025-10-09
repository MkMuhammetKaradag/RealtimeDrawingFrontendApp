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
    case ShapeToolValue.ARROW_LEFT: // Sol Ok // Ok gövdesinin (dikey) kalınlığını belirleyen oran
      const shaftThicknessY = (1 / 3) * (ey - sy); // Ok şeklini oluşturan 7 nokta (X ve Y'nin rolleri değiştirildi)

      points.push({ x: sx, y: my }); // 1. Uç (En sol)
      points.push({ x: mx, y: sy }); // 2. Ok başının üst köşesi
      points.push({ x: mx, y: sy + shaftThicknessY }); // 3. Gövde üst iç köşe
      points.push({ x: ex, y: sy + shaftThicknessY }); // 4. Gövde üst sağ köşe (En sağ, üst gövde)
      points.push({ x: ex, y: ey - shaftThicknessY }); // 5. Gövde alt sağ köşe (En sağ, alt gövde)
      points.push({ x: mx, y: ey - shaftThicknessY }); // 6. Gövde alt iç köşe
      points.push({ x: mx, y: ey }); // 7. Ok başının alt köşesi
      break;
    case ShapeToolValue.ARROW_RIGHT: // Sağ Ok
      // Ok gövdesinin (dikey) kalınlığını belirleyen oran
      const shaftThicknessYRight = (1 / 3) * (ey - sy);

      // Ok şeklini oluşturan 7 nokta (Sol Ok'un X koordinatları ters çevrildi)
      points.push({ x: ex, y: my }); // 1. Uç (En sağ)
      points.push({ x: mx, y: sy }); // 2. Ok başının üst köşesi
      points.push({ x: mx, y: sy + shaftThicknessYRight }); // 3. Gövde üst iç köşe
      points.push({ x: sx, y: sy + shaftThicknessYRight }); // 4. Gövde üst sol köşe (En sol, üst gövde)
      points.push({ x: sx, y: ey - shaftThicknessYRight }); // 5. Gövde alt sol köşe (En sol, alt gövde)
      points.push({ x: mx, y: ey - shaftThicknessYRight }); // 6. Gövde alt iç köşe
      points.push({ x: mx, y: ey }); // 7. Ok başının alt köşesi
      break;
    case ShapeToolValue.ARROW_DOWN: // Aşağı Ok
      // Ok gövdesinin (yatay) kalınlığını belirleyen oran
      const shaftThicknessXDown = (1 / 3) * (ex - sx);

      // Ok şeklini oluşturan 7 nokta (Yukarı Ok'un Y koordinatları ters çevrildi)
      points.push({ x: mx, y: ey }); // 1. Uç (En aşağı)
      points.push({ x: ex, y: my }); // 2. Ok başının sağ köşesi
      points.push({ x: ex - shaftThicknessXDown, y: my }); // 3. Gövde sağ iç köşe
      points.push({ x: ex - shaftThicknessXDown, y: sy }); // 4. Gövde sağ üst köşe (En üst, sağ gövde)
      points.push({ x: sx + shaftThicknessXDown, y: sy }); // 5. Gövde sol üst köşe (En üst, sol gövde)
      points.push({ x: sx + shaftThicknessXDown, y: my }); // 6. Gövde sol iç köşe
      points.push({ x: sx, y: my }); // 7. Ok başının sol köşesi
      break;
    // Diğer ok türleri (ARROW_RIGHT, ARROW_DOWN, ARROW_LEFT) benzer mantıkla
    // dikdörtgen gövde ve üçgen başlıktan oluşur.
    case ShapeToolValue.FOUR_STAR: // Dört Köşeli Yıldız
      const rOuterFour = Math.max(Math.abs(ex - sx), Math.abs(ey - sy)) / 2;
      // İç yarıçapı, dış yarıçapın yaklaşık %40'ı olarak belirleyelim
      const rInnerFour = rOuterFour * 0.4;

      const numPointsFour = 8;
      // Başlangıç açısı 45 derece (π/4 radyan) olmalı ki yıldız dikey dursun
      const startAngleFour = -Math.PI / 2;

      for (let i = 0; i < numPointsFour; i++) {
        const radius = i % 2 === 0 ? rOuterFour : rInnerFour;
        const angle = startAngleFour + (i * 2 * Math.PI) / numPointsFour;

        // Kutupsal koordinatlardan Kartezyen koordinatlara çevrim
        const x = mx + radius * Math.cos(angle);
        const y = my + radius * Math.sin(angle);

        points.push({ x, y });
      }
      break;
    case ShapeToolValue.FIVE_STAR: // Beş Köşeli Yıldız
      const rOuterFive = Math.max(Math.abs(ex - sx), Math.abs(ey - sy)) / 2;
      // İç yarıçapı, dış yarıçapın yaklaşık %40'ı olarak belirleyelim
      const rInnerFive = rOuterFive * 0.4;

      const numPointsFive = 10;
      // Başlangıç açısı 90 derece (π/2 radyan) olmalı ki tek bir köşe yukarı baksın
      const startAngleFive = -Math.PI / 2;

      for (let i = 0; i < numPointsFive; i++) {
        const radius = i % 2 === 0 ? rOuterFive : rInnerFive;
        const angle = startAngleFive + (i * 2 * Math.PI) / numPointsFive;

        // Kutupsal koordinatlardan Kartezyen koordinatlara çevrim
        const x = mx + radius * Math.cos(angle);
        const y = my + radius * Math.sin(angle);

        points.push({ x, y });
      }
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
