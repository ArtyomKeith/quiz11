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
