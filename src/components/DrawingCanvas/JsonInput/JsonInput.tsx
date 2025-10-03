// src/components/JsonInput/JsonInput.tsx

import React, { useState } from 'react';
import type { JsonInputProps } from './JsonInput.types';

export const JsonInput: React.FC<JsonInputProps> = ({
  show,
  onClose,
  onSubmit,
}) => {
  const [jsonInputValue, setJsonInputValue] = useState('');

  const handleSubmit = () => {
    onSubmit(jsonInputValue);
    setJsonInputValue(''); // Başarılı gönderimde input'u temizle
    onClose();
  };

  if (!show) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-inner">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        JSON Veri Girişi:
      </label>
      <textarea
        value={jsonInputValue}
        onChange={(e) => setJsonInputValue(e.target.value)}
        className="w-full p-3 border-2 border-gray-300 rounded-lg font-mono text-sm resize-y"
        rows={6}
        placeholder={`[
  {"strokeId": "abc-123", "points":[{"x":100,"y":100},{"x":200,"y":200}], "color":"#FF0000", "size":5, "filled":false, "tool":"pen"},
  {"strokeId": "def-456", "points":[{"x":500,"y":300},{"x":600,"y":400}], "color":"#0000FF", "size":10, "filled":true, "tool":"rectangle"}
]`}
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all"
        >
          İptal
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
        >
          Veriyi Çiz
        </button>
      </div>
    </div>
  );
};
