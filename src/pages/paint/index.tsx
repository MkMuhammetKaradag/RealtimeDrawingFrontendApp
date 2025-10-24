// src/pages/paint.tsx (Artık çok daha temiz)

import React from 'react';
import Toolbar from '../../components/toolBar';
import Canvas from '../../components/canvas';
import GameOverGallery from '../../components/game/GameOverGallery'; // Yeni bileşen
import useDrawingToolState from '../../hooks/useDrawingToolState'; // Yeni hook

import {
  ToolTypeContext,
  ShapeTypeContext,
  ShapeOutlineContext,
  LineWidthContext,
  ColorContext,
  DispatcherContext,
} from '../../context';
import type { WebSocketMessage, PlayerRole } from '../../types/game.interface'; // Tip yolu doğru olmalı

interface PaintProps {
  role: PlayerRole;
  gameStatus: 'idle' | 'started' | 'ended' | 'waiting';
  sendMessage: (data: any) => void;
  roomDrawData: WebSocketMessage | null;
  onNewGame?: () => void;
  gameOverData?: any;
}
export interface ParsedAction {
  function: string;
  color?: string;
  toolType: string;
  lineWidth?: number;
  lineWidthType?: any; // Veya LineWidthType
  normX?: number;
  normY?: number;
  player_id?: string;
  type?: string;
  shapeType?: string;
  shapeOutlineType?: string;
}
export interface ActionWithPlayer {
  Data: string; // JSON string olarak action
  PlayerID: string; // Oyuncu ID'si
}
const Paint: React.FC<PaintProps> = ({
  role,
  gameStatus,
  sendMessage,
  roomDrawData,
  gameOverData,
  onNewGame,
}) => {
  // 1. TÜM STATE VE HANDLER'LARI HOOK'TAN ÇEK
  const {
    toolType,
    shapeType,
    shapeOutlineType,
    lineWidthType,
    mainColor,
    subColor,
    toolTypeContextValue,
    shapeTypeContextValue,
    shapeOutlineContextValue,
    lineWidthContextValue,
    colorContextValue,
    dispatcherContextValue,
    setColor,
  } = useDrawingToolState({ role, gameStatus });

  // 2. OYUN SONU GALERİSİNİ GÖSTER
  if (gameStatus === 'ended' && gameOverData && onNewGame) {
    return (
      <GameOverGallery gameOverData={gameOverData} onNewGame={onNewGame} />
    );
  }

  // 3. CONTEXT PROVIDER'LARI SAR VE NORMAL OYUN GÖRÜNÜMÜNÜ YÖNET
  return (
    <ToolTypeContext.Provider value={toolTypeContextValue}>
      <ShapeTypeContext.Provider value={shapeTypeContextValue}>
        <ShapeOutlineContext.Provider value={shapeOutlineContextValue}>
          <LineWidthContext.Provider value={lineWidthContextValue}>
            <DispatcherContext.Provider value={dispatcherContextValue}>
              <ColorContext.Provider value={colorContextValue}>
                {/* Oyun Başladı Durumu */}
                {gameStatus === 'started' && (
                  <div className="flex flex-col md:flex-row w-full h-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-600">
                    {role === 'drawer' && (
                      <div className="w-full md:w-48 lg:w-56 flex-shrink-0 bg-gray-700/80 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-600 shadow-lg p-3 md:p-4 transition-all duration-300 z-10">
                        <Toolbar />
                        {/* Kısayollar bilgisi burada kalabilir */}
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-center relative sm:min-h-0 min-h-80 bg-gray-900/50">
                      <Canvas
                        sendMessage={sendMessage}
                        roomDrawData={roomDrawData}
                        role={role}
                        toolType={toolType}
                        shapeType={shapeType}
                        shapeOutlineType={shapeOutlineType}
                        mainColor={mainColor}
                        subColor={subColor}
                        lineWidthType={lineWidthType}
                        setColor={setColor}
                      />
                    </div>
                  </div>
                )}

                {/* Oyun Idle/Waiting Durumu */}
                {(gameStatus === 'idle' || gameStatus === 'waiting') && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
                    <div className="text-center p-8">
                      {/* ... (Idle/Waiting Durumu HTML'i) ... */}
                      <div className="text-6xl mb-4">
                        {gameStatus === 'idle' ? '🎮' : '⏳'}
                      </div>
                      <h3 className="text-white font-bold text-xl mb-2">
                        {gameStatus === 'idle'
                          ? 'Oyun Başlamadı'
                          : 'Yeni Tur Başlıyor...'}
                      </h3>
                      <p className="text-gray-400">
                        {gameStatus === 'idle'
                          ? 'Oyun başlamasını bekleyin...'
                          : 'Hazırlanın, tur başlamak üzere!'}
                      </p>
                    </div>
                  </div>
                )}
              </ColorContext.Provider>
            </DispatcherContext.Provider>
          </LineWidthContext.Provider>
        </ShapeOutlineContext.Provider>
      </ShapeTypeContext.Provider>
    </ToolTypeContext.Provider>
  );
};

export default Paint;
