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
    icon: <FaRegStar />,
    title: '4-Point Star',
  },
];

interface ShapePanelProps {
  className?: string;
  // Yeni eklenen prop'lar
  isOpen: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>; // Dış tıklamayı algılamak için ref
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

  // Shape aracı seçiliyse panelin içindeki elemanları etkinleştir
  const isShapeToolSelected = toolTypeContex.type === ToolValue.SHAPE;

  // Panelin görünürlüğünü isOpen prop'una göre yönet
  const panelClasses = `${className} absolute z-10 p-2 w-40 flex flex-col items-center bg-white shadow-lg rounded-lg border border-gray-200 
    ${isOpen ? 'block' : 'hidden'}`; // isOpen false ise gizle

  return (
    <div ref={panelRef} className={panelClasses}>
      <div className="shape-container w-full mb-2">
        <div className="shape-content grid grid-cols-4 gap-1 p-1">
          {shapes.map((shape) => {
            const isSelected =
              shapeTypeContext.type === shape.type && isShapeToolSelected;
            const itemClasses = isSelected
              ? 'bg-blue-300 border-blue-700 text-blue-900'
              : 'text-gray-600 hover:bg-gray-200 hover:border-gray-400';

            return (
              <div
                key={shape.type}
                title={shape.title}
                className={`shape-item flex justify-center items-center w-8 h-8 p-1 cursor-pointer border border-transparent rounded-md transition-all ${itemClasses}`}
                onClick={() => {
                  shapeTypeContext.setType(shape.type);
                  toolTypeContex.setType(ToolValue.SHAPE);
                  onClose(); // Şekil seçildiğinde paneli kapat
                }}
              >
                {shape.icon}
              </div>
            );
          })}
        </div>
        <div className="shape-style mt-2 flex flex-col items-start px-1">
          <label
            htmlFor="shape-outline-select"
            className="font-semibold text-gray-700 mb-1 text-xs"
          >
            Outline
          </label>
          <select
            id="shape-outline-select"
            className={`w-full bg-white border border-gray-300 rounded py-1 px-2 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 ${
              !isShapeToolSelected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            value={shapeOutlineContext.type}
            onChange={handleOutlineChange}
            disabled={!isShapeToolSelected}
          >
            <option value={ShapeOutlineValue.SOLID}>Solid Line</option>
            <option value={ShapeOutlineValue.DOTTED}>Dotted Line</option>
          </select>
        </div>
      </div>
      {/* "Shapes" metnini kaldırabiliriz, çünkü artık bir butonla açılıyor */}
      {/* <div className="absolute bottom-0 w-full text-center text-xs font-semibold text-gray-600 pt-1">
        Shapes
      </div> */}
    </div>
  );
};

export default ShapePanel;
