import React from 'react';
import { Play, Info } from 'lucide-react';
import { GameMetadata } from '../types';

interface GameCardProps {
  game: GameMetadata;
  onPlay: (id: string) => void;
}

const CATEGORY_MAP: Record<string, string> = {
  Puzzle: '益智',
  Action: '动作',
  Strategy: '策略',
  Arcade: '街机'
};

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay }) => {
  return (
    <div className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-slate-900 relative">
        <div className="absolute inset-0 bg-indigo-600/10 group-hover:bg-transparent transition-colors z-10" />
        {/* Generative placeholder if no image, specific styling for 2048 to look good */}
        {game.id === '2048' ? (
          <div className="w-full h-full flex items-center justify-center bg-yellow-500/10">
            <div className="grid grid-cols-2 gap-2 transform rotate-12 scale-110 opacity-80">
              <div className="w-12 h-12 bg-yellow-400 rounded shadow-sm"></div>
              <div className="w-12 h-12 bg-yellow-500 rounded shadow-sm"></div>
              <div className="w-12 h-12 bg-orange-400 rounded shadow-sm"></div>
              <div className="w-12 h-12 bg-orange-500 rounded shadow-sm"></div>
            </div>
          </div>
        ) : (
          <img 
            src={game.thumbnail} 
            alt={game.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity transform group-hover:scale-105 duration-500"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase mb-1 block">
              {CATEGORY_MAP[game.category] || game.category}
            </span>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
              {game.name}
            </h3>
          </div>
        </div>
        
        <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">
          {game.description}
        </p>

        <button 
          onClick={() => onPlay(game.id)}
          className="w-full py-2.5 px-4 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/25"
        >
          <Play className="w-4 h-4 fill-current" />
          立即游玩
        </button>
      </div>
    </div>
  );
};