// src/components/auth/RegisterForm.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  registerUser,
  selectAuthStatus,
  selectAuthError,
} from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import './AuthForms.css'; // Ortak stil dosyasını import et

const RegisterForm = ({ onToggle }: { onToggle: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Redux store'dan gerekli state'leri çek
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  // Form input'larının state'i
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form gönderme işlemi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Sayfanın yeniden yüklenmesini engelle

    // Yükleme durumundayken tekrar form göndermeyi engelle
    if (authStatus === 'loading') {
      return;
    }

    // registerUser async thunk'ını dispatch et
    const resultAction = await dispatch(
      registerUser({ username, email, password })
    );

    // İşlem başarılıysa anasayfaya yönlendir
    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    // <form onSubmit={handleSubmit} className="auth-form">
    //   {/* Eğer hata varsa, hata mesajını göster */}
    //   {authError && <div className="auth-error-message">{authError}</div>}

    //   <div className="form-group">
    //     <label htmlFor="username">Kullanıcı Adı</label>
    //     <input
    //       type="text"
    //       id="username"
    //       value={username}
    //       onChange={(e) => setUsername(e.target.value)}
    //       required
    //     />
    //   </div>
    //   <div className="form-group">
    //     <label htmlFor="email">E-posta</label>
    //     <input
    //       type="email"
    //       id="email"
    //       value={email}
    //       onChange={(e) => setEmail(e.target.value)}
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
    //     {authStatus === 'loading' ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
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
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Kullanıcı adı"
          />
          <span className="input-icon">👤</span>
        </div>
      </div>

      <div className="form-group">
        <div className="input-container">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="E-posta adresin"
          />
          <span className="input-icon">📧</span>
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
            placeholder="Güçlü bir şifre"
          />
          <span className="input-icon">🔒</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={authStatus === 'loading' }
        className={`submit-button ${authStatus === 'loading'  ? 'loading' : ''}`}
      >
        <span className="button-text">
          {authStatus === 'loading'  ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
        </span>
        <div className="button-bg"></div>
        {authStatus === 'loading'  && <div className="loading-spinner"></div>}
      </button>

      <p className="toggle-text" onClick={onToggle}>
        <span>Zaten hesabın var mı?</span>
        <strong> Giriş yap</strong>
      </p>
    </form>
  );
};

export default RegisterForm;
