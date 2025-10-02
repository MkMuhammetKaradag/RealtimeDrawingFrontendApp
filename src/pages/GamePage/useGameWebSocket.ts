import { useEffect, useRef, useState } from 'react';

export interface WebSocketMessage {
  type: 'error' | 'room_status' | 'game_state' | string;
  room_id: string;
  content: any;
  // Diğer oyun verileri
}

interface UseGameWebSocketProps {
  roomId: string;
  sessionToken?: string; // opsiyonel, çerezden alıp geçebilirsin
  maxReconnectAttempts?: number;
}

export const useGameWebSocket = ({
  roomId,
  sessionToken,
  maxReconnectAttempts = 3,
}: UseGameWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!roomId) {
      setConnectionStatus('error');
      setErrorMessage('Oda IDsi bulunamadı.');
      return;
    }

    let isMounted = true;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const connectWebSocket = () => {
      if (!isMounted) return;

      const url = `ws://localhost:8080/wsgame/ws/game/${roomId}${
        sessionToken ? `?session=${sessionToken}` : ''
      }`;

      if (ws.current) ws.current.close();

      ws.current = new WebSocket(url);

      // Timeout kontrolü
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          ws.current?.close();
          setConnectionStatus('error');
          setErrorMessage('Sunucuya bağlanılamadı (timeout)');
        }
      }, 10000);

      ws.current.onopen = () => {
        if (!isMounted) {
          ws.current?.close();
          return;
        }

        clearTimeout(connectionTimeout);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        heartbeatInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        console.log('📨 Gelen mesaj:', event.data);
        if (!isMounted) return;

        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'pong') return;

          if (message.type === 'error') {
            setErrorMessage(message.content || 'Sunucu hatası');
            setConnectionStatus('error');
            ws.current?.close();
            return;
          }

          if (message.type === 'canvas_update') {
            console.log('Canvas güncelleme mesajı alındı');
            setRoomData({ ...message, content: message.content });
          } else {
            setRoomData(message);
          }
        } catch (e) {
          console.error('Mesaj işlenirken hata:', e);
        }
      };

      ws.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        if (heartbeatInterval) clearInterval(heartbeatInterval);

        if (!isMounted) return;

        if (
          event.code !== 1000 &&
          connectionStatus !== 'error' &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;
          setConnectionStatus('connecting');

          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            10000
          );
          setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, delay);
        } else {
          setConnectionStatus('disconnected');
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            setErrorMessage(
              'Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.'
            );
          }
        }
      };

      ws.current.onerror = (err) => {
        console.error('WebSocket hatası:', err);
      };
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      ws.current?.close(1000, 'Component unmounted');
    };
  }, [roomId, sessionToken, maxReconnectAttempts]);

  const sendMessage = (data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  };

  return { connectionStatus, errorMessage, roomData, sendMessage };
};
