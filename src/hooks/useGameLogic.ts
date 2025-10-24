import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameWebSocket } from './useGameWebSocket'; // Farz edilen hook
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/slices/authSlice';
import { LeaveRoom, updateGameMode } from '../services/game.service';
import type {
  GameSettings,
  PlayerRole,
  GameStatus,
  WebSocketMessage,
} from '../types/game.interface';

interface UseGameLogicProps {
  roomId: string;
  sessionToken: string;
}

const DEFAULT_SETTINGS: GameSettings = {
  total_rounds: 2,
  round_duration: 60,
  max_players: 8,
  min_players: 2,
  game_mode_id: 1,
};

const useGameLogic = ({ roomId, sessionToken }: UseGameLogicProps) => {
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  // ************ STATE YÖNETİMİ ************
  const [playerRole, setPlayerRole] = useState<PlayerRole>(null);
  const [currentStatus, setCurrentStatus] = useState<GameStatus>('idle');
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [gameSettings, setGameSettings] =
    useState<GameSettings>(DEFAULT_SETTINGS);
  const [isStatusInfoVisible, setIsStatusInfoVisible] = useState(true);
  const [gameOverData, setGameOverData] = useState<any>(null);

  // ************ WEBSOCKET BAĞLANTISI ************
  const {
    connectionStatus,
    errorMessage,
    roomData,
    roomDrawData,
    sendMessage,
  } = useGameWebSocket({ roomId, sessionToken });

  // ************ HANDLER FONKSİYONLARI ************

  // Ayar Değişikliğini Yönetme
  const handleSettingChange = useCallback(
    (name: keyof GameSettings, value: number) => {
      // Basit doğrulama mantığı (eski bileşenden taşındı)
      if (value < 1)
        return console.warn(`${name} için minimum değer 1 olmalıdır.`);
      if (name === 'max_players' && value > 10)
        return console.warn(`Maksimum oyuncu sayısı 10'u geçemez.`);
      if (name === 'total_rounds' && value > 10)
        return console.warn(`Round sayısı 10'u geçemez.`);

      setGameSettings((prevSettings) => {
        if (name === 'min_players' && value > prevSettings.max_players) {
          return prevSettings; // Değişikliği reddet
        }

        const updatedSettings: GameSettings = {
          ...prevSettings,
          [name]: value,
        };

        // Ayar değişikliğini WS üzerinden diğer oyunculara gönder
        sendMessage({ type: 'game_settings_update', content: updatedSettings });
        return updatedSettings;
      });
    },
    [sendMessage]
  );

  // Yeni Oyun Başlatma (Oyun Bittiğinde State Sıfırlama)
  const handleNewGame = useCallback(() => {
    setPlayerRole(null);
    setCurrentStatus('idle');
    setIsStatusInfoVisible(true);
    setGameOverData(null);
    // WS üzerinden yeni oyun başlatma isteği göndermek gerekebilir
  }, []);

  // Oyun Modunu Güncelleme (API üzerinden)
  const handleUpdateGameMode = async (modeId: number) => {
    if (!roomId) return;
    try {
      await updateGameMode(roomId, modeId);
      // setGameSettings WS mesajıyla güncellenecektir
    } catch (error) {
      console.error('Oyun modu güncellenemedi:', error);
    }
  };

  // Oyun Başlatma (WS üzerinden)
  const handleStartGame = () => {
    sendMessage({ type: 'game_started', content: {} });
  };

  // Tahmin Gönderme (WS üzerinden)
  const handleGuessSubmit = (guessText: string) => {
    sendMessage({
      type: 'player_move',
      content: { type: 'guess', text: guessText },
    });
  };

  // Odadan Ayrılma (API üzerinden)
  const handleActionLeaveRoom = async () => {
    if (!roomId) return;
    try {
      await LeaveRoom(roomId);
      navigate('/');
    } catch (error) {
      console.error('Odadan ayrılırken hata oluştu:', error);
    }
  };

  // WS Ayarlarını Güncelleme (Sadece Host için)
  const handleUpdatedSettingGame = () => {
    sendMessage({ type: 'game_settings_update', content: { ...gameSettings } });
  };

  const handleCloseStatusInfo = () => setIsStatusInfoVisible(false);

  // ************ WEBSOCKET MESAJ İŞLEME ************
  useEffect(() => {
    if (!roomData) return;
    const message = roomData as WebSocketMessage & any;
    const myId = currentUser?.id;

    // Mesaj Türü İşleme (Switch-Case Bloğu)
    switch (message.type) {
      case 'game_started':
        setCurrentStatus('waiting');
        break;
      case 'game_over':
        setCurrentStatus('ended');
        setPlayerRole(null);
        setGameOverData(message.content);
        break;
      // ... (Diğer tüm case'ler buraya taşınır: round_start_drawer, round_start_guesser, game_settings_updated, game_status, room_status, game_mode_changed)

      case 'round_start_drawer':
      case 'round_start_guesser':
        setCurrentStatus('started');
        setPlayerRole(message.type.includes('drawer') ? 'drawer' : 'guesser');
        break;
      case 'game_settings_updated':
        if (message.content) {
          setGameSettings(message.content as GameSettings);
        }
        break;
      case 'game_status':
        if (message.game_data) {
          const data = message.game_data;
          setIsRoomHost(Boolean(message.is_host));
          if (data.mode_data?.Settings)
            setGameSettings(data.mode_data.Settings);

          if (data.state === 'in_progress') {
            setCurrentStatus('started');
            const isDrawer = data.active_player === myId;
            setPlayerRole(isDrawer ? 'drawer' : 'guesser');
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
        if ('is_host' in message) setIsRoomHost(Boolean(message.is_host));
        break;
      case 'game_mode_changed':
        const modeID = Number(message.content.game_mode_id);
        if (!isNaN(modeID)) {
          setGameSettings((prev) => ({ ...prev, game_mode_id: modeID }));
        }
        break;
      case 'round_preparation':
        setPlayerRole(null);
        break;
      default:
        break;
    }
  }, [roomData, currentUser?.id]);

  // ************ DÖNÜŞ DEĞERLERİ ************
  return {
    // State Değerleri
    connectionStatus,
    errorMessage,
    playerRole,
    currentStatus,
    isRoomHost,
    gameSettings,
    roomDrawData,
    gameOverData,
    isStatusInfoVisible,

    // Handler Fonksiyonları
    sendMessage, // Paint bileşeni için
    handleActionLeaveRoom,
    handleStartGame,
    handleSettingChange,
    handleUpdatedSettingGame,
    handleUpdateGameMode,
    handleGuessSubmit,
    handleNewGame,
    handleCloseStatusInfo,
  };
};

export default useGameLogic;
