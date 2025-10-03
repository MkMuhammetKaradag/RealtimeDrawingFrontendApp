import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameWebSocket } from './useGameWebSocket.ts';
import DrawingCanvas from '../../components/DrawingCanvas/DrawingCanvas.tsx';

import { useDrawingLogic } from '../../hooks/useDrawingLogic.ts';
import type {
  RealtimePointPayload,
  StrokeData,
  Tool,
} from '../../components/DrawingCanvas/DrawingCanvas.types.ts'; // StrokeData ve Tool'u da import ettiğimizden emin olalım
import { Toolbar } from '../../components/DrawingCanvas/Toolbar/Toolbar.tsx';
import { JsonInput } from '../../components/DrawingCanvas/JsonInput/JsonInput.tsx';

const GamePage: React.FC = () => {
  const { room_id } = useParams<{ room_id: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<'drawer' | 'guesser' | null>(null);

  const { connectionStatus, errorMessage, roomData, sendMessage } =
    useGameWebSocket({
      roomId: room_id || '',
      sessionToken: document.cookie.split('session=')[1],
    });

  const [showJsonInput, setShowJsonInput] = useState(false);

  // useDrawingLogic hook'unu çağırırken remoteDrawingPoint'i direkt olarak setAllStrokes ile yöneteceğimiz için null geçebiliriz.
  const {
    canvasRef,
    tool,
    setTool,
    color,
    setColor,
    size,
    setSize,
    filled,
    setFilled,
    allStrokes,
    startDrawing,
    stopDrawing,
    draw,
    clearCanvas,
    undoStroke,
    exportData,
    handleJsonImport,
    canvasCursor,
    setAllStrokes, // Bu, useDrawingLogic'ten gelen setAllStrokes fonksiyonu
  } = useDrawingLogic({
    canDraw: role === 'drawer',
    sendMessage: sendMessage,
    remoteDrawingPoint: null, // remoteDrawingPoint'i GamePage'de manuel olarak işleyeceğiz
  });

  // Uzak sunucudan gelen verileri işlemek için useEffect
  useEffect(() => {
    if (!roomData) return;

    if (roomData.type === 'canvas_update') {
      console.log('Canvas güncellemesi alındı:', roomData);

      try {
        const parsedData = JSON.parse(roomData.content.data);
        const payload = parsedData as RealtimePointPayload;

        setAllStrokes((prevStrokes) => {
          if (payload.isBucketFill && payload.fillPosition) {
            const newFillStroke: StrokeData = {
              // Tip tanımını açıkça belirt
              strokeId: payload.strokeId,
              points: [], // Boya kovası için points boş, Point[] tipine uyuyor
              color: payload.color,
              size: 1, // Size bir sayı, Number tipine uyuyor
              filled: true,
              tool: 'bucket', // 'bucket' Tool tipine uyuyor
              isBucketFill: true,
              fillPosition: payload.fillPosition,
            };
            const existingBucketFillIndex = prevStrokes.findIndex(
              (s) => s.strokeId === payload.strokeId
            );
            if (existingBucketFillIndex !== -1) {
              const updatedStrokes = [...prevStrokes];
              updatedStrokes[existingBucketFillIndex] = newFillStroke;
              return updatedStrokes;
            } else {
              return [...prevStrokes, newFillStroke];
            }
          } else if (payload.type === 'shape_draw') {
            const newShapeStroke: StrokeData = {
              // Tip tanımını açıkça belirt
              strokeId: payload.strokeId,
              points: payload.points || [], // payload.points Point[] tipinde veya boş dizi, uyumlu
              color: payload.color,
              size: payload.size,
              filled: payload.filled ?? false, // undefined durumunda false, uyumlu
              tool: payload.tool, // Tool tipine uyuyor
            };
            const existingShapeIndex = prevStrokes.findIndex(
              (s) => s.strokeId === payload.strokeId
            );
            if (existingShapeIndex !== -1) {
              const updatedStrokes = [...prevStrokes];
              updatedStrokes[existingShapeIndex] = newShapeStroke;
              return updatedStrokes;
            } else {
              return [...prevStrokes, newShapeStroke];
            }
          } else {
            // Normal çizim noktası
            const existingStrokeIndex = prevStrokes.findIndex(
              (s) => s.strokeId === payload.strokeId
            );
            if (existingStrokeIndex !== -1) {
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
              const newPenStroke: StrokeData = {
                // Tip tanımını açıkça belirt
                points: [payload.point],
                color: payload.color,
                size: payload.size,
                filled: false,
                tool: payload.tool, // Tool tipine uyuyor
                strokeId: payload.strokeId,
              };
              return [...prevStrokes, newPenStroke];
            }
          }
        });
      } catch (error) {
        console.error(
          'Canvas verisi JSON ayrıştırma hatası:',
          error,
          roomData.content.data
        );
      }
    } else if (roomData.type === 'clear_canvas') {
      setAllStrokes([]);
    }
    // else if (roomData.type === 'undo_stroke') {
    //     setAllStrokes((prev) => prev.filter(s => s.strokeId !== roomData.strokeId));
    // }

    if (roomData.type === 'round_start_drawer') setRole('drawer');
    if (roomData.type === 'round_start_guesser') setRole('guesser');
  }, [roomData, setAllStrokes]);

  if (connectionStatus === 'connecting') {
    return <p>Odaya bağlanılıyor...</p>;
  }

  if (connectionStatus === 'error') {
    return (
      <div>
        <p>Hata: {errorMessage}</p>
        <button onClick={() => window.location.reload()}>Tekrar Dene</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8">
      <div className=" w-full  max-w-7xl mx-auto ">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          🎨 Oyun Odası: {room_id}{' '}
          {role && `(${role === 'drawer' ? 'Çizen' : 'Tahmin Eden'})`}
        </h1>

        <p className="text-center text-lg mb-4">
          Durum:{' '}
          {connectionStatus === 'connected' ? 'Bağlı! 🟢' : 'Bağlanıyor...'}
        </p>

        {role === null && (
          <div className="text-center mb-6">
            {' '}
            <button
              onClick={() => sendMessage({ type: 'game_started' })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors font-semibold"
            >
              Hazırım!{' '}
            </button>{' '}
            <p className="mt-2 text-gray-600">
              Oyunun başlamasını bekleyin. Rolünüz atandığında çizim araçları
              görünür.{' '}
            </p>{' '}
          </div>
        )}
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8 mt-6">
          {role === 'drawer' && (
            <div className="w-full lg:max-w-sm lg:order-1 order-2 mb-6 lg:mb-0">
              {/* PC'de solda (order-1), mobilde (order-2) */}
              <Toolbar
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                size={size}
                setSize={setSize}
                filled={filled}
                setFilled={setFilled}
                clearCanvas={clearCanvas}
                undoStroke={undoStroke}
                exportData={exportData}
                toggleJsonInput={() => setShowJsonInput(!showJsonInput)}
                allStrokesCount={allStrokes.length}
              />
            </div>
          )}

          <div className="w-full lg:flex-1 lg:order-2 order-1">
            {' '}
            {/* lg:flex-1 ile kalan alanı kaplamasını sağladık */}
            <DrawingCanvas
              canvasRef={canvasRef}
              canDraw={role === 'drawer'}
              startDrawing={startDrawing}
              stopDrawing={stopDrawing}
              draw={draw}
              canvasCursor={canvasCursor}
            />
          </div>
        </div>
        {role === 'drawer' && (
          <JsonInput
            show={showJsonInput}
            onClose={() => setShowJsonInput(false)}
            onSubmit={handleJsonImport}
          />
        )}
        <div className="text-center text-gray-600 mt-6">
          {role === 'guesser' && (
            <p>Sıra çizen oyuncuda. Çizimi izleyin ve tahmin etmeye çalışın!</p>
          )}
          <p>Çizim yaptıkça veriler konsola yazdırılacaktır 🎨</p>
          {roomData && (
            <pre className="mt-4 p-2 bg-gray-100 rounded-lg text-left text-sm overflow-auto max-h-48">
              Son Oda Verisi: {JSON.stringify(roomData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
};

export default GamePage;
