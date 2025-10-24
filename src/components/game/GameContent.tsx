// src/components/game/GameContent.tsx

import React from 'react';
import GameSettingsForm from './GameSettingsForm';
import GuessInputForm from './GuessInputForm';
import GameStatusInfo from './GameStatusInfo';
import Paint from '../../pages/paint'; // Paint bileşeni
import type {
  GameSettings,
  PlayerRole,
  GameStatus,
} from '../../types/game.interface'; // Tip tanımı

interface GameContentProps {
  currentStatus: GameStatus;
  playerRole: PlayerRole;
  isRoomHost: boolean;
  gameSettings: GameSettings;
  roomDrawData: any;
  gameOverData: any;
  connectionStatus: string;
  isStatusInfoVisible: boolean;
  sendMessage: (message: any) => void;
  onStartGame: () => void;
  onSettingChange: (name: keyof GameSettings, value: number) => void;
  onUpdatedSetting: () => void;
  onUpdateGameMode: (modeId: number) => Promise<void>;
  onGuessSubmit: (guessText: string) => void;
  onNewGame: () => void;
  onCloseStatusInfo: () => void;
}

const GameContent: React.FC<GameContentProps> = ({
  currentStatus,
  playerRole,
  isRoomHost,
  gameSettings,
  roomDrawData,
  gameOverData,
  connectionStatus,
  isStatusInfoVisible,
  sendMessage,
  onStartGame,
  onSettingChange,
  onUpdatedSetting,
  onUpdateGameMode,
  onGuessSubmit,
  onNewGame,
  onCloseStatusInfo,
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
      {/* Oyun Ayarları - Sadece idle durumunda */}
      {currentStatus === 'idle' && (
        <div className="p-6 md:p-8">
          <GameSettingsForm
            settings={gameSettings}
            onSettingChange={onSettingChange}
            onStartGame={onStartGame}
            onUpdatedSetting={onUpdatedSetting}
            onUpdateGameMode={onUpdateGameMode}
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
              onClose={onCloseStatusInfo}
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
                onNewGame={onNewGame}
              />
            </div>

            {/* Tahmin Input - Sadece guesser için */}
            {currentStatus === 'started' && playerRole === 'guesser' && (
              <div className="mt-4">
                <GuessInputForm
                  onGuessSubmit={onGuessSubmit}
                  connectionStatus={connectionStatus}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameContent;
