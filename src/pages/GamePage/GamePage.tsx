// src/pages/GamePage.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import useGameLogic from '../../hooks/useGameLogic';
import ConnectionStatusCard from '../../components/common/ConnectionStatusCard';
import GameHeader from '../../components/game/GameHeader';
import GameContent from '../../components/game/GameContent';

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const sessionToken = document.cookie.split('session=')[1] || '';
  const roomId = room_id || '';

  // Tüm mantığı tek bir hook'tan çekiyoruz
  const logic = useGameLogic({ roomId, sessionToken });

  // Bağlantı durumu hatalarını göster (Erken Çıkış)
  if (logic.connectionStatus !== 'connected') {
    return (
      <ConnectionStatusCard
        status={
          logic.connectionStatus as 'connecting' | 'error' | 'disconnected'
        }
        errorMessage={logic.errorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <GameHeader
          roomId={roomId}
          connectionStatus={logic.connectionStatus}
          playerRole={logic.playerRole}
          onLeaveRoom={logic.handleActionLeaveRoom}
        />

        <GameContent
          // State/Veri
          currentStatus={logic.currentStatus}
          playerRole={logic.playerRole}
          isRoomHost={logic.isRoomHost}
          gameSettings={logic.gameSettings}
          roomDrawData={logic.roomDrawData}
          gameOverData={logic.gameOverData}
          connectionStatus={logic.connectionStatus}
          isStatusInfoVisible={logic.isStatusInfoVisible}
          sendMessage={logic.sendMessage}
          // Handler'lar
          onStartGame={logic.handleStartGame}
          onSettingChange={logic.handleSettingChange}
          onUpdatedSetting={logic.handleUpdatedSettingGame}
          onUpdateGameMode={logic.handleUpdateGameMode}
          onGuessSubmit={logic.handleGuessSubmit}
          onNewGame={logic.handleNewGame}
          onCloseStatusInfo={logic.handleCloseStatusInfo}
        />

        {/* Debug Footer (Eski yerinde kalabilir) */}
        {/* ... */}
      </div>
    </div>
  );
};

export default GamePage;
