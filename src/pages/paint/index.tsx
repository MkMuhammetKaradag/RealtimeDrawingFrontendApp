import React, { useState, useCallback, useEffect } from 'react';
import Toolbar from '../../components/toolBar';
import {
  ToolTypeContext,
  ShapeTypeContext,
  ShapeOutlineContext,
  LineWidthContext,
  ColorContext,
  DispatcherContext,
} from '../../context';
import type {
  ColorType,
  LineWidthType,
  ShapeOutlineType,
  ShapeToolType,
  ToolType,
} from '../../util/toolType';
import {
  ColorValue,
  LineWidthValue,
  ShapeOutlineValue,
  ShapeToolValue,
  ToolValue,
} from '../../util/toolType';
import Dispatcher from '../../util/dispatcher';
import Canvas from '../../components/canvas';
import type { WebSocketMessage } from '../../hooks/useGameWebSocket';
import {
  CLEAR_EVENT,
  REDO_EVENT,
  UNDO_EVENT,
} from '../../util/dispatcher/event';
import { useNavigate } from 'react-router-dom';

import SimpleMiniCanvas from '../../components/canvas/SimpleMiniCanvas';

interface PaintProps {
  role: 'drawer' | 'guesser' | null;
  gameStatus: 'idle' | 'started' | 'ended' | 'waiting';
  sendMessage: (data: any) => void;
  roomDrawData: WebSocketMessage | null;
  gameOverData?: any; // Opsiyonel, çünkü başlangıçta yok
}

export interface ParsedAction {
  function: string;
  color?: string;
  toolType: string;
  lineWidth?: number;
  lineWidthType?: string;
  normX?: number;
  normY?: number;
  player_id?: string;
  type?: string;
  shapeType?: string;
  shapeOutlineType?: string;
}

