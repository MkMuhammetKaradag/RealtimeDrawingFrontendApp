// src/services/auth.service.ts

import axios from 'axios';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '../types/store';

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
