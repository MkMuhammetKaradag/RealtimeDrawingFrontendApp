/* eslint-disable @typescript-eslint/no-unused-vars */

// Nokta koordinatları için temel arayüz (interface) tanımı
export interface Point {
  x: number;
  y: number;
}

/**
 * Fare olayından yola çıkarak Canvas üzerindeki göreceli konumu hesaplar.
 * @param canvas - HTML Canvas elementi
 * @param event - Mouse Event (Fare olayı)
 * @returns Point {x, y} Canvas üzerindeki koordinatlar
 */
export const getMousePos = (
  canvas: HTMLCanvasElement,
  event: MouseEvent
): Point => {
  // Canvas'ın tarayıcı penceresine göre konumunu alır (sol üst köşe)
  const rect = canvas.getBoundingClientRect();
  return {
    // Fare konumu (clientX/Y) ile Canvas'ın sol/üst konum farkı alınarak göreceli konum bulunur.
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
};

/**
 * Dokunmatik olaydan (Touch Event) yola çıkarak Canvas üzerindeki konumu hesaplar.
 * @param canvas - HTML Canvas elementi
 * @param event - Touch Event (Dokunma olayı)
 * @returns Point {x, y} Canvas üzerindeki koordinatlar
 */
export const getTouchPos = (
  canvas: HTMLCanvasElement,
  event: TouchEvent
): Point => {
  // NOT: getBoundingClientRect() kullanmak genellikle offsetLeft/Top kullanmaktan daha modern ve güvenlidir.
  return {
    // İlk dokunma noktasının (touches[0]) sayfa konumu ile Canvas'ın ofset konumu arasındaki farkı alır.
    x: event.touches[0].pageX - canvas.offsetLeft,
    y: event.touches[0].pageY - canvas.offsetTop,
  };
};

/**
 * RGB(A) renk bileşenlerini Hexadecimal (Onaltılık) renk koduna dönüştürür.
 * @param r - Kırmızı bileşeni (0-255)
 * @param g - Yeşil bileşeni (0-255)
 * @param b - Mavi bileşeni (0-255)
 * @param a - Opsiyonel Alfa (Şeffaflık) bileşeni
 * @returns Hex renk kodu (örneğin: #RRGGBB veya #RRGGBBAA)
 */
export const rgbToHex = (r: number, g: number, b: number, a?: number) => {
  // Tek bir renk bileşenini 2 haneli Hex koda dönüştüren yardımcı fonksiyon.
  const componentToHex = (c: number) => {
    const hex = c.toString(16);
    // Eğer tek haneli ise (örneğin 'A'), başına '0' ekler ('0A').
    return hex.length == 1 ? '0' + hex : hex;
  };

  // #RRGGBB formatında Hex kodu oluşturur.
  const res = '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);

  // Alfa (a) değeri varsa, kodu #RRGGBBAA formatına dönüştürür, yoksa sadece #RRGGBB döndürür.
  return a ? res + componentToHex(a) : res;
};

/**
 * Hexadecimal renk kodunu RGB(A) bileşenlerine dönüştürür.
 * @param hex - Hex renk kodu (örneğin: #RRGGBB veya #RRGGBBAA)
 * @returns RGB(A) bileşenleri içeren bir obje veya null (eşleşme yoksa)
 */
export const hexToRgb = (hex: string) => {
  // Hex kodunu parçalara ayıran düzenli ifade (regex)
  // ^#? : Başta opsiyonel '#' işareti
  // ([a-f\d]{2}) : 4 adet 2 haneli Hex grubu (R, G, B, A) yakalar
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(
    hex
  );
  return result
    ? {
        // Yakalanan parçaları 16'lık tabandan tam sayıya dönüştürür.
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: parseInt(result[4], 16), // Alfa değeri
      }
    : null;
};

/**
 * Canvas üzerindeki belirli bir X, Y koordinatındaki pikselin rengini alır.
 * @param ctx - Canvas 2D Rendering Context
 * @param x - Pikselin x koordinatı
 * @param y - Pikselin y koordinatı
 * @returns Pikselin Hex renk kodu (#RRGGBBAA)
 */
export const getPixelColorOnCanvas = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number
): string => {
  // Sadece 1x1 boyutunda birImageData alır. data [R, G, B, A] dizisini içerir.
  const p = ctx.getImageData(x, y, 1, 1).data;

  // RGB dizisini Hex koda dönüştürüp döndürür.
  return rgbToHex(p[0], p[1], p[2], p[3]);
};

