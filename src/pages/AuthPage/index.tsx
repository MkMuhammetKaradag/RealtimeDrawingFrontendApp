// src/pages/AuthPage/index.tsx

import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import './AuthPageModule.css'; // Sayfa stili için CSS dosyası

const AuthPage = () => {
  const navigate = useNavigate();

  // Redux store'dan kullanıcının kimlik doğrulama durumunu al
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Form görünümünü yönetmek için state
  const [isLoginView, setIsLoginView] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Kullanıcı zaten giriş yapmışsa, ana sayfaya yönlendir
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
    // <div className="auth-page-container">
    //   <div className="auth-card-wrapper">
    //     <h2 className="auth-title">{isLoginView ? 'Giriş Yap' : 'Kayıt Ol'}</h2>

    //     {/* Koşullu renderlama ile doğru formu göster */}
    //     {isLoginView ? (
    //       <LoginForm onToggle={handleToggleView} />
    //     ) : (
    //       <RegisterForm />
    //     )}

    //     <p className="toggle-view-text" onClick={handleToggleView}>
    //       {isLoginView
    //         ? 'Henüz hesabın yok mu? Kayıt ol'
    //         : 'Zaten hesabın var mı? Giriş yap'}
    //     </p>
    //   </div>
    // </div>
    <div className="auth-page">
      {/* Animated background particles */}
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <div className="auth-container">
        <div className={`auth-card ${mounted ? 'mounted' : ''}`}>
          {/* Logo/Game title */}
          <div className="game-logo">
            <div className="logo-text">
              <span className="logo-main">Mk</span>
              <span className="logo-sub">.IO</span>
            </div>
            <div className="logo-tagline">Oyunun Gücü Seninle</div>
          </div>

          {/* Form title with slide animation */}
          <div className="form-title-container">
            <h2
              className={`form-title ${
                isLoginView ? 'login-active' : 'register-active'
              }`}
            >
              <span className="title-text">
                {isLoginView ? 'Hoş Geldin!' : 'Aramıza Katıl!'}
              </span>
              <div className="title-underline"></div>
            </h2>
          </div>

          {/* Form container with smooth transition */}
          <div className="form-container">
            <div
              className={`form-slider ${
                isLoginView ? 'show-login' : 'show-register'
              }`}
            >
              <div className="form-panel login-panel">
                <LoginForm onToggle={handleToggleView} />
              </div>
              <div className="form-panel register-panel">
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
