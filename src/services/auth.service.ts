// src/services/auth.service.ts

import axios from 'axios';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../types/store';

import { forceLogout } from '../store/slices/authSlice';

// API'nin temel URL'sini buraya yaz
const API_URL = 'http://localhost:8080/auth'; // Örnek URL

// Axios'tan bir instance oluştur, böylece daha sonra header'lara token eklemek kolay olur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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

// Giriş yapma fonksiyonu
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  console.log('credentials in auth service: ', credentials);
  const response = await api.post('/signin', credentials);
  console.log('response in  auth-service: ', response);
  return response.data;
};

// Kayıt olma fonksiyonu
export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  const response = await api.post('/signup', credentials);
  return response.data;
};

// Çıkış yapma fonksiyonu (isteğe bağlı, backend'de bir endpoint varsa)
export const logout = async (): Promise<void> => {
  const response = await api.post('/logout');
  return response.data;
};

export const refreshToken = async (): Promise<AuthResponse> => {
  const response = await api.post('/refresh-token');
  return response.data;
};

export const hello = async (): Promise<AuthResponse> => {
  const response = await api.get('/hello');
  return response.data;
};
