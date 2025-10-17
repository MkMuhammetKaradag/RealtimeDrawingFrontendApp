import { canvasLogger, type LogData } from '../logger';

// WebSocket mesaj tipleri
export const WebSocketMessageValue = {
  // Canvas işlemleri
  CANVAS_ACTION: 'CANVAS_ACTION',

  // Kullanıcı yönetimi
  USER_JOIN: 'USER_JOIN',
  USER_LEAVE: 'USER_LEAVE',

  // Oda yönetimi
  ROOM_JOIN: 'ROOM_JOIN',
  ROOM_LEAVE: 'ROOM_LEAVE',

  // Sistem mesajları
  PING: 'PING',
  PONG: 'PONG',
  ERROR: 'ERROR',
};
export type WebSocketMessageType =
  (typeof WebSocketMessageValue)[keyof typeof WebSocketMessageValue];
// WebSocket mesaj yapısı
export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: number;
  userId?: string;
  roomId?: string;
}

// Canvas action mesajı
export interface CanvasActionMessage {
  type: typeof WebSocketMessageValue.CANVAS_ACTION;
  data: {
    action: LogData;
    canvasState?: {
      width: number;
      height: number;
      imageData?: string; // Base64 encoded image data
    };
  };
  timestamp: number;
  userId: string;
  roomId: string;
}

// Kullanıcı bilgileri
export interface UserInfo {
  id: string;
  name?: string;
  color?: string; // Kullanıcının rengi
  isActive?: boolean;
}

// Oda bilgileri
export interface RoomInfo {
  id: string;
  name?: string;
  users: UserInfo[];
  maxUsers?: number;
  isPrivate?: boolean;
}

