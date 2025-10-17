// src/pages/AuthPage/index.tsx
import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [isLoginView, setIsLoginView] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: '100%',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="w-full max-w-md z-10">
        <div
          className={`bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-2xl shadow-black/20 border border-white/20 transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          {/* Logo/Game title */}
          <div className="text-center mb-8">
            <div className="mb-2">
              <span className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mk
              </span>
              <span className="text-4xl font-black text-gray-800 -ml-1">
                .IO
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600">
              Oyunun Gücü Seninle
            </div>
          </div>

          {/* Form title with slide animation */}
          <div className="text-center mb-8 h-16 flex items-center justify-center">
            <h2 className="relative transition-all duration-500">
              <span
                className={`text-2xl font-bold text-gray-800 block transition-all duration-500 ${
                  isLoginView ? 'translate-x-0' : '-translate-x-2'
                }`}
              >
                {isLoginView ? 'Hoş Geldin!' : 'Aramıza Katıl!'}
              </span>
              <div
                className={`h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mx-auto mt-2 transition-all duration-500 ${
                  isLoginView ? 'w-20' : 'w-24'
                }`}
              ></div>
            </h2>
          </div>

          {/* Form container with smooth transition */}
          <div className="relative overflow-hidden rounded-xl">
            <div
              className={`flex transition-transform duration-500 ease-in-out ${
                isLoginView ? 'translate-x-0' : '-translate-x-1/2'
              }`}
              style={{ width: '200%' }}
            >
              {/* Login Form Panel */}
              <div className="w-1/2 px-1">
                <LoginForm onToggle={handleToggleView} />
              </div>

              {/* Register Form Panel */}
              <div className="w-1/2 px-1">
                <RegisterForm onToggle={handleToggleView} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
