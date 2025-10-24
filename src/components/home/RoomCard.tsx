// src/components/HomePage/RoomCard.tsx

import React from 'react';
import type { Room } from '../../services/game.service';

interface RoomCardProps {
  room: Room;
  onAction: (roomId: string, isUserInRoom: boolean) => Promise<void>;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onAction }) => {
  const isFull = room.current_players >= room.max_players;
  const canJoin = room.status === 'waiting' && !isFull;
  const isUserMember = room.is_user_in_room;

  let buttonText = 'Odaya Katıl';
  let buttonDisabled = !canJoin && !isUserMember;

  if (isUserMember) {
    buttonText = 'Oyuna Gir / Geri Dön';
    buttonDisabled = false;
  } else if (isFull) {
    buttonText = 'Oda Dolu';
    buttonDisabled = true;
  } else if (room.status !== 'waiting') {
    buttonText = 'Oyun Başladı';
    buttonDisabled = true;
  }

  const buttonClass = isUserMember
    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700';

  const statusClasses =
    room.status === 'waiting'
      ? 'bg-green-900/30 text-green-300 border-green-700'
      : 'bg-yellow-900/30 text-yellow-300 border-yellow-700';

  return (
    <div
      className={`bg-gray-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 overflow-hidden backdrop-blur-sm
                ${isUserMember ? 'border-green-500' : 'border-indigo-500'}
                ${isFull ? 'opacity-60' : 'opacity-100'}`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-white truncate flex-1">
            {room.room_name}
          </h3>
          <div className="flex gap-2 ml-2">
            {isUserMember && (
              <span className="inline-flex items-center px-2 py-1 bg-green-900/50 text-green-300 text-xs font-bold rounded-full border border-green-700">
                SİZ
              </span>
            )}
            {room.is_private && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full border border-gray-500">
                🔒 Gizli
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {/* Mod */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Mod:</span>
            <span className="font-semibold text-indigo-300">
              {room.mode_name}
            </span>
          </div>

          {/* Oyuncular */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Oyuncular:</span>
            <span className="font-bold text-white">
              {room.current_players} / {room.max_players}
            </span>
          </div>

          {/* Durum */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Durum:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusClasses}`}
            >
              {room.status === 'waiting' ? '🕐 Bekliyor' : '🎮 Oyunda'}
            </span>
          </div>
        </div>

        <button
          onClick={() => onAction(room.id, isUserMember)}
          disabled={buttonDisabled}
          className={`w-full py-3 px-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none ${buttonClass}`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default RoomCard;
