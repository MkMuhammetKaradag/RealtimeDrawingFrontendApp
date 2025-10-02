// src/router/index.tsx

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import {
  selectAuthStatus,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import HomePage from '../pages/HomePage/index';
import AuthPage from '../pages/AuthPage';
import NotFoundPage from '../pages/NotFoundPage';
import GamePage from '../pages/GamePage/GamePage';

// Korumalı Yol Bileşeni
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authStatus = useAppSelector(selectAuthStatus);

  // Bu kısım, redux-persist'in state'i geri yüklemesini bekler.
  // Uygulama ilk yüklendiğinde `authStatus` "loading" olacaktır.
  if (authStatus === 'loading') {
    return <div>Yükleniyor...</div>;
  }

  // Eğer `authStatus` artık loading değilse ve kullanıcı giriş yapmamışsa, login sayfasına yönlendir.
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Kullanıcı giriş yapmışsa ve yükleme tamamlanmışsa, bileşeni göster.
  return <>{children}</>;
};

const AppRouter = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Routes>
      {/* Kimlik doğrulama sayfası. Kullanıcı giriş yapmışsa anasayfaya yönlendirilir. */}
      <Route
        path="/auth"
        element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />}
      />

      {/* Ana sayfa ve diğer korumalı yollar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/game/:room_id"
        element={
          <ProtectedRoute>
            <GamePage />
          </ProtectedRoute>
        }
      />
      {/* Tanımlanmamış tüm yollar için 404 sayfası */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
