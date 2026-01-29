import { Topic, PlayerProfile } from './types';

export const POPULAR_TOPICS: Topic[] = [
  { id: 'tech', name: 'Технологии', icon: 'Cpu', color: 'bg-blue-500' },
  { id: 'science', name: 'Наука', icon: 'FlaskConical', color: 'bg-green-500' },
  { id: 'history', name: 'История', icon: 'Hourglass', color: 'bg-yellow-500' },
  { id: 'pop', name: 'Поп-культура', icon: 'Music', color: 'bg-pink-500' },
  { id: 'geo', name: 'География', icon: 'Globe', color: 'bg-cyan-500' },
  { id: 'lit', name: 'Литература', icon: 'BookOpen', color: 'bg-purple-500' },
];

export const MOCK_LEADERBOARD: PlayerProfile[] = [
  { id: '1', name: 'Алексей К.', avatar: 'https://picsum.photos/100/100?random=1', points: 12500, rank: 1, streak: 15 },
  { id: '2', name: 'Мария С.', avatar: 'https://picsum.photos/100/100?random=2', points: 11200, rank: 2, streak: 8 },
  { id: '3', name: 'Дмитрий', avatar: 'https://picsum.photos/100/100?random=3', points: 9800, rank: 3, streak: 3 },
  { id: '4', name: 'Елена Р.', avatar: 'https://picsum.photos/100/100?random=4', points: 8500, rank: 4, streak: 0 },
  { id: '5', name: 'Иван Д.', avatar: 'https://picsum.photos/100/100?random=5', points: 7200, rank: 5, streak: 1 },
];