// src/components/GameSettingsForm.tsx

import React from 'react';

interface GameSettings {
  total_rounds: number;
  round_duration: number;
  max_players: number;
  min_players: number;
  game_mode_id: number;
}

interface GameSettingsFormProps {
  settings: GameSettings;
  onSettingChange: (name: keyof GameSettings, value: number) => void;
  onStartGame: () => void;
  onUpdatedSetting: () => void;
  onUpdateGameMode: (modeId: number) => void;
  isHost: boolean;
}

const GAME_MODES = [
  { id: 1, name: '🎨 Çiz ve Tahmin (Klasik)' },
  { id: 2, name: '👥 Ortak Alan' },
  { id: 3, name: '⚔️ VS Modu' },
];

const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
  settings,
  onSettingChange,
  onStartGame,
  onUpdateGameMode,
  isHost,
}) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const numericValue = parseInt(value, 10);

    if (name === 'game_mode_id') {
      if (!isNaN(numericValue)) {
        onUpdateGameMode(numericValue);
      }
    } else if (!isNaN(numericValue)) {
      onSettingChange(name as keyof GameSettings, numericValue);
    }
  };

  // Host olmayanlar için özet bileşeni
  const SettingsSummary: React.FC = () => (
    <div className="text-center">
      <div className="mb-6">
        <div className="text-4xl mb-2">⏳</div>
        <h3 className="text-xl font-bold text-gray-200 mb-2">
          Oyun Başlamak Üzere!
        </h3>
        <p className="text-gray-400">
          Oda sahibi oyunu başlatmak üzere. Hazırlanın!
        </p>
      </div>

      {/* Ayarlar Özeti */}
      <div className="bg-gray-700/30 rounded-xl p-6 mb-6 border border-gray-600/50">
        <h4 className="text-lg font-semibold text-gray-200 mb-4 flex items-center justify-center gap-2">
          <span>⚙️</span>
          Oyun Ayarları Özeti
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-600/20 rounded-lg">
            <div className="text-2xl font-bold text-indigo-400">
              {settings.total_rounds}
            </div>
            <div className="text-xs text-gray-400 mt-1">Tur</div>
          </div>
          <div className="text-center p-3 bg-gray-600/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {Math.floor(settings.round_duration / 60)}:
              {(settings.round_duration % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-gray-400 mt-1">Süre</div>
          </div>
          <div className="text-center p-3 bg-gray-600/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {settings.max_players}
            </div>
            <div className="text-xs text-gray-400 mt-1">Maks. Oyuncu</div>
          </div>
          <div className="text-center p-3 bg-gray-600/20 rounded-lg">
            <div className="text-lg font-bold text-yellow-400">
              {
                GAME_MODES.find(
                  (mode) => mode.id === settings.game_mode_id
                )?.name.split(' ')[0]
              }
            </div>
            <div className="text-xs text-gray-400 mt-1">Mod</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-600/30">
          <p className="text-sm text-gray-400">
            Mod:{' '}
            <span className="text-gray-300">
              {
                GAME_MODES.find((mode) => mode.id === settings.game_mode_id)
                  ?.name
              }
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  // Host için tam form bileşeni
  const HostSettingsForm: React.FC = () => {
    const InputGroup: React.FC<{
      label: string;
      name: keyof GameSettings;
      value: number;
      min: number;
      max: number;
      unit?: string;
    }> = ({ label, name, value, min, max, unit }) => (
      <div className="flex flex-col">
        <label
          htmlFor={name}
          className="text-sm font-medium text-gray-300 mb-2"
        >
          {label}
          {unit && <span className="text-gray-400 ml-1">({unit})</span>}
        </label>
        <input
          id={name}
          name={name}
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          className="p-3 border-2 border-gray-600 rounded-xl bg-gray-700/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200 placeholder-gray-400"
        />
      </div>
    );

    const GameModeSelect: React.FC = () => (
      <div className="flex flex-col md:col-span-2">
        <label
          htmlFor="game_mode_id"
          className="text-sm font-medium text-gray-300 mb-2"
        >
          Oyun Modu
        </label>
        <select
          id="game_mode_id"
          name="game_mode_id"
          value={settings.game_mode_id || 1}
          onChange={handleChange}
          className="p-3 border-2 border-gray-600 rounded-xl bg-gray-700/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all duration-200"
        >
          {GAME_MODES.map((mode) => (
            <option
              key={mode.id}
              value={mode.id}
              className="bg-gray-800 text-white"
            >
              {mode.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-2">
          {settings.game_mode_id === 2
            ? 'Kısa sürede çizim gerektirir.'
            : settings.game_mode_id === 3
            ? 'Rekabetçi oyun modu.'
            : 'Standart çizim ve tahmin modu.'}
        </p>
      </div>
    );

    return (
      <>
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700/50">
          <div className="text-2xl">🎮</div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Oyun Ayarlarını Yönet
          </h2>
        </div>

        <div className="mb-6 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <p className="font-semibold text-green-300">Oda Sahibisiniz</p>
              <p className="text-sm text-green-400/90 mt-1">
                Oyun ayarlarını yapıp başlatabilirsiniz.
              </p>
            </div>
          </div>
        </div>

        {/* Ayarlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <GameModeSelect />
          <InputGroup
            label="Toplam Tur Sayısı"
            name="total_rounds"
            value={settings.total_rounds}
            min={2}
            max={8}
            unit="Tur"
          />
          <InputGroup
            label="Tur Süresi"
            name="round_duration"
            value={settings.round_duration}
            min={30}
            max={180}
            unit="Saniye"
          />
          <InputGroup
            label="Maksimum Oyuncu"
            name="max_players"
            value={settings.max_players}
            min={2}
            max={10}
            unit="Kişi"
          />
          <InputGroup
            label="Minimum Oyuncu"
            name="min_players"
            value={settings.min_players}
            min={2}
            max={8}
            unit="Kişi"
          />
        </div>

        {/* Ayarlar Önizleme */}
        <div className="mb-6 p-4 bg-gray-700/30 rounded-xl border border-gray-600/50">
          <h4 className="text-lg font-semibold text-gray-200 mb-3 flex items-center gap-2">
            <span>👁️</span>
            Ayarlar Önizleme
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-2 bg-gray-600/20 rounded-lg">
              <div className="text-lg font-bold text-indigo-400">
                {settings.total_rounds}
              </div>
              <div className="text-xs text-gray-400">Tur</div>
            </div>
            <div className="text-center p-2 bg-gray-600/20 rounded-lg">
              <div className="text-lg font-bold text-green-400">
                {Math.floor(settings.round_duration / 60)}:
                {(settings.round_duration % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-400">Süre</div>
            </div>
            <div className="text-center p-2 bg-gray-600/20 rounded-lg">
              <div className="text-lg font-bold text-purple-400">
                {settings.max_players}
              </div>
              <div className="text-xs text-gray-400">Maks. Oyuncu</div>
            </div>
            <div className="text-center p-2 bg-gray-600/20 rounded-lg">
              <div className="text-sm font-bold text-yellow-400">
                {
                  GAME_MODES.find(
                    (mode) => mode.id === settings.game_mode_id
                  )?.name.split(' ')[0]
                }
              </div>
              <div className="text-xs text-gray-400">Mod</div>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="p-6 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50">
      {isHost ? <HostSettingsForm /> : <SettingsSummary />}

      {/* Başlat Butonu - Her İki Durumda da Görünür */}
      <div className="text-center mt-6">
        <button
          onClick={onStartGame}
          disabled={!isHost}
          className={`relative w-full py-4 px-8 font-bold rounded-xl shadow-2xl transition-all duration-200 transform overflow-hidden group ${
            isHost
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-indigo-500/25'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {/* Gradient hover efekti (sadece host için) */}
          {isHost && (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          )}

          <span className="relative z-10 flex items-center justify-center gap-2">
            {isHost ? (
              <>
                <span className="text-lg">🚀</span>
                OYUNU BAŞLAT
              </>
            ) : (
              <>
                <span className="text-lg">⏳</span>
                BAŞLAMASI BEKLENİYOR...
              </>
            )}
          </span>
        </button>

        {/* Açıklama */}
        <p className="text-sm text-gray-400 mt-3">
          {isHost
            ? 'Ayarları tamamladıysanız oyunu başlatabilirsiniz'
            : 'Oyunu başlatmak için oda sahibi olmalısınız'}
        </p>
      </div>
    </div>
  );
};

export default GameSettingsForm;