// WebSocket client sınıfı
export class CanvasWebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private userId: string;
  private roomId: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 saniye
  private isConnecting: boolean = false;
  private messageQueue: WebSocketMessage[] = [];
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(url: string, userId: string, roomId: string) {
    this.url = url;
    this.userId = userId;
    this.roomId = roomId;
  }

  // WebSocket bağlantısı kurma
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (
        this.isConnecting ||
        (this.ws && this.ws.readyState === WebSocket.OPEN)
      ) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('🔗 WebSocket bağlantısı kuruldu');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Odaya katılma mesajı gönder
          this.sendMessage({
            type: WebSocketMessageValue.ROOM_JOIN,
            data: { roomId: this.roomId, userId: this.userId },
            timestamp: Date.now(),
            userId: this.userId,
            roomId: this.roomId,
          });

          // Kuyruktaki mesajları gönder
          this.flushMessageQueue();

          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('WebSocket mesaj parse hatası:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log(
            '🔌 WebSocket bağlantısı kapandı:',
            event.code,
            event.reason
          );
          this.isConnecting = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // Otomatik yeniden bağlanma
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket hatası:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  // WebSocket bağlantısını kapatma
  public disconnect(): void {
    if (this.ws) {
      // Odayı terk etme mesajı gönder
      this.sendMessage({
        type: WebSocketMessageValue.ROOM_LEAVE,
        data: { roomId: this.roomId, userId: this.userId },
        timestamp: Date.now(),
        userId: this.userId,
        roomId: this.roomId,
      });

      this.ws.close();
      this.ws = null;
    }
  }

  // Mesaj gönderme
  public sendMessage(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Bağlantı yoksa kuyruğa ekle
      this.messageQueue.push(message);
    }
  }

  // Canvas işlemi gönderme
  public sendCanvasAction(
    action: LogData,
    canvasState?: { width: number; height: number; imageData?: string }
  ): void {
    const message: CanvasActionMessage = {
      type: WebSocketMessageValue.CANVAS_ACTION,
      data: {
        action,
        canvasState,
      },
      timestamp: Date.now(),
      userId: this.userId,
      roomId: this.roomId,
    };

    this.sendMessage(message);
  }

  // Canvas işlemlerini otomatik gönderme (logger'dan)
  public startAutoSendCanvasActions(): void {
    // Logger'dan yeni log'ları dinle
    const originalLog = canvasLogger.log.bind(canvasLogger);

    canvasLogger.log = (data: LogData) => {
      // Orijinal log fonksiyonunu çağır
      originalLog(data);

      // WebSocket'e gönder
      this.sendCanvasAction(data);
    };
  }

  // Canvas işlemlerini otomatik göndermeyi durdurma
  public stopAutoSendCanvasActions(): void {
    // Bu özellik için daha karmaşık bir implementasyon gerekebilir
    // Şimdilik basit bir yaklaşım kullanıyoruz
  }

  // Event listener ekleme
  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Event listener kaldırma
  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Event emit etme
  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  // Mesaj işleme
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case WebSocketMessageValue.CANVAS_ACTION:
        this.emit('canvasAction', message);
        break;

      case WebSocketMessageValue.USER_JOIN:
        this.emit('userJoin', message);
        break;

      case WebSocketMessageValue.USER_LEAVE:
        this.emit('userLeave', message);
        break;

      case WebSocketMessageValue.ROOM_JOIN:
        this.emit('roomJoin', message);
        break;

      case WebSocketMessageValue.ROOM_LEAVE:
        this.emit('roomLeave', message);
        break;

      case WebSocketMessageValue.PING:
        this.sendMessage({
          type: WebSocketMessageValue.PONG,
          data: { timestamp: Date.now() },
          timestamp: Date.now(),
        });
        break;

      case WebSocketMessageValue.PONG:
        this.emit('pong', message);
        break;

      case WebSocketMessageValue.ERROR:
        this.emit('error', message);
        break;

      default:
        console.warn('Bilinmeyen WebSocket mesaj tipi:', message.type);
    }
  }

  // Kuyruktaki mesajları gönderme
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  // Yeniden bağlanma planlama
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay =
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `🔄 ${delay}ms sonra yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Yeniden bağlanma hatası:', error);
      });
    }, delay);
  }

  // Bağlantı durumu kontrolü
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Kullanıcı ID'sini değiştirme
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  // Oda ID'sini değiştirme
  public setRoomId(roomId: string): void {
    this.roomId = roomId;
  }

  // Canvas durumunu almak için yardımcı fonksiyon
  public static getCanvasState(canvas: HTMLCanvasElement): {
    width: number;
    height: number;
    imageData: string;
  } {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context bulunamadı');
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/png');

    return {
      width: canvas.width,
      height: canvas.height,
      imageData: base64,
    };
  }
}

// WebSocket hook'u (React için)
export const useCanvasWebSocket = (
  url: string,
  userId: string,
  roomId: string
) => {
  const [wsClient, setWsClient] = React.useState<CanvasWebSocketClient | null>(
    null
  );
  const [isConnected, setIsConnected] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const client = new CanvasWebSocketClient(url, userId, roomId);

    client.on('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    client.on('disconnected', () => {
      setIsConnected(false);
    });

    client.on('error', (err: any) => {
      setError(err.message || 'WebSocket hatası');
      setIsConnected(false);
    });

    setWsClient(client);

    // Bağlanma
    client.connect().catch((err) => {
      setError(err.message || 'Bağlantı hatası');
    });

    // Cleanup
    return () => {
      client.disconnect();
    };
  }, [url, userId, roomId]);

  return {
    wsClient,
    isConnected,
    error,
    connect: () => wsClient?.connect(),
    disconnect: () => wsClient?.disconnect(),
    sendCanvasAction: (
      action: LogData,
      canvasState?: { width: number; height: number; imageData?: string }
    ) => wsClient?.sendCanvasAction(action, canvasState),
    startAutoSend: () => wsClient?.startAutoSendCanvasActions(),
    stopAutoSend: () => wsClient?.stopAutoSendCanvasActions(),
  };
};

// React import'u ekleme
import React from 'react';
