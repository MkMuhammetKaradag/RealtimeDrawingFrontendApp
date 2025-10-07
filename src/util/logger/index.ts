import type { Point } from '../tool/tool';
import type { ToolType, ShapeToolType, LineWidthType } from '../toolType';

// Log event tipleri
export const LogEventValue = {
  // Çizim işlemleri
  DRAW_START: 'DRAW_START',
  DRAW_MOVE: 'DRAW_MOVE',
  DRAW_END: 'DRAW_END',

  // Şekil işlemleri
  SHAPE_START: 'SHAPE_START',
  SHAPE_MOVE: 'SHAPE_MOVE',
  SHAPE_END: 'SHAPE_END',

  // Doldurma işlemleri
  FILL_START: 'FILL_START',
  FILL_END: 'FILL_END',

  // Silme işlemleri
  ERASE_START: 'ERASE_START',
  ERASE_MOVE: 'ERASE_MOVE',
  ERASE_END: 'ERASE_END',

  // Renk çıkarma
  COLOR_EXTRACT: 'COLOR_EXTRACT',

  // Canvas işlemleri
  CANVAS_CLEAR: 'CANVAS_CLEAR',
  CANVAS_UNDO: 'CANVAS_UNDO',
  CANVAS_REDO: 'CANVAS_REDO',
  CANVAS_RESIZE: 'CANVAS_RESIZE',

  // Tool değişiklikleri
  TOOL_CHANGE: 'TOOL_CHANGE',
  COLOR_CHANGE: 'COLOR_CHANGE',
  LINE_WIDTH_CHANGE: 'LINE_WIDTH_CHANGE',
} as const;
export type LogEventType = (typeof LogEventValue)[keyof typeof LogEventValue];
// Log veri yapıları
export interface BaseLogData {
  timestamp?: number;
  eventType: LogEventType;
  toolType: ToolType;
  userId?: string; // WebSocket için kullanıcı ID'si
}

export type DrawEventType =
  | typeof LogEventValue.DRAW_START
  | typeof LogEventValue.DRAW_MOVE
  | typeof LogEventValue.DRAW_END;

export interface DrawLogData extends BaseLogData {
  eventType: DrawEventType;
  position: Point;
  color: string;
  lineWidth: number;
  isTouch: boolean;
}

export type ShapeEventType =
  | typeof LogEventValue.SHAPE_START
  | typeof LogEventValue.SHAPE_MOVE
  | typeof LogEventValue.SHAPE_END;

export interface ShapeLogData extends BaseLogData {
  eventType: ShapeEventType;
  shapeType: ShapeToolType;
  startPosition: Point;
  endPosition?: Point;
  color: string;
  lineWidth: number;
  isDashed: boolean;
  isTouch: boolean;
}

export type FillEventType =
  | typeof LogEventValue.FILL_START
  | typeof LogEventValue.FILL_END;

export interface FillLogData extends BaseLogData {
  eventType: FillEventType;
  position: Point;
  fillColor: string;
  isTouch: boolean;
}
export type EraseEventType =
  | typeof LogEventValue.ERASE_START
  | typeof LogEventValue.ERASE_MOVE
  | typeof LogEventValue.ERASE_END;

export interface EraseLogData extends BaseLogData {
  eventType: EraseEventType;
  position: Point;
  lineWidth: number;
  isTouch: boolean;
}
export type ColorExtractEventType = typeof LogEventValue.COLOR_EXTRACT;

export interface ColorExtractLogData extends BaseLogData {
  eventType: ColorExtractEventType;
  position: Point;
  extractedColor: string;
  isTouch: boolean;
}
export type CanvasEventType =
  | typeof LogEventValue.CANVAS_CLEAR
  | typeof LogEventValue.CANVAS_UNDO
  | typeof LogEventValue.CANVAS_REDO
  | typeof LogEventValue.CANVAS_RESIZE;

export interface CanvasLogData extends BaseLogData {
  eventType: CanvasEventType;
  canvasSize?: { width: number; height: number };
}
export type ToolChangeEventType =
  | typeof LogEventValue.TOOL_CHANGE
  | typeof LogEventValue.COLOR_CHANGE
  | typeof LogEventValue.LINE_WIDTH_CHANGE;

