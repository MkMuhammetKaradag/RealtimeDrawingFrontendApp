import axios, { type AxiosInstance } from 'axios';

// API'nin temel URL'sini buraya yaz
// NOT: auth.service'den farklı olarak, sadece /game/rooms isteği attığınız için
// temel URL'yi http://localhost:8080/ olarak ayarlıyoruz ve isteği /game/rooms olarak atıyoruz.
// Eğer tüm oyun API'si http://localhost:8080/game altında toplanıyorsa, baseURL'i ona göre ayarlayabilirsiniz.
const API_BASE_URL = 'http://localhost:8080';

// Room yapısı için bir TypeScript arayüzü tanımlayalım
export interface Room {
  id: string;
  room_name: string;
  creator_id: string;
  max_players: number;
  current_players: number;
  status: 'waiting' | 'in_game' | 'finished'; // Durumlar
  game_mode_id: number;
  is_private: boolean;
  created_at: string;
  started_at: string;
  finished_at: string;
  mode_name: string;
  is_user_in_room: boolean;
}

// Odaları listeleme yanıtı için arayüz
export interface GetRoomsResponse {
  message: string;
  rooms: Room[];
}

// Axios'tan bir instance oluştur.
// Auth service'deki gibi, header'lar ve withCredentials ayarları burada da geçerli olmalı.
const gameApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Cookie/Session tabanlı kimlik doğrulama kullanıyorsanız bu önemlidir.
  withCredentials: true,
});

// Auth service'de olduğu gibi interceptorları burada da kurabiliriz,
// ancak genellikle tek bir global axios instance veya tek bir interceptor setup fonksiyonu kullanılır.
// Basitlik için, şimdilik sadece istek fonksiyonunu ekleyelim.
// NOT: Eğer token yenileme/401 yönlendirme mantığını tüm istekler için uygulamak istiyorsanız,
// bu interceptor mantığını tek bir global yerde (örneğin Redux store kurulumunda) yapmanız daha iyidir.

/**
 * Görünür (Herkese Açık) Odaları Listeler.
 * @returns {Promise<GetRoomsResponse>} Odalar listesi ve mesaj içeren Promise.
 */
export const getVisibleRooms = async (): Promise<GetRoomsResponse> => {
  try {
    const response = await gameApi.get<GetRoomsResponse>('/game/rooms');
    // İsteğinizin URL'si: http://localhost:8080/game/rooms
    return response.data;
  } catch (error) {
    // Hata yönetimi (örneğin loglama veya kullanıcıya bildirme)
    console.error('Odalar listesi çekilirken hata oluştu:', error);
    // Hatanın çağırıcı fonksiyonda ele alınması için tekrar fırlatıyoruz.
    throw error;
  }
};

/**
 * Özel bir Odaya ID ve Şifre ile Katılma (Gelecekte Kullanım İçin Örnek).
 * @param {string} roomId - Odanın ID'si.
 * @param {string} password - Odanın şifresi.
 * @returns {Promise<any>} Odaya katılma yanıtı.
 */
// export const joinPrivateRoom = async (roomId: string, password: string): Promise<any> => {
//     const response = await gameApi.post(`/game/rooms/${roomId}/join`, { password });
//     return response.data;
// };

// İhtiyacınız olacak diğer servis fonksiyonlarını buraya ekleyebilirsiniz:
// - Oda Oluşturma
// - Odaya Katılma (Şifresiz)
// - Oyundan Ayrılma
// ...
