// src/pages/HomePage.tsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { logoutUser } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';
import {
  getVisibleRooms,
  JoinRooms,
  type Room,
} from '../../services/game.service';
import { hello } from '../../services/auth.service';

// Alt Bileşenleri içe aktar
import HeaderSection from '../../components/home/HeaderSection';
import PrivateRoomForm from '../../components/home/PrivateRoomForm';
import RoomsList from '../../components/home/RoomsList';

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  // State Yönetimi
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ********* API VE OYUN MANTIĞI *********

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVisibleRooms();
      setRooms(data.rooms);
      setRetryCount(0); // Başarılıysa deneme sayısını sıfırla
    } catch (err) {
      console.error('Odaları çekerken hata:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Odalar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptToConnectToRoom = (roomId: string) => {
    navigate(`/game/${roomId}`);
  };

  const handleActionRoom = async (roomId: string, isUserInRoom: boolean) => {
    if (isUserInRoom) {
      // Kullanıcı zaten odadaysa, direkt oyuna yönlendir.
      attemptToConnectToRoom(roomId);
    } else {
      // Kullanıcı odada değilse, JoinRoom API isteği at.
      try {
        const data = await JoinRooms(roomId);
        console.log('Odaya katılma başarılı:', data);
        attemptToConnectToRoom(roomId);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Odaya katılırken bir sorunla karşılaşıldı.';
        setError(errorMessage);
      }
    }
  };

  const handleJoinPrivateRoom = (roomId: string) => {
    if (roomId.trim() === '') return;
    attemptToConnectToRoom(roomId.trim());
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleHello = async () => {
    try {
      const response = await hello();
      alert('Hello from server: ' + JSON.stringify(response));
    } catch (error) {
      console.error('Hello request failed:', error);
      alert('Hello request failed. See console for details.');
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  // ********* useEffect HOOKS (Yükleme ve Otomatik Yenileme) *********

  // İlk yükleme ve tekrar denemelerde çalışır
  useEffect(() => {
    fetchRooms();
  }, [retryCount]);

  // Odaları otomatik yeniler (30 saniyede bir)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchRooms();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading]);

  // ********* RENDER *********

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <HeaderSection
          username={user?.username}
          isLoading={isLoading}
          onRefresh={fetchRooms}
          onHello={handleHello}
          onLogout={handleLogout}
        />

        <PrivateRoomForm onJoin={handleJoinPrivateRoom} />

        <RoomsList
          rooms={rooms}
          isLoading={isLoading}
          error={error}
          onActionRoom={handleActionRoom}
          onRetry={handleRetry}
          retryCount={retryCount}
        />
      </div>
    </div>
  );
};

export default HomePage;
