// src/components/Toolbar/Toolbar.tsx

import React from 'react';
import {
  Pencil,
  Eraser,
  Circle,
  Square,
  Minus,
  Trash2,
  Download,
  Upload,
  Undo,
  Droplet,
} from 'lucide-react';
import type { ToolbarProps } from './Toolbar.types';

const colors = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#FFA500',
  '#800080',
];

const sizes = [2, 5, 10, 15, 20];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  filled,
  setFilled,
  clearCanvas,
  undoStroke,
  exportData,
  toggleJsonInput,
  allStrokesCount,
}) => {
  const renderFillControl = () => {
    // Sadece şekil araçları seçili olduğunda dolgu kontrolünü göster
    const showFill = ['line', 'circle', 'rectangle'].includes(tool);
    if (!showFill) return null;

    return (
      <div className="flex gap-2 p-2 bg-gray-100 rounded-lg items-center">
        <button
          onClick={() => setFilled(!filled)}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold ${
            filled
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filled ? '🎨 Dolu' : '⭕ Boş'}
        </button>
        {filled && (
          <div className="text-sm text-gray-600">
            {tool === 'line' && 'Kalın çizgi'}
            {tool === 'circle' && 'Dolu daire'}
            {tool === 'rectangle' && 'Dolu dikdörtgen'}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-4 lg:p-6 lg:pb-4">
      <div className="flex flex-wrap items-center gap-4 lg:flex-col lg:items-start lg:gap-6">
        {/* Araçlar */}
        <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => setTool('pen')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'pen'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            title="Kalem"
          >
            <Pencil size={20} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'eraser'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            title="Silgi"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'circle'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            title="Daire"
          >
            <Circle size={20} />
          </button>
          <button
            onClick={() => setTool('rectangle')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'rectangle'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            title="Dikdörtgen"
          >
            <Square size={20} />
          </button>
          <button
            onClick={() => setTool('bucket')}
            className={`p-3 rounded-lg transition-all ${
              tool === 'bucket'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-200'
            }`}
            title="Boya Kovası"
          >
            <Droplet size={20} />
          </button>
        </div>

        {/* Dolgu Kontrolü */}
        {renderFillControl()}

        {/* Renkler */}
        <div className="flex flex-wrap lg:flex-row gap-2 p-2 bg-gray-100 rounded-lg items-center max-w-full">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-10 h-10 rounded-lg transition-all ${
                color === c
                  ? 'ring-4 ring-blue-500 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{
                backgroundColor: c,
                border: c === '#FFFFFF' ? '2px solid #ddd' : 'none',
              }}
              title={c}
            />
          ))}
          <div className="ml-2 flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-300"
              title="Özel renk seç"
            />
          </div>
        </div>

        {/* Boyutlar */}
        <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                size === s
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
              title={`${s}px`}
            >
              <div
                className="rounded-full bg-current"
                style={{ width: s, height: s }}
              />
            </button>
          ))}
        </div>

        {/* Aksiyonlar */}
        <div className="flex flex-wrap gap-2 w-full lg:flex-col lg:w-auto lg:mt-4">
          <button
            onClick={undoStroke}
            disabled={allStrokesCount === 0}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full lg:w-auto justify-center"
          >
            <Undo size={18} />
            Geri Al
          </button>
          <button
            onClick={toggleJsonInput}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <Upload size={18} />
            Veri Ekle
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <Download size={18} />
            İndir
          </button>
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2 w-full lg:w-auto justify-center"
          >
            <Trash2 size={18} />
            Temizle
          </button>
        </div>
      </div>
    </div>
  );
};
