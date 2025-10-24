// src/components/game/GameHeader.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { PlayerRole } from '../../types/game.interface'; // Tip tanımı

interface GameHeaderProps {
  roomId: string;
  connectionStatus: string;
  playerRole: PlayerRole;
  onLeaveRoom: () => Promise<void>;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  roomId,
  connectionStatus,
  playerRole,
  onLeaveRoom,
}) => {
  const navigate = useNavigate();

  const connectionClass =
    connectionStatus === 'connected'
      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
      : 'bg-gradient-to-r from-yellow-600 to-amber-600 text-gray-900';

  const playerRoleClass =
    playerRole === 'drawer'
      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
      : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white';

  return (
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
          <p className="text-gray-400 text-sm mt-1">Oda ID: {roomId}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className={`px-4 py-2 rounded-xl cursor-pointer text-sm font-semibold bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 transition-all`}
          onClick={onLeaveRoom}
        >
          Ayrıl
        </button>

        <div
          className={`px-4 py-2 rounded-xl text-sm font-semibold ${connectionClass}`}
        >
          {connectionStatus === 'connected' ? '✅ BAĞLI' : '🔄 BAĞLANIYOR'}
        </div>

        {playerRole && (
          <div
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${playerRoleClass}`}
          >
            {playerRole === 'drawer' ? '🎨 ÇİZİYORSUN' : '🔍 TAHMİN EDİYORSUN'}
          </div>
        )}
      </div>
    </header>
  );
};

export default GameHeader;
