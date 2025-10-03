// src/components/DrawingCanvas/DrawingCanvas.tsx

import React, { useEffect } from 'react'; // useEffect'i import etmeyi unutmayın
import type { DrawingCanvasComponentProps } from './DrawingCanvas.types';
const CANVAS_WIDTH = 800; // Genişlik pikseli
const CANVAS_HEIGHT = 500; // Yükseklik pikseli
const DrawingCanvas: React.FC<DrawingCanvasComponentProps> = ({
  canvasRef,
  canDraw,
  startDrawing,
  stopDrawing,
  draw,
  canvasCursor,
}) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
    }
  }, [canvasRef]);
  // Mouse event wrappers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canDraw && startDrawing) startDrawing(e);
  };
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canDraw && stopDrawing) stopDrawing(e);
  };
  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canDraw && stopDrawing) stopDrawing(e);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canDraw && draw) draw(e);
  };

  // Touch event wrappers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (canDraw && startDrawing) startDrawing(e);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (canDraw && stopDrawing) stopDrawing(e);
  };
  const handleTouchCancel = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (canDraw && stopDrawing) stopDrawing(e);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (canDraw && draw) draw(e);
  };
  // Canvas'ın iç çözünürlüğü için sabit değerler belirleyelim
  // Bu değerler, çizimin ne kadar detaylı olacağını belirler.

  return (
    <div className="flex justify-center w-full px-4 sm:px-0">
      {' '}
      {/* w-full ve mobil padding ekledim */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onTouchMove={handleTouchMove}
        style={{
          cursor: canDraw ? canvasCursor : 'not-allowed',
          // CSS ile görsel boyutu ayarla:
          maxWidth: '100%', // Maksimum genişlik üst div'i kadar

          height: 'auto', // Genişliğe göre oranı koru
          aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
          display: 'block', // Varsayılan inline boşlukları kaldır
          touchAction: 'none', // Mobil cihazlarda çizim yaparken kaydırmayı engelle
        }}
        className="border-4 border-gray-300 rounded-xl shadow-lg bg-white" // Arka plan rengi ekledim
      />
    </div>
  );
};

export default DrawingCanvas;
