// src/components/common/ConnectionStatusCard.tsx
import React from 'react';

interface ConnectionStatusCardProps {
  status: 'connecting' | 'error' | 'disconnected';
  errorMessage?: string | null;
}

/**
 * Bağlantı durumu 'connecting', 'error' veya 'disconnected' olduğunda gösterilen tam sayfa kart.
 */
const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  status,
  errorMessage,
}) => {
  if (status === 'connecting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
        <p className="text-white text-xl ml-4">Odaya bağlanılıyor...</p>
      </div>
    );
  }

  if (status === 'error' || status === 'disconnected') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="w-full max-w-md p-8 bg-white border-t-4 border-red-600 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-red-600 mb-4 text-center">
            Bağlantı Kesildi! 🔴
          </h2>
          <p className="text-lg text-gray-700 mb-6 text-center">
            Sunucuyla bağlantı koptu. Lütfen internet bağlantınızı kontrol edin.
            {errorMessage && (
              <span className="block text-sm text-red-500 mt-2">
                Hata: {errorMessage}
              </span>
            )}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-transform transform hover:scale-[1.01]"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ConnectionStatusCard;
