import React, { useContext, type FC, type JSX } from 'react';

// İkonları içe aktar
import { IoMdCreate } from 'react-icons/io'; // Kalem
import { MdFormatColorFill } from 'react-icons/md'; // Doldurma
import { FaEraser } from 'react-icons/fa'; // Silgi
import { MdColorize } from 'react-icons/md'; // Renk Seçici (Damlalık)

import { ToolValue, type ToolType } from '../../../util/toolType';
import { ToolTypeContext } from '../../../context'; // Context'i hook ile kullanacağız

// Tailwind sınıfları kullanıldığından, ayrı bir CSS/Less dosyasına gerek kalmaz.
// import './index.less';

// TypeScript Arayüzü
export interface ToolPanelProps {
  className?: string; // Dışarıdan gelen stil sınıfı
}

/**
 * Tek bir araç butonunu temsil eden yardımcı bileşen.
 */
interface ToolItemProps {
  title: string;
  icon: JSX.Element;
  toolType: ToolType;
  currentType: ToolType;
  onClick: (type: ToolType) => void;
}

const ToolItem: FC<ToolItemProps> = ({
  title,
  icon,
  toolType,
  currentType,
  onClick,
}) => {
  const isSelected = currentType === toolType;

  // Tailwind sınıfları:
  const baseClasses =
    'flex justify-center items-center w-8 h-8 cursor-pointer p-1 border border-transparent rounded-sm transition-all text-xl';
  const hoverClasses = 'hover:border-blue-500 hover:bg-blue-100';
  const selectedClasses = isSelected
    ? 'bg-blue-200 border-blue-600 text-blue-800'
    : 'text-gray-700';

  return (
    <span title={title} onClick={() => onClick(toolType)}>
      <div className={`${baseClasses} ${hoverClasses} ${selectedClasses}`}>
        {icon}
      </div>
    </span>
  );
};

// ----------------------------------------------------------------------

const ToolPanel: FC<ToolPanelProps> = (props): JSX.Element => {
  const { className } = props;

  // useContext Hook'unu kullanarak Context değerlerine erişim
  const toolContext = useContext(ToolTypeContext);
  const { type, setType } = toolContext;

  return (
    // 'toolpanel' div'ini Tailwind sınıflarıyla yeniden tanımlıyoruz
    <div
      className={`${className} relative p-2 pt-0 w-24 flex flex-col items-center`}
    >
      {/* Üst Grup (Top) - Kalem, Silgi, Doldurma */}
      <div className="flex justify-between w-full mb-2">
        {/* Kalem (Pencil) */}
        <ToolItem
          title="Kalem"
          icon={<IoMdCreate />}
          toolType={ToolValue.PEN}
          currentType={type}
          onClick={setType}
        />

        {/* Silgi (Eraser) */}
        <ToolItem
          title="Silgi"
          icon={<FaEraser />}
          toolType={ToolValue.ERASER}
          currentType={type}
          onClick={setType}
        />

        {/* Renk Doldurma (Fill) */}
        <ToolItem
          title="Renk Doldur"
          icon={<MdFormatColorFill />}
          toolType={ToolValue.COLOR_FILL}
          currentType={type}
          onClick={setType}
        />
      </div>

      {/* Alt Grup (Down) - Renk Seçici */}
      <div className="flex justify-start w-full">
        {/* Renk Seçici (Color Extractor) */}
        <ToolItem
          title="Renk Seçici (Damlalık)"
          icon={<MdColorize />}
          toolType={ToolValue.COLOR_EXTRACT}
          currentType={type}
          onClick={setType}
        />
      </div>

      {/* Panel Başlığı (Title) */}
      {/* Absolute konumlandırma ile altta ortalanmış başlık */}
      <div className="absolute bottom-0 w-full text-center text-xs font-semibold text-gray-600 pt-1">
        Araçlar
      </div>
    </div>
  );
};

export default ToolPanel;
