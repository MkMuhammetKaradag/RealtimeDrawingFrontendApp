// src/pages/GamePage.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from '../../hooks/useGameWebSocket'; // Hook yolu güncellendi

import { useAppSelector } from '../../store/hooks';
import { selectUser } from '../../store/slices/authSlice';
import GameSettingsForm from '../../components/game/GameSettingsForm';
import GuessInputForm from '../../components/game/GuessInputForm'; // YENİ
import GameStatusInfo from '../../components/game/GameStatusInfo'; // YENİ
import ConnectionStatusCard from '../../components/common/ConnectionStatusCard'; // YENİ
import { updateGameMode } from '../../services/game.service';
import type {
  GameSettings,
  PlayerRole,
  GameStatus,
  WebSocketMessage,
} from '../../types/game.interface'; // YENİ ARAYÜZLER
import Paint from '../paint';

/**
 * Oyun Odası Bileşeni: Oyun mantığı, WebSocket iletişimi ve arayüzü yönetir.
 */
const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  // --- OYUN DURUMU YÖNETİMİ ---
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus>('idle');
  const [isRoomHost, setIsRoomHost] = useState(false); // Oda sahibi (Host) kontrolü
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    total_rounds: 2,
    round_duration: 60,
    max_players: 8,
    min_players: 2,
    game_mode_id: 1, // Varsayılan mod
  });
  const [isStatusInfoVisible, setIsStatusInfoVisible] = useState(true);

  // --- WEBSOCKET BAĞLANTISI ---
  const {
    connectionStatus,
    errorMessage,
    roomData,
    roomDrawData,
    sendMessage,
  } = useGameWebSocket({
    roomId: room_id || '',
    sessionToken: document.cookie.split('session=')[1], // Güvenli çerez okuma örneği
  });

  // --- AYAR DEĞİŞİKLİĞİ İŞLEME ve GÖNDERME FONKSİYONLARI ---

  /**
   * Ayar değişikliğini kontrol eder, local state'i günceller ve WS ile sunucuya gönderir.
   */
  const handleSettingChange = useCallback(
    (name: keyof GameSettings, value: number) => {
      // 1. Girdi Kontrolleri (Client-Side Validasyon)
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
        // Min/Max Tutarlılık Kontrolü
        if (name === 'min_players' && value > prevSettings.max_players) {
          console.warn(
            `Minimum oyuncu sayısı (${value}), maksimum oyuncu sayısından (${prevSettings.max_players}) büyük olamaz.`
          );
          return prevSettings; // Güncelleme yapma
        }

        // 2. Yeni ayar objesini oluştur
        const updatedSettings: GameSettings = {
          ...prevSettings,
          [name]: value,
        };

        // 3. WebSocket üzerinden sunucuya güncelleme mesajını gönder
        sendMessage({
          type: 'game_settings_update',
          content: updatedSettings,
        });

        // 4. Local state'i güncelle
        return updatedSettings;
      });
    },
    [sendMessage]
  );

  /**
   * Oyun Modunu API üzerinden günceller ve başarılı olursa local state'i günceller.
   */
  const handleUpdateGameMode = async (modeId: number) => {
    if (!room_id) return;

    try {
      await updateGameMode(room_id, modeId);

      // Başarılı olursa WS geri bildirimini beklemeden local state'i güncelle (Optimistic Update)
      setGameSettings((prevSettings) => ({
        ...prevSettings,
        game_mode_id: modeId,
      }));

      console.log(`Oyun Modu ID ${modeId} olarak güncellendi (API).`);
    } catch (error) {
      console.error('Oyun modu güncellenemedi:', error);
    }
  };

  /**
   * Oyunu başlatma mesajını sunucuya gönderir.
   */
  const handleStartGame = () => {
    sendMessage({
      type: 'game_started',
      content: {}, // Ayarlar sunucuda tutulmalı, bu mesaj sadece başlatma komutudur
    });
  };

  /**
   * Tahmin mesajını sunucuya gönderir. GuessInputForm'dan çağrılır.
   */
  const handleGuessSubmit = (guessText: string) => {
    sendMessage({
      type: 'player_move',
      content: {
        type: 'guess',
        text: guessText,
      },
    });
  };

  /**
   * Ayarlar formunda bulunan "Ayarları Güncelle" butonu için.
   * Güncel ayarları WS ile sunucuya tekrar gönderir.
   */
  const handleUpdatedSettingGame = () => {
    sendMessage({
      type: 'game_settings_update',
      content: {
        ...gameSettings,
      },
    });
  };

  // --- WEBSOCKET'TEN GELEN VERİLERİ İŞLEME (useEffect) ---
  useEffect(() => {
    if (!roomData) return;

    // TypeScript'te güvenli tür kontrolü için yardımcı fonksiyon
    const message = roomData as WebSocketMessage & any; // 'any' ile geçici olarak genişletme

    switch (message.type) {
      case 'game_started':
        setCurrentStatus('waiting');
        break;

      case 'game_over':
        setCurrentStatus('idle');
        setPlayerRole(null);
        break;

      case 'round_start_drawer':
        setCurrentStatus('started');
        setPlayerRole('drawer');
        break;

      case 'round_start_guesser':
        setCurrentStatus('started');
        setPlayerRole('guesser');
        break;

      case 'game_settings_updated':
        if (message.content) {
          // Sunucudan gelen ayarları güncelle (Tamamen güvenilir kaynak)
          setGameSettings(message.content as GameSettings);
          console.log('Oyun Ayarları (WS) Güncellendi:', message.content);
        }
        break;

      case 'game_status':
        if (message.game_data) {
          const data = message.game_data;
          const myId = currentUser?.id;

          // HOST KONTROLÜ
          if (data.mode_data?.HostId && myId === data.mode_data.HostId) {
            setIsRoomHost(true);
          } else {
            setIsRoomHost(false);
          }

          // AYARLARI AL
          if (data.mode_data?.Settings) {
            setGameSettings(data.mode_data.Settings);
          }

          // OYUN DURUMU KONTROLÜ
          if (data.state === 'in_progress') {
            setCurrentStatus('started');
            // Role belirleme mantığı: Eğer Skribbl tarzı (mode_id: 1) ise CurrentDrawer'a göre rol belirle
            if (data.mode_id == 1) {
              const currentDrawerId = data.mode_data.CurrentDrawer;
              setPlayerRole(currentDrawerId === myId ? 'drawer' : 'guesser');
            } else {
              // Diğer modlar için (örn. herkes çizebiliyorsa) varsayılan rolü ata
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
        // 'is_host' özelliğini güvenli bir şekilde kontrol et ve güncelle
        if ('is_host' in message) {
          setIsRoomHost(Boolean(message.is_host));
        }
        break;

      case 'game_mode_changed':
        if ('game_mode_id' in message.content) {
          const modeID = Number(message.content.game_mode_id);
          if (!isNaN(modeID)) {
            // Immutable (Değişmez) güncelleme kuralı
            setGameSettings((prev) => ({
              ...prev,
              game_mode_id: modeID,
            }));
            console.log(
              `Oyun Modu (WS) üzerinden ${modeID} olarak güncellendi.`
            );
          }
        }
        break;

      // Diğer mesaj tipleri buraya eklenebilir
      default:
        // console.log(`İşlenmeyen mesaj tipi: ${message.type}`, message);
        break;
    }
  }, [roomData, currentUser?.id]); // Bağımlılıklar: roomData her değiştiğinde ve kullanıcı ID'si değiştiğinde çalışır

  // --- RENDER (Bağlantı ve Hata Durumları) ---
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

  // --- ANA SAYFA RENDER'I ---
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="w-full max-w-7xl mx-auto p-4">
        {/* Başlık ve Bağlantı Bilgisi */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 p-4 bg-gray-800 rounded-xl shadow-lg">
          <div className="flex items-center space-x-4">
            <span
              className="text-white hover:cursor-pointer text-xl font-medium"
              onClick={() => navigate('/')}
            >
              🏠 Ana Sayfa
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
              WS Durum:{' '}
              {connectionStatus === 'connected' ? 'BAĞLI' : 'BAĞLANIYOR'}
            </span>
            {playerRole && (
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-indigo-600 text-white">
                ROL: {playerRole === 'drawer' ? 'ÇİZENSİN' : 'TAHMİN EDENSİN'}
              </span>
            )}
          </div>
        </header>

        {/* Ana İçerik Alanı: Ayarlar veya Oyun Alanı */}
        <div
          style={{ height: currentStatus === 'idle' ? 'auto' : '80vh' }}
          className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl border border-gray-100 flex flex-col"
        >
          {/* OYUN AYARLARI FORMU - Sadece 'idle' (oyun başlamadan önce) durumunda göster */}
          {currentStatus === 'idle' && (
            <GameSettingsForm
              settings={gameSettings}
              onSettingChange={handleSettingChange}
              onStartGame={handleStartGame}
              onUpdatedSetting={handleUpdatedSettingGame}
              onUpdateGameMode={handleUpdateGameMode}
              isHost={isRoomHost}
            />
          )}

          {/* OYUN BAŞLADIYSA: Çizim Alanı ve Tahmin */}
          {(currentStatus === 'started' || currentStatus === 'ended') && (
            <div className="relative w-full   h-full  flex-grow flex flex-col">
              {/* Oyun Durumu Bilgisi (Canvas'ın üstünde görünür) */}
              <GameStatusInfo
                gameStatus={currentStatus}
                playerRole={playerRole}
                isVisible={isStatusInfoVisible}
                onClose={() => setIsStatusInfoVisible(false)} // Gizleme işlevi
              />
              {/* Çizim Alanı */}
              <div
                className="flex-grow w-full relative min-h-60"
                // Sadece Guesser için, formun kapladığı alanı manuel olarak düşürüyoruz.
                // Örneğin, tahmin formu 80px yer kaplıyorsa:
                style={{
                  height:
                    currentStatus === 'started' && playerRole === 'guesser'
                      ? 'calc(100% - 80px)'
                      : '100%',
                }}
              >
                <Paint
                  key={`${playerRole}-${currentStatus}`}
                  role={playerRole}
                  gameStatus={currentStatus}
                  sendMessage={sendMessage}
                  roomDrawData={roomDrawData}
                />
              </div>
              {/* TAHMİN ALANI - SADECE GUESSER İÇİN GÖRÜNÜR (Canvas'ın altında yer alır) */}
              {currentStatus === 'started' && playerRole === 'guesser' && (
                <GuessInputForm
                  onGuessSubmit={handleGuessSubmit}
                  connectionStatus={connectionStatus}
                />
              )}
            </div>
          )}
        </div>

        {/* Alt Bilgi ve Debug Verisi */}
        <footer className="text-center text-gray-400 mt-8">
          {roomData && (
            <div className="mt-6 p-4 bg-gray-700 rounded-xl text-left text-sm overflow-auto max-h-48 shadow-inner">
              <p className="text-gray-300 font-bold mb-2">
                Son Oda Verisi (Hata Ayıklama)
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
