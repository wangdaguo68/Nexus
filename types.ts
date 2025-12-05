import React from 'react';

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  thumbnail: string; // URL or placeholder color
  component: React.ComponentType<{ onExit: () => void }>;
  category: 'Puzzle' | 'Action' | 'Strategy' | 'Arcade';
}

export interface PlatformState {
  activeGameId: string | null;
}

export interface Game2048State {
  grid: number[][];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';