export interface ToolChangeLogData extends BaseLogData {
  eventType: ToolChangeEventType;
  oldValue?: string | ToolType | LineWidthType;
  newValue: string | ToolType | LineWidthType;
}

// Union type for all log data
export type LogData =
  | DrawLogData
  | ShapeLogData
  | FillLogData
  | EraseLogData
  | ColorExtractLogData
  | CanvasLogData
  | ToolChangeLogData;

// Logger sınıfı
export class CanvasLogger {
  private logs: LogData[] = [];
  private isEnabled: boolean = true;
  private maxLogs: number = 1000; // Maksimum log sayısı

  constructor() {
    this.logs = [];
  }

  // Log ekleme
  public log(data: LogData): void {
    if (!this.isEnabled) return;

    // Timestamp ekle
    data.timestamp = Date.now();

    // Log'u ekle
    this.logs.push(data);

    // Maksimum log sayısını kontrol et
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // En eski log'u sil
    }

    // Console'a yazdır
    this.printToConsole(data);
  }

  // Console'a yazdırma
  private printToConsole(data: LogData): void {
    const timestamp = new Date(data.timestamp ?? Date.now()).toLocaleTimeString(
      'tr-TR'
    );

    switch (data.eventType) {
      case LogEventValue.DRAW_START:
        console.log(
          `🖊️ [${timestamp}] Çizim Başladı - Tool: ${data.toolType}, Konum: (${data.position.x}, ${data.position.y}), Renk: ${data.color}, Kalınlık: ${data.lineWidth}, Touch: ${data.isTouch}`
        );
        break;

      case LogEventValue.DRAW_MOVE:
        console.log(
          `🖊️ [${timestamp}] Çizim Devam Ediyor - Konum: (${data.position.x}, ${data.position.y})`
        );
        break;

      case LogEventValue.DRAW_END:
        console.log(
          `🖊️ [${timestamp}] Çizim Bitti - Son Konum: (${data.position.x}, ${data.position.y})`
        );
        break;

      case LogEventValue.SHAPE_START:
        console.log(
          `🔷 [${timestamp}] Şekil Başladı - Tip: ${data.shapeType}, Başlangıç: (${data.startPosition.x}, ${data.startPosition.y}), Renk: ${data.color}, Kalınlık: ${data.lineWidth}, Kesikli: ${data.isDashed}, Touch: ${data.isTouch}`
        );
        break;

      case LogEventValue.SHAPE_MOVE:
        console.log(
          `🔷 [${timestamp}] Şekil Çiziliyor - Bitiş: (${data.endPosition?.x}, ${data.endPosition?.y})`
        );
        break;

      case LogEventValue.SHAPE_END:
        console.log(
          `🔷 [${timestamp}] Şekil Bitti - Tip: ${data.shapeType}, Bitiş: (${data.endPosition?.x}, ${data.endPosition?.y})`
        );
        break;

      case LogEventValue.FILL_START:
        console.log(
          `🪣 [${timestamp}] Doldurma Başladı - Konum: (${data.position.x}, ${data.position.y}), Renk: ${data.fillColor}, Touch: ${data.isTouch}`
        );
        break;

      case LogEventValue.FILL_END:
        console.log(
          `🪣 [${timestamp}] Doldurma Bitti - Konum: (${data.position.x}, ${data.position.y})`
        );
        break;

      case LogEventValue.ERASE_START:
        console.log(
          `🧽 [${timestamp}] Silme Başladı - Konum: (${data.position.x}, ${data.position.y}), Kalınlık: ${data.lineWidth}, Touch: ${data.isTouch}`
        );
        break;

      case LogEventValue.ERASE_MOVE:
        console.log(
          `🧽 [${timestamp}] Silme Devam Ediyor - Konum: (${data.position.x}, ${data.position.y})`
        );
        break;

      case LogEventValue.ERASE_END:
        console.log(
          `🧽 [${timestamp}] Silme Bitti - Son Konum: (${data.position.x}, ${data.position.y})`
        );
        break;

      case LogEventValue.COLOR_EXTRACT:
        console.log(
          `🎨 [${timestamp}] Renk Çıkarıldı - Konum: (${data.position.x}, ${data.position.y}), Renk: ${data.extractedColor}, Touch: ${data.isTouch}`
        );
        break;

      case LogEventValue.CANVAS_CLEAR:
        console.log(`🗑️ [${timestamp}] Canvas Temizlendi`);
        break;

      case LogEventValue.CANVAS_UNDO:
        console.log(`↶ [${timestamp}] Geri Alındı`);
        break;

      case LogEventValue.CANVAS_REDO:
        console.log(`↷ [${timestamp}] İleri Alındı`);
        break;

      case LogEventValue.CANVAS_RESIZE:
        console.log(
          `📏 [${timestamp}] Canvas Boyutu Değişti - Yeni Boyut: ${data.canvasSize?.width}x${data.canvasSize?.height}`
        );
        break;

      case LogEventValue.TOOL_CHANGE:
        console.log(
          `🔧 [${timestamp}] Araç Değişti - Eski: ${data.oldValue}, Yeni: ${data.newValue}`
        );
        break;

      case LogEventValue.COLOR_CHANGE:
        console.log(
          `🎨 [${timestamp}] Renk Değişti - Eski: ${data.oldValue}, Yeni: ${data.newValue}`
        );
        break;

      case LogEventValue.LINE_WIDTH_CHANGE:
        console.log(
          `📏 [${timestamp}] Çizgi Kalınlığı Değişti - Eski: ${data.oldValue}, Yeni: ${data.newValue}`
        );
        break;
    }
  }

  // Log'ları alma (WebSocket için)
  public getLogs(): LogData[] {
    return [...this.logs];
  }

  // Son N log'u alma
  public getRecentLogs(count: number = 10): LogData[] {
    return this.logs.slice(-count);
  }

  // Log'ları temizleme
  public clearLogs(): void {
    this.logs = [];
    console.log('🧹 Tüm loglar temizlendi');
  }

  // Logger'ı açma/kapama
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📝 Logger ${enabled ? 'açıldı' : 'kapatıldı'}`);
  }

  // WebSocket için veri hazırlama
  public prepareForWebSocket(userId?: string): LogData[] {
    return this.logs.map((log) => ({
      ...log,
      userId,
    }));
  }

  // Belirli bir zaman aralığındaki log'ları alma
  public getLogsByTimeRange(startTime: number, endTime: number): LogData[] {
    return this.logs.filter(
      (log) =>
        typeof log.timestamp === 'number' &&
        log.timestamp >= startTime &&
        log.timestamp <= endTime
    );
  }

  // İstatistikler
  public getStats(): {
    totalLogs: number;
    eventTypeCounts: Record<LogEventType, number>;
    lastActivity: number | null;
  } {
    const eventTypeCounts = {} as Record<LogEventType, number>;

    // Event type'ları sıfırla
    Object.values(LogEventValue).forEach((eventType) => {
      eventTypeCounts[eventType] = 0;
    });

    // Sayıları hesapla
    this.logs.forEach((log) => {
      eventTypeCounts[log.eventType]++;
    });

    return {
      totalLogs: this.logs.length,
      eventTypeCounts,
      lastActivity:
        this.logs.length > 0
          ? typeof this.logs[this.logs.length - 1].timestamp === 'number'
            ? (this.logs[this.logs.length - 1].timestamp as number)
            : null
          : null,
    };
  }
}

// Global logger instance
export const canvasLogger = new CanvasLogger();

// Helper fonksiyonlar
export const logDrawStart = (
  toolType: ToolType,
  position: Point,
  color: string,
  lineWidth: number,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.DRAW_START,
    toolType,
    position,
    color,
    lineWidth,
    isTouch,
  });
};

export const logDrawMove = (
  toolType: ToolType,
  position: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.DRAW_MOVE,
    toolType,
    position,
    color: '', // Move'da renk gerekmez
    lineWidth: 0, // Move'da kalınlık gerekmez
    isTouch,
  });
};

export const logDrawEnd = (
  toolType: ToolType,
  position: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.DRAW_END,
    toolType,
    position,
    color: '', // End'de renk gerekmez
    lineWidth: 0, // End'de kalınlık gerekmez
    isTouch,
  });
};

export const logShapeStart = (
  toolType: ToolType,
  shapeType: ShapeToolType,
  startPosition: Point,
  color: string,
  lineWidth: number,
  isDashed: boolean,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.SHAPE_START,
    toolType,
    shapeType,
    startPosition,
    color,
    lineWidth,
    isDashed,
    isTouch,
  });
};

export const logShapeMove = (
  toolType: ToolType,
  shapeType: ShapeToolType,
  startPosition: Point,
  endPosition: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.SHAPE_MOVE,
    toolType,
    shapeType,
    startPosition,
    endPosition,
    color: '', // Move'da renk gerekmez
    lineWidth: 0, // Move'da kalınlık gerekmez
    isDashed: false, // Move'da dashed gerekmez
    isTouch,
  });
};

export const logShapeEnd = (
  toolType: ToolType,
  shapeType: ShapeToolType,
  startPosition: Point,
  endPosition: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.SHAPE_END,
    toolType,
    shapeType,
    startPosition,
    endPosition,
    color: '', // End'de renk gerekmez
    lineWidth: 0, // End'de kalınlık gerekmez
    isDashed: false, // End'de dashed gerekmez
    isTouch,
  });
};

export const logFillStart = (
  toolType: ToolType,
  position: Point,
  fillColor: string,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.FILL_START,
    toolType,
    position,
    fillColor,
    isTouch,
  });
};

export const logFillEnd = (
  toolType: ToolType,
  position: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.FILL_END,
    toolType,
    position,
    fillColor: '', // End'de renk gerekmez
    isTouch,
  });
};

export const logEraseStart = (
  toolType: ToolType,
  position: Point,
  lineWidth: number,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.ERASE_START,
    toolType,
    position,
    lineWidth,
    isTouch,
  });
};

export const logEraseMove = (
  toolType: ToolType,
  position: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.ERASE_MOVE,
    toolType,
    position,
    lineWidth: 0, // Move'da kalınlık gerekmez
    isTouch,
  });
};

export const logEraseEnd = (
  toolType: ToolType,
  position: Point,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.ERASE_END,
    toolType,
    position,
    lineWidth: 0, // End'de kalınlık gerekmez
    isTouch,
  });
};

export const logColorExtract = (
  toolType: ToolType,
  position: Point,
  extractedColor: string,
  isTouch: boolean = false
) => {
  canvasLogger.log({
    eventType: LogEventValue.COLOR_EXTRACT,
    toolType,
    position,
    extractedColor,
    isTouch,
  });
};

export const logCanvasClear = (toolType: ToolType) => {
  canvasLogger.log({
    eventType: LogEventValue.CANVAS_CLEAR,
    toolType,
  });
};

export const logCanvasUndo = (toolType: ToolType) => {
  canvasLogger.log({
    eventType: LogEventValue.CANVAS_UNDO,
    toolType,
  });
};

export const logCanvasRedo = (toolType: ToolType) => {
  canvasLogger.log({
    eventType: LogEventValue.CANVAS_REDO,
    toolType,
  });
};

export const logCanvasResize = (
  toolType: ToolType,
  width: number,
  height: number
) => {
  canvasLogger.log({
    eventType: LogEventValue.CANVAS_RESIZE,
    toolType,
    canvasSize: { width, height },
  });
};

export const logToolChange = (oldTool: ToolType, newTool: ToolType) => {
  canvasLogger.log({
    eventType: LogEventValue.TOOL_CHANGE,
    toolType: newTool,
    oldValue: oldTool,
    newValue: newTool,
  });
};

export const logColorChange = (
  toolType: ToolType,
  oldColor: string,
  newColor: string
) => {
  canvasLogger.log({
    eventType: LogEventValue.COLOR_CHANGE,
    toolType,
    oldValue: oldColor,
    newValue: newColor,
  });
};

export const logLineWidthChange = (
  toolType: ToolType,
  oldWidth: LineWidthType,
  newWidth: LineWidthType
) => {
  canvasLogger.log({
    eventType: LogEventValue.LINE_WIDTH_CHANGE,
    toolType,
    oldValue: oldWidth,
    newValue: newWidth,
  });
};
