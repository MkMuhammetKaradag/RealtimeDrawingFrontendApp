// src/components/HomePage/PrivateRoomForm.tsx

import React, { useState } from 'react';

interface PrivateRoomFormProps {
  onJoin: (roomId: string) => void;
}

const PrivateRoomForm: React.FC<PrivateRoomFormProps> = ({ onJoin }) => {
  const [privateRoomId, setPrivateRoomId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onJoin(privateRoomId);
    setPrivateRoomId('');
  };

  return (
    <div className="mb-8 p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
      <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <span>🔐</span>
        Özel Odaya Katıl
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={privateRoomId}
            onChange={(e) => setPrivateRoomId(e.target.value)}
            placeholder="Oda ID'sini girin..."
            className="w-full p-4 border-2 border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 bg-gray-700/50 text-white placeholder-gray-400"
            required
          />
        </div>
        <button
          type="submit"
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Odaya Gir
        </button>
      </form>
    </div>
  );
};

export default PrivateRoomForm;
