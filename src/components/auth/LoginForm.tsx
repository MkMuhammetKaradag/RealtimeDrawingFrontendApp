// src/components/auth/LoginForm.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  loginUser,
  selectAuthStatus,
  selectAuthError,
} from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // Form stilleri için CSS dosyası

const LoginForm = ({ onToggle }: { onToggle: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux store'dan gerekli state'leri çek
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  // Form input'larının state'i
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Form gönderme işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

    // Sadece idle (beklemede) durumdayken işleme devam et
    if (authStatus === 'loading') {
      return;
    }

    // Asenkron thunk'ı dispatch et ve sonucu bekle
    const resultAction = await dispatch(loginUser({ identifier, password }));

    // İşlem başarılıysa anasayfaya yönlendir
    if (loginUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    // <form onSubmit={handleSubmit} className="auth-form">
    //   {/* Eğer hata varsa, hata mesajını göster */}
    //   {authError && <div className="auth-error-message">{authError}</div>}

    //   <div className="form-group">
    //     <label htmlFor="identifier">Identifier</label>
    //     <input
    //       type="text"
    //       id="identifier"
    //       value={identifier}
    //       onChange={(e) => setIdentifier(e.target.value)}
    //       required
    //     />
    //   </div>
    //   <div className="form-group">
    //     <label htmlFor="password">Şifre</label>
    //     <input
    //       type="password"
    //       id="password"
    //       value={password}
    //       onChange={(e) => setPassword(e.target.value)}
    //       required
    //     />
    //   </div>
    //   <button
    //     type="submit"
    //     disabled={authStatus === 'loading'}
    //     className="submit-button"
    //   >
    //     {authStatus === 'loading' ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
    //   </button>
    // </form>
    <form onSubmit={handleSubmit} className="auth-form">
      {authError && (
        <div className="error-message animate-shake">
          <span>⚠️</span>
          {authError}
        </div>
      )}

      <div className="form-group">
        <div className="input-container">
          <input
            type="text"
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            placeholder="Kullanıcı adı veya e-posta"
          />
          <span className="input-icon">👤</span>
        </div>
      </div>

      <div className="form-group">
        <div className="input-container">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Şifre"
          />
          <span className="input-icon">🔒</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={authStatus === 'loading'}
        className={`submit-button ${authStatus === 'loading' ? 'loading' : ''}`}
      >
        <span className="button-text">
          {authStatus === 'loading' ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </span>
        <div className="button-bg"></div>
        {authStatus === 'loading' && <div className="loading-spinner"></div>}
      </button>

      <p className="toggle-text" onClick={onToggle}>
        <span>Henüz hesabın yok mu?</span>
        <strong> Kayıt ol</strong>
      </p>
    </form>
  );
};

export default LoginForm;
