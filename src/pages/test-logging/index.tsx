import React, { useState, useEffect } from 'react';
import {
  canvasLogger,
  type LogEventType,
  LogEventValue,
} from '../../util/logger';
import { CanvasWebSocketClient } from '../../util/websocket';

const TestLoggingPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoggerEnabled, setIsLoggerEnabled] = useState(true);
  const [wsClient, setWsClient] = useState<CanvasWebSocketClient | null>(null);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsUrl, setWsUrl] = useState('ws://localhost:8080');
  const [userId, setUserId] = useState('test-user-123');
  const [roomId, setRoomId] = useState('test-room-456');

  // Log'ları güncelleme
  useEffect(() => {
    const updateLogs = () => {
      setLogs(canvasLogger.getRecentLogs(50));
    };

    // Her saniye log'ları güncelle
    const interval = setInterval(updateLogs, 1000);
    updateLogs(); // İlk yükleme

    return () => clearInterval(interval);
  }, []);

  // Logger durumunu değiştirme
  const toggleLogger = () => {
    const newState = !isLoggerEnabled;
    setIsLoggerEnabled(newState);
    canvasLogger.setEnabled(newState);
  };

  // Log'ları temizleme
  const clearLogs = () => {
    canvasLogger.clearLogs();
    setLogs([]);
  };

  // WebSocket bağlantısı
  const connectWebSocket = async () => {
    if (wsClient) {
      wsClient.disconnect();
    }

    const client = new CanvasWebSocketClient(wsUrl, userId, roomId);

    client.on('connected', () => {
      setIsWsConnected(true);
      console.log('WebSocket bağlantısı kuruldu');
    });

    client.on('disconnected', () => {
      setIsWsConnected(false);
      console.log('WebSocket bağlantısı kesildi');
    });

    client.on('error', (error: any) => {
      console.error('WebSocket hatası:', error);
      setIsWsConnected(false);
    });

    client.on('canvasAction', (message: any) => {
      console.log('Canvas action alındı:', message);
    });

    setWsClient(client);

    try {
      await client.connect();
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
    }
  };

  // WebSocket bağlantısını kesme
  const disconnectWebSocket = () => {
    if (wsClient) {
      wsClient.disconnect();
      setIsWsConnected(false);
    }
  };

  // Test log'ları oluşturma
  const createTestLogs = () => {
    // Test çizim log'ları
    canvasLogger.log({
      eventType: LogEventValue.DRAW_START,
      toolType: 'PEN',
      position: { x: 100, y: 100 },
      color: '#ff0000',
      lineWidth: 2,
      isTouch: false,
    });

    canvasLogger.log({
      eventType: LogEventValue.DRAW_MOVE,
      toolType: 'PEN',
      position: { x: 150, y: 120 },
      color: '',
      lineWidth: 0,
      isTouch: false,
    });

    canvasLogger.log({
      eventType: LogEventValue.DRAW_END,
      toolType: 'PEN',
      position: { x: 200, y: 150 },
      color: '',
      lineWidth: 0,
      isTouch: false,
    });

    // Test şekil log'ları
    canvasLogger.log({
      eventType: LogEventValue.SHAPE_START,
      toolType: 'SHAPE',
      shapeType: 'RECT',
      startPosition: { x: 50, y: 50 },
      color: '#00ff00',
      lineWidth: 3,
      isDashed: false,
      isTouch: false,
    });

    canvasLogger.log({
      eventType: LogEventValue.SHAPE_END,
      toolType: 'SHAPE',
      shapeType: 'RECT',
      startPosition: { x: 50, y: 50 },
      endPosition: { x: 150, y: 150 },
      color: '',
      lineWidth: 0,
      isDashed: false,
      isTouch: false,
    });

    // Test doldurma log'ları
    canvasLogger.log({
      eventType: LogEventValue.FILL_START,
      toolType: 'COLOR_FILL',
      position: { x: 100, y: 100 },
      fillColor: '#0000ff',
      isTouch: false,
    });

    // Test silme log'ları
    canvasLogger.log({
      eventType: LogEventValue.ERASE_START,
      toolType: 'ERASER',
      position: { x: 75, y: 75 },
      lineWidth: 5,
      isTouch: false,
    });

    // Test renk çıkarma log'ları
    canvasLogger.log({
      eventType: LogEventValue.COLOR_EXTRACT,
      toolType: 'COLOR_EXTRACT',
      position: { x: 125, y: 125 },
      extractedColor: '#ffff00',
      isTouch: false,
    });

    // Test canvas işlemleri
    canvasLogger.log({
      eventType: LogEventValue.CANVAS_CLEAR,
      toolType: 'PEN',
    });

    canvasLogger.log({
      eventType: LogEventValue.CANVAS_UNDO,
      toolType: 'PEN',
    });

    canvasLogger.log({
      eventType: LogEventValue.CANVAS_REDO,
      toolType: 'PEN',
    });

    canvasLogger.log({
      eventType: LogEventValue.CANVAS_RESIZE,
      toolType: 'PEN',
      canvasSize: { width: 800, height: 600 },
    });

    // Test tool değişiklikleri
    canvasLogger.log({
      eventType: LogEventValue.TOOL_CHANGE,
      toolType: 'ERASER',
      oldValue: 'PEN',
      newValue: 'ERASER',
    });

    canvasLogger.log({
      eventType: LogEventValue.COLOR_CHANGE,
      toolType: 'PEN',
      oldValue: '#ff0000',
      newValue: '#00ff00',
    });

    canvasLogger.log({
      eventType: LogEventValue.LINE_WIDTH_CHANGE,
      toolType: 'PEN',
      oldValue: 'THIN',
      newValue: 'BOLD',
    });
  };

  // İstatistikleri alma
  const getStats = () => {
    return canvasLogger.getStats();
  };

  const stats = getStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Canvas Logging Test Sayfası</h1>

      {/* Kontrol Paneli */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Kontrol Paneli</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <button
            onClick={toggleLogger}
            className={`px-4 py-2 rounded ${
              isLoggerEnabled
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            Logger: {isLoggerEnabled ? 'Açık' : 'Kapalı'}
          </button>

          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Log'ları Temizle
          </button>

          <button
            onClick={createTestLogs}
            className="px-4 py-2 bg-purple-500 text-white rounded"
          >
            Test Log'ları Oluştur
          </button>

          <div className="text-sm">
            <div>Toplam Log: {stats.totalLogs}</div>
            <div>
              Son Aktivite:{' '}
              {stats.lastActivity
                ? new Date(stats.lastActivity).toLocaleTimeString('tr-TR')
                : 'Yok'}
            </div>
          </div>
        </div>

        {/* WebSocket Kontrolleri */}
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">WebSocket Kontrolleri</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="WebSocket URL"
              className="px-3 py-2 border rounded"
            />

            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Kullanıcı ID"
              className="px-3 py-2 border rounded"
            />

            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Oda ID"
              className="px-3 py-2 border rounded"
            />

            <div className="flex gap-2">
              <button
                onClick={connectWebSocket}
                disabled={isWsConnected}
                className={`px-4 py-2 rounded ${
                  isWsConnected
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-500 text-white'
                }`}
              >
                Bağlan
              </button>

              <button
                onClick={disconnectWebSocket}
                disabled={!isWsConnected}
                className={`px-4 py-2 rounded ${
                  !isWsConnected
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-red-500 text-white'
                }`}
              >
                Bağlantıyı Kes
              </button>
            </div>
          </div>

          <div className="text-sm">
            WebSocket Durumu:
            <span
              className={`ml-2 px-2 py-1 rounded text-white ${
                isWsConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            >
              {isWsConnected ? 'Bağlı' : 'Bağlı Değil'}
            </span>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Log İstatistikleri</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-sm">
          {Object.entries(stats.eventTypeCounts).map(([eventType, count]) => (
            <div key={eventType} className="text-center">
              <div className="font-semibold">{eventType}</div>
              <div className="text-2xl font-bold text-blue-600">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Listesi */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Son Log'lar ({logs.length})</h2>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              Henüz log bulunmuyor. Test log'ları oluşturmak için yukarıdaki
              butonu kullanın.
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log, index) => (
                <div key={index} className="p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-blue-600">
                          {log.eventType}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleTimeString('tr-TR')}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({log.toolType})
                        </span>
                      </div>

                      <div className="text-sm text-gray-700">
                        {log.eventType.includes('DRAW') && (
                          <div>
                            Konum: ({log.position?.x}, {log.position?.y}) |
                            Renk: {log.color} | Kalınlık: {log.lineWidth}
                          </div>
                        )}

                        {log.eventType.includes('SHAPE') && (
                          <div>
                            Şekil: {log.shapeType} | Başlangıç: (
                            {log.startPosition?.x}, {log.startPosition?.y}) |
                            {log.endPosition &&
                              ` Bitiş: (${log.endPosition.x}, ${log.endPosition.y})`}{' '}
                            | Kesikli: {log.isDashed ? 'Evet' : 'Hayır'}
                          </div>
                        )}

                        {log.eventType.includes('FILL') && (
                          <div>
                            Konum: ({log.position?.x}, {log.position?.y}) |
                            Renk: {log.fillColor}
                          </div>
                        )}

                        {log.eventType.includes('ERASE') && (
                          <div>
                            Konum: ({log.position?.x}, {log.position?.y}) |
                            Kalınlık: {log.lineWidth}
                          </div>
                        )}

                        {log.eventType === 'COLOR_EXTRACT' && (
                          <div>
                            Konum: ({log.position?.x}, {log.position?.y}) |
                            Çıkarılan Renk: {log.extractedColor}
                          </div>
                        )}

                        {log.eventType.includes('CANVAS') && log.canvasSize && (
                          <div>
                            Canvas Boyutu: {log.canvasSize.width}x
                            {log.canvasSize.height}
                          </div>
                        )}

                        {(log.eventType === 'TOOL_CHANGE' ||
                          log.eventType === 'COLOR_CHANGE' ||
                          log.eventType === 'LINE_WIDTH_CHANGE') && (
                          <div>
                            Eski: {log.oldValue} → Yeni: {log.newValue}
                          </div>
                        )}

                        {log.isTouch && (
                          <span className="text-orange-600">(Touch)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestLoggingPage;
