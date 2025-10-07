import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from './useGameWebSocket.ts';
import Paint from '../paint/index.tsx';

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<'drawer' | 'guesser' | null>(null);
  const [gameStatus, setGameStatus] = useState<'idle' | 'started' | 'ended'>(
    'idle'
  );

  const {
    connectionStatus,
    errorMessage,
    roomData,
    roomDrawData,
    sendMessage,
  } = useGameWebSocket({
    roomId: room_id || '',
    sessionToken: document.cookie.split('session=')[1],
  });

  const [showJsonInput, setShowJsonInput] = useState(false);

  // Uzak sunucudan gelen verileri işlemek için useEffect
  useEffect(() => {
    if (!roomData) return;

    if (roomData.type === 'canvas_update') {
      console.log('Canvas güncellemesi alındı:', roomData);
    } else if (roomData.type === 'game_started') {
      setGameStatus('started');
    } else if (roomData.type === 'game_over') {
      setGameStatus('ended');
      // Oyun bittiğinde oyuncu rolünü sıfırlayabiliriz
      setRole(null);
    } else if (roomData.type === 'round_start_drawer') setRole('drawer');
    else if (roomData.type === 'round_start_guesser') setRole('guesser');
  }, [roomData]);

  if (connectionStatus === 'connecting') {
    return <p>Odaya bağlanılıyor...</p>;
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    // disconnected durumunu ekleyin
    return (
      <div className="text-center p-8 bg-red-100 border border-red-400 rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Bağlantı Kesildi! 🔴
        </h2>
        <p className="text-lg text-red-700 mb-4">
          İnternet bağlantınızı kontrol edin veya sunucuyla bağlantı koptu.
          {errorMessage && <span> Hata: {errorMessage}</span>}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors font-semibold"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8">
      <div className=" w-full  max-w-7xl mx-auto ">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          🎨 Oyun Odası: {room_id}{' '}
          {role && `(${role === 'drawer' ? 'Çizen' : 'Tahmin Eden'})`}
        </h1>

        <p className="text-center text-lg mb-4">
          Durum:{' '}
          {connectionStatus === 'connected' ? 'Bağlı! 🟢' : 'Bağlanıyor...'}
        </p>

        {/* 3. Oyun durumu mesajlarını gösterin */}
        {gameStatus === 'started' && (
          <p className="text-center text-2xl font-extrabold text-green-700 mb-6 animate-pulse">
            Oyun Başladı! 🚀 Çizime Başlayın!
          </p>
        )}
        {gameStatus === 'ended' && (
          <p className="text-center text-2xl font-extrabold text-red-700 mb-6">
            Oyun Sona Erdi. 🏁 Skorları Kontrol Edin.
          </p>
        )}

        {role === null &&
          gameStatus !== 'ended' && ( // Oyun bitmediyse Hazırım butonu görünsün
            <div className="text-center mb-6">
              {' '}
              <button
                onClick={() => sendMessage({ type: 'game_started' })}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors font-semibold"
              >
                Hazırım!{' '}
              </button>{' '}
              <p className="mt-2 text-gray-600">
                Oyunun başlamasını bekleyin. Rolünüz atandığında çizim araçları
                görünür.{' '}
              </p>{' '}
            </div>
          )}

        <Paint
          role={role}
          gameStatus={gameStatus}
          sendMessage={sendMessage}
          roomDrawData={roomDrawData}
        ></Paint>

        <div className="text-center text-gray-600 mt-6">
          {role === 'guesser' && (
            <p>Sıra çizen oyuncuda. Çizimi izleyin ve tahmin etmeye çalışın!</p>
          )}
          <p>Çizim yaptıkça veriler konsola yazdırılacaktır 🎨</p>
          {roomData && (
            <pre className="mt-4 p-2 bg-gray-100 rounded-lg text-left text-sm overflow-auto max-h-48">
              Son Oda Verisi: {JSON.stringify(roomData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
