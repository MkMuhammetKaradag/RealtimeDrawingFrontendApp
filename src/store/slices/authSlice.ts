// src/store/slices/authSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type {
  User,
  LoginCredentials,
  RegisterCredentials,
} from '../../types/store';
import {
  login,
  register,
  logout as logoutApi,
} from '../../services/auth.service';
import { REHYDRATE } from 'redux-persist';

// 1. Durum Arayüzü (State Interface)
// Redux state'inin yapısını tanımlıyoruz. Bu, uygulamanın kimlik doğrulama
// durumunu tutan "veri sözleşmesi"dir.
interface AuthState {
  user: User | null; // Giriş yapan kullanıcı bilgileri
  isAuthenticated: boolean; // Kullanıcının oturumunun açık olup olmadığını belirtir
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Asenkron işlemin anlık durumunu gösterir
  error: string | null; // Varsa, API'den gelen hata mesajı
}

// Başlangıç durumu. Uygulama ilk yüklendiğinde bu değerleri alır.
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  status: 'idle',
  error: null,
};

// 2. Asenkron İşlemler (Async Thunks)
// `createAsyncThunk` ile API çağrıları gibi asenkron işlemleri yönetiyoruz.
// Bu fonksiyon, işlem için üç otomatik aksiyon tipi (`pending`, `fulfilled`, `rejected`) oluşturur.

// Kullanıcı girişi için async thunk.
// Backend'den gelen verileri yönetir ve Redux state'ini günceller.
export const loginUser = createAsyncThunk(
  'auth/login', // Aksiyonun adı
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await login(credentials);
      // Başarılı olursa, backend'den gelen veriyi döndürür.
      // Bu veri, `fulfilled` durumunda `action.payload` olarak kullanılacaktır.

      return response;
    } catch (error: any) {
      // Hata olursa, `rejectWithValue` ile hata mesajını iletiriz.
      // Bu mesaj, `rejected` durumunda `action.payload` olarak kullanılacaktır.
      return rejectWithValue(
        error.response.data.message || 'Giriş başarısız oldu.'
      );
    }
  }
);

// Kullanıcı kaydı için async thunk.
// Login ile benzer şekilde çalışır.
export const registerUser = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials, { rejectWithValue }) => {
    try {
      const response = await register(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response.data.message || 'Kayıt başarısız oldu.'
      );
    }
  }
);

// Kullanıcı çıkışı için async thunk.
// Backend'de bir çıkış endpoint'i varsa çağırır.
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await logoutApi();
});

// 3. Dilim Tanımı (`createSlice`)
// `createSlice` ile reducer'larımızı, aksiyonlarımızı ve başlangıç durumumuzu
// tek bir yerde tanımlıyoruz. Bu, boilerplate kodu azaltır.
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Senkron (anlık) state değişiklikleri buraya yazılır.
    // Örneğin, state'i başlangıç durumuna döndürmek.
    resetAuthState: (state) => {
      Object.assign(state, initialState);
    },
    // Kullanıcı bilgilerini güncellemek için senkron reducer.
    // Profil güncelleme gibi işlemler için kullanılabilir.
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    forceLogout: (state) => {
      Object.assign(state, initialState); // Tarayıcıdan oturum çerezini temizlemek için bir fonksiyon çağır
      document.cookie = 'Session=; Max-Age=0; Path=/;';
    },
  },
  // 4. Asenkron İşlemlerin Durumunu Yöneten `extraReducers`
  // `createAsyncThunk`'ın oluşturduğu `pending`, `fulfilled`, `rejected`
  // aksiyon tiplerine burada nasıl tepki verileceğini belirtiriz.
  extraReducers: (builder) => {
    // `loginUser` işlemleri için durum yönetimi
    builder
      // İstek gönderildiğinde
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'; // Durumu "yükleniyor" olarak ayarla
        state.error = null; // Önceki hataları temizle
      })
      // İstek başarıyla tamamlandığında
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'; // Durumu "başarılı" olarak ayarla
        state.user = action.payload.user; // Kullanıcı verisini kaydet

        state.isAuthenticated = true; // Oturumu açık olarak işaretle
      })
      // İstek başarısız olduğunda
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'; // Durumu "hatalı" olarak ayarla
        state.error = action.payload as string; // Hata mesajını kaydet
        state.user = null;

        state.isAuthenticated = false;
      });

    // `registerUser` işlemleri için durum yönetimi
    // Login ile benzer şekilde çalışır.
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;

        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });

    builder.addCase(REHYDRATE, (state, action: any) => {
      // Eğer geri yüklenen payload varsa, onu state'e kopyala
      if (action.payload && action.payload.auth) {
        console.log('Auth data found:', action.payload.auth);
        state.user = action.payload.auth.user;
        state.isAuthenticated =
          action.payload.auth.isAuthenticated || !!action.payload.auth.user;
        state.status = action.payload.auth.status || 'idle';
        state.error = action.payload.auth.error || null;
      }
    });

    // `logoutUser` işlemi için durum yönetimi
    // Çıkış işlemi tamamlandığında state'i başlangıç durumuna döndürür.
    builder.addCase(logoutUser.fulfilled, (state) => {
      Object.assign(state, initialState);
    });
  },
});

// Aksiyon oluşturucularını dışa aktarıyoruz. Bileşenlerden bu aksiyonları
// `dispatch` ederek state'i değiştirebiliriz.
export const { resetAuthState, updateUser, forceLogout } = authSlice.actions;

// Reducer'ı dışa aktarıyoruz. Bu reducer, `store.ts` dosyasında kullanılacaktır.
export default authSlice.reducer;

// Seçiciler (Selectors)
// Bileşenlerin state'e daha kolay ve tip güvenli bir şekilde erişmesi için kullanılır.
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.isAuthenticated;
export const selectUser = (state: RootState) => state.auth.user;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
