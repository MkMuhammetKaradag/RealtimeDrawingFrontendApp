// src/components/game/GameStatusInfo.tsx
import React from 'react';
// types/game.interface yolu GamePage.tsx'te interfaces/game.interface olarak güncellendiğini varsayalım
import type { GameStatus, PlayerRole } from '../../types/game.interface'; // Veya kendi types yolunuzu kullanın

interface GameStatusInfoProps {
  gameStatus: GameStatus;
  playerRole: PlayerRole;
  isVisible: boolean;
  onClose: () => void; // Gizleme düğmesine tıklandığında çağrılacak fonksiyon
}

/**
 * Oyunun mevcut durumuna göre kullanıcıya bilgi mesajı gösteren ve
 * Canvas'ın üstünde konumlanan bileşen.
 */
const GameStatusInfo: React.FC<GameStatusInfoProps> = ({
  gameStatus,
  playerRole,
  isVisible,
  onClose,
}) => {
  if (!isVisible) {
    return null; // Gizliyse hiçbir şey döndürme
  }

  let messageText = '';
  let messageClass = '';

  if (gameStatus === 'started' && playerRole === 'drawer') {
    messageText = 'Çizeceğiniz Kelime';
    messageClass = 'text-green-600 bg-green-50 border-green-600';
  } else if (gameStatus === 'ended') {
    messageText = 'Oyun SONA ERDİ. 🏁';
    messageClass = 'text-red-600 bg-red-50 border-red-600';
  } else if (gameStatus === 'waiting') {
    // Opsiyonel: Round başlangıcını bekleme durumu
    messageText = 'Yeni Tur Başlıyor...';
    messageClass = 'text-yellow-600 bg-yellow-50 border-yellow-600';
  } else {
    return null; // Başlatılmadıysa ve idle ise gösterme
  }

  return (
    // position-absolute ve z-10 ile Canvas'ın üstüne çıkarıyoruz.
    // top-4 ve left-1/2 -translate-x-1/2 ile üstte ortalıyoruz.
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-auto max-w-lg transition-all duration-300">
      <div
        className={`relative flex items-center justify-between p-3 pr-10 rounded-lg shadow-lg border-l-4 font-black ${messageClass}`}
      >
        <p className="text-center text-xl mr-4">{messageText}</p>

        {/* Kapatma Butonu (X) */}
        <button
          onClick={onClose}
          aria-label="Bilgi mesajını gizle"
          className="absolute top-1 right-1 p-1 text-xl font-bold rounded-full hover:bg-opacity-80 transition duration-150"
          style={{
            color: messageClass.includes('green')
              ? '#16A34A'
              : messageClass.includes('red')
              ? '#DC2626'
              : '#D97706',
          }}
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export default GameStatusInfo;
