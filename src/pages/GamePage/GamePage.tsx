import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from './useGameWebSocket.ts';
import DrawingCanvas, {
  type RealtimePointPayload,
} from '../../components/home/DrawingCanvas.tsx';

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const [role, setRole] = useState<'drawer' | 'guesser' | null>(null);
  const navigate = useNavigate();
  // Yeni state: Uzak sunucudan gelen çizim noktalarını tutmak için
  const [remoteDrawingPoint, setRemoteDrawingPoint] =
    useState<RealtimePointPayload | null>(null);

  const { connectionStatus, errorMessage, roomData, sendMessage } =
    useGameWebSocket({
      roomId: room_id || '',
      sessionToken: document.cookie.split('session=')[1], // çerezden session al
    });

  useEffect(() => {
    if (!roomData) return;

    if (roomData.type === 'canvas_update') {
      console.log('Canvas güncellemesi alındı:', roomData);

      try {
        // 🚨 DÜZELTME BURADA: content.data'yı JSON.parse() ile objeye dönüştür
        const parsedData = JSON.parse(roomData.content.data);

        // Şimdi ayrıştırılmış objeyi kullanabilirsiniz
        // parsedData bir RealtimePointPayload tipinde olmalı
        setRemoteDrawingPoint(parsedData as RealtimePointPayload);
      } catch (error) {
        console.error(
          'Canvas verisi JSON ayrıştırma hatası:',
          error,
          roomData.content.data
        );
      }
    }

    if (roomData.type === 'round_start_drawer') setRole('drawer');
    if (roomData.type === 'round_start_guesser') setRole('guesser');
  }, [roomData]);

  if (connectionStatus === 'connecting') {
    return <p>Odaya bağlanılıyor...</p>;
  }

  if (connectionStatus === 'error') {
    return (
      <div>
        <p>Hata: {errorMessage}</p>
        <button onClick={() => window.location.reload()}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div>
      <p>Bağlı! 🟢</p>
      {roomData && <pre>{JSON.stringify(roomData, null, 2)}</pre>}
      <button onClick={() => sendMessage({ type: 'ready' })}>Hazırım!</button>
      <DrawingCanvas
        canDraw={role === 'drawer'}
        sendMessage={sendMessage}
        remoteDrawingPoint={remoteDrawingPoint} // Yeni prop: Uzaktan gelen çizim noktası
      />
    </div>
  );
};
export default GamePage;
