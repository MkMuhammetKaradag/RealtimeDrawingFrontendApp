// src/types/store.ts

// Backend'den gelecek kullanıcı verisinin tipi
export interface User {
  id: string;
  username: string;
  email: string;
  // Gerekirse başka alanlar ekleyebilirsin
}

// Giriş (Login) işlemi için kullanılacak verinin tipi
export interface LoginCredentials {
  identifier: string;
  password: string;
}

// Kayıt (Register) işlemi için kullanılacak verinin tipi
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// Backend'den başarılı bir login/register işleminden sonra dönen cevap tipi
export interface AuthResponse {
  user: User;
  token: string;
}

// Redux store'daki kimlik doğrulama durumu (state) için arayüz
// Bu tanım authSlice.ts dosyasındaki AuthState arayüzü ile aynıdır.
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}
