// src/pages/HomePage/index.tsx

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { hello } from '../../services/auth.service';
import type { AppDispatch, RootState } from '../../store/store';
import DrawingCanvas from '../../components/home/DrawingCanvas';

const HomePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);

  // Logout butonu için handler (aynı kalır)
  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // Hello butonu için handler (aynı kalır)
  const handleHello = async () => {
    try {
      const response = await hello();
      console.log('Hello from server:', response);
      alert('Hello from server: ' + JSON.stringify(response));
    } catch (error) {
      console.error('Hello request failed:', error);
      alert('Hello request failed. See console for details.');
    }
  };

  return (
    // 🔑 Tailwind ile ana konteyneri güzelleştiriyoruz
    <div className="min-h-screen bg-gray-50 p-6 sm:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-7xl font-extrabold text-blue-400 mb-4 border-b pb-2">
          Ana Sayfa & Ortak Çizim Testi
        </h1>
        <h1 className="text-3xl font-bold underline text-neutral-700">
          Hello world!
        </h1>
        {/* Kullanıcı Bilgisi ve Aksiyonlar */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white shadow rounded-xl">
          {user && (
            <p className="text-xl text-gray-700 font-medium">
              Hoş geldiniz,{' '}
              <span className="text-blue-500">{user.username}</span>!
            </p>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleHello}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
            >
              Hello Server
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* Çizim Tuvali Bölümü */}
        <div className="mt-8">
          <DrawingCanvas />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
