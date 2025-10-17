// src/components/auth/RegisterForm.tsx

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  registerUser,
  selectAuthStatus,
  selectAuthError,
} from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const RegisterForm = ({ onToggle }: { onToggle: () => void }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authStatus === 'loading') {
      return;
    }

    const resultAction = await dispatch(
      registerUser({ username, email, password })
    );

    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {authError && (
        <div className="bg-gradient-to-br from-red-200 to-red-300 text-red-700 p-3 px-4 rounded-lg font-semibold flex items-center gap-2 border border-red-200 animate-shake">
          <span>⚠️</span>
          {authError}
        </div>
      )}

      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Kullanıcı adı"
            className="w-full mt-2 py-4 pr-12 pl-5 border-2 border-gray-300 rounded-xl text-base bg-white bg-opacity-80 transition-all duration-300 ease-in-out outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:transform focus:-translate-y-0.5 placeholder-gray-400 placeholder:font-medium"
          />
          <span className="absolute right-4 text-xl opacity-70 transition-transform duration-200 ease-in-out pointer-events-none">
            👤
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="E-posta adresin"
            className="w-full py-4 pr-12 pl-5 border-2 border-gray-300 rounded-xl text-base bg-white bg-opacity-80 transition-all duration-300 ease-in-out outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:transform focus:-translate-y-0.5 placeholder-gray-400 placeholder:font-medium"
          />
          <span className="absolute right-4 text-xl opacity-70 transition-transform duration-200 ease-in-out pointer-events-none">
            📧
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Güçlü bir şifre"
            className="w-full py-4 pr-12 pl-5 border-2 border-gray-300 rounded-xl text-base bg-white bg-opacity-80 transition-all duration-300 ease-in-out outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:transform focus:-translate-y-0.5 placeholder-gray-400 placeholder:font-medium"
          />
          <span className="absolute right-4 text-xl opacity-70 transition-transform duration-200 ease-in-out pointer-events-none">
            🔒
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={authStatus === 'loading'}
        className={`relative px-8 py-4 border-none rounded-xl text-lg font-bold text-white cursor-pointer overflow-hidden transition-all duration-300 ease-in-out mt-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 hover:transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-300 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none group ${
          authStatus === 'loading' ? 'loading' : ''
        }`}
      >
        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-br from-purple-600 to-indigo-500 transition-left duration-400 ease-in-out z-10 group-hover:left-0"></div>

        <span className="relative z-20">
          {authStatus === 'loading' ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
        </span>

        {authStatus === 'loading' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 border-2 border-white border-opacity-30 border-t-2 border-t-white rounded-full animate-spin z-30"></div>
        )}
      </button>

      <p
        className="text-center text-gray-500 cursor-pointer text-sm transition-all duration-300 ease-in-out mt-2.5 hover:text-indigo-500 hover:transform hover:-translate-y-0.5"
        onClick={onToggle}
      >
        <span>Zaten hesabın var mı?</span>
        <strong className="text-indigo-500 font-bold"> Giriş yap</strong>
      </p>
    </form>
  );
};

export default RegisterForm;
