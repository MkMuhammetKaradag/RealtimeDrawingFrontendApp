// src/components/Toolbar/index.tsx (GÜNCELLENMİŞ)

import React, { type JSX, useState, useRef, useEffect } from 'react';
import ToolPanel from './tool';
import ShapePanel from './shape';
import ThickSelector from './thickSelector';
import ColorPanel from './colorPanel';
import OtherOperator from './other';
import { FaShapes } from 'react-icons/fa'; // FaShapes ikonunu kullanıyorum

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
    <div className="flex items-center bg-gray-100 p-2 shadow-lg rounded-lg relative">
      {' '}
      {/* p-4 yerine p-2 ve items-center eklendi */}
      <OtherOperator className="toolbar-item" />{' '}
      {/* classname eklendi, marginleri içeride yöneteceğiz */}
      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2" /> {/* Dikey çizgi */}
      <ToolPanel className="toolbar-item" />
      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2" /> {/* Dikey çizgi */}
      {/* Yeni Shapes Butonu ve Açılır Paneli */}
      <div ref={shapeButtonRef} className="relative toolbar-item">
        <button
          className="flex justify-center items-center w-12 h-12 p-1 cursor-pointer border border-transparent rounded-md transition-all text-gray-600 hover:bg-gray-200 hover:border-gray-400"
          title="Shapes"
          onClick={toggleShapePanel}
        >
          <FaShapes size={20} />
        </button>
        <ShapePanel
          className="absolute top-full left-0 mt-2" // Butonun altına açılması için
          isOpen={isShapePanelOpen}
          onClose={() => setIsShapePanelOpen(false)}
          panelRef={shapePanelRef}
        />
      </div>
      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2" /> {/* Dikey çizgi */}
      <ThickSelector className="toolbar-item" />
      {/* Ayırıcı */}
      <div className="w-px bg-gray-300 h-8 mx-2" /> {/* Dikey çizgi */}
      <ColorPanel className="toolbar-item" />
    </div>
  );
};

export default Toolbar;