const Paint: React.FC<PaintProps> = ({
  role,
  gameStatus,
  sendMessage,
  roomDrawData,
  gameOverData,
}) => {
  // State'ler
  const [toolType, setToolType] = useState<ToolType>(ToolValue.PEN);
  const [shapeType, setShapeType] = useState<ShapeToolType>(
    ShapeToolValue.LINE
  );
  const [shapeOutlineType, setShapeOutlineType] = useState<ShapeOutlineType>(
    ShapeOutlineValue.SOLID
  );
  const [lineWidthType, setLineWidthType] = useState<LineWidthType>(
    LineWidthValue.THIN
  );
  const [activeColorType, setActiveColorType] = useState<ColorType>(
    ColorValue.MAIN
  );
  const [mainColor, setMainColor] = useState<string>('#000000');
  const [subColor, setSubColor] = useState<string>('#FFFFFF');
  const [showGameOver, setShowGameOver] = useState(false);
  const navigate = useNavigate();

  const shortenPlayerId = (playerId: string) => {
    return playerId.slice(0, 8) + '...';
  };

  // Dispatcher
  const [dispatcher] = useState(() => new Dispatcher());

  useEffect(() => {
    if (gameStatus === 'ended') {
      setShowGameOver(true);
      console.log('🎮 Oyun bitti, galeri gösterilecek');
    } else {
      setShowGameOver(false);
    }
  }, [gameStatus]);

  // Debug fonksiyonu
  const logAction = useCallback((action: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎨 Çizim Eylemi: ${action}`, details || '');
    }
  }, []);

  // Renk ve araç yönetimi fonksiyonları
  const setColor = useCallback(
    (value: string) => {
      if (activeColorType === ColorValue.MAIN) {
        setMainColor(value);
      } else {
        setSubColor(value);
      }
      logAction('Renk değiştirildi', { aktif: activeColorType, yeni: value });
    },
    [activeColorType, logAction]
  );

  const swapColors = useCallback(() => {
    setMainColor(subColor);
    setSubColor(mainColor);
    logAction('Renkler değiştirildi', {
      yeniAna: subColor,
      yeniYardimci: mainColor,
    });
  }, [mainColor, subColor, logAction]);

  const handleToolChange = useCallback(
    (newTool: ToolType) => {
      setToolType(newTool);
      logAction('Araç değiştirildi', { yeniAraç: newTool });
    },
    [logAction]
  );

  const handleShapeChange = useCallback(
    (newShape: ShapeToolType) => {
      setToolType(ToolValue.SHAPE);
      setShapeType(newShape);
      logAction('Şekil değiştirildi', { yeniŞekil: newShape });
    },
    [logAction]
  );

  const handleLineWidthChange = useCallback(
    (newWidth: LineWidthType) => {
      setLineWidthType(newWidth);
      logAction('Çizgi kalınlığı değiştirildi', { yeniKalınlık: newWidth });
    },
    [logAction]
  );

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sadece drawer rolündekiler ve oyun devam ederken kısayolları kullanabilsin
      if (role !== 'drawer' || gameStatus !== 'started') return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            dispatcher.dispatch(e.shiftKey ? REDO_EVENT : UNDO_EVENT);
            logAction('Kısayol: ' + (e.shiftKey ? 'Redo' : 'Undo'));
            break;
          case 'y':
            e.preventDefault();
            dispatcher.dispatch(REDO_EVENT);
            logAction('Kısayol: Redo');
            break;
          case 'a':
            e.preventDefault();
            dispatcher.dispatch(CLEAR_EVENT);
            logAction('Kısayol: Clear');
            break;
          case 'e':
            e.preventDefault();
            setToolType(ToolValue.ERASER);
            logAction('Kısayol: Silgi');
            break;
          case 'p':
            e.preventDefault();
            setToolType(ToolValue.PEN);
            logAction('Kısayol: Kalem');
            break;
        }
      }

      // Basit kısayollar (Ctrl gerektirmeyen)
      switch (e.key) {
        case 'Escape':
          setToolType(ToolValue.PEN);
          logAction('Kısayol: Escape - Kalem modu');
          break;
        case ' ':
          // Boşluk tuşu - Renk değiştirme
          if (e.target === document.body) {
            e.preventDefault();
            swapColors();
            logAction('Kısayol: Boşluk - Renk değiştir');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatcher, role, gameStatus, swapColors, logAction]);

  // Oyun durumu değişikliklerini takip et
  useEffect(() => {
    if (gameStatus === 'started' && role === 'drawer') {
      logAction('Çizim modu aktif', { rol: role });
    } else if (gameStatus === 'ended') {
      logAction('Oyun bitti, çizim devre dışı');
    }
  }, [gameStatus, role, logAction]);

  // WebSocket verilerini takip et (debug için)
  useEffect(() => {
    if (roomDrawData && process.env.NODE_ENV === 'development') {
      logAction('WebSocket verisi alındı', roomDrawData);
    }
  }, [roomDrawData, logAction]);

  // Context değerleri
  const toolTypeContextValue = {
    type: toolType,
    setType: handleToolChange,
  };

  const shapeTypeContextValue = {
    type: shapeType,
    setType: handleShapeChange,
  };

  const shapeOutlineContextValue = {
    type: shapeOutlineType,
    setType: setShapeOutlineType,
  };

  const lineWidthContextValue = {
    type: lineWidthType,
    setType: handleLineWidthChange,
  };

  const colorContextValue = {
    mainColor,
    subColor,
    activeColor: activeColorType,
    setColor,
    setActiveColor: setActiveColorType,
    swapColors,
  };

  const dispatcherContextValue = { dispatcher };

  const parseRoundData = (gameOverData: any) => {
    console.log('🔍 parseRoundData input:', gameOverData);

    if (!gameOverData?.rounds) {
      console.log('❌ rounds bulunamadı');
      return [];
    }

    const result = Object.entries(gameOverData.rounds)
      .map(([roundKey, roundData]: [string, any]) => {
        const roundNumber = roundKey.replace('round_', '');

        // Eğer player_actions yoksa veya boşsa, bu round'ı atla
        if (
          !roundData.player_actions ||
          Object.keys(roundData.player_actions).length === 0
        ) {
          console.log(`⏭️ Round ${roundNumber} boş, atlanıyor`);
          return null;
        }

        const players = Object.entries(roundData.player_actions)
          .map(([playerId, actions]: [string, any]) => {
            const parsedActions: ParsedAction[] = actions
              .map((action: any) => {
                try {
                  return JSON.parse(action.Data) as ParsedAction;
                } catch (e) {
                  console.log('❌ JSON parse hatası:', e);
                  return null;
                }
              })
              .filter(Boolean) as ParsedAction[];

            return {
              playerId,
              actions: parsedActions,
              actionCount: parsedActions.length,
            };
          })
          .filter((player) => player.actions.length > 0); // Boş oyuncuları filtrele

        // Eğer bu round'da hiç oyuncu kalmadıysa, round'ı atla
        if (players.length === 0) {
          console.log(`⏭️ Round ${roundNumber} için hiç oyuncu kalmadı`);
          return null;
        }

        return {
          roundNumber,
          word: roundData.word,
          players,
        };
      })
      .filter(Boolean); // null değerleri filtrele

    console.log('🔍 parseRoundData result:', result);
    return result;
  };
  if (gameStatus === 'ended' && gameOverData) {
    console.log('🔍 gameOverData:', gameOverData);
    console.log('🔍 gameOverData:', gameOverData);

    const rounds = parseRoundData(gameOverData);
    console.log('🔍 Parsed rounds:', rounds);

    // Debug: rounds boş mu kontrol et
    if (rounds.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-6">🎨</div>
            <h2 className="text-2xl font-bold text-white mb-4">Oyun Sonu!</h2>
            <p className="text-gray-300 mb-6">
              Bu oyunda kaydedilmiş çizim bulunamadı.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                🎮 Yeni Oyun Başlat
              </button>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200"
              >
                🏠 Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Eğer rounds doluysa normal galeriyi göster
    return (
      <div className="w-full h-full bg-gray-800 rounded-xl border border-gray-600 p-6 overflow-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-3xl font-bold text-white mb-2">Oyun Sonu!</h2>
          <p className="text-gray-300">Tüm roundların çizim detayları</p>
          <div className="mt-4 bg-gray-700/50 rounded-lg p-3 inline-block">
            <p className="text-gray-400 text-sm">
              Toplam {rounds.length} round •{' '}
              {rounds.reduce(
                (total, round) => total + (round?.players?.length || 0),
                0
              )}{' '}
              oyuncu katkısı
            </p>
          </div>
        </div>

        {/* Round Listesi */}
        <div className="space-y-6">
          {rounds.map((round) => (
            <div
              key={round?.roundNumber}
              className="bg-gray-700/50 rounded-xl p-6 border border-gray-600 hover:border-purple-500 transition-all duration-300"
            >
              {/* Round Başlığı */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {round?.roundNumber}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Round {round?.roundNumber}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {round?.players.length} oyuncu katkıda bulundu
                    </p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Kelime:{' '}
                  <span className="text-yellow-300 font-bold">
                    {round?.word}
                  </span>
                </div>
              </div>

              {/* Oyuncu Listesi */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {round?.players.map((player) => (
                  <div
                    key={player.playerId}
                    className="bg-gray-600/50 rounded-lg p-4 border border-gray-500 hover:border-blue-400 transition-all duration-200"
                  >
                    {/* Oyuncu Bilgisi */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {player.playerId.slice(0, 2)}
                        </div>
                        <span className="text-white font-medium">
                          {shortenPlayerId(player.playerId)}
                        </span>
                      </div>
                      <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                        {player.actionCount} çizim
                      </span>
                    </div>

                    {/* Mini Canvas Önizleme */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-2">
                        Çizim Önizleme:
                      </div>
                      <SimpleMiniCanvas
                        key={round.roundNumber}
                        roundId={round.roundNumber}
                        actions={player.actions}
                        width={180}
                        height={120}
                      />
                    </div>

                    {/* Çizim İstatistikleri */}
                    <div className="space-y-2">
                      {player.actions
                        .slice(0, 3)
                        .map((action: ParsedAction, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs bg-gray-500/30 p-2 rounded"
                          >
                            <span className="text-gray-300 capitalize">
                              {action.function.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center space-x-2">
                              {action.color && (
                                <div
                                  className="w-3 h-3 rounded border border-gray-400"
                                  style={{ backgroundColor: action.color }}
                                />
                              )}
                              <span className="text-gray-400">
                                {action.toolType}
                              </span>
                            </div>
                          </div>
                        ))}

                      {player.actions.length > 3 && (
                        <div className="text-center text-gray-400 text-xs pt-2">
                          ... ve {player.actions.length - 3} daha
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Butonlar */}
        <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-600">
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            🎮 Yeni Oyun Başlat
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            🏠 Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }
  return (
    <ToolTypeContext.Provider value={toolTypeContextValue}>
      <ShapeTypeContext.Provider value={shapeTypeContextValue}>
        <ShapeOutlineContext.Provider value={shapeOutlineContextValue}>
          <LineWidthContext.Provider value={lineWidthContextValue}>
            <DispatcherContext.Provider value={dispatcherContextValue}>
              <ColorContext.Provider value={colorContextValue}>
                {gameStatus === 'started' && (
                  <div className="flex flex-col md:flex-row w-full h-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-600">
                    {/* Toolbar - Sadece drawer için ve mobilde daha kompakt */}
                    {role === 'drawer' && (
                      <div className="w-full md:w-48 lg:w-56 flex-shrink-0 bg-gray-700/80 backdrop-blur-sm border-b md:border-b-0 md:border-r border-gray-600 shadow-lg p-3 md:p-4 transition-all duration-300 z-10">
                        <div className="flex flex-col gap-3 md:gap-4">
                          <Toolbar />
                          {/* Kısayol bilgisi - sadece masaüstünde */}
                          <div className="hidden md:block mt-4 pt-4 border-t border-gray-600">
                            <p className="text-xs text-gray-400 mb-2">
                              Kısayollar:
                            </p>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Ctrl+Z: Geri Al</div>
                              <div>Ctrl+Y: İleri Al</div>
                              <div>Ctrl+A: Temizle</div>
                              <div>Esc: Kalem</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Canvas Alanı */}
                    <div className="flex-1 flex items-center justify-center relative   sm:min-h-0  min-h-80   üstü ve altı   bg-gray-900/50">
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

                {/* Oyun başlamadığında veya beklerken */}
                {(gameStatus === 'idle' || gameStatus === 'waiting') && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl border border-gray-600">
                    <div className="text-center p-8">
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
