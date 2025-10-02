import {
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
  strokeId: string;
  points: Point[];
  color: string;
  size: number;
  filled: boolean;
  tool: Tool;
  isBucketFill?: boolean;
  fillPosition?: Point;
  imageData?: ImageData;
}

export interface RealtimePointPayload {
  type: string;
  point: Point;
  strokeId: string;
  color: string;
  size: number;
  tool: 'pen' | 'eraser' | 'bucket'; // 'bucket' da ekledik
  isBucketFill?: boolean; // Boya kovası için
  fillPosition?: Point; // Boya kovası için
}

type Tool = 'pen' | 'eraser' | 'line' | 'circle' | 'rectangle' | 'bucket';

interface DrawingCanvasProps {
  canDraw: boolean;
  sendMessage: (data: any) => void;
  remoteDrawingPoint: RealtimePointPayload | null; // Yeni prop
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  canDraw,
  sendMessage,
  remoteDrawingPoint, // Yeni propu burada alıyoruz
}) => {
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
  const [activeStrokeId, setActiveStrokeId] = useState<string>('');

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

  // Uzak sunucudan gelen noktayı canvas'a ekleme fonksiyonu
  const addRemotePointToCanvas = useCallback(
    (payload: RealtimePointPayload) => {
      setAllStrokes((prevStrokes) => {
        // Eğer gelen veri bir boya kovası dolgusu ise
        if (payload.isBucketFill && payload.fillPosition) {
          // Geçerli canvas durumunun anlık görüntüsünü al
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (!ctx || !canvas) return prevStrokes;

          // Geçici olarak flood fill uygula (sadece görsel olarak, StrokeData'ya ImageData eklenmeli)
          // Bu kısmı biraz değiştireceğiz, ImageData'yı doğrudan StrokeData'ya ekleyeceğiz.
          // Flood fill'i burada direkt çalıştırmak yerine, ImageData'yı StrokeData olarak saklayalım.
          // Ancak bu, flood fill'in diğer istemcilerde doğru şekilde yeniden çizilmesini zorlaştırır.
          // Daha iyi bir yaklaşım, flood fill'in parametrelerini (başlangıç noktası, renk) göndermek ve
          // her istemcinin kendi flood fill'ini uygulamasını sağlamaktır.

          // Şimdilik, sadece flood fill'in tetiklendiğini varsayalım
          const newFillStroke: StrokeData = {
            strokeId: payload.strokeId,
            points: [], // Boya kovası için boş points
            color: payload.color,
            size: 1, // Boya kovası için size önemli değil
            filled: true,
            tool: 'bucket',
            isBucketFill: true,
            fillPosition: payload.fillPosition,
            // ImageData burada olmayacak, her istemci kendi ImageData'sını oluşturacak
            // veya flood fill işleminin kendisi tetiklenecek.
          };
          // Eğer zaten bu fillPosition'a sahip bir bucket fill varsa güncelle, yoksa ekle
          const existingBucketFillIndex = prevStrokes.findIndex(
            (s) =>
              s.tool === 'bucket' &&
              s.fillPosition?.x === payload.fillPosition?.x &&
              s.fillPosition?.y === payload.fillPosition?.y
          );

          if (existingBucketFillIndex !== -1) {
            const updatedStrokes = [...prevStrokes];
            updatedStrokes[existingBucketFillIndex] = newFillStroke;
            return updatedStrokes;
          } else {
            return [...prevStrokes, newFillStroke];
          }
        } else {
          // Normal çizim noktası ise
          const existingStrokeIndex = prevStrokes.findIndex(
            (s) => s.strokeId === payload.strokeId
          );

          if (existingStrokeIndex !== -1) {
            // Var olan stroke'a yeni nokta ekle
            const newStrokes = [...prevStrokes];
            newStrokes[existingStrokeIndex] = {
              ...newStrokes[existingStrokeIndex],
              points: [
                ...newStrokes[existingStrokeIndex].points,
                payload.point,
              ],
            };
            return newStrokes;
          } else {
            // Yeni stroke oluştur
            return [
              ...prevStrokes,
              {
                points: [payload.point],
                color: payload.color,
                size: payload.size,
                filled: false, // Uzaktan gelen kalem/silgi için filled genellikle false'dur
                tool: payload.tool,
                strokeId: payload.strokeId,
              },
            ];
          }
        }
      });
    },
    []
  );

  // remoteDrawingPoint prop'u değiştiğinde addRemotePointToCanvas'ı çağır
  useEffect(() => {
    if (remoteDrawingPoint) {
      console.log('Uzaktan gelen çizim noktası:', remoteDrawingPoint);
      addRemotePointToCanvas(remoteDrawingPoint);
    }
  }, [remoteDrawingPoint, addRemotePointToCanvas]); // addRemotePointToCanvas bağımlılığı eklendi

  useEffect(() => {
    if (activeStrokeId && currentStroke.length > 0) {
      const lastPoint = currentStroke[currentStroke.length - 1];

      const payload: RealtimePointPayload = {
        type: 'draw',
        point: lastPoint,
        strokeId: activeStrokeId,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? size * 2 : size,
        tool: tool === 'eraser' ? 'eraser' : 'pen',
      };

      const sendMessageData = { type: 'player_move', content: payload };
      sendMessage(sendMessageData);
    }
  }, [currentStroke, activeStrokeId, color, size, tool, sendMessage]); // sendMessage bağımlılığı eklendi

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

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    allStrokes.forEach((stroke) => {
      // Boya kovası vuruşları için özel işlem
      if (
        stroke.tool === 'bucket' &&
        stroke.isBucketFill &&
        stroke.fillPosition
      ) {
        // Sadece fillPosition ve color'ı alıp floodFill'i yeniden çalıştırın
        // Bu sayede ImageData'yı göndermeye gerek kalmaz ve her istemci kendi dolgusunu oluşturur
        try {
          // Bu, yerel ve uzaktan gelen stroke'lar için doldurmayı sağlar
          floodFillInternal(
            ctx,
            canvas.width,
            canvas.height,
            stroke.fillPosition.x, // Tıklanan X
            stroke.fillPosition.y, // Tıklanan Y
            stroke.color
          );
        } catch (error) {
          console.error('Flood Fill yeniden uygulama hatası:', error);
        }
      } else {
        if (stroke.points.length === 0) return;

        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        if (stroke.tool === 'line') {
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
          if (stroke.filled) {
            ctx.lineWidth = stroke.size * 2;
          }
        } else if (stroke.tool === 'circle') {
          const start = stroke.points[0];
          const end = stroke.points[stroke.points.length - 1]; // Dairenin son noktası (radius için)
          const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
          );
          ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
          if (stroke.filled) {
            ctx.fill();
          }
        } else if (stroke.tool === 'rectangle') {
          const start = stroke.points[0];
          const corner = stroke.points[2]; // Karşı köşe
          const width = corner.x - start.x;
          const height = corner.y - start.y;
          if (stroke.filled) {
            ctx.fillRect(start.x, start.y, width, height);
          }
          ctx.strokeRect(start.x, start.y, width, height);
        } else {
          // Pen ve Eraser için
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
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
          // Pen tool için bu kısım muhtemelen çağrılmayacak çünkü pen doğrudan currentStroke'a ekliyor
          // Ancak kalırsa sorun olmaz
          if (filled) {
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
      if (!isDrawing || !canDraw) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const newPoint: Point = { x: Math.round(x), y: Math.round(y) };

      if (tool === 'pen' || tool === 'eraser') {
        setCurrentStroke((prev) => [...prev, newPoint]);

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
        } else {
          // İlk nokta için
          ctx.strokeStyle = drawColor;
          ctx.lineWidth = drawSize;
          ctx.beginPath();
          ctx.moveTo(newPoint.x, newPoint.y);
          ctx.lineTo(newPoint.x, newPoint.y);
          ctx.stroke();
        }
      } else {
        drawTemporaryShape(newPoint);
      }
    },
    [isDrawing, currentStroke, color, size, tool, drawTemporaryShape, canDraw]
  );

  const startDrawing = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !canDraw) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const point: Point = { x: Math.round(x), y: Math.round(y) };

    if (tool === 'bucket') {
      handleCanvasClick(event);
      return;
    }

    const newStrokeId = crypto.randomUUID();
    setActiveStrokeId(newStrokeId);
    setIsDrawing(true);
    setCurrentStroke([]);

    if (tool === 'line' || tool === 'circle' || tool === 'rectangle') {
      setStartPoint(point);
    } else {
      setCurrentStroke([point]);
      // İlk noktayı gönder
      const payload: RealtimePointPayload = {
        type: 'draw',
        point: point,
        strokeId: newStrokeId,
        color: tool === 'eraser' ? '#FFFFFF' : color,
        size: tool === 'eraser' ? size * 2 : size,
        tool: tool === 'eraser' ? 'eraser' : 'pen',
      };
      sendMessage({ type: 'player_move', content: payload });
    }
  };

  const stopDrawing = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (!canDraw) return;
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
          // Daire için, sadece merkez ve bir nokta yeterlidir
          points = [startPoint, endPoint];
          break;
        case 'rectangle':
          points = [
            startPoint,
            { x: endPoint.x, y: startPoint.y },
            endPoint,
            { x: startPoint.x, y: endPoint.y },
          ];
          break;
      }

      const finalStrokeData: StrokeData = {
        strokeId: activeStrokeId,
        points,
        color,
        size,
        filled,
        tool,
      };

      setAllStrokes((prev) => [...prev, finalStrokeData]);
      setStartPoint(null);
      console.log('Yeni Şekil Vuruşu:', finalStrokeData);

      // Şekil çizimini diğer istemcilere gönder
      // Bu, points dizisini göndermeyi gerektirecektir, bu da daha büyük bir payload olabilir
      // Ya da sadece startPoint, endPoint, tool, color, size, filled gönderilip
      // her istemcinin şekli kendi tarafında yeniden oluşturması sağlanabilir.
      // Basitlik adına tüm points'i gönderelim, ancak performans için iyileştirilebilir.
      sendMessage({
        type: 'player_move',
        content: {
          type: 'shape_draw', // Yeni bir tip belirleyelim
          strokeId: activeStrokeId,
          points: points,
          color: color,
          size: size,
          filled: filled,
          tool: tool,
        },
      });
    } else {
      if (currentStroke.length > 0) {
        const finalStrokeData: StrokeData = {
          strokeId: activeStrokeId,
          points: currentStroke,
          color: tool === 'eraser' ? '#FFFFFF' : color,
          size: tool === 'eraser' ? size * 2 : size,
          filled, // Kalem/Silgi için filled prop'unu kullan
          tool,
        };

        setAllStrokes((prev) => [...prev, finalStrokeData]);
        console.log('Yeni Çizim Vuruşu:', finalStrokeData);
        // Kalem/Silgi vuruşu zaten her noktada gönderildiği için burada tekrar göndermeye gerek olmayabilir
        // Ancak stroke tamamlandığında bir "stroke_end" mesajı göndermek iyi bir uygulama olabilir.
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
    sendMessage({ type: 'clear_canvas' }); // Diğer istemcilere tuvalin temizlendiğini bildir
  };

  const undoStroke = () => {
    if (allStrokes.length > 0) {
      const lastStroke = allStrokes[allStrokes.length - 1];
      setAllStrokes((prev) => prev.slice(0, -1));
      sendMessage({ type: 'undo_stroke', strokeId: lastStroke.strokeId }); // Diğer istemcilere geri alındığını bildir
    }
  };

  const handleJsonSubmit = () => {
    try {
      const data = JSON.parse(jsonInput);
      if (Array.isArray(data)) {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
          // Mevcut çizimleri temizlemeden eklemek için
          // clearCanvas(); // İsteğe bağlı: Önce tuvali temizle
          data.forEach((stroke: StrokeData) => {
            if (stroke.isBucketFill && stroke.fillPosition) {
              // floodFill fonksiyonu yerine, burada bir olay tetikleyip
              // sunucuya göndermek ve diğer istemcilerin de aynı fill işlemini yapmasını sağlamak daha iyi
              // Şimdilik sadece yerel olarak ekleyelim
              setAllStrokes((prev) => [
                ...prev,
                { ...stroke, strokeId: crypto.randomUUID() },
              ]);
              // floodFill(stroke.fillPosition.x, stroke.fillPosition.y, stroke.color);
            } else {
              setAllStrokes((prev) => [
                ...prev,
                { ...stroke, strokeId: crypto.randomUUID() },
              ]);
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

  // Flood fill algoritması (içsel kullanım için)
  const floodFillInternal = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    startX: number,
    startY: number,
    fillColor: string
  ) => {
    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    const pixels = imageData.data;

    const startPos = (startY * canvasWidth + startX) * 4;
    const startR = pixels[startPos];
    const startG = pixels[startPos + 1];
    const startB = pixels[startPos + 2];
    const startA = pixels[startPos + 3];

    const fillRGB = hexToRgb(fillColor);
    if (!fillRGB) return;

    const tolerance = 5;

    const matchStartColor = (pos: number) => {
      return (
        Math.abs(pixels[pos] - startR) <= tolerance &&
        Math.abs(pixels[pos + 1] - startG) <= tolerance &&
        Math.abs(pixels[pos + 2] - startB) <= tolerance &&
        Math.abs(pixels[pos + 3] - startA) <= tolerance
      );
    };

    const colorPixel = (pos: number) => {
      pixels[pos] = fillRGB.r;
      pixels[pos + 1] = fillRGB.g;
      pixels[pos + 2] = fillRGB.b;
      pixels[pos + 3] = 255;
    };

    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (stack.length && visited.size < canvasWidth * canvasHeight) {
      const [x, y] = stack.pop()!;
      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue; // Sınır kontrolü

      const pos = (y * canvasWidth + x) * 4;
      if (!matchStartColor(pos)) continue;

      colorPixel(pos);

      if (x > 0) stack.push([x - 1, y]);
      if (x < canvasWidth - 1) stack.push([x + 1, y]);
      if (y > 0) stack.push([x, y - 1]);
      if (y < canvasHeight - 1) stack.push([x, y + 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const newStrokeId = crypto.randomUUID();

    // Yerel olarak dolguyu uygula
    floodFillInternal(
      ctx,
      canvas.width,
      canvas.height,
      startX,
      startY,
      fillColor
    );

    const fillStroke: StrokeData = {
      strokeId: newStrokeId,
      points: [],
      color: fillColor,
      size: 1,
      filled: true,
      tool: 'bucket',
      isBucketFill: true,
      fillPosition: { x: startX, y: startY },
      // ImageData'yı burada saklamak yerine, diğer istemcilere fillPosition ve color gönderip
      // onların da kendi floodFillInternal'larını çalıştırmasını sağlamak daha doğru
      imageData: undefined,
    };

    setAllStrokes((prev) => [...prev, fillStroke]);

    // Diğer istemcilere boya kovası olayını bildir
    const payload: RealtimePointPayload = {
      type: 'draw', // Yeni bir tip
      strokeId: newStrokeId,
      point: { x: startX, y: startY }, // Bu durumda point aslında fillPosition
      color: fillColor,
      size: 1,
      tool: 'bucket',
      isBucketFill: true,
      fillPosition: { x: startX, y: startY },
    };
    sendMessage({ type: 'player_move', content: payload });
    console.log('Boya Kovası Gönderildi:', payload);
  };

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

  const handleCanvasClick = (event: MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'bucket' && canDraw) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = Math.round(event.clientX - rect.left);
      const y = Math.round(event.clientY - rect.top);

      floodFill(x, y, color);
    }
  };

  const canvasCursor = canDraw ? 'crosshair' : 'not-allowed';

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
              style={{ cursor: canDraw ? canvasCursor : 'not-allowed' }}
              className="border-4 border-gray-300 rounded-xl shadow-lg"
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
