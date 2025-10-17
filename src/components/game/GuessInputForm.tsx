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
    <div className="mt-1 p-4 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={currentGuess}
            onChange={(e) => setCurrentGuess(e.target.value)}
            placeholder="Tahmininizi yazın ve Enter'a basın..."
            className={`w-full p-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all duration-200 placeholder-gray-400 ${
              isConnected
                ? 'bg-gray-700/50 border-gray-600 text-white focus:border-indigo-500 focus:ring-indigo-500/20'
                : 'bg-gray-800/30 border-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!isConnected}
            maxLength={50}
          />

          {/* Karakter sayacı */}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span
              className={`text-xs ${
                currentGuess.length > 35
                  ? 'text-red-400'
                  : currentGuess.length > 25
                  ? 'text-yellow-400'
                  : 'text-gray-400'
              }`}
            >
              {currentGuess.length}/50
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isButtonDisabled}
          className={`relative px-8 py-4 font-bold rounded-xl shadow-2xl transition-all duration-200 transform overflow-hidden group ${
            !isButtonDisabled
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-indigo-500/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {/* Gradient hover efekti */}
          {!isButtonDisabled && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          )}

          <span className="relative z-10 flex items-center justify-center gap-2">
            {!isButtonDisabled ? (
              <>
                <span className="text-lg">🚀</span>
                TAHMİN ET
              </>
            ) : (
              <>
                <span className="text-lg">⏳</span>
                {!isConnected ? 'BAĞLANTI YOK' : 'TAHMİN GİRİN'}
              </>
            )}
          </span>
        </button>
      </form>

      {/* İpucu ve Bilgilendirme */}
      <div className=" mt-4 sm:flex hidden flex-col sm:flex-row gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span>💡</span>
          <span>Hızlı ve doğru tahminler bonus puan kazandırır!</span>
        </div>

        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span>Enter tuşu ile hızlı gönderim</span>
        </div>
      </div>

      {/* Örnek Tahminler (Opsiyonel - Eğitim Amaçlı) */}
      {currentGuess.length === 0 && (
        <div className="mt-3 hidden  sm:block">
          <p className="text-xs text-gray-500 mb-2">Örnek tahminler:</p>
          <div className="flex flex-wrap gap-2">
            {['elma', 'araba', 'güneş', 'kitap', 'balık'].map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setCurrentGuess(example)}
                className="px-3 py-1 bg-gray-700/50 text-gray-300 rounded-lg text-xs hover:bg-gray-600/50 transition-colors duration-150"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuessInputForm;
