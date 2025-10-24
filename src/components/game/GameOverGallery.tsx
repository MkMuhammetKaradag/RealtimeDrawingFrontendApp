// src/components/game/GameOverGallery.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleMiniCanvas from '../canvas/SimpleMiniCanvas'; // Yolu güncelleyin
import { type ActionWithPlayer, type ParsedAction } from '../../pages/paint'; // Tip tanımını içe aktarın

interface RoundData {
  roundNumber: string;
  word: string;
  actions: ActionWithPlayer[];
  contributors: string[];
}
interface GameOverGalleryProps {
  gameOverData: any;
  onNewGame: () => void;
}

const GameOverGallery: React.FC<GameOverGalleryProps> = ({
  gameOverData,
  onNewGame,
}) => {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');

  // Oyuncu ID'sini kısaltma
  const shortenPlayerId = useCallback((playerId: string) => {
    return playerId.slice(0, 8) + '...';
  }, []);

  // Aksiyonları parse etme
  const parseActions = useCallback(
    (actions: ActionWithPlayer[]): ParsedAction[] => {
      return actions
        .map((action) => {
          try {
            const parsed = JSON.parse(action.Data) as ParsedAction;
            return { ...parsed, player_id: action.PlayerID };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean) as ParsedAction[];
    },
    []
  );

  // Round verilerini parse etme (ÇOK BÜYÜK MANTIK BURAYA TAŞINDI)
  const parseRoundData = useCallback((data: any): RoundData[] => {
    if (!data?.rounds) return [];

    return Object.entries(data.rounds)
      .map(([roundKey, roundData]: [string, any]) => {
        const roundNumber = roundKey.replace('round_', '');
        if (
          !roundData.actions ||
          !Array.isArray(roundData.actions) ||
          roundData.actions.length === 0
        ) {
          return null;
        }

        const contributors = [
          ...new Set(
            roundData.actions.map((action: ActionWithPlayer) => action.PlayerID)
          ),
        ];

        return {
          roundNumber,
          word: roundData.word || 'Bilinmeyen',
          actions: roundData.actions,
          contributors,
        };
      })
      .filter(Boolean) as RoundData[];
  }, []);

  // Veri yükleme ve ilk round'ı seçme
  useEffect(() => {
    const parsedRounds = parseRoundData(gameOverData);
    setRounds(parsedRounds);

    if (parsedRounds.length > 0 && !selectedRound) {
      setSelectedRound(parsedRounds[0].roundNumber);
    }
  }, [gameOverData, parseRoundData, selectedRound]);

  const selectedRoundData = rounds.find(
    (round) => round.roundNumber === selectedRound
  );

  // Kaydedilmiş çizim yoksa
  if (rounds.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-6">🎨</div>
          <h2 className="text-2xl font-bold text-white mb-4">Oyun Sonu!</h2>
          <p className="text-gray-300 mb-6">
            Bu oyunda kaydedilmiş çizim bulunamadı.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onNewGame}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              🎮 Yeni Oyun Başlat
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              🏠 Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Galeri Gösterimi
  return (
    <div className="w-full h-full bg-gray-800 rounded-xl border border-gray-600 p-6 overflow-auto">
      {/* ... (Round Seçici, Detaylar, Canvas Önizleme, İstatistikler) ... */}
      {/* Buradaki tüm HTML yapısı, Game Over Gallery'nin büyük yapısını temsil eder. */}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-3xl font-bold text-white mb-2">Oyun Sonu!</h2>
        {/* ... (İstatistikler) ... */}
      </div>

      {/* Round Seçici */}
      <div className="mb-6">
        {/* ... (Round seçici düğmelerinin HTML'i) ... */}
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Round Seçin:
        </label>
        <div className="flex flex-wrap gap-2">
          {rounds.map((round) => (
            <button
              key={round.roundNumber}
              onClick={() => setSelectedRound(round.roundNumber)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                selectedRound === round.roundNumber
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Round {round.roundNumber}
              <div className="text-xs opacity-80">
                {round.word} • {round.actions.length} eylem
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedRoundData && (
        <div className="space-y-6">
          {/* Seçili Round Detayları */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            {/* Kelime ve Başlık */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <h3 className="text-xl font-bold text-white">
                Round {selectedRoundData.roundNumber}
              </h3>
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                Kelime:{' '}
                <span className="text-yellow-300 font-bold">
                  {selectedRoundData.word}
                </span>
              </div>
            </div>

            {/* Ana Canvas Önizleme */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3">
                Round Çizimi
              </h4>
              <div className="bg-gray-600/30 rounded-lg p-4 border border-gray-500 flex justify-center">
                <SimpleMiniCanvas
                  key={`round-${selectedRoundData.roundNumber}`}
                  roundId={selectedRoundData.roundNumber}
                  actions={parseActions(selectedRoundData.actions)}
                  width={500}
                  height={350}
                />
              </div>
            </div>

            {/* Katkıda Bulunan Oyuncular ve İstatistikler (Orijinal koddan kısaltıldı) */}
            {/* ... (Katkıda Bulunanlar HTML'i) ... */}
            {/* ... (İstatistikler HTML'i) ... */}
          </div>
        </div>
      )}

      {/* Butonlar */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-600">
        <button
          onClick={onNewGame}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          🎮 Yeni Oyun Başlat
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          🏠 Ana Sayfaya Dön
        </button>
      </div>
    </div>
  );
};

export default GameOverGallery;
