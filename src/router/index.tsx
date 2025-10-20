// src/router/index.tsx
import React, { lazy, Suspense, type FC, type ReactNode } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import {
  selectAuthStatus,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import { Loading } from '../components/loading/Loading';
export interface ProtectedRouteProps {
  children: ReactNode;
}

export interface PublicRouteProps {
  children: ReactNode;
  redirectPath?: string;
}

// Lazy loading
const HomePage = lazy(() => import('../pages/HomePage/index'));
const AuthPage = lazy(() => import('../pages/AuthPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const GamePage = lazy(() => import('../pages/GamePage/GamePage'));

// Korumalı Yol Bileşeni
const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  //const authStatus = useAppSelector(selectAuthStatus);

  // if (authStatus === 'loading') {
  //   return (
  //     <Loading
  //       message="Güvenlik kontrolü yapılıyor..."
  //       size="medium"
  //       fullScreen={true}
  //     />
  //   );
  // }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public route - giriş yapmış kullanıcıları ana sayfaya yönlendirir
const PublicRoute: FC<PublicRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const authStatus = useAppSelector(selectAuthStatus);

  if (authStatus === 'loading') {
    return <Loading size="small" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRouter = () => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 min-h-screen">
      <Suspense fallback={<Loading message="Sayfa yükleniyor..." fullScreen />}>
        <Routes>
          {/* Auth sayfası - sadece giriş yapmamış kullanıcılar */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Korumalı routelar */}
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

          {/* 404 sayfası */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default AppRouter;
