// src/services/auth.service.ts

;
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../types/store';


import { api } from './service';

// Axios'tan bir instance oluştur, böylece daha sonra header'lara token eklemek kolay olur

// Giriş yapma fonksiyonu
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  console.log('credentials in auth service: ', credentials);
  const response = await api.post('/auth/signin', credentials);
  console.log('response in  auth-service: ', response);
  return response.data;
};

// Kayıt olma fonksiyonu
export const register = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup', credentials);
  return response.data;
};

// Çıkış yapma fonksiyonu (isteğe bağlı, backend'de bir endpoint varsa)
export const logout = async (): Promise<void> => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export const hello = async (): Promise<AuthResponse> => {
  const response = await api.get('/auth/hello');
  return response.data;
};
