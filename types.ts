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
