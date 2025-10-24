// src/pages/GamePage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from '../../hooks/useGameWebSocket';
import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import GameSettingsForm from '../../components/game/GameSettingsForm';
import GuessInputForm from '../../components/game/GuessInputForm';
import GameStatusInfo from '../../components/game/GameStatusInfo';
import ConnectionStatusCard from '../../components/common/ConnectionStatusCard';
import { LeaveRoom, updateGameMode } from '../../services/game.service';
import type {
  GameSettings,
  PlayerRole,
  GameStatus,
  WebSocketMessage,
} from '../../types/game.interface';
import Paint from '../paint';

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  // Oyun durumu state'leri
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus>('idle');
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    total_rounds: 2,
    round_duration: 60,
    max_players: 8,
    min_players: 2,
    game_mode_id: 1,
  });
  const [isStatusInfoVisible, setIsStatusInfoVisible] = useState(true);
  const [gameOverData, setGameOverData] = useState<any>(null);

  // WebSocket bağlantısı
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

  // Ayar değişikliği işleme
  const handleSettingChange = useCallback(
    (name: keyof GameSettings, value: number) => {
      if (value < 1) {
        console.warn(`${name} için minimum değer 1 olmalıdır.`);
        return;
      }
      if (name === 'max_players' && value > 10) {
        console.warn(`Maksimum oyuncu sayısı 10'u geçemez.`);
        return;
      }
      if (name === 'total_rounds' && value > 10) {
        console.warn(`Round sayısı 10'u geçemez.`);
        return;
      }

      setGameSettings((prevSettings) => {
        if (name === 'min_players' && value > prevSettings.max_players) {
          console.warn(
            `Minimum oyuncu sayısı (${value}), maksimum oyuncu sayısından (${prevSettings.max_players}) büyük olamaz.`
          );
          return prevSettings;
        }

        const updatedSettings: GameSettings = {
          ...prevSettings,
          [name]: value,
        };

        sendMessage({
          type: 'game_settings_update',
          content: updatedSettings,
        });

        return updatedSettings;
      });
    },
    [sendMessage]
  );
  const handleNewGame = useCallback(() => {
    // Tüm game state'lerini sıfırla
    setPlayerRole(null);
    setCurrentStatus('idle');
    setIsStatusInfoVisible(true);
    setGameOverData(null);

    // console.log("Yeni oyun başlatıldı, tüm state'ler sıfırlandı.");
  }, []);

  // Oyun modu güncelleme
  const handleUpdateGameMode = async (modeId: number) => {
    if (!room_id) return;

    try {
      await updateGameMode(room_id, modeId);
      setGameSettings((prevSettings) => ({
        ...prevSettings,
        game_mode_id: modeId,
      }));
      // console.log(`Oyun Modu ID ${modeId} olarak güncellendi (API).`);
    } catch (error) {
      console.error('Oyun modu güncellenemedi:', error);
    }
  };

  // Oyun başlatma
  const handleStartGame = () => {
    sendMessage({
      type: 'game_started',
      content: {},
    });
  };

  // Tahmin gönderme
  const handleGuessSubmit = (guessText: string) => {
    sendMessage({
      type: 'player_move',
      content: {
        type: 'guess',
        text: guessText,
      },
    });
  };
  const handleActionLeaveRoom = async () => {
    if (!room_id) return;
    try {
      await LeaveRoom(room_id);
      navigate('/');
    } catch (error) {
      console.error('Odadan ayrılırken hata oluştu:', error);
    }
  };

  // Ayarları güncelleme
  const handleUpdatedSettingGame = () => {
    sendMessage({
      type: 'game_settings_update',
      content: {
        ...gameSettings,
      },
    });
  };

  // WebSocket verilerini işleme
  useEffect(() => {
    if (!roomData) return;

    const message = roomData as WebSocketMessage & any;

    switch (message.type) {
      case 'game_started':
        setCurrentStatus('waiting');
        break;

      case 'game_over':
        setCurrentStatus('ended');
        setPlayerRole(null);
        setGameOverData(message.content);
        break;

      case 'round_start_drawer':
        setCurrentStatus('started');
        setPlayerRole('drawer');
        break;
      case 'round_preparation':
        setPlayerRole(null);
        break;
      case 'round_start_guesser':
        setCurrentStatus('started');
        setPlayerRole('guesser');
        break;

      case 'game_settings_updated':
        if (message.content) {
          setGameSettings(message.content as GameSettings);
          // console.log('Oyun Ayarları (WS) Güncellendi:', message.content);
        }
        break;

      case 'game_status':
        if (message.game_data) {
          const data = message.game_data;
          const myId = currentUser?.id;
          // console.log('Gelen Oyun Durumu Verisi:', message);
          if (message.is_host === true) {
            setIsRoomHost(true);
          } else {
            setIsRoomHost(false);
          }

          if (data.mode_data?.Settings) {
            setGameSettings(data.mode_data.Settings);
          }

          if (data.state === 'in_progress') {
            setCurrentStatus('started');
            if (data.mode_id == 1) {
              const currentDrawerId = data.active_player;
              setPlayerRole(currentDrawerId === myId ? 'drawer' : 'guesser');
            } else {
              setPlayerRole('drawer');
            }
          } else if (data.state === 'finished' || data.state === 'over') {
            setCurrentStatus('ended');
            setPlayerRole(null);
          } else if (data.state === 'waiting_for_players') {
            setCurrentStatus('idle');
            setPlayerRole(null);
          }
        }
        break;

      case 'room_status':
        if ('is_host' in message) {
          setIsRoomHost(Boolean(message.is_host));
        }
        break;

      case 'game_mode_changed':
        if ('game_mode_id' in message.content) {
          const modeID = Number(message.content.game_mode_id);
          if (!isNaN(modeID)) {
            setGameSettings((prev) => ({
              ...prev,
              game_mode_id: modeID,
            }));
            // console.log(
            //   `Oyun Modu (WS) üzerinden ${modeID} olarak güncellendi.`
            // );
          }
        }
        break;

      default:
        break;
    }
  }, [roomData, currentUser?.id]);

  // Bağlantı durumu hatalarını göster
  if (
    connectionStatus === 'connecting' ||
    connectionStatus === 'error' ||
    connectionStatus === 'disconnected'
  ) {
    return (
      <ConnectionStatusCard
        status={connectionStatus as 'connecting' | 'error' | 'disconnected'}
        errorMessage={errorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header - Koyu tema ve gradient butonlar */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>🏠</span>
              Ana Sayfa
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                <span className="mr-2">🎨</span>
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Oyun Odası
                </span>
              </h1>
              <p className="text-gray-400 text-sm mt-1">Oda ID: {room_id}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div
              className={`px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold ${'bg-gradient-to-r from-yellow-600 to-amber-600 text-gray-900'}`}
              onClick={handleActionLeaveRoom}
            >
              Ayrıl
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                connectionStatus === 'connected'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-gradient-to-r from-yellow-600 to-amber-600 text-gray-900'
              }`}
            >
              {connectionStatus === 'connected' ? '✅ BAĞLI' : '🔄 BAĞLANIYOR'}
            </div>

            {playerRole && (
              <div
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  playerRole === 'drawer'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                }`}
              >
                {playerRole === 'drawer'
                  ? '🎨 ÇİZİYORSUN'
                  : '🔍 TAHMİN EDİYORSUN'}
              </div>
            )}
          </div>
        </header>

        {/* Ana İçerik Alanı */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Oyun Ayarları - Sadece idle durumunda */}
          {currentStatus === 'idle' && (
            <div className="p-6 md:p-8">
              <GameSettingsForm
                settings={gameSettings}
                onSettingChange={handleSettingChange}
                onStartGame={handleStartGame}
                onUpdatedSetting={handleUpdatedSettingGame}
                onUpdateGameMode={handleUpdateGameMode}
                isHost={isRoomHost}
              />
            </div>
          )}

          {/* Oyun Alanı - Oyun başladığında veya bittiğinde */}
          {(currentStatus === 'started' || currentStatus === 'ended') && (
            <div className="flex flex-col">
              {/* Oyun Durumu Bilgisi */}
              <div className="px-6 pt-6">
                <GameStatusInfo
                  gameStatus={currentStatus}
                  playerRole={playerRole}
                  isVisible={isStatusInfoVisible}
                  onClose={() => setIsStatusInfoVisible(false)}
                />
              </div>

              {/* Çizim ve Tahmin Alanı */}
              <div className="flex-1 flex flex-col p-6">
                <div
                  className={`flex-1 relative rounded-xl overflow-hidden border-2 ${
                    currentStatus === 'ended'
                      ? 'border-yellow-500/50'
                      : 'border-gray-600'
                  }`}
                >
                  <Paint
                    key={`${playerRole}-${currentStatus}`}
                    role={playerRole}
                    gameStatus={currentStatus}
                    sendMessage={sendMessage}
                    roomDrawData={roomDrawData}
                    gameOverData={gameOverData}
                    onNewGame={handleNewGame}
                  />
                </div>

                {/* Tahmin Input - Sadece guesser için */}
                {currentStatus === 'started' && playerRole === 'guesser' && (
                  <div className="mt-4">
                    <GuessInputForm
                      onGuessSubmit={handleGuessSubmit}
                      connectionStatus={connectionStatus}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Debug Bilgisi - Geliştirici için */}
        {roomData && process.env.NODE_ENV === 'development' && (
          <footer className="mt-6 p-6 bg-gray-800/50 rounded-2xl border border-gray-700/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 font-bold text-sm">
                🐛 Debug Bilgisi (Geliştirici Modu)
              </h3>
              <span className="text-xs text-gray-500">Oda ID: {room_id}</span>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 max-h-48 overflow-auto">
              <pre className="text-gray-400 text-xs whitespace-pre-wrap">
                {JSON.stringify(roomData, null, 2)}
              </pre>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default GamePage;
