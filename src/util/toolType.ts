// ====================================================================
// 1. ToolType (Ana Araç Tipleri)
// ====================================================================

/**
 * Ana araçların çalışma zamanı değerlerini tutan sabiti (const object).
 */
export const ToolValue = {
  PEN: 'PEN',
  COLOR_FILL: 'COLOR_FILL',
  TEXT: 'TEXT',
  COLOR_EXTRACT: 'COLOR_EXTRACT',
  ERASER: 'ERASER',
  MAGNIFYING: 'MAGNIFYING',
  SHAPE: 'SHAPE',
} as const;

/**
 * ToolValue objesindeki tüm string literal değerlerinin birleşik (union) tipi.
 */
export type ToolType = (typeof ToolValue)[keyof typeof ToolValue];

// ====================================================================
// 2. ShapeToolType (Şekil Araç Tipleri)
// ====================================================================

/**
 * Şekil araçlarının çalışma zamanı değerlerini tutan sabiti.
 */
export const ShapeToolValue = {
  /** Çizgi */
  LINE: 'LINE',
  /** Dikdörtgen */
  RECT: 'RECT',
  /** Çember */
  CIRCLE: 'CIRCLE',
  /** Eşkenar Dörtgen */
  RHOMBUS: 'RHOMBUS',
  /** Üçgen */
  TRIANGLE: 'TRIANGLE',
  /** Beşgen */
  PENTAGON: 'PENTAGON',
  /** Altıgen */
  SEXANGLE: 'SEXANGLE',
  /** Yukarı Ok */
  ARROW_TOP: 'ARROW_TOP',
  /** Sağ Ok */
  ARROW_RIGHT: 'ARROW_RIGHT',
  /** Aşağı Ok */
  ARROW_DOWN: 'ARROW_DOWN',
  /** Sol Ok */
  ARROW_LEFT: 'ARROW_LEFT',
  /** Dört Köşeli Yıldız */
  FOUR_STAR: 'FOUR_STAR',

  FIVE_STAR: 'FIVE_STAR',
} as const;

/**
 * ShapeToolValue objesindeki tüm string literal değerlerinin birleşik tipi.
 */
export type ShapeToolType =
  (typeof ShapeToolValue)[keyof typeof ShapeToolValue];

// ====================================================================
// 3. ShapeOutlineType (Şekil Ana Hat Tipleri)
// ====================================================================

/**
 * Şekil ana hat tiplerinin (düz/noktalı) çalışma zamanı değerlerini tutan sabiti.
 */
export const ShapeOutlineValue = {
  /** Düz Çizgi */
  SOLID: 'SOLID',
  /** Noktalı Çizgi */
  DOTTED: 'DOTTED',
} as const;

/**
 * ShapeOutlineValue objesindeki tüm string literal değerlerinin birleşik tipi.
 */
export type ShapeOutlineType =
  (typeof ShapeOutlineValue)[keyof typeof ShapeOutlineValue];

// ====================================================================
// 4. LineWidthType (Çizgi Kalınlığı Tipleri)
// ====================================================================

/**
 * Çizgi kalınlıklarının çalışma zamanı değerlerini tutan sabiti.
 */
export const LineWidthValue = {
  THIN: 'THIN',
  MIDDLE: 'MIDDLE',
  BOLD: 'BOLD',
  MAXBOLD: 'MAXBOLD',
} as const;

/**
 * LineWidthValue objesindeki tüm string literal değerlerinin birleşik tipi.
 */
export type LineWidthType =
  (typeof LineWidthValue)[keyof typeof LineWidthValue];

// ====================================================================
// 5. ColorType (Renk Tipleri)
// ====================================================================

/**
 * Seçili renk tiplerinin (ana/ikincil) çalışma zamanı değerlerini tutan sabiti.
 */
export const ColorValue = {
  MAIN: 'MAIN',
  SUB: 'SUB',
} as const;

/**
 * ColorValue objesindeki tüm string literal değerlerinin birleşik tipi.
 */
export type ColorType = (typeof ColorValue)[keyof typeof ColorValue];
