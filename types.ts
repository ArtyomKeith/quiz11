export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizState {
  questions: Question[];
  currentIndex: number;
  score: number;
  isFinished: boolean;
  isLoading: boolean;
  gameMode: 'single' | 'multi' | 'daily';
  opponentScore?: number; // For multiplayer simulation
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  points: number;
  rank: number;
  streak: number;
}

export interface Topic {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface MultiplayerMatch {
  id: string;
  code: string;
  topic: string;
  status: 'waiting' | 'playing' | 'finished';
  player1_id: string;
  player2_id: string | null;
  player1_score: number;
  player2_score: number;
  questions: Question[]; // JSON stored in DB
}

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
            language_code?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}
