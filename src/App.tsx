import { useEffect, useRef, useState } from 'react';

// Çizim verisinin tipini tanımla
interface LineData {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function App() {
  // Canvas elementine erişim için useRef kullan
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // WebSocket bağlantısını tutmak için useRef kullan
  const ws = useRef<WebSocket | null>(null);

  // Çizim durumunu ve son koordinatları tut
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleClearCanvas = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Backend'e bir "clear" (temizleme) komutu gönder
      ws.current.send(JSON.stringify({ type: 'clear' }));
    }
  };

  // Component yüklendiğinde WebSocket bağlantısını kur
  useEffect(() => {
    ws.current = new WebSocket('ws://' + window.location.host + '/ws');

    // Backend'den gelen mesajları dinle
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Gelen mesajın tipini kontrol et
          if (data.type === 'clear') {
            // Eğer "clear" komutu geldiyse tuvalı temizle
            ctx.clearRect(
              0,
              0,
              canvasRef.current.width,
              canvasRef.current.height
            );
          } else {
            // Değilse, çizim verisini işle
            const lineData: LineData = data;
            ctx.beginPath();
            ctx.moveTo(lineData.x1, lineData.y1);
            ctx.lineTo(lineData.x2, lineData.y2);
            ctx.stroke();
          }
        }
      }
    };

    // Component ayrıldığında bağlantıyı kapat
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  // Çizim başladığında
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setLastPos({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY });
  };

  // Çizim devam ederken
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const newPos = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
    const lineData: LineData = {
      x1: lastPos.x,
      y1: lastPos.y,
      x2: newPos.x,
      y2: newPos.y,
    };

    // WebSocket üzerinden çizim verisini backend'e gönder
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(lineData));
    }

    setLastPos(newPos);
  };

  // Çizim bittiğinde
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Mouse canvas'tan çıktığında
  const handleMouseOut = () => {
    setIsDrawing(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h1>Gerçek Zamanlı Çizim</h1>
      <button onClick={handleClearCanvas}>Temizle</button>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: '1px solid black' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseOut={handleMouseOut}
      />
    </div>
  );
}

export default App;
