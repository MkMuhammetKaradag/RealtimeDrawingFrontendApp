// src/components/Toolbar/index.tsx (GÜNCELLENMİŞ)

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

  // ----------------------------------------------------------------------
  // KRİTİK DEĞİŞİKLİK: FLEX YÖNÜNÜ VE AYIRICILARI RESPONSIVE YAPMAK
  // ----------------------------------------------------------------------
  return (
    // Mobil (varsayılan): Yatay düzen (flex-row), yatay kaydırma
    // Masaüstü (md): Dikey düzen (md:flex-col), öğeler yukarı hizalı (md:items-start)
    <div className="flex flex-row md:flex-col items-center md:items-start bg-white md:bg-gray-100 p-2 md:p-3 shadow-lg md:shadow-none rounded-lg md:rounded-none relative overflow-x-auto md:overflow-visible h-full w-full">
      <OtherOperator className="toolbar-item" />

      {/* Ayırıcı - Mobil: Dikey Çizgi (mx-2) | Masaüstü: Yatay Çizgi (my-2) */}
      <div className="w-px bg-gray-300 h-8 mx-2 md:w-full md:h-px md:my-2" />

      <ToolPanel className="toolbar-item" />

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2 md:w-full md:h-px md:my-2" />

      {/* Shapes Butonu ve Açılır Paneli */}
      <div ref={shapeButtonRef} className="relative toolbar-item md:w-full">
        <button
          className="flex justify-center items-center w-12 h-12 p-1 cursor-pointer border border-transparent rounded-md transition-all text-gray-600 hover:bg-gray-200 hover:border-gray-400"
          title="Shapes"
          onClick={toggleShapePanel}
        >
          <FaShapes size={20} />
        </button>
        {/* Panel Konumu: Mobil (varsayılan): Üst/Sol | Masaüstü (md:): Sağ Taraf */}
        <ShapePanel
          className="absolute top-full left-0 mt-2 md:top-0 md:left-full md:ml-2 z-10"
          isOpen={isShapePanelOpen}
          onClose={() => setIsShapePanelOpen(false)}
          panelRef={shapePanelRef}
        />
      </div>

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2 md:w-full md:h-px md:my-2" />

      <ThickSelector className="toolbar-item" />

      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2 md:w-full md:h-px md:my-2" />

      <ColorPanel className="toolbar-item" />
    </div>
  );
};

export default Toolbar;
