// src/components/Toolbar/tool.tsx (GÜNCELLENMİŞ - MOBİL OPTİMİZE)

import React, { useContext, type FC, type JSX } from 'react';
import { IoMdCreate } from 'react-icons/io';
import { MdFormatColorFill } from 'react-icons/md';
import { FaEraser } from 'react-icons/fa';
import { MdColorize } from 'react-icons/md';
import { ToolValue, type ToolType } from '../../../util/toolType';
import { ToolTypeContext } from '../../../context';

export interface ToolPanelProps {
  className?: string;
}

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

  // Mobil ve masaüstü için farklı boyutlar
  const baseClasses =
    'flex justify-center items-center cursor-pointer border border-transparent rounded-md transition-all shadow-sm';
  const mobileClasses = 'w-7 h-7 p-0.5 text-base';
  const desktopClasses = 'md:w-8 md:h-8 md:p-1 md:text-xl';

  const hoverClasses = 'hover:border-indigo-500 hover:bg-indigo-100';
  const selectedClasses = isSelected
    ? 'bg-indigo-200 border-indigo-600 text-indigo-800 shadow-lg'
    : 'text-gray-700 bg-white';

  return (
    <button
      title={title}
      onClick={() => onClick(toolType)}
      type="button"
      className={`${baseClasses} ${mobileClasses} ${desktopClasses} ${hoverClasses} ${selectedClasses}`}
    >
      {icon}
    </button>
  );
};

const ToolPanel: FC<ToolPanelProps> = (props): JSX.Element => {
  const { className } = props;
  const toolContext = useContext(ToolTypeContext);
  const { type, setType } = toolContext;

  return (
    // Mobilde yatay, masaüstünde dikey olmayan - her zaman yatay
    <div
      className={`${className} flex flex-row items-center justify-center gap-1 md:gap-2 p-0`}
    >
      <ToolItem
        title="Kalem"
        icon={<IoMdCreate />}
        toolType={ToolValue.PEN}
        currentType={type}
        onClick={setType}
      />

      <ToolItem
        title="Silgi"
        icon={<FaEraser />}
        toolType={ToolValue.ERASER}
        currentType={type}
        onClick={setType}
      />

      <ToolItem
        title="Renk Doldur"
        icon={<MdFormatColorFill />}
        toolType={ToolValue.COLOR_FILL}
        currentType={type}
        onClick={setType}
      />

      <ToolItem
        title="Renk Seçici"
        icon={<MdColorize />}
        toolType={ToolValue.COLOR_EXTRACT}
        currentType={type}
        onClick={setType}
      />
    </div>
  );
};

export default ToolPanel;
