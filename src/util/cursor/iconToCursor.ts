// Örnek ToolValue enum tanımı (Sizin projenizdeki mevcut tanımı kullanın)

import { ToolValue, type ToolType } from '../toolType';

// Sizin sağladığınız SVG Yolları
const PEN_PATH = `<path d="M5.648 12.276l-1.65 1.1-.415 1.68 1.665-.42 1.104-1.656-.704-.704zM7.1 10.899l.627.627.091-.032c.937-.334 1.88-1.019 2.824-2.089 1.139-1.29 3.061-3.587 5.757-6.879a.211.211 0 0 0-.297-.297c-3.286 2.693-5.583 4.616-6.881 5.758-1.076.946-1.76 1.888-2.088 2.819l-.033.093zm-.615 5.486L.843 17.814l1.4-5.671 3.004-2.004C5.7 8.863 6.583 7.645 7.9 6.486c1.32-1.162 3.632-3.097 6.936-5.804a2.21 2.21 0 0 1 3.111 3.112c-2.71 3.309-4.645 5.62-5.804 6.934-1.156 1.31-2.373 2.173-3.652 2.65l-2.005 3.007z"></path>`;
const ERASER_PATH = `<path d="M2.125 13.781l7.938-7.938c0.719-0.719 1.813-0.719 2.531 0l7.688 7.688c0.719 0.719 0.719 1.844 0 2.563l-7.938 7.938c-2.813 2.813-7.375 2.813-10.219 0-2.813-2.813-2.813-7.438 0-10.25zM11.063 22.75l-7.656-7.688c-2.125 2.125-2.125 5.563 0 7.688s5.531 2.125 7.656 0z"></path>`;
const COLOR_FILL_PATH = `<path d="M 11.3125 3.28125 L 9.90625 4.71875 L 11.6875 6.5 L 4.78125 13.40625 C 3.597656 14.589844 3.597656 16.535156 4.78125 17.71875 L 4.84375 17.78125 L 11.1875 24.09375 C 12.371094 25.277344 14.316406 25.277344 15.5 24.09375 L 23.09375 16.5 L 23.8125 15.8125 L 14.09375 6.09375 L 13.3125 5.28125 L 13.09375 5.09375 Z M 13.125 7.9375 L 21 15.8125 L 14.09375 22.6875 C 13.675781 23.105469 13.011719 23.105469 12.59375 22.6875 L 6.21875 16.28125 C 5.800781 15.863281 5.800781 15.230469 6.21875 14.8125 Z M 25 19.25 L 24.1875 20.4375 C 24.1875 20.4375 23.648438 21.191406 23.125 22.09375 C 22.863281 22.546875 22.617188 23.019531 22.40625 23.5 C 22.195313 23.980469 22 24.421875 22 25 C 22 26.644531 23.355469 28 25 28 C 26.644531 28 28 26.644531 28 25 C 28 24.421875 27.804688 23.980469 27.59375 23.5 C 27.382813 23.019531 27.136719 22.546875 26.875 22.09375 C 26.351563 21.191406 25.8125 20.4375 25.8125 20.4375 Z M 25 22.875 C 25.066406 22.984375 25.058594 22.976563 25.125 23.09375 C 25.363281 23.503906 25.617188 23.941406 25.78125 24.3125 C 25.945313 24.683594 26 25.027344 26 25 C 26 25.554688 25.554688 26 25 26 C 24.445313 26 24 25.554688 24 25 C 24 25.027344 24.054688 24.683594 24.21875 24.3125 C 24.382813 23.941406 24.636719 23.503906 24.875 23.09375 C 24.941406 22.976563 24.933594 22.984375 25 22.875 Z"></path>`;

// Simgeyi SVG Data URL'sine dönüştüren ve **dinamik rengi** kullanan fonksiyon.
const iconToDataURL = (
  iconSvg: string,
  color: string,
  fallbackCursor: string = 'crosshair'
): string => {
  // SVG'nin stroke (çizgi) rengini dinamik olarak ayarlar
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 28 28" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`;

  // Tam CSS 'cursor' değerini döndürür (URL + yedek imleç).
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(
    svg
  )}"), ${fallbackCursor}`;
};

/**
 * Seçili araca ve renge göre dinamik CSS 'cursor' stilini döndürür.
 * @param toolType - Seçili aracın tipi.
 * @param color - Seçili çizim rengi (örn: '#FF0000').
 * @returns Doğrudan HTML 'style' prop'unda kullanılabilecek CSS 'cursor' dizesi.
 */
export const getCanvasCursorStyle = (
  toolType: ToolType,
  color: string,
  secondColor: string
): string => {
  const dynamicColor = color;

  switch (toolType) {
    case ToolValue.PEN:
      // Kalem, dinamik rengi kullanır.
      return iconToDataURL(PEN_PATH, dynamicColor);

    case ToolValue.COLOR_FILL:
      // Boya kovası, dinamik rengi kullanır.
      return iconToDataURL(COLOR_FILL_PATH, dynamicColor);

    case ToolValue.ERASER:
      return iconToDataURL(ERASER_PATH, secondColor, 'grab');

    case ToolValue.TEXT:
      return 'text'; // Standart tarayıcı imleci

    case ToolValue.MAGNIFYING:
      return 'zoom-in'; // Standart tarayıcı imleci

    case ToolValue.COLOR_EXTRACT:
    case ToolValue.SHAPE:
    default:
      return 'crosshair';
  }
};
