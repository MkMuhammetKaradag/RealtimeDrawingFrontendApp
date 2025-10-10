// src/pages/GamePage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from './useGameWebSocket.ts';
import Paint from '../paint/index.tsx';
import { useAppSelector } from '../../store/hooks.ts';
import { selectUser } from '../../store/slices/authSlice.ts';
import GameSettingsForm from '../../components/game/GameSettingsForm.tsx';
// Yeni bileşeni import et

// Ayar türlerini tanımlayalım (Backend'den beklenen format)
interface GameSettings {
  total_rounds: number;
  round_duration: number; // Saniye
  max_players: number;
  min_players: number;
}

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [guess, setGuess] = useState('');
  const [role, setRole] = useState<'drawer' | 'guesser' | null>(null);
  const [gameStatus, setGameStatus] = useState<
    'idle' | 'started' | 'ended' | 'waiting'
  >('idle');
  // Yeni: Oda ayarlarını tutmak için state
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    total_rounds: 5,
    round_duration: 60,
    max_players: 8,
    min_players: 2,
  });
  // Yeni: Oda sahibi (host) kontrolü
  const [isHost, setIsHost] = useState(true); // Varsayılan olarak true, backend'den güncellenmeli

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

  // Ayar Değişikliklerini İşlemek ve WebSocket ile Göndermek İçin Fonksiyon
  const handleSettingChange = (name: keyof GameSettings, value: number) => {
    // **1. Güncel ayarları hesapla**

    if (value < 1) {
      console.warn(
        `${name} için minimum değer 1 olmalıdır. İşlem iptal edildi.`
      );
      // Kullanıcıya geri bildirim göstermek isteyebilirsiniz (örn. toast mesajı)
      return;
    }

    // b) Özel Kısıtlamalar
    if (name === 'max_players' && value > 10) {
      console.warn(`Maksimum oyuncu sayısı 10'u geçemez. İşlem iptal edildi.`);
      // Kullanıcıya hata mesajı gösterin
      return;
    }
    if (name === 'total_rounds' && value > 10) {
      console.warn(`Round sayısı 10'u geçemez. İşlem iptal edildi.`);
      // Kullanıcıya hata mesajı gösterin
      return;
    }
    // c) Minimum ve Maksimum Oyuncu Tutarlılığı Kontrolü (Gelişmiş)
    if (name === 'min_players') {
      // Eğer girilen min değer, mevcut max değerden büyükse
      if (value > gameSettings.max_players) {
        console.warn(
          `Minimum oyuncu sayısı (${value}), maksimum oyuncu sayısından (${gameSettings.max_players}) büyük olamaz.`
        );
        return;
      }
    }
    // Bu, state'in asenkron doğasını atlatan ve her zaman en güncel bilgiyi baz alan en güvenli yöntemdir.
    setGameSettings((prevSettings) => {
      // 2. Yeni ayar objesini oluştur
      const updatedSettings: GameSettings = {
        ...prevSettings,
        [name]: value,
      };

      // 3. WebSocket üzerinden sunucuya ayar güncelleme mesajını gönder
      // NOT: Bu, state'in güncellenmesini beklemez, güncellemek istediğimiz değeri gönderir.
      sendMessage({
        type: 'game_settings_update',
        content: { ...updatedSettings }, // Hesaplanan updatedSettings'i kullan
      });

      // 4. Local state'i güncelle (React bunu asenkron yapar)
      return updatedSettings;
    });
  };
  // Oyunu Başlatma Fonksiyonu
  const handleStartGame = () => {
    // Oyun Başlatma mesajını gönderirken güncel ayarları ekle
    sendMessage({
      type: 'game_started',
      content: {
        //settings: gameSettings,
      },
    });
  };

  const handleUpdatedSettingGame = () => {
    // Oyun Başlatma mesajını gönderirken güncel ayarları ekle
    console.log(gameSettings);
    sendMessage({
      type: 'game_settings_update',
      content: {
        ...gameSettings,
      },
    });
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;

    sendMessage({
      type: 'player_move',
      content: {
        type: 'guess',
        text: guess.trim(),
      },
    });
    setGuess('');
  };

  // Uzak sunucudan gelen verileri işlemek için useEffect
  useEffect(() => {
    if (!roomData) return;

    if (roomData.type === 'canvas_update') {
      console.log('Canvas güncellemesi alındı:', roomData);
    } else if (roomData.type === 'game_started') {
      setGameStatus('waiting');
    } else if (roomData.type === 'game_over') {
      setGameStatus('ended');
      setRole(null);
    } else if (roomData.type === 'round_start_drawer') {
      setGameStatus('started');
      setRole('drawer');
    } else if (roomData.type === 'round_start_guesser') {
      setGameStatus('started');
      setRole('guesser');
    } else if (
      roomData.type === 'game_settings_updated' &&
      'content' in roomData
    ) {
      // Sunucudan gelen ayarları güncelle
      const newSettings = roomData.content as GameSettings;
      setGameSettings(newSettings);
      console.log('Oyun Ayarları Güncellendi:', newSettings);
    } else if (roomData.type === 'game_status') {
      if ('game_data' in roomData) {
        const data = (roomData as unknown as { game_data: any }).game_data;
        const myId = user?.id;

        // HOST KONTROLÜ: Sunucudan gelen veride host ID'si varsa kontrol et
        if (data.mode_data.HostId && myId === data.mode_data.HostId) {
          setIsHost(true);
        } else {
          setIsHost(false);
        }

        // Sunucudan gelen ayarları al
        if (data.mode_data.Settings) {
          setGameSettings(data.mode_data.Settings);
        }

        if (data.state === 'in_progress') {
          setGameStatus('started');
          const currentDrawerId = data.mode_data.CurrentDrawer;
          setRole(currentDrawerId === myId ? 'drawer' : 'guesser');
        } else if (data.state === 'finished' || data.state === 'over') {
          setGameStatus('idle');
          setRole(null);
        } else if (data.state === 'waiting_for_players') {
          // Oyun başlamadan önceki bekleme durumu
          setGameStatus('idle');
          setRole(null);
        }
      } else {
        console.warn(
          'Beklenmeyen game_status mesajı: game_data eksik',
          roomData
        );
      }
    }
  }, [roomData, user?.id]);

  // --- Bağlantı Durumu Kartı --- (Değişmedi)

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

  // --- Ana Oyun Sayfası ---
  return (
    <div className="min-h-screen">
      <div className="w-full max-w-7xl mx-auto p-4">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4">
            <span
              className="text-white hover:cursor-pointer text-xl font-medium"
              onClick={() => navigate('/')}
            >
              🏠 Home
            </span>
            <h1 className="text-3xl font-extrabold text-indigo-400">
              🎨 Oyun Odası: {room_id}
            </h1>
          </div>
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

        {/* Ana İçerik Alanı */}
        <div
          style={{ height: gameStatus === 'idle' ? 'auto' : '80vh' }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-100"
        >
          {/* OYUN AYARLARI FORMU - Sadece 'idle' durumunda göster */}
          {gameStatus === 'idle' && (
            <GameSettingsForm
              settings={gameSettings}
              onSettingChange={handleSettingChange}
              onStartGame={handleStartGame}
              onUpdatedSetting={handleUpdatedSettingGame}
              isHost={isHost}
            />
          )}

          {/* OYUN BAŞLADIYSA: Çizim Alanı ve Tahmin */}
          {gameStatus === 'started' && (
            <>
              {role === 'drawer' && (
                <p className="text-center text-2xl font-black text-green-600 mb-6 bg-green-50 p-3 rounded-lg border-l-4 border-green-600">
                  Çizeceğiniz Kelime
                </p>
              )}
              <Paint
                role={role}
                gameStatus={gameStatus}
                sendMessage={sendMessage}
                roomDrawData={roomDrawData}
              />

              {/* TAHMİN ALANI - SADECE GUESSER İÇİN GÖRÜNÜR */}
              {role === 'guesser' && (
                <form
                  onSubmit={handleGuessSubmit}
                  className="mt-6 flex flex-col md:flex-row gap-3"
                >
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Tahmininizi buraya yazın..."
                    className="flex-grow p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition duration-150"
                    disabled={connectionStatus !== 'connected'}
                  />
                  <button
                    type="submit"
                    className="md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
                    disabled={!guess.trim() || connectionStatus !== 'connected'}
                  >
                    TAHMİN ET! 💬
                  </button>
                </form>
              )}
            </>
          )}

          {/* OYUN SONA ERDİ MESAJI */}
          {gameStatus === 'ended' && (
            <p className="text-center text-2xl font-black text-red-600 mb-6 bg-red-50 p-3 rounded-lg border-l-4 border-red-600">
              Oyun SONA ERDİ. 🏁
            </p>
          )}
        </div>

        {/* Alt Bilgi ve Konsol Verisi */}
        <footer className="text-center text-gray-400 mt-8">
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
