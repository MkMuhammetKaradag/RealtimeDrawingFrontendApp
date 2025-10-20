import React, { useRef, useEffect } from 'react';
import type { ParsedAction } from '../../pages/paint';

interface SimpleMiniCanvasProps {
  actions: ParsedAction[];
  width?: number;
  height?: number;
}

const SimpleMiniCanvas: React.FC<SimpleMiniCanvasProps> = ({ 
  actions, 
  width = 180, 
  height = 120 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas'ı temizle - BEYAZ arka plan
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Çizim stilini ayarla
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Sadece çizim action'larını filtrele
    const drawActions = actions.filter(action => 
      action.function.includes('draw') && 
      action.normX && 
      action.normY
    );

    if (drawActions.length === 0) return;

    let currentPath: {x: number, y: number}[] = [];
    let currentColor = '#000000';
    let currentLineWidth = 2;

    drawActions.forEach((action, index) => {
      const x = action.normX! * width;
      const y = action.normY! * height;

      // Renk ve kalınlık ayarları
      if (action.color) currentColor = action.color;
      if (action.lineWidth) currentLineWidth = Math.max(1, action.lineWidth * 2);

      switch (action.function) {
        case 'draw_start':
          // Yeni path başlat
          currentPath = [{x, y}];
          break;

        case 'draw_move':
          if (currentPath.length > 0) {
            currentPath.push({x, y});
            
            // Path'i çiz
            ctx.beginPath();
            ctx.moveTo(currentPath[0].x, currentPath[0].y);
            
            for (let i = 1; i < currentPath.length; i++) {
              ctx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = currentLineWidth;
            ctx.stroke();
          }
          break;

        case 'draw_end':
          // Path'i temizle
          currentPath = [];
          break;

        case 'canvas_clear':
          // Canvas'ı temizle
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, width, height);
          break;
      }
    });

    // Debug: canvas'ın sınırlarını çiz
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);

  }, [actions, width, height]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="bg-white rounded border border-gray-300 shadow-sm"
      />
      <div className="absolute bottom-1 right-1 text-xs text-gray-500 bg-white/80 px-1 rounded">
        {actions.filter(a => a.function.includes('draw')).length} çizim
      </div>
    </div>
  );
};

export default SimpleMiniCanvas;