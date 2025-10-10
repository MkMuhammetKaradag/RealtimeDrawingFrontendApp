// src/components/GameSettingsForm.tsx

import React from 'react';

// Ayar türlerini tanımlayalım
interface GameSettings {
  total_rounds: number;
  round_duration: number; // Saniye
  max_players: number;
  min_players: number;
}

// Props arayüzünü tanımlayalım
interface GameSettingsFormProps {
  settings: GameSettings;
  onSettingChange: (name: keyof GameSettings, value: number) => void;
  onStartGame: () => void;
  onUpdatedSetting: () => void;
  isHost: boolean; // Sadece host'un ayar yapabilmesi için
}

const GameSettingsForm: React.FC<GameSettingsFormProps> = ({
  settings,
  onSettingChange,
  onStartGame,
  onUpdatedSetting,
  isHost,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // value'nun sayı olduğundan emin olalım
    const numericValue = parseInt(value, 10);
    // isNaN kontrolü yapabiliriz
    if (!isNaN(numericValue)) {
      onSettingChange(name as keyof GameSettings, numericValue);
    }
  };

  const InputGroup: React.FC<{
    label: string;
    name: keyof GameSettings;
    value: number;
    min: number;
    max: number;
    unit?: string;
  }> = ({ label, name, value, min, max, unit }) => (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} ({unit})
      </label>
      <input
        id={name}
        name={name}
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={!isHost}
        className={`p-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ${
          isHost ? 'bg-white' : 'bg-gray-100 cursor-not-allowed'
        }`}
      />
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-indigo-100">
      <h2 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2">
        🛠️ Oyun Ayarları
      </h2>

      {isHost ? (
        <p className="text-green-600 mb-4">
          Oda sahibisiniz. Lütfen oyun ayarlarını yapın.
        </p>
      ) : (
        <p className="text-yellow-600 mb-4">
          Ayarları sadece oda sahibi değiştirebilir. Başlamasını bekleyin.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

      <div className="text-center ">
        <button
          onClick={onStartGame}
          disabled={!isHost}
          className={`w-full px-8 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 transform ${
            isHost
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
        >
          {isHost ? 'OYUNU BAŞLAT! 🚀' : 'BAŞLAMASI BEKLENİYOR...'}
        </button>
        <button
          onClick={onUpdatedSetting}
          disabled={!isHost}
          className={`w-full px-8 mt-4 py-3 font-bold rounded-xl shadow-lg transition-all duration-200 transform ${
            isHost
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
        >
          {isHost ? 'Setting Uptdated🚀' : 'BAŞLAMASI BEKLENİYOR...'}
        </button>
      </div>
    </div>
  );
};

export default GameSettingsForm;
