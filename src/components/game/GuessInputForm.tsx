// src/components/game/GuessInputForm.tsx
import React, { useState } from 'react';

interface GuessInputFormProps {
  onGuessSubmit: (guess: string) => void;
  connectionStatus: string;
}

/**
 * Kullanıcının tahminini girdiği ve gönderdiği form bileşeni.
 */
const GuessInputForm: React.FC<GuessInputFormProps> = ({
  onGuessSubmit,
  connectionStatus,
}) => {
  const [currentGuess, setCurrentGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedGuess = currentGuess.trim();
    if (!trimmedGuess) return;

    onGuessSubmit(trimmedGuess);
    setCurrentGuess(''); // Tahmin gönderildikten sonra inputu temizle
  };

  const isConnected = connectionStatus === 'connected';
  const isButtonDisabled = !currentGuess.trim() || !isConnected;

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 flex flex-col md:flex-row gap-3"
    >
      <input
        type="text"
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value)}
        placeholder="Tahmininizi buraya yazın..."
        className="flex-grow p-3 border-2 border-indigo-300 rounded-lg focus:outline-none focus:border-indigo-500 transition duration-150"
        disabled={!isConnected}
      />
      <button
        type="submit"
        className="md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-400"
        disabled={isButtonDisabled}
      >
        TAHMİN ET! 💬
      </button>
    </form>
  );
};

export default GuessInputForm;
