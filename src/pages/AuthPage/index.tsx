// src/pages/AuthPage/index.tsx

import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import './AuthPage.module.css'; // Sayfa stili için CSS dosyası

const AuthPage = () => {
  const navigate = useNavigate();

  // Redux store'dan kullanıcının kimlik doğrulama durumunu al
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Form görünümünü yönetmek için state
  const [isLoginView, setIsLoginView] = useState(true);

  // Kullanıcı zaten giriş yapmışsa, ana sayfaya yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleToggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <h2 className="auth-title">
          {isLoginView ? 'Giriş Yap' : 'Kayıt Ol'}
        </h2>
        
        {/* Koşullu renderlama ile doğru formu göster */}
        {isLoginView ? <LoginForm /> : <RegisterForm />}
        
        <p className="toggle-view-text" onClick={handleToggleView}>
          {isLoginView ? 'Henüz hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;