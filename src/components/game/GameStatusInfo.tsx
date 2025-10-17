// src/components/game/GameStatusInfo.tsx
import React from 'react';
import type { GameStatus, PlayerRole } from '../../types/game.interface';

interface GameStatusInfoProps {
  gameStatus: GameStatus;
  playerRole: PlayerRole;
  isVisible: boolean;
  onClose: () => void;
}

const GameStatusInfo: React.FC<GameStatusInfoProps> = ({
  gameStatus,
  playerRole,
  isVisible,
  onClose,
}) => {
  if (!isVisible) {
    return null;
  }

  // Duruma göre mesaj ve stil belirleme
  let messageConfig = {
    text: '',
    icon: '',
    gradient: '',
    bgColor: '',
    borderColor: '',
    textColor: '',
    shortText: '', // Mobil için kısa mesaj
  };

  if (gameStatus === 'started' && playerRole === 'drawer') {
    messageConfig = {
      text: '🎨 Sıra Sizde! Çizeceğiniz Kelime: "..."',
      shortText: '🎨 Çizme Sırası Sizde!',
      icon: '🎨',
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-900/90',
      borderColor: 'border-green-500',
      textColor: 'text-green-100',
    };
  } else if (gameStatus === 'started' && playerRole === 'guesser') {
    messageConfig = {
      text: '🔍 Tahmin Etmeye Başlayın! Çizimi izleyin ve kelimeyi bulun.',
      shortText: '🔍 Tahmin Etme Zamanı!',
      icon: '🔍',
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-900/90',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-100',
    };
  } else if (gameStatus === 'ended') {
    messageConfig = {
      text: '🏁 Oyun Sona Erdi! Sonuçlar açıklanıyor...',
      shortText: '🏁 Oyun Bitti!',
      icon: '🏁',
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-900/90',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-100',
    };
  } else if (gameStatus === 'waiting') {
    messageConfig = {
      text: '⏳ Yeni Tur Başlamak Üzere... Hazırlanın!',
      shortText: '⏳ Yeni Tur Geliyor!',
      icon: '⏳',
      gradient: 'from-yellow-500 to-amber-500',
      bgColor: 'bg-yellow-900/90',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-100',
    };
  } else {
    return null;
  }

  return (
    <div className="absolute top-2 sm:top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-20 w-[95vw] max-w-sm md:max-w-md transition-all duration-300">
      {/* Mobilde daha kompakt, masaüstünde daha geniş */}
      <div
        className={`relative backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl border-2 p-3 md:p-4 ${messageConfig.bgColor} ${messageConfig.borderColor}`}
      >
        {/* Gradient üst bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl md:rounded-t-2xl bg-gradient-to-r ${messageConfig.gradient}`}
        ></div>

        <div className="flex items-start md:items-center justify-between gap-2 md:gap-3">
          <div className="flex items-start md:items-center gap-2 md:gap-3 flex-1 min-w-0">
            {/* İkon - Mobilde daha küçük */}
            <div
              className={`text-xl md:text-2xl p-1.5 md:p-2 rounded-lg md:rounded-xl bg-white/10 backdrop-blur-sm flex-shrink-0`}
            >
              {messageConfig.icon}
            </div>

            {/* Mesaj içeriği - Mobilde daha kompakt */}
            <div className="flex-1 min-w-0">
              {/* Masaüstünde uzun mesaj, mobilde kısa mesaj */}
              <p
                className={`font-bold text-sm md:text-lg ${messageConfig.textColor} hidden md:block`}
              >
                {messageConfig.text}
              </p>
              <p
                className={`font-bold text-sm md:text-lg ${messageConfig.textColor} block md:hidden`}
              >
                {messageConfig.shortText}
              </p>

              {/* Alt açıklamalar - Sadece masaüstünde ve belirli durumlarda */}
              {gameStatus === 'started' && playerRole === 'drawer' && (
                <p className="text-green-200/80 text-xs md:text-sm mt-1 hidden md:block">
                  Diğer oyuncuların tahmin etmesi için çizmeye başlayın
                </p>
              )}
              {gameStatus === 'started' && playerRole === 'guesser' && (
                <p className="text-blue-200/80 text-xs md:text-sm mt-1 hidden md:block">
                  Doğru tahmin puan kazandırır! Hızlı olun!
                </p>
              )}
            </div>
          </div>

          {/* Kapatma Butonu - Mobilde daha küçük */}
          <button
            onClick={onClose}
            aria-label="Bilgi mesajını gizle"
            className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-white/20 active:scale-95 ${messageConfig.textColor}`}
          >
            <span className="text-base md:text-lg font-bold">×</span>
          </button>
        </div>

        {/* İlerleme çubuğu - Mobilde daha ince */}
        <div className="mt-2 md:mt-3 w-full bg-black/20 rounded-full h-0.5 md:h-1">
          <div
            className={`h-0.5 md:h-1 rounded-full bg-gradient-to-r ${messageConfig.gradient} transition-all duration-1000`}
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>

      {/* Ok işareti - Mobilde daha küçük */}
      <div className="absolute -bottom-1.5 md:-bottom-2 left-1/2 transform -translate-x-1/2">
        <div
          className={`w-3 h-3 md:w-4 md:h-4 rotate-45 ${messageConfig.bgColor} border-b-2 border-r-2 ${messageConfig.borderColor}`}
        ></div>
      </div>
    </div>
  );
};

export default GameStatusInfo;
