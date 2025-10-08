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
    size: 'text-lg',
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

  // ----------------------------------------------------------------------
  // KRİTİK DÜZENLEME: RESPONSIVE ANA KONTEYNER VE BAŞLIK KALDIRMA
  // ----------------------------------------------------------------------

  return (
    // Ana Kapsayıcı: thickselector
    // W-full ile tam genişlik kullanır, dikey/yatay akışa uyum sağlar.
    // Başlık kaldırıldığı için 'pt-0' gereksiz hale geldi, p-0 yeterli.
    <div
      className={`${className} relative w-full flex items-center justify-center p-0`}
    >
      {/* Ana Buton: thickline */}
      <button
        type="button" // Erişilebilirlik için
        className="relative w-full h-10 flex items-center justify-center cursor-pointer border border-transparent rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <IoMdArrowDropdown className="absolute right-1 text-gray-500 text-xl" />
      </button>

      {/* Custom Popover Menüsü */}
      <CustomPopover open={open} onClose={onClose} anchorEl={anchorEle}>
        <div className="flex flex-col p-2 space-y-1 bg-white shadow-xl rounded-lg ring-1 ring-black ring-opacity-5">
          {thicks.map((thick) => {
            const isSelected = thick.type === lineWidthContext.type;

            // Popover içindeki thick-item görünümü
            const itemClasses = isSelected
              ? 'bg-indigo-100 border-indigo-500 text-indigo-700' // Seçili stil
              : 'hover:bg-gray-100 border-gray-100 text-gray-700'; // Normal stil

            return (
              <button
                key={thick.title}
                title={thick.title}
                type="button"
                className={`w-20 h-8 flex items-center justify-center p-1 rounded-md border cursor-pointer transition-colors ${itemClasses}`}
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
              </button>
            );
          })}
        </div>
      </CustomPopover>

      {/* Panel Başlığı Kaldırıldı (Yer kazanmak ve gereksiz tekrardan kaçınmak için) */}
    </div>
  );
};

export default ThickSelector;
