import React, { useEffect } from 'react';
import { useMinesweeper, Difficulty } from '../../hooks/useMinesweeper';
import { Flag, Bomb, Smile, Frown, RotateCcw, Settings } from 'lucide-react';
import { playSound } from '../../utils/audio';

const GameMinesweeper: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { board, reveal, toggleFlag, gameOver, won, restart, mineCount, difficulty, setDifficulty } = useMinesweeper();

  useEffect(() => {
    restart();
  }, []);

  useEffect(() => {
      if (won) playSound('win');
  }, [won]);

  const handleReveal = (x: number, y: number) => {
      const result = reveal(x, y);
      if (result === 'mine') playSound('explosion');
      else if (result === 'safe') playSound('move');
  };

  const handleFlag = (e: React.MouseEvent, x: number, y: number) => {
      toggleFlag(e, x, y);
      playSound('select');
  };

  const getCellColor = (count: number) => {
    switch (count) {
      case 1: return 'text-cyan-400';
      case 2: return 'text-green-400';
      case 3: return 'text-red-400';
      case 4: return 'text-purple-400';
      case 5: return 'text-orange-400';
      case 6: return 'text-pink-400';
      default: return 'text-gray-300';
    }
  };

  const remainingFlags = mineCount - board.flat().filter(c => c.isFlagged).length;
  
  const difficulties: {label: string, value: Difficulty}[] = [
      { label: '初级', value: 'Beginner' },
      { label: '中级', value: 'Intermediate' },
      { label: '高级', value: 'Advanced' },
      { label: '专家', value: 'Expert' },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-900">
      
      {/* Header / Stats */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-slate-700 shadow-lg">
            
            {/* Difficulty Selector */}
            <div className="flex bg-slate-900 rounded-lg p-1 gap-1">
                {difficulties.map(d => (
                    <button
                        key={d.value}
                        onClick={() => { setDifficulty(d.value); playSound('select'); }}
                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${difficulty === d.value ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        {d.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-6 items-center">
                 <div className="text-center">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">剩余地雷</span>
                    <span className={`text-2xl font-mono font-bold ${remainingFlags < 0 ? 'text-red-500' : 'text-cyan-400'}`}>
                        {remainingFlags.toString().padStart(3, '0')}
                    </span>
                </div>
                
                <button 
                    onClick={() => { restart(); playSound('select'); }} 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg ${gameOver ? 'bg-red-500/20 text-red-500 ring-2 ring-red-500' : won ? 'bg-green-500/20 text-green-500 ring-2 ring-green-500' : 'bg-slate-700 text-white hover:bg-indigo-600'}`}
                >
                    {gameOver ? <Frown size={24} /> : won ? <Smile size={24} /> : <RotateCcw size={20} />}
                </button>
            </div>
        </div>
      </div>

      {/* Board */}
      <div className="relative p-3 bg-slate-800 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-slate-700/50">
        <div 
            className="grid gap-[2px] bg-slate-900/50"
            style={{ 
                gridTemplateColumns: `repeat(${board[0]?.length || 9}, 1fr)` 
            }}
        >
           {board.map((row, y) => 
              row.map((cell, x) => (
                <div 
                   key={`${y}-${x}`}
                   onClick={() => handleReveal(x, y)}
                   onContextMenu={(e) => handleFlag(e, x, y)}
                   className={`
                     w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-lg font-bold cursor-pointer select-none transition-all rounded-sm
                     ${cell.isOpen 
                        ? 'bg-slate-900/80 shadow-inner' 
                        : 'bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]'}
                     ${cell.isOpen && cell.isMine ? 'bg-red-900/80 !shadow-[inset_0_0_10px_rgba(255,0,0,0.5)]' : ''}
                   `}
                >
                   {cell.isOpen ? (
                      cell.isMine ? <Bomb size={16} className="text-red-500 animate-bounce" /> : cell.count > 0 ? <span className={getCellColor(cell.count)}>{cell.count}</span> : null
                   ) : (
                      cell.isFlagged ? <Flag size={14} className="text-yellow-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" /> : null
                   )}
                </div>
              ))
           )}
        </div>
      </div>

      {/* Result Overlay */}
      {(gameOver || won) && (
          <div className="mt-8 text-center animate-fade-in bg-slate-800/90 p-6 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-sm z-10 max-w-sm w-full mx-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <h2 className={`text-4xl font-extrabold mb-2 ${won ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600' : 'text-red-500'}`}>
                  {won ? '任务完成' : '行动失败'}
              </h2>
              <p className="text-slate-400 mb-6">{won ? '区域已安全，干得好指挥官。' : '检测到爆炸信号，连接中断。'}</p>
              <div className="flex flex-col gap-3">
                  <button onClick={() => { restart(); playSound('select'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/25 transition-transform active:scale-95">
                    再次部署
                  </button>
                  <button onClick={onExit} className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-3 rounded-lg font-bold transition-colors">
                    返回基地
                  </button>
              </div>
          </div>
      )}
      
      {!gameOver && !won && (
         <p className="mt-6 text-slate-500 text-xs font-mono opacity-60">TACTICAL_VIEW // ROW: {board.length} COL: {board[0]?.length} // MINES: {mineCount}</p>
      )}

    </div>
  );
};

export default GameMinesweeper;