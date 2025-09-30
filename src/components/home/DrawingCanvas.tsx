import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  type MouseEvent,
} from 'react';
import {
  Pencil,
  Eraser,
  Circle,
  Square,
  Minus,
  Trash2,
  Download,
  Upload,
  Undo,
  Droplet,
} from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface StrokeData {
  points: Point[];
  color: string;
  size: number;
  filled: boolean; 
  tool: Tool; 
  isBucketFill?: boolean;
  fillPosition?: Point;
  imageData?: ImageData;
}
interface RealtimePointPayload {
  point: Point;
  strokeId: string; 
  color: string;
  size: number;
  tool: 'pen' | 'eraser';
}
type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'bucket';

const DrawingCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [allStrokes, setAllStrokes] = useState<StrokeData[]>([]);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);
  const [filled, setFilled] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [tempCanvas, setTempCanvas] = useState<HTMLCanvasElement | null>(null);
  const [activeStrokeId, setActiveStrokeId] = useState<string>(''); // Aktif vuruşun benzersiz ID'si

  const colors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
  ];

  const sizes = [2, 5, 10, 15, 20];
  useEffect(() => {
    if (activeStrokeId && currentStroke.length > 0) {
      // En son eklenen noktayı al
      const lastPoint = currentStroke[currentStroke.length - 1];

      // Gönderilecek yükü (payload) oluştur
      const payload: RealtimePointPayload = {
        point: lastPoint,
        strokeId: activeStrokeId,
        color: tool === 'eraser' ? '#FFFFFF' : color, // Silgi için beyaz
        size: tool === 'eraser' ? size * 2 : size,
        tool: tool === 'eraser' ? 'eraser' : 'pen',
      };

      // 🔑 Real-Time Gönderim Simülasyonu: Konsola yazdır
      // Normalde burada Sunucuya WebSocket/Socket.io ile gönderim yapılırdı
      console.log('Real-Time Nokta Gönderildi:', payload);
    }
  }, [currentStroke, activeStrokeId, color, size, tool]); // currentStroke her değiştiğinde tetiklenir
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1000;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Geçici canvas oluştur
      const temp = document.createElement('canvas');
      temp.width = 1000;
      temp.height = 600;
      setTempCanvas(temp);
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Canvas'ı temizle
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {
      if (stroke.isBucketFill && stroke.imageData) {
        // Boya kovası vuruşlarını direkt ImageData olarak çiz
        ctx.putImageData(stroke.imageData, 0, 0);
      } else {
        // Normal vuruşları çiz
        if (stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }

        if (stroke.filled) {
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      }
    });
  }, [allStrokes]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawTemporaryShape = useCallback(
    (endPoint: Point) => {
      if (!startPoint) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      redrawCanvas();

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      switch (tool) {
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          if (filled) {
            // Çizgiler için kalın doldurma efekti
            ctx.lineWidth = size * 2;
          }
          ctx.stroke();
          break;

        case 'circle':
          const radius = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          );
          ctx.beginPath();
          ctx.arc(startPoint.x, startPoint.y, radius, 0, Math.PI * 2);
          if (filled) {
            ctx.fill();
          }
          ctx.stroke();
          break;

        case 'rectangle':
          const width = endPoint.x - startPoint.x;
          const height = endPoint.y - startPoint.y;
          if (filled) {
            ctx.fillRect(startPoint.x, startPoint.y, width, height);
          }
          ctx.strokeRect(startPoint.x, startPoint.y, width, height);
          break;

        case 'pen':
          if (filled) {
            // Kalem için yuvarlak uç efekti
            ctx.beginPath();
            ctx.arc(endPoint.x, endPoint.y, size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
          break;
      }
    },
    [startPoint, color, size, tool, filled, redrawCanvas]
  );
  const draw = useCallback(
    (event: MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const newPoint: Point = { x: Math.round(x), y: Math.round(y) };

      if (tool === 'pen' || tool === 'eraser') {
        // 🔑 Sadece yeni noktayı diziye ekle
        setCurrentStroke((prev) => [...prev, newPoint]);

        // Yerel çizim (ekranınızda anlık görünmesi için)
        const drawColor = tool === 'eraser' ? '#FFFFFF' : color;
        const drawSize = tool === 'eraser' ? size * 2 : size;

        if (currentStroke.length > 0) {
          const lastPoint = currentStroke[currentStroke.length - 1];
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = drawSize;
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(newPoint.x, newPoint.y);
          ctx.stroke();
        }
      } else {
        // ... (şekil çizimi mantığı aynı kalır)
        drawTemporaryShape(newPoint);
      }
    },
    [isDrawing, currentStroke, color, size, tool, drawTemporaryShape]
  );
  const startDrawing = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point: Point = { x: Math.round(x), y: Math.round(y) };
    if (tool === 'bucket') {
      handleCanvasClick(event);
      return;
    }
    const newStrokeId = crypto.randomUUID(); // Veya date.now() kullanabilirsiniz.
    setActiveStrokeId(newStrokeId); // 🔑 Yeni ID'yi ayarla
    setIsDrawing(true);
    setCurrentStroke([]);

    if (tool === 'line' || tool === 'circle' || tool === 'rectangle') {
      setStartPoint(point);
    } else {
      setCurrentStroke([point]);
      draw(event);
    }
  };

  const stopDrawing = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool === 'line' || tool === 'circle' || tool === 'rectangle') {
      if (!startPoint) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const endPoint: Point = { x: Math.round(x), y: Math.round(y) };

      let points: Point[] = [];

      switch (tool) {
        case 'line':
          points = [startPoint, endPoint];
          break;
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) +
              Math.pow(endPoint.y - startPoint.y, 2)
          );
          const numPoints = Math.max(100, Math.round(radius * 2));
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * Math.PI * 2;
            points.push({
              x: Math.round(startPoint.x + radius * Math.cos(angle)),
              y: Math.round(startPoint.y + radius * Math.sin(angle)),
            });
          }
          break;
        case 'rectangle':
          points = [
            startPoint,
            { x: endPoint.x, y: startPoint.y },
            endPoint,
            { x: startPoint.x, y: endPoint.y },
            startPoint,
          ];
          break;
      }

      const finalStrokeData: StrokeData = {
        points,
        color,
        size,
        filled,
        tool,
      };

      setAllStrokes((prev) => [...prev, finalStrokeData]);
      setStartPoint(null);
      console.log('Yeni Şekil Vuruşu:', finalStrokeData);
    } else {
      if (currentStroke.length > 0) {
        const finalStrokeData: StrokeData = {
          points: currentStroke,
          color: tool === 'eraser' ? '#FFFFFF' : color,
          size: tool === 'eraser' ? size * 2 : size,
          filled,
          tool,
        };

        setAllStrokes((prev) => [...prev, finalStrokeData]);
        console.log('Yeni Çizim Vuruşu:', finalStrokeData);
      }
    }
    setActiveStrokeId('');
    setCurrentStroke([]);
  };
  const renderFillControl = () => (
    <div className="flex gap-2 p-2 bg-gray-100 rounded-lg items-center">
      <button
        onClick={() => setFilled(!filled)}
        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-semibold ${
          filled
            ? 'bg-blue-500 text-white shadow-lg'
            : 'bg-white text-gray-700 hover:bg-gray-200'
        }`}
      >
        {filled ? '🎨 Dolu' : '⭕ Boş'}
      </button>
      {filled && (
        <div className="text-sm text-gray-600">
          {tool === 'pen' && 'Kalın uç'}
          {tool === 'line' && 'Kalın çizgi'}
          {tool === 'circle' && 'Dolu daire'}
          {tool === 'rectangle' && 'Dolu dikdörtgen'}
        </div>
      )}
    </div>
  );

  const clearCanvas = () => {
    setAllStrokes([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const undoStroke = () => {
    if (allStrokes.length > 0) {
      setAllStrokes((prev) => prev.slice(0, -1));
    }
  };

  const handleJsonSubmit = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (Array.isArray(data)) {
        // Import edilen verileri mevcut canvas'a çiz
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          data.forEach((stroke) => {
            if (stroke.isBucketFill && stroke.fillPosition) {
              floodFill(
                stroke.fillPosition.x,
                stroke.fillPosition.y,
                stroke.color
              );
            } else {
              setAllStrokes((prev) => [...prev, stroke]);
            }
          });
        }
        setJsonInput('');
        setShowJsonInput(false);
      }
    } catch (error) {
      alert('JSON parse hatası: ' + error);
    }
  };

  const exportData = () => {
    // ImageData'yı JSON'a çeviremeyeceğimiz için, export ederken kaldırıyoruz
    const exportableStrokes = allStrokes.map((stroke) => {
      const { imageData, ...exportableStroke } = stroke;
      return exportableStroke;
    });

    const dataStr = JSON.stringify(exportableStrokes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drawing-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };
  // Flood fill algoritması
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const beforeFillImageData = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Başlangıç noktasının rengini al
    const startPos = (startY * canvas.width + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    // Yeni rengi RGB formatına çevir
    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    // Renk toleransı
    const tolerance = 1;

    // Aynı renkteki pikselleri kontrol et
    const matchStartColor = (pos: number) => {
      return (
        Math.abs(pixels[pos] - startR) <= tolerance &&
        Math.abs(pixels[pos + 1] - startG) <= tolerance &&
        Math.abs(pixels[pos + 2] - startB) <= tolerance &&
        Math.abs(pixels[pos + 3] - startA) <= tolerance
      );
    };

    // Pikseli yeni renkle değiştir
    const colorPixel = (pos: number) => {
      pixels[pos] = fillRGB.r;
      pixels[pos + 1] = fillRGB.g;
      pixels[pos + 2] = fillRGB.b;
      pixels[pos + 3] = 255;
    };

    // Flood fill algoritması
    const stack: [number, number][] = [[startX, startY]];
    const maxSize = canvas.width * canvas.height;
    const visited = new Set<string>();

    while (stack.length && visited.size < maxSize) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const pos = (y * canvas.width + x) * 4;
      if (!matchStartColor(pos)) continue;

      colorPixel(pos);

      // 4 yöne yayıl
      if (x > 0) stack.push([x - 1, y]);
      if (x < canvas.width - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvas.height - 1) stack.push([x, y + 1]);
    }

    ctx.putImageData(imageData, 0, 0);

    // Dolgu işlemini strokes'a ekle
    const fillStroke: StrokeData = {
      points: [], // Boya kovası için boş points
      color: fillColor,
      size: 1,
      filled: true,
      tool: 'bucket',
      isBucketFill: true,
      fillPosition: { x: startX, y: startY },
      imageData: imageData, // Dolgu sonrası durumu kaydet
    };

    const exportableFillData = {
      tool: 'bucket',
      color: fillColor,
      fillPosition: { x: startX, y: startY },
    };
    console.log('Yeni Boya Kovası Vuruşu:', exportableFillData);

    setAllStrokes((prev) => [...prev, fillStroke]);
  };
  // Hex renk kodunu RGB'ye çevir
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };
  // Canvas tıklama olayını güncelle
  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'bucket') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);

      floodFill(x, y, color);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          🎨 Modern Çizim Uygulaması
        </h1>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          {/* Araç Çubuğu */}
          {renderFillControl()}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            {/* Araçlar */}
            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
              <button
                onClick={() => setTool('pen')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'pen'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Kalem"
              >
                <Pencil size={20} />
              </button>
              <button
                onClick={() => setTool('eraser')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'eraser'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Silgi"
              >
                <Eraser size={20} />
              </button>
              <button
                onClick={() => setTool('line')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'line'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Çizgi"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => setTool('circle')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'circle'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Daire"
              >
                <Circle size={20} />
              </button>
              <button
                onClick={() => setTool('rectangle')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'rectangle'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Dikdörtgen"
              >
                <Square size={20} />
              </button>
              <button
                onClick={() => setTool('bucket')}
                className={`p-3 rounded-lg transition-all ${
                  tool === 'bucket'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-200'
                }`}
                title="Boya Kovası"
              >
                <Droplet size={20} />
              </button>
            </div>

            {/* Renkler */}
            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg items-center">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c
                      ? 'ring-4 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: c,
                    border: c === '#FFFFFF' ? '2px solid #ddd' : 'none',
                  }}
                  title={c}
                />
              ))}
              <div className="ml-2 flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-300"
                  title="Özel renk seç"
                />
              </div>
            </div>

            {/* Boyutlar */}
            <div className="flex gap-2 p-2 bg-gray-100 rounded-lg">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                    size === s
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-200'
                  }`}
                  title={`${s}px`}
                >
                  <div
                    className="rounded-full bg-current"
                    style={{ width: s, height: s }}
                  />
                </button>
              ))}
            </div>

            {/* Aksiyonlar */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={undoStroke}
                disabled={allStrokes.length === 0}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Undo size={18} />
                Geri Al
              </button>
              <button
                onClick={() => setShowJsonInput(!showJsonInput)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
              >
                <Upload size={18} />
                Veri Ekle
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2"
              >
                <Download size={18} />
                İndir
              </button>
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
              >
                <Trash2 size={18} />
                Temizle
              </button>
            </div>
          </div>

          {/* JSON Girişi */}
          {showJsonInput && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                JSON Veri Girişi:
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full p-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
                rows={4}
                placeholder='{"points":[{"x":100,"y":100},{"x":200,"y":200}],"color":"#FF0000","size":5}'
              />
              <button
                onClick={handleJsonSubmit}
                className="mt-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
              >
                Veriyi Çiz
              </button>
            </div>
          )}

          {/* Canvas */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onMouseMove={draw}
              className="border-4 border-gray-300 rounded-xl shadow-lg cursor-crosshair"
            />
          </div>
        </div>

        <div className="text-center text-gray-600">
          <p>Çizim yaptıkça veriler konsola yazdırılacaktır 🎨</p>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
