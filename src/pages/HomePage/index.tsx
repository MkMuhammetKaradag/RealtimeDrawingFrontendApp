import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import type { AppDispatch, RootState } from '../../store/store';
// Game Service'den gerekli fonksiyon ve tipleri içeri aktarıyoruz
import { getVisibleRooms, type Room } from '../../services/game.service';
import { hello } from '../../services/auth.service'; // Test için tutulabilir
import { useNavigate } from 'react-router-dom';
// Helper bileşenler (opsiyonel ama yapıyı temiz tutar)
// import DrawingCanvas from '../../components/home/DrawingCanvas'; // Şimdilik odalara odaklanmak için kaldırılabilir/kullanılmayabilir.

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  // 1. Durum Yönetimi: Odalar, Yükleme ve Hata için state'ler
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2. Özel Oda Girişi için state
  const [privateRoomId, setPrivateRoomId] = useState('');

  // 3. Veri Çekme Fonksiyonu
  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null); // Yeni istekte hatayı sıfırla
    try {
      const data = await getVisibleRooms();
      setRooms(data.rooms);
    } catch (err) {
      console.error('Odaları çekerken hata:', err);
      setError('Odalar yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Component yüklendiğinde odaları çek
  useEffect(() => {
    fetchRooms();
  }, []);

  // --- Olay İşleyicileri ---

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Odaya Katılma İşlevi (Şimdilik sadece console log)
  const handleJoinRoom = (roomId: string) => {
    console.log(`Odaya Katıl: ${roomId}`);
    // Gerçek uygulamada: navigate(`/game/${roomId}`) veya WebSocket bağlantısı başlat
    alert(`Odaya Katılma İsteği: ${roomId}`);
  };
  const attemptToConnectToRoom = (roomId: string) => {
    const wsUrl = `ws://localhost:8080/wsgame/ws/game/${roomId}`;

    // **ŞİMDİ SADECE YÖNLENDİRME YAPIYORUZ:**
    // Gerçek bağlantı ve ilk mesaj kontrolü, bu URL'ye yönlendirdiğimiz
    // yeni bir GamePage bileşeninde yapılmalıdır.

    // Eğer burası bir "Geri Dön" aksiyonu ise, kullanıcının odaya
    // girme isteği başarılı olana kadar direkt yönlendirme en iyi yoldur.

    console.log(`WebSocket bağlantısı deneniyor: ${wsUrl}`);

    // Yönlendirmeyi yap. Bağlantı denemesi ve hata/başarı yönetimi
    // artık /game/:room_id sayfasının sorumluluğundadır.
    navigate(`/game/${roomId}`);

    // NOT: Hata kontrolü için (örneğin, "Oyun bitti" hatası) GamePage bileşeniniz
    // ilk WebSocket mesajını almalı ve hata gelirse kullanıcıyı
    // 'navigate('/')' ile ana sayfaya geri göndermelidir.
  };
  const handleActionRoom = (roomId: string, isUserInRoom: boolean) => {
    if (isUserInRoom) {
      console.log(`[GERİ DÖN] Odaya bağlanılıyor: ${roomId}`);
      // Kullanıcı odadaysa, direkt bağlantı denemesini başlat.
      attemptToConnectToRoom(roomId);
    } else {
      console.log(`[KATIL] Odaya katılma isteği: ${roomId}`);
      // Kullanıcı odada değilse, önce "katıl" API çağrısı yapılıp
      // ardından başarılıysa bağlantı denemesi başlatılmalıdır.
      // Şimdilik sadece bağlantı denemesini başlatıyoruz (Katılma API çağrısı atlanmıştır).
      attemptToConnectToRoom(roomId);
    }
  };
  // Özel Odaya Katılma İşlevi (Giriş alanından)
  const handleJoinPrivateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (privateRoomId.trim() === '') return;
    console.log(`Özel Odaya Katılma ID: ${privateRoomId}`);
    handleJoinRoom(privateRoomId); // Örneğin, bu ID ile odaya katılmayı deneriz.
    setPrivateRoomId('');
  };

  // Hello butonu handler (test için tutulabilir)
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

  // --- Görsel Alanı (Return) ---

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Başlık ve Kullanıcı Bilgisi */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white shadow rounded-xl">
          <h1 className="text-3xl font-extrabold text-blue-600">Oda Listesi</h1>
          <div className="flex space-x-4 items-center">
            {user && (
              <span className="text-xl text-gray-700 font-medium hidden sm:inline">
                Hoş geldiniz,{' '}
                <span className="text-blue-500 font-bold">{user.username}</span>
                !
              </span>
            )}
            <div className="flex space-x-4">
              <button
                onClick={handleHello}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
              >
                Hello Server
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Özel Oda Giriş Formu */}
        <div className="mb-8 p-6 bg-white shadow rounded-xl border border-blue-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Özel Odaya ID ile Katıl
          </h2>
          <form
            onSubmit={handleJoinPrivateRoom}
            className="flex flex-col sm:flex-row gap-4"
          >
            <input
              type="text"
              value={privateRoomId}
              onChange={(e) => setPrivateRoomId(e.target.value)}
              placeholder="Oda ID'sini Girin"
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors shadow-md"
            >
              Odaya Gir
            </button>
          </form>
        </div>

        {/* Oda Listesi Alanı */}
        <h2 className="text-2xl font-bold text-gray-700 mb-4 border-b pb-2">
          Herkese Açık Odalar ({rooms.length})
        </h2>

        {isLoading && (
          <div className="p-8 text-center text-xl text-blue-500">
            Odalar yükleniyor... 🔄
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            Hata: {error}
            <button onClick={fetchRooms} className="ml-4 underline font-medium">
              Tekrar Dene
            </button>
          </div>
        )}

        {!isLoading && !error && rooms.length === 0 && (
          <div className="p-8 text-center text-xl text-gray-500 bg-white rounded-xl shadow">
            Aktif oda bulunamadı. Yeni bir oda oluşturmak ister misiniz? 🛋️
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {' '}
          {/* Grid sınıfını eklediğinizden emin olun! */}
          {rooms.map((room) => {
            // Kullanılabilirlik ve Durum Değişkenleri
            const isFull = room.current_players >= room.max_players;
            const canJoin = room.status === 'waiting' && !isFull;
            const isUserMember = room.is_user_in_room; // Yeni kontrolümüz

            // Butonun Metni ve Etkinliği
            let buttonText = 'Odaya Katıl';
            let buttonDisabled = !canJoin && !isUserMember; // Üyeyse ve tam değilse etkin

            if (isUserMember) {
              buttonText = 'Oyuna Gir / Geri Dön';
              buttonDisabled = false; // Kullanıcı zaten odadaysa her zaman etkin olmalı
            } else if (isFull) {
              buttonText = 'Oda Dolu';
              buttonDisabled = true;
            } else if (room.status !== 'waiting') {
              buttonText = 'Oyun Başladı';
              buttonDisabled = true;
            }

            // Butonun Rengi
            const buttonClass = isUserMember
              ? 'bg-green-500 hover:bg-green-600' // Kullanıcı odadaysa yeşil
              : 'bg-blue-500 hover:bg-blue-600'; // Değilse varsayılan mavi

            return (
              <div
                key={room.id}
                className={`bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-t-4 
                          ${
                            isUserMember
                              ? 'border-green-500'
                              : 'border-blue-500'
                          }`} // Kullanıcı odadaysa sınır rengi değişir
              >
                {/* ... oda bilgileri (room_name, mode_name, oyuncu sayısı) ... */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  {room.room_name}
                  {isUserMember && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">
                      SİZ BURADASINIZ
                    </span>
                  )}
                  {room.is_private && (
                    <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      Gizli
                    </span>
                  )}
                </h3>
                {/* ... diğer odanın bilgileri (mode_name, oyuncu sayısı, status) ... */}
                <p className="text-sm text-gray-500 mb-4">
                  Mod:{' '}
                  <span className="font-semibold text-blue-600">
                    {room.mode_name}
                  </span>
                </p>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-lg font-medium text-gray-700">
                    Oyuncu:{' '}
                    <span className="font-bold">{room.current_players}</span> /{' '}
                    {room.max_players}
                  </p>
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-full 
                            ${
                              room.status === 'waiting'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                  >
                    {room.status === 'waiting' ? 'Bekliyor' : 'Oyunda'}
                  </span>
                </div>

                {/* Buton Alanı */}
                <button
                  onClick={() => handleActionRoom(room.id, isUserMember)}
                  disabled={buttonDisabled}
                  className={`w-full py-2 mt-2 font-semibold rounded-lg transition-colors shadow-md
                                disabled:bg-gray-400 disabled:cursor-not-allowed
                                ${buttonClass} text-white`}
                >
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
