// src/components/Toolbar/shape.tsx (GÜNCELLENMİŞ)

import React, { useContext, type FC, type JSX } from 'react';
import {
  FaRegSquare,
  FaRegCircle,
  FaRegStar,
  FaLongArrowAltUp,
  FaLongArrowAltRight,
  FaLongArrowAltDown,
  FaLongArrowAltLeft,
} from 'react-icons/fa';
import { AiOutlineLine } from 'react-icons/ai';
import { BsTriangle, BsPentagon, BsHexagon, BsDiamond } from 'react-icons/bs';
import { PiStarFour } from 'react-icons/pi';
import {
  ShapeOutlineContext,
  ShapeTypeContext,
  ToolTypeContext,
} from '../../../context';
import type { ShapeOutlineType, ShapeToolType } from '../../../util/toolType';
import {
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../../../util/toolType';

const shapes: { type: ShapeToolType; icon: JSX.Element; title: string }[] = [
  { type: ShapeToolValue.LINE, icon: <AiOutlineLine />, title: 'Line' },
  { type: ShapeToolValue.RECT, icon: <FaRegSquare />, title: 'Rectangle' },
  {
    type: ShapeToolValue.CIRCLE,
    icon: <FaRegCircle />,
    title: 'Circle (Oval)',
  },
  { type: ShapeToolValue.RHOMBUS, icon: <BsDiamond />, title: 'Rhombus' },
  { type: ShapeToolValue.TRIANGLE, icon: <BsTriangle />, title: 'Triangle' },
  { type: ShapeToolValue.PENTAGON, icon: <BsPentagon />, title: 'Pentagon' },
  { type: ShapeToolValue.SEXANGLE, icon: <BsHexagon />, title: 'Hexagon' },
  {
    type: ShapeToolValue.ARROW_TOP,
    icon: <FaLongArrowAltUp />,
    title: 'Up Arrow',
  },
  {
    type: ShapeToolValue.ARROW_RIGHT,
    icon: <FaLongArrowAltRight />,
    title: 'Right Arrow',
  },
  {
    type: ShapeToolValue.ARROW_DOWN,
    icon: <FaLongArrowAltDown />,
    title: 'Down Arrow',
  },
  {
    type: ShapeToolValue.ARROW_LEFT,
    icon: <FaLongArrowAltLeft />,
    title: 'Left Arrow',
  },
  {
    type: ShapeToolValue.FOUR_STAR,
    icon: <PiStarFour />,
    title: '4-Point Star',
  },
  {
    type: ShapeToolValue.FIVE_STAR,
    icon: <FaRegStar />,
    title: '5-Point Star',
  },
];

interface ShapePanelProps {
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
}

const ShapePanel: FC<ShapePanelProps> = ({
  className,
  isOpen,
  onClose,
  panelRef,
}) => {
  const toolTypeContex = useContext(ToolTypeContext);
  const shapeTypeContext = useContext(ShapeTypeContext);
  const shapeOutlineContext = useContext(ShapeOutlineContext);

  const handleOutlineChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    shapeOutlineContext.setType(event.target.value as ShapeOutlineType);
  };

  const isShapeToolSelected = toolTypeContex.type === ToolValue.SHAPE;

  // ----------------------------------------------------------------------
  // KRİTİK DÜZENLEME 1: KONUMLANDIRMA VE GÖRÜNÜRLÜK YÖNETİMİ
  // ----------------------------------------------------------------------

  // `className` prop'u zaten konumlandırmayı içerdiği için,
  // bu bileşendeki mutlak konumlandırma sınıflarını (absolute top-full left-0 mt-2) kaldırıyoruz
  // ve sadece görünürlük ile temel stilleri koruyoruz.

  const panelClasses = `${className} z-10 p-3 w-44 flex flex-col items-center bg-white shadow-xl rounded-lg border border-gray-200 
    transition-opacity duration-200 ease-in-out ${
      isOpen ? 'opacity-100 block' : 'opacity-0 hidden'
    }`; // Gizleme/Gösterme için geçiş eklendi

  return (
    <div ref={panelRef} className={panelClasses}>
      {/* BAŞLIK EKLENDİ (Daha okunaklı olması için) */}
      <h3 className="text-sm font-bold text-gray-800 mb-2 w-full text-left">
        Şekiller
      </h3>

      <div className="shape-container w-full">
        <div className="shape-content grid grid-cols-4 gap-2 p-1 border border-gray-300 rounded-lg bg-gray-50">
          {shapes.map((shape) => {
            const isSelected =
              shapeTypeContext.type === shape.type && isShapeToolSelected;
            const itemClasses = isSelected
              ? 'bg-blue-500 border-blue-700 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-200 hover:border-gray-400 bg-white';

            return (
              <button
                key={shape.type}
                title={shape.title}
                type="button"
                className={`flex justify-center items-center w-8 h-8 p-1 cursor-pointer border border-transparent rounded-md transition-all ${itemClasses}`}
                onClick={() => {
                  shapeTypeContext.setType(shape.type);
                  toolTypeContex.setType(ToolValue.SHAPE);
                  // onClose();
                }}
              >
                {shape.icon}
              </button>
            );
          })}
        </div>

        {/* Çizgi Stili Seçici */}
        <div className="shape-style mt-3 pt-2 border-t border-gray-200 flex flex-col items-start px-1">
          <label
            htmlFor="shape-outline-select"
            className="font-medium text-gray-700 mb-1 text-xs"
          >
            Çizgi Stili
          </label>
          <select
            id="shape-outline-select"
            className={`w-full bg-white border border-gray-300 rounded py-1 px-2 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 ${
              !isShapeToolSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={shapeOutlineContext.type}
            onChange={handleOutlineChange}
            disabled={!isShapeToolSelected}
          >
            <option value={ShapeOutlineValue.SOLID}>Düz Çizgi</option>
            <option value={ShapeOutlineValue.DOTTED}>Noktalı Çizgi</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ShapePanel;