/**
 * İki ImageData objesini karşılaştırarak, doldurulması gereken pikselleri günceller.
 * Bu fonksiyon, muhtemelen bir "Kova Doldurma (Fill)" aracı için kullanılır.
 * @param origin - Canvas'ın orijinal ImageData'sı (doldurma başlamadan önceki durumu)
 * @param data - Güncellenecek olan ImageData (doldurma işlemi uygulanan alan)
 * @param fillData - Yeni doldurma renginin [R, G, B, A] dizisi
 * @returns Güncellenmiş ImageData
 */
export const updateImageData = (
  origin: ImageData,
  data: ImageData,
  fillData: [number, number, number, number]
) => {
  for (let row = 0; row < data.height; row++) {
    for (let col = 0; col < data.width; col++) {
      // Pikselin ImageData dizisindeki başlangıç indeksini hesaplar (4 bileşen * (satır * genişlik + sütun))
      const index = row * data.width * 4 + col * 4;

      // Güncel verideki (data) pikselin RGBA değerleri
      const r1 = data.data[index];
      const g1 = data.data[index + 1];
      const b1 = data.data[index + 2];
      const a1 = data.data[index + 3];

      // Orijinal verideki (origin) pikselin RGBA değerleri
      const r2 = origin.data[index];
      const g2 = origin.data[index + 1];
      const b2 = origin.data[index + 2];
      const a2 = origin.data[index + 3];

      // Pikselin orijinal piksel ile aynı olup olmadığını kontrol eder.
      const equalOrigin = r1 === r2 && g1 === g2 && b1 === b2 && a1 === a2;

      // Pikselin zaten doldurma rengiyle aynı olup olmadığını kontrol eder.
      const equalFilling =
        r1 === fillData[0] &&
        g1 === fillData[1] &&
        b1 === fillData[2] &&
        a1 === fillData[3];

      // Eğer piksel orijinal renkteyse VEYA zaten doldurulmuş renkteyse (bu ikisi DEĞİLSE), yeni renkle doldur.
      // Yani, sadece orijinal alanda olup henüz doldurulmamış olan pikselleri boya.
      if (!(equalOrigin || equalFilling)) {
        data.data[index] = fillData[0];
        data.data[index + 1] = fillData[1];
        data.data[index + 2] = fillData[2];
        data.data[index + 3] = fillData[3];
      }
    }
  }

  return data;
};

// --- Temel Çizim Aracı Sınıfı ---
export default class Tool {
  /**
   * Çizgi kalınlığı çarpanı. (Canvas bileşeninde ayarlanır)
   */
  public static lineWidthFactor = 1;
  /**
   * Ana çizim rengi. (Canvas bileşeninde ayarlanır)
   */
  public static mainColor = 'black';
  /**
   * İkincil renk. (Canvas bileşeninde ayarlanır)
   */
  public static subColor = 'white';

  // Tüm araçların kullanacağı Canvas 2D Context'i. Statik olarak tutulur.
  public static ctx: CanvasRenderingContext2D;

  // --- Fare Olay Yöneticileri (Bu sınıfı miras alan alt sınıflar bunları uygular) ---

  public onMouseDown(event: MouseEvent): void {
    // Fare tıklandığında (çizim başlangıcı)
  }

  public onMouseMove(event: MouseEvent): void {
    // Fare hareket ettiğinde (çizim devamı)
  }

  public onMouseUp(event: MouseEvent): void {
    // Fare bırakıldığında (çizim bitişi)
  }

  // --- Dokunmatik Olay Yöneticileri (Alt sınıflar uygular) ---

  public onTouchStart(event: TouchEvent): void {
    // Dokunmaya başlandığında (çizim başlangıcı)
  }

  public onTouchMove(event: TouchEvent): void {
    // Dokunma devam ettiğinde (çizim devamı)
  }

  public onTouchEnd(event: TouchEvent): void {
    // Dokunma sona erdiğinde (çizim bitişi)
  }
}
