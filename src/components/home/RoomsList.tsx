// src/components/HomePage/RoomsList.tsx

import React from 'react';
import type { Room } from '../../services/game.service';
import RoomCard from './RoomCard';

interface RoomsListProps {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  onActionRoom: (roomId: string, isUserInRoom: boolean) => Promise<void>;
  onRetry: () => void;
}

const RoomsList: React.FC<RoomsListProps> = ({
  rooms,
  isLoading,
  error,
  retryCount,
  onActionRoom,
  onRetry,
}) => {
  // --- Yükleme Durumu ---
  if (isLoading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-gray-400">Odalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // --- Hata Durumu ---
  if (error) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <div className="p-6 bg-red-900/50 border border-red-700 rounded-xl text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">Hata!</div>
          <p className="text-red-300 mb-4">{error}</p>
          {retryCount < 3 && (
            <button
              onClick={onRetry}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
            >
              Tekrar Dene ({3 - retryCount} deneme hakkınız kaldı)
            </button>
          )}
          {retryCount >= 3 && (
            <p className="text-sm text-red-400 mt-3">
              Sürekli hata alıyorsanız, lütfen sayfayı yenileyin veya daha sonra
              tekrar deneyin.
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Boş Durum ---
  if (rooms.length === 0) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4 text-gray-400">🛋️</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Aktif oda bulunamadı
          </h3>
          <p className="text-gray-400">İlk odayı oluşturan siz olun!</p>
        </div>
      </div>
    );
  }

  // --- Oda Listesi ---
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-200">
          Herkese Açık Odalar
          <span className="ml-2 text-indigo-400">({rooms.length})</span>
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} onAction={onActionRoom} />
        ))}
      </div>
    </div>
  );
};

export default RoomsList;
