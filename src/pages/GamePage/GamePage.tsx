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
      setRole(null);
    } else if (roomData.type === 'round_start_drawer') {
      setGameStatus('started');
      setRole('drawer');
    } else if (roomData.type === 'round_start_guesser') {
      setGameStatus('started');
      setRole('guesser');
    }
  }, [roomData]);

  // --- Bağlantı Durumu Kartı (Daha Modern Hata Görüntüsü) ---
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="text-white text-xl ml-4">Odaya bağlanılıyor...</p>
      </div>
    );
  }

  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white border-t-4 border-red-600 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-red-600 mb-4 text-center">
            Bağlantı Kesildi! 🔴
          </h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            Sunucuyla bağlantı koptu. Lütfen internet bağlantınızı kontrol edin.
            {errorMessage && (
              <span className="block text-sm text-red-500 mt-2">
                Hata: {errorMessage}
              </span>
            )}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-[1.01]"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  // --- Ana Oyun Sayfası (Modern Tasarım) ---
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-gray-800 rounded-xl shadow-lg">
          <h1 className="text-3xl font-extrabold text-indigo-400">
            🎨 Oyun Odası: {room_id}
          </h1>
          <div className="mt-2 sm:mt-0 flex items-center space-x-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-green-500 text-white'
                  : 'bg-yellow-500 text-gray-900'
              }`}
            >
              Durum: {connectionStatus === 'connected' ? 'BAĞLI' : 'BAĞLANIYOR'}
            </span>
            {role && (
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-indigo-600 text-white">
                ROL: {role === 'drawer' ? 'ÇİZENSİN' : 'TAHMİN EDENSİN'}
              </span>
            )}
          </div>
        </header>

        {/* Ana İçerik Kartı */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-100">
          {/* Oyun Durumu Mesajları */}
          {gameStatus === 'started' && (
            <p className="text-center text-2xl font-black text-green-600 mb-6 bg-green-50 p-3 rounded-lg border-l-4 border-green-600">
              Oyun BAŞLADI! 🚀
            </p>
          )}
          {gameStatus === 'ended' && (
            <p className="text-center text-2xl font-black text-red-600 mb-6 bg-red-50 p-3 rounded-lg border-l-4 border-red-600">
              Oyun SONA ERDİ. 🏁
            </p>
          )}

          {/* Hazırım Butonu (Rol Atanmadan Önce) */}
          {role === null && gameStatus !== 'ended' && (
            <div className="text-center mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-xl font-semibold text-indigo-700 mb-4">
                Rolünüzü Bekliyorsunuz. Hazır mısınız?
              </p>
              <button
                onClick={() => sendMessage({ type: 'game_started' })}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg transition-all duration-200 hover:bg-indigo-700 transform hover:scale-105 active:scale-95"
              >
                HEMEN BAŞLA!
              </button>
              <p className="mt-4 text-gray-600 text-sm">
                Oyunun başlaması için tüm oyuncuların hazır olması gerekir.
              </p>
            </div>
          )}

          {/* Çizim Alanı (Paint Componenti) */}
          <Paint
            role={role}
            gameStatus={gameStatus}
            sendMessage={sendMessage}
            roomDrawData={roomDrawData}
          />
        </div>

        {/* Alt Bilgi ve Konsol Verisi */}
        <footer className="text-center text-gray-400 mt-8">
          {role === 'guesser' && (
            <p className="text-lg font-medium text-indigo-300">
              Sıra çizen oyuncuda. Gözleriniz tuvalde!
            </p>
          )}

          {/* Debug/Son Veri Alanı */}
          {roomData && (
            <div className="mt-6 p-4 bg-gray-700 rounded-xl text-left text-sm overflow-auto max-h-48 shadow-inner">
              <p className="text-gray-300 font-bold mb-2">
                Son Oda Verisi (Debug)
              </p>
              <pre className="text-gray-400 whitespace-pre-wrap">
                {JSON.stringify(roomData, null, 2)}
              </pre>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default GamePage;
