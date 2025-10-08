import React, { useContext, type FC, type JSX } from 'react';

// İkonları içe aktar
import { IoMdCreate } from 'react-icons/io'; // Kalem
import { MdFormatColorFill } from 'react-icons/md'; // Doldurma
import { FaEraser } from 'react-icons/fa'; // Silgi
import { MdColorize } from 'react-icons/md'; // Renk Seçici (Damlalık)

import { ToolValue, type ToolType } from '../../../util/toolType';
import { ToolTypeContext } from '../../../context';

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
    'flex justify-center items-center w-8 h-8 cursor-pointer p-1 border border-transparent rounded-md transition-all text-xl shadow-sm';
  const hoverClasses = 'hover:border-indigo-500 hover:bg-indigo-100';
  const selectedClasses = isSelected
    ? 'bg-indigo-200 border-indigo-600 text-indigo-800 shadow-lg'
    : 'text-gray-700 bg-white';

  return (
    <button title={title} onClick={() => onClick(toolType)} type="button">
      <div className={`${baseClasses} ${hoverClasses} ${selectedClasses}`}>
        {icon}
      </div>
    </button>
  );
};

// ----------------------------------------------------------------------

const ToolPanel: FC<ToolPanelProps> = (props): JSX.Element => {
  const { className } = props;

  const toolContext = useContext(ToolTypeContext);
  const { type, setType } = toolContext;

  // ----------------------------------------------------------------------
  // KRİTİK DEĞİŞİKLİK: MASAÜSTÜNDE ÇOKLU SÜTUN (FLEX-WRAP İLE)
  // ----------------------------------------------------------------------

  return (
    // Mobil (Varsayılan): Yatay akış (Toolbar'a uyar), öğeler yan yana.
    // Masaüstü (md:): Dikey değil, satırları saran yatay akış (flex-row flex-wrap).
    <div
      className={`${className} w-full flex flex-row flex-wrap items-center justify-center space-x-2 md:space-x-1 md:space-y-1 p-0`}
    >
      {/*
        Masaüstü Modunda:
        - `flex-row` ve `flex-wrap` sayesinde butonlar yan yana sıralanır ve
          sığmadığında alt satıra geçer.
        - `md:w-1/2` (opsiyonel) ile her öğenin genişliğini ayarlayarak
          iki sütunlu bir düzeni zorlayabiliriz, ancak bu örnekte sadece
          `flex-wrap` yeterli olacaktır.
        - Daha temiz bir grid görünümü için `md:gap-1` kullanıldı.
      */}

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

      {/* Renk Seçici (Color Extractor) */}
      <ToolItem
        title="Renk Seçici (Damlalık)"
        icon={<MdColorize />}
        toolType={ToolValue.COLOR_EXTRACT}
        currentType={type}
        onClick={setType}
      />

      {/* Örnek olarak ek araçlar ekleyelim (Düzeni görmek için) */}
      {/* <ToolItem
        title="Metin Ekle"
        icon={<IoMdCreate />} // İkonu placeholder olarak kullandık
        toolType={ToolValue.TEXT as ToolType}
        currentType={type}
        onClick={setType}
      />
      <ToolItem
        title="Büyüteç"
        icon={<MdColorize />} // İkonu placeholder olarak kullandık
        toolType={ToolValue.MAGNIFYING as ToolType}
        currentType={type}
        onClick={setType}
      /> */}
    </div>
  );
};

export default ToolPanel;
