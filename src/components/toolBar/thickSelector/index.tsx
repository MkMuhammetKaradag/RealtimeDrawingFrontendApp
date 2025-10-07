import React, { useState, useContext, type FC, type JSX } from 'react';

// React Icons kütüphanesinden uygun ikonları içe aktar
import { BsDashLg } from 'react-icons/bs'; // Kalınlığı temsil etmek için genel bir çizgi ikonu
import { IoMdArrowDropdown } from 'react-icons/io'; // Popover açılır menü ikonu


import type { LineWidthType } from '../../../util/toolType';
import { LineWidthValue } from '../../../util/toolType';
import { LineWidthContext } from '../../../context';
import CustomPopover from './CustomPopover';

/**
 * Bileşen özellikleri (Props) tanımı.
 */
interface ThickSelectorProps {
  className?: string;
}

// Kalınlık seviyelerini temsil eden nesne dizisi
const thicks: {
  type: LineWidthType;
  title: string;
  size: string; // İkonun Tailwind boyutu (text-xl, text-2xl vb.)
  stroke: string; // İkonun çizgi kalınlığı (Custom CSS)
}[] = [
  {
    type: LineWidthValue.THIN,
    title: 'İnce (1px)',
    size: 'text-lg', // Hafifçe büyük çizgi
    stroke: '1px',
  },
  {
    type: LineWidthValue.MIDDLE,
    title: 'Orta (2px)',
    size: 'text-2xl',
    stroke: '1.5px',
  },
  {
    type: LineWidthValue.BOLD,
    title: 'Kalın (3px)',
    size: 'text-3xl',
    stroke: '2px',
  },
  {
    type: LineWidthValue.MAXBOLD,
    title: 'Çok Kalın (4px)',
    size: 'text-4xl',
    stroke: '3px',
  },
];

/**
 * Tek bir çizgi kalınlığı seçeneği için yardımcı bileşen.
 */
const LineThicknessIcon: FC<{
  size: string;
  stroke: string;
  isSelected: boolean;
}> = ({ size, stroke, isSelected }) => (
  <span className="flex items-center justify-center w-full h-full">
    <BsDashLg
      className={`${size} transform rotate-90 transition-colors duration-200`}
      style={{
        // Seçili rengi ve stroke (çizgi) kalınlığını doğrudan uygula
        color: isSelected ? 'var(--color-primary, #3b82f6)' : '#4b5563',
        strokeWidth: stroke,
      }}
    />
  </span>
);

const ThickSelector: FC<ThickSelectorProps> = (props): JSX.Element => {
  const { className } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEle, setAnchorEle] = useState<HTMLElement | null>(null);
  const lineWidthContext = useContext(LineWidthContext);

  const onOpen: React.MouseEventHandler<HTMLElement> = (event) => {
    setAnchorEle(event.currentTarget);
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  // Şu anki aktif kalınlığın detaylarını bul
  const currentThick =
    thicks.find((t) => t.type === lineWidthContext.type) || thicks[0];

  return (
    // Ana Kapsayıcı: thickselector
    <div
      className={`${className} relative p-2 pt-0 w-20 flex flex-col items-center`}
    >
      {/* Ana Buton: thickline */}
      <div
        className="relative w-full h-8 flex items-center justify-center cursor-pointer border border-transparent rounded-sm hover:bg-gray-100 hover:border-gray-300 transition-all"
        onClick={onOpen}
        title={`Çizgi Kalınlığı: ${currentThick.title}`}
      >
        {/* Mevcut Kalınlık İkonu */}
        <LineThicknessIcon
          size={currentThick.size}
          stroke={currentThick.stroke}
          isSelected={true}
        />

        {/* Açılır Menü İkonu */}
        <IoMdArrowDropdown className="absolute right-1 bottom-1 text-gray-500 text-base" />
      </div>

      {/* Custom Popover Menüsü */}
      <CustomPopover open={open} onClose={onClose} anchorEl={anchorEle}>
        <div className="flex flex-col p-1 space-y-1 bg-white shadow-lg rounded ring-1 ring-black ring-opacity-5">
          {thicks.map((thick) => {
            const isSelected = thick.type === lineWidthContext.type;

            // Popover içindeki thick-item görünümü
            const itemClasses = isSelected
              ? 'bg-blue-100 border-blue-500' // Seçili stil
              : 'hover:bg-gray-100 border-transparent'; // Normal stil

            return (
              <div
                key={thick.title}
                title={thick.title}
                className={`w-16 h-8 flex items-center justify-center p-1 rounded border cursor-pointer transition-colors ${itemClasses}`}
                onClick={() => {
                  lineWidthContext.setType(thick.type);
                  setOpen(false); // Seçimden sonra kapat
                }}
              >
                <LineThicknessIcon
                  size={thick.size}
                  stroke={thick.stroke}
                  isSelected={isSelected}
                />
              </div>
            );
          })}
        </div>
      </CustomPopover>

      {/* Panel Başlığı: title */}
      <div className="absolute bottom-0 w-full text-center text-xs font-semibold text-gray-600 pt-1">
        Kalınlık
      </div>
    </div>
  );
};

export default ThickSelector;
