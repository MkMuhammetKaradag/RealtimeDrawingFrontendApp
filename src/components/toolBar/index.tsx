// src/components/Toolbar/index.tsx (GÜNCELLENMİŞ - MOBİL OPTİMİZE)

import React, { type JSX, useState, useRef, useEffect } from 'react';
import ToolPanel from './tool';
import ShapePanel from './shape';
import ThickSelector from './thickSelector';
import ColorPanel from './colorPanel';
import OtherOperator from './other';
import { FaShapes } from 'react-icons/fa';

const Toolbar = (): JSX.Element => {
  const [isShapePanelOpen, setIsShapePanelOpen] = useState(false);
  const shapeButtonRef = useRef<HTMLDivElement>(null);
  const shapePanelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shapePanelRef.current &&
        !shapePanelRef.current.contains(event.target as Node) &&
        shapeButtonRef.current &&
        !shapeButtonRef.current.contains(event.target as Node)
      ) {
        setIsShapePanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleShapePanel = () => {
    setIsShapePanelOpen((prev) => !prev);
  };

  return (
    // Mobilde kompakt yatay düzen, masaüstünde dikey düzen
    <div className="flex flex-row md:flex-col items-center md:items-start bg-white md:bg-gray-100 p-1 md:p-3 shadow-lg md:shadow-none rounded-lg md:rounded-none relative overflow-x-auto md:overflow-visible h-full w-full min-h-[48px] md:min-h-0">
      {/* Mobilde daha küçük boyutlar */}
      <OtherOperator className="toolbar-item-mobile md:toolbar-item" />

      {/* Ayırıcı - Mobilde daha ince */}
      <div className="w-px bg-gray-300 h-6 mx-1 md:w-full md:h-px md:my-2 md:mx-0" />

      <ToolPanel className="toolbar-item-mobile md:toolbar-item" />

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-6 mx-1 md:w-full md:h-px md:my-2 md:mx-0" />

      {/* Shapes Butonu - Mobilde daha küçük */}
      <div
        ref={shapeButtonRef}
        className="relative toolbar-item-mobile md:toolbar-item md:w-full"
      >
        <button
          className="flex justify-center items-center w-8 h-8 md:w-12 md:h-12 p-1 cursor-pointer border border-transparent rounded-md transition-all text-gray-600 hover:bg-gray-200 hover:border-gray-400 text-sm md:text-base"
          title="Shapes"
          onClick={toggleShapePanel}
        >
          <FaShapes className="text-lg md:text-xl" />
        </button>
        {/* Panel Konumu */}
        <ShapePanel
          className="absolute top-full left-0 mt-1 md:top-0 md:left-full md:ml-2 z-10"
          isOpen={isShapePanelOpen}
          onClose={() => setIsShapePanelOpen(false)}
          panelRef={shapePanelRef}
        />
      </div>

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-6 mx-1 md:w-full md:h-px md:my-2 md:mx-0" />

      <ThickSelector className="toolbar-item-mobile md:toolbar-item" />

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-6 mx-1 md:w-full md:h-px md:my-2 md:mx-0" />

      <ColorPanel className="toolbar-item-mobile md:toolbar-item" />
    </div>
  );
};

export default Toolbar;
