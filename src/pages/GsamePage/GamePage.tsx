import { formToJSON } from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// WebSocket'ten gelebilecek mesaj tiplerini tanımlayalım
interface WebSocketMessage {
  type: 'error' | 'room_status' | 'game_state' | string;
  room_id: string;
  message?: string;
  // Diğer oyun verileri
}

const GamePage = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    if (!room_id) {
      setConnectionStatus('error');
      setErrorMessage('Oda IDsi bulunamadı.');
      return;
    }

    // 🔒 Cleanup flag - strict mode double render'ı önlemek için
    let isComponentMounted = true;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    const connectWebSocket = () => {
      if (!isComponentMounted) return;

      console.log('🔌 WebSocket bağlantısı kuruluyor:', room_id);
      const wsUrl = `ws://localhost:8080/wsgame/ws/game/${room_id}`;

      // 🆕 Önceki bağlantıyı temizle
      if (
        ws.current?.readyState === WebSocket.OPEN ||
        ws.current?.readyState === WebSocket.CONNECTING
      ) {
        ws.current.close();
      }

      ws.current = new WebSocket(wsUrl);

      // ⏱️ Bağlantı timeout'u ekle
      const connectionTimeout = setTimeout(() => {
        if (ws.current?.readyState !== WebSocket.OPEN) {
          console.error('❌ WebSocket bağlantısı zaman aşımına uğradı');
          ws.current?.close();
          setConnectionStatus('error');
          setErrorMessage('Sunucuya bağlanılamadı (timeout)');
        }
      }, 10000); // 10 saniye

      ws.current.onopen = () => {
        if (!isComponentMounted) {
          ws.current?.close();
          return;
        }

        clearTimeout(connectionTimeout);
        console.log('✅ WebSocket bağlantısı kuruldu');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // 💓 Heartbeat başlat (her 30 saniyede ping gönder)
        heartbeatInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
            console.log('💓 Ping gönderildi');
          }
        }, 30000);
      };

      ws.current.onmessage = (event) => {
        if (!isComponentMounted) return;

        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 Sunucudan mesaj:', message);

          // Pong mesajını işle
          if (message.type === 'pong') {
            console.log('💓 Pong alındı');
            return;
          }

          // Hata kontrolü
          if (message.type === 'error') {
            console.error('❌ Sunucu hatası:', message.message);
            setErrorMessage(message.message || 'Sunucu hatası');
            setConnectionStatus('error');

            setTimeout(() => {
              alert(`Odaya Giriş Başarısız: ${message.message}`);
              navigate('/');
            }, 100);

            ws.current?.close();
            return;
          }

          if (
            message.type === 'room_status' ||
            message.type === 'game_status'
          ) {
            setRoomData(message);
          }
        } catch (e) {
          console.error('❌ Mesaj işlenirken hata:', e);
        }
      };

      ws.current.onclose = (event) => {
        clearTimeout(connectionTimeout);
        if (heartbeatInterval) clearInterval(heartbeatInterval);

        console.log(
          '🔌 WebSocket kapandı. Kod:',
          event.code,
          'Sebep:',
          event.reason
        );

        if (!isComponentMounted) {
          console.log('⚠️ Component unmount oldu, reconnect yapılmayacak');
          return;
        }

        // Normal kapanma (1000) değilse ve hata durumu değilse reconnect dene
        if (
          event.code !== 1000 &&
          connectionStatus !== 'error' &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current++;
          console.log(
            `🔄 Yeniden bağlanma denemesi ${reconnectAttempts.current}/${maxReconnectAttempts}`
          );

          setConnectionStatus('connecting');

          // Exponential backoff
          const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempts.current),
            10000
          );
          setTimeout(() => {
            if (isComponentMounted) {
              connectWebSocket();
            }
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

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket hatası:', error);
        // onerror sonrası otomatik onclose çağrılır, orada handle edilecek
      };
    };

    // İlk bağlantıyı kur
    connectWebSocket();

    // Cleanup
    return () => {
      console.log('🧹 Component unmount - WebSocket temizleniyor');
      isComponentMounted = false;
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (ws.current) {
        ws.current.close(1000, 'Component unmounted'); // Normal closure
      }
    };
  }, [room_id, navigate]); // ⚠️ connectionStatus kaldırıldı

  // Bağlantı durumuna göre UI
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Odaya bağlanılıyor...</p>
          {reconnectAttempts.current > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Yeniden deneme {reconnectAttempts.current}/{maxReconnectAttempts}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (connectionStatus === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-bold mb-2">Bağlantı Hatası</h2>
          <p>{errorMessage}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Oyun içeriği */}
      <div className="connection-indicator">
        {connectionStatus === 'connected' ? '🟢 Bağlı' : '🔴 Bağlantı Kesildi'}
      </div>
      {roomData && <div>{/* Room data'yı göster */}</div>}
    </div>
  );
};

export default GamePage;
