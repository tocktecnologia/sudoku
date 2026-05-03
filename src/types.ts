export type Difficulty = 'easy' | 'medium' | 'moderate' | 'hard';

export interface UserData {
  uid: string;
  displayName: string;
  photoURL: string;
  careerLevel: number;
  tokens: number;
  dailyStreak: number;
  lastDailyChallenge?: string;
  bestTimes: Record<string, number>;
}

export interface ChallengeData {
  id: string;
  board: string;
  solution: string;
  difficulty: Difficulty;
  status: 'waiting' | 'playing' | 'finished';
  players: {
    p1: PlayerInfo;
    p2?: PlayerInfo;
  };
  createdAt: any;
  winner?: string;
}

export interface PlayerInfo {
  uid: string;
  name: string;
  time: number;
  finished: boolean;
  mistakes: number;
}

export interface Theme {
  name: string;
  bg: string;
  grid: string;
  accent: string;
  text: string;
  cell: string;
  selected: string;
  error: string;
}

export const THEMES: Theme[] = [
  {
    name: 'Classic',
    bg: 'bg-stone-50',
    grid: 'border-stone-800',
    accent: 'bg-indigo-600',
    text: 'text-stone-900',
    cell: 'bg-white',
    selected: 'bg-indigo-100',
    error: 'bg-red-100 text-red-600'
  },
  {
    name: 'Dark Slate',
    bg: 'bg-slate-900',
    grid: 'border-slate-700',
    accent: 'bg-sky-500',
    text: 'text-slate-100',
    cell: 'bg-slate-800',
    selected: 'bg-slate-700',
    error: 'bg-rose-900/50 text-rose-400'
  },
  {
    name: 'Forest',
    bg: 'bg-emerald-950',
    grid: 'border-emerald-800/50',
    accent: 'bg-emerald-500',
    text: 'text-emerald-50',
    cell: 'bg-emerald-900/50',
    selected: 'bg-emerald-800',
    error: 'bg-orange-900/50 text-orange-400'
  },
  {
    name: 'Minimalist',
    bg: 'bg-white',
    grid: 'border-black',
    accent: 'bg-black',
    text: 'text-black',
    cell: 'bg-white',
    selected: 'bg-gray-100',
    error: 'bg-gray-100 text-red-500 font-bold'
  }
];
