// src/components/HomePage/HeaderSection.tsx

import React from 'react';

interface HeaderSectionProps {
  username?: string;
  isLoading: boolean;
  onRefresh: () => void;
  onHello: () => void;
  onLogout: () => void;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
  username,
  isLoading,
  onRefresh,
  onHello,
  onLogout,
}) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
      <div className="flex-1">
        <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Oda Listesi
        </h1>
        {username && (
          <p className="text-lg text-gray-300 mt-2">
            Hoş geldiniz,{' '}
            <span className="font-semibold text-indigo-300">{username}</span>!
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>🔄</span>
          {isLoading ? 'Yükleniyor...' : 'Yenile'}
        </button>

        <button
          onClick={onHello}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Hello Server
        </button>

        <button
          onClick={onLogout}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default HeaderSection;
