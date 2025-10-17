import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { getVisibleRooms, type Room } from '../../services/game.service';
import { hello } from '../../services/auth.service';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [privateRoomId, setPrivateRoomId] = useState('');

  const [retryCount, setRetryCount] = useState(0);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVisibleRooms();
      setRooms(data.rooms);
      setRetryCount(0);
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

  useEffect(() => {
    fetchRooms();
  }, [retryCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchRooms();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const attemptToConnectToRoom = (roomId: string) => {
    console.log(`WebSocket bağlantısı deneniyor: ${roomId}`);
    navigate(`/game/${roomId}`);
  };

  const handleActionRoom = (roomId: string, isUserInRoom: boolean) => {
    if (isUserInRoom) {
      console.log(`[GERİ DÖN] Odaya bağlanılıyor: ${roomId}`);
      attemptToConnectToRoom(roomId);
    } else {
      console.log(`[KATIL] Odaya katılma isteği: ${roomId}`);
      attemptToConnectToRoom(roomId);
    }
  };

  const handleJoinPrivateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (privateRoomId.trim() === '') return;

    console.log(`Özel Odaya Katılma ID: ${privateRoomId}`);
    attemptToConnectToRoom(privateRoomId.trim());
    setPrivateRoomId('');
  };

  const handleHello = async () => {
    try {
      const response = await hello();
      console.log('Hello from server:', response);
      alert('Hello from server: ' + JSON.stringify(response));
    } catch (error) {
      console.error('Hello request failed:', error);
      alert('Hello request failed. See console for details.');
    }
  };

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const getStatusColor = (status: string) => {
    return status === 'waiting'
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Auth sayfasıyla uyumlu koyu tema */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Oda Listesi
            </h1>
            {user && (
              <p className="text-lg text-gray-300 mt-2">
                Hoş geldiniz,{' '}
                <span className="font-semibold text-indigo-300">
                  {user.username}
                </span>
                !
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchRooms}
              disabled={isLoading}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>🔄</span>
              {isLoading ? 'Yükleniyor...' : 'Yenile'}
            </button>

            <button
              onClick={handleHello}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Hello Server
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Private Room Form - Koyu tema */}
        <div className="mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span>🔐</span>
            Özel Odaya Katıl
          </h2>
          <form
            onSubmit={handleJoinPrivateRoom}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-1">
              <input
                type="text"
                value={privateRoomId}
                onChange={(e) => setPrivateRoomId(e.target.value)}
                placeholder="Oda ID'sini girin..."
                className="w-full p-4 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400"
                required
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Odaya Gir
            </button>
          </form>
        </div>

        {/* Rooms Section - Koyu tema */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-200">
              Herkese Açık Odalar
              <span className="ml-2 text-indigo-400">({rooms.length})</span>
            </h2>

            {!isLoading && !error && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-lg text-gray-400">Odalar yükleniyor...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-6 bg-red-900/50 border border-red-700 rounded-xl text-center">
              <div className="text-red-400 text-lg font-semibold mb-2">
                Hata!
              </div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200"
              >
                Tekrar Dene ({3 - retryCount} deneme hakkınız kaldı)
              </button>
              {retryCount >= 3 && (
                <p className="text-sm text-red-400 mt-3">
                  Sürekli hata alıyorsanız, lütfen sayfayı yenileyin veya daha
                  sonra tekrar deneyin.
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && rooms.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 text-gray-400">🛋️</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Aktif oda bulunamadı
              </h3>
              <p className="text-gray-400">İlk odayı oluşturan siz olun!</p>
            </div>
          )}

          {/* Rooms Grid */}
          {!isLoading && !error && rooms.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => {
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

                return (
                  <div
                    key={room.id}
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Mod:</span>
                          <span className="font-semibold text-indigo-300">
                            {room.mode_name}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Oyuncular:
                          </span>
                          <span className="font-bold text-white">
                            {room.current_players} / {room.max_players}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Durum:</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              room.status === 'waiting'
                                ? 'bg-green-900/30 text-green-300 border-green-700'
                                : 'bg-yellow-900/30 text-yellow-300 border-yellow-700'
                            }`}
                          >
                            {room.status === 'waiting'
                              ? '🕐 Bekliyor'
                              : '🎮 Oyunda'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleActionRoom(room.id, isUserMember)}
                        disabled={buttonDisabled}
                        className={`w-full py-3 px-4 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none ${buttonClass}`}
                      >
                        {buttonText}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
