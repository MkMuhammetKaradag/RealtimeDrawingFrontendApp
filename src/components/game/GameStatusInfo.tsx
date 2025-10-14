// src/components/game/GameStatusInfo.tsx
import React from 'react';
import type { GameStatus, PlayerRole } from '../../types/game.interface';

interface GameStatusInfoProps {
  gameStatus: GameStatus;
  playerRole: PlayerRole;
}

/**
 * Oyunun mevcut durumuna göre kullanıcıya bilgi mesajı gösteren bileşen.
 */
const GameStatusInfo: React.FC<GameStatusInfoProps> = ({
  gameStatus,
  playerRole,
}) => {
  if (gameStatus === 'ended') {
    return (
      <p className="text-center text-2xl font-black text-red-600 mb-6 bg-red-50 p-3 rounded-lg border-l-4 border-red-600">
        Oyun SONA ERDİ. 🏁
      </p>
    );
  }

  if (gameStatus === 'started' && playerRole === 'drawer') {
    return (
      <p className="text-center text-2xl font-black text-green-600 mb-6 bg-green-50 p-3 rounded-lg border-l-4 border-green-600">
        Çizeceğiniz Kelime
      </p>
    );
  }

  // Diğer durumlar için (idle, waiting, guesser) özel mesaj gerekmiyorsa null döndür.
  return null;
};

export default GameStatusInfo;
