import type { AxiosInstance } from 'axios';
import axios from 'axios';
import { forceLogout } from '../store/slices/authSlice';
import type { AuthResponse } from '../types/store';

const API_BASE_URL = 'http://localhost:8080';

// Axios'tan bir instance oluştur.
// Auth service'deki gibi, header'lar ve withCredentials ayarları burada da geçerli olmalı.
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Cookie/Session tabanlı kimlik doğrulama kullanıyorsanız bu önemlidir.
  withCredentials: true,
});
export const setupInterceptors = (store: any) => {
  api.interceptors.response.use(
    (response) => {
      const isRefreshNeeded = response.headers['x-refresh-needed'] === 'true';

      if (isRefreshNeeded) {
        // Eğer yenileme sinyali varsa, arka planda yenileme isteği at
        refreshToken().catch((refreshError) => {
          // Yenileme başarısız olursa (cihaz değişimi vb.), kullanıcıyı çıkışa yönlendir
          window.location.href = '/auth';
        });
      }
      return response; // Orijinal yanıtı ilet
    },
    (error) => {
      console.log('status:', error.response.status);
      if (error.response.status === 401) {
        store.dispatch(forceLogout()); // Parametre olarak gelen store'u kullan
        window.location.href = '/auth';
      }
      return Promise.reject(error);
    }
  );
};
export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await api.post('/refresh-token');
  return response.data;
};
