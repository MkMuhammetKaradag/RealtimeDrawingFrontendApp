// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';

import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import authReducer from './slices/authSlice';
// 1. Kalıcılık (Persist) Ayarları
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Sadece belirli alanları persist et
};
// 2. Root reducer'ı oluştur
const rootReducer = combineReducers({
  auth: authReducer,
  // Diğer reducer'lar buraya eklenecek
});

// 3. Persist edilmiş reducer'ı oluştur
const persistedReducer = persistReducer(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  //devTools: process.env.NODE_ENV !== 'production', // Sadece development'ta DevTools
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
