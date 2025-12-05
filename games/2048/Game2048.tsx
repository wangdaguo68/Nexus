import React, { useEffect } from 'react';
import { use2048 } from '../../hooks/use2048';
import { RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface Game2048Props {
  onExit: () => void;
}

const TILE_COLORS: Record<number, string> = {
  0: 'bg-slate-800/40',
  2: 'bg-slate-200 text-slate-800',
  4: 'bg-orange-100 text-slate-800',
  8: 'bg-orange-200 text-slate-800',
  16: 'bg-orange-300 text-white',
  32: 'bg-orange-400 text-white',
  64: 'bg-orange-500 text-white',
  128: 'bg-orange-600 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]',
  256: 'bg-yellow-400 text-white shadow-[0_0_15px_rgba(250,204,21,0.5)]',
  512: 'bg-yellow-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.6)]',
  1024: 'bg-yellow-600 text-white shadow-[0_0_25px_rgba(202,138,4,0.7)]',
  2048: 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.9)] ring-2 ring-indigo-400',
};

const Game2048: React.FC<Game2048Props> = ({ onExit }) => {
  const { state, move, restart } = use2048();

  // Sound effects
  const prevGridRef = React.useRef(JSON.stringify(state.grid));
  useEffect(() => {
      const currentStr = JSON.stringify(state.grid);
      if (currentStr !== prevGridRef.current) {
          playSound('move');
          prevGridRef.current = currentStr;
      }
      if (state.won && !state.gameOver) playSound('win');
      if (state.gameOver) playSound('lose');
  }, [state.grid, state.won, state.gameOver]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); move('UP'); break;
        case 'ArrowDown': e.preventDefault(); move('DOWN'); break;
        case 'ArrowLeft': e.preventDefault(); move('LEFT'); break;
        case 'ArrowRight': e.preventDefault(); move('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  const getFontSize = (num: number) => {
    if (num < 100) return 'text-3xl sm:text-4xl';
    if (num < 1000) return 'text-2xl sm:text-3xl';
    return 'text-xl sm:text-2xl';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-900">
      
      {/* Game Header */}
      <div className="w-full max-w-md flex justify-between items-end mb-6">
        <div>
          <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500 mb-1">2048</h2>
          <p className="text-slate-400 text-sm">合并方块，挑战极限！</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-800/80 backdrop-blur p-3 rounded-lg border border-slate-700 min-w-[80px] text-center shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">得分</span>
            <span className="text-xl font-bold text-white tabular-nums">{state.score}</span>
          </div>
          <div className="bg-slate-800/80 backdrop-blur p-3 rounded-lg border border-slate-700 min-w-[80px] text-center shadow-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">最高分</span>
            <span className="text-xl font-bold text-white tabular-nums">{state.bestScore}</span>
          </div>
        </div>
      </div>

      {/* Game Board container with controls */}
      <div className="relative group">
        
        {/* The Grid */}
        <div className="bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-700 w-[320px] h-[320px] sm:w-[400px] sm:h-[400px]">
          <div className="grid grid-cols-4 gap-3 w-full h-full bg-slate-900/50 p-1 rounded-lg">
            {state.grid.map((row, rIndex) => (
              row.map((val, cIndex) => (
                <div 
                  key={`${rIndex}-${cIndex}`} 
                  className={`rounded-lg flex items-center justify-center font-bold transition-all duration-150 transform ${TILE_COLORS[val] || 'bg-indigo-900'} ${val > 0 ? 'scale-100 shadow-md' : 'scale-100'}`}
                >
                  <span className={`${getFontSize(val)}`}>
                    {val > 0 ? val : ''}
                  </span>
                </div>
              ))
            ))}
          </div>
        </div>

        {/* Game Over / Won Overlay */}
        {(state.gameOver || (state.won && !state.gameOver)) && (
          <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10 animate-fade-in border border-slate-700">
             <h3 className={`text-4xl font-extrabold mb-2 ${state.gameOver ? 'text-slate-200' : 'text-yellow-400'}`}>
               {state.gameOver ? '游戏结束' : '你赢了！'}
             </h3>
             <p className="text-slate-400 mb-6 font-medium">
               {state.gameOver ? '无法继续移动' : '2048 达成！'}
             </p>
             <div className="flex gap-4">
                <button 
                  onClick={onExit}
                  className="px-6 py-2 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 transition-colors"
                >
                  退出
                </button>
                <button 
                  onClick={() => { restart(); playSound('select'); }}
                  className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 transition-transform active:scale-95"
                >
                  再来一局
                </button>
             </div>
          </div>
        )}

      </div>

      {/* Controls / Footer Actions */}
      <div className="w-full max-w-md mt-8 flex justify-between items-center">
        <button 
          onClick={() => { restart(); playSound('select'); }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="font-medium text-sm">重置</span>
        </button>

        {/* Mobile D-Pad (only visible on small screens strictly if we wanted, but keeping minimal for now) */}
        <div className="hidden sm:flex text-slate-500 text-sm items-center gap-2">
            <span className="text-xs mr-2">使用方向键控制:</span>
            <div className="p-1 bg-slate-800 rounded"><ArrowUp className="w-4 h-4" /></div>
            <div className="p-1 bg-slate-800 rounded"><ArrowLeft className="w-4 h-4" /></div>
            <div className="p-1 bg-slate-800 rounded"><ArrowDown className="w-4 h-4" /></div>
            <div className="p-1 bg-slate-800 rounded"><ArrowRight className="w-4 h-4" /></div>
        </div>
      </div>
      
    </div>
  );
};

export default Game2048;