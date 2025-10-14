// Oyun ayarlarının backend'den beklenen formatı
export interface GameSettings {
  total_rounds: number;
  round_duration: number; // Saniye cinsinden
  max_players: number;
  min_players: number;
  game_mode_id: number;
}

// Oyuncu rollerini tanımlar
export type PlayerRole = 'drawer' | 'guesser' | null;

// Oyunun genel durumlarını tanımlar
export type GameStatus = 'idle' | 'started' | 'ended' | 'waiting';

// WebSocket mesajlarında kullanılacak temel arayüz (mevcut useGameWebSocket'taki tiplerinizi buraya taşıyabilirsiniz)
export interface WebSocketMessage {
  type: string;
  content: any;
  // Diğer olası özellikler (örn. sender, timestamp)
}
