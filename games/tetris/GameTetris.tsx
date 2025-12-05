import React, { useEffect } from 'react';
import { useTetris } from '../../hooks/useTetris';
import { ArrowLeft, ArrowRight, ArrowDown, RotateCw, Pause, Play, RotateCcw } from 'lucide-react';
import { playSound } from '../../utils/audio';

const GameTetris: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { grid, piece, score, gameOver, isPaused, setIsPaused, move, rotate, drop, restart } = useTetris();
  
  // Previous score ref to detect score changes
  const prevScoreRef = React.useRef(0);

  useEffect(() => {
     if (score > prevScoreRef.current) {
        playSound('clear');
        prevScoreRef.current = score;
     }
  }, [score]);

  useEffect(() => {
      if (gameOver) playSound('lose');
  }, [gameOver]);

  const handleMove = (dir: -1 | 1) => {
      move(dir);
      playSound('move');
  };

  const handleRotate = () => {
      rotate();
      playSound('move'); // or a specific rotate sound
  };
  
  const handleDrop = () => {
      drop();
      playSound('move');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      switch (e.key) {
        case 'ArrowLeft': handleMove(-1); break;
        case 'ArrowRight': handleMove(1); break;
        case 'ArrowDown': handleDrop(); break;
        case 'ArrowUp': handleRotate(); break;
        case ' ': setIsPaused(p => !p); playSound('select'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, rotate, drop, gameOver, setIsPaused]);

  // Merge grid and active piece for rendering
  const renderGrid = grid.map(row => [...row]);
  if (!gameOver) {
    piece.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          const py = piece.y + y;
          const px = piece.x + x;
          if (py >= 0 && py < renderGrid.length && px >= 0 && px < renderGrid[0].length) {
            renderGrid[py][px] = piece.color;
          }
        }
      });
    });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-900">
      <div className="flex gap-8 items-start">
        {/* Game Board */}
        <div className="relative p-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
          <div className="bg-black/50 p-1 rounded-lg border-2 border-slate-600">
            <div className="grid grid-rows-[repeat(20,minmax(0,1fr))] grid-cols-[repeat(10,minmax(0,1fr))] gap-px bg-slate-900 w-[250px] h-[500px] sm:w-[300px] sm:h-[600px] shadow-inner">
              {renderGrid.map((row, y) =>
                row.map((color, x) => (
                  <div key={`${y}-${x}`} className={`w-full h-full transition-colors duration-100 ${color ? color : 'bg-slate-800/20'}`} />
                ))
              )}
            </div>
          </div>

          {/* Overlays */}
          {(gameOver || isPaused) && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
               <h3 className="text-3xl font-bold text-white mb-2">{gameOver ? '游戏结束' : '已暂停'}</h3>
               {gameOver && <p className="text-slate-300 mb-6 font-mono">得分: <span className="text-yellow-400">{score}</span></p>}
               <div className="flex gap-4">
                 <button onClick={() => { if(gameOver) restart(); else setIsPaused(false); playSound('select'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-500/25">
                     {gameOver ? '再来一局' : '继续游戏'}
                 </button>
                 <button onClick={onExit} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold">退出</button>
               </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="hidden md:flex flex-col gap-4 w-48">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">得分</h3>
            <p className="text-3xl font-mono font-bold text-yellow-400 tabular-nums">{score}</p>
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1 shadow-lg">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">操作指南</h3>
             <ul className="text-sm text-slate-300 space-y-4">
               <li className="flex items-center gap-3"><span className="bg-slate-700 p-1.5 rounded"><ArrowLeft size={14} /></span> 左移</li>
               <li className="flex items-center gap-3"><span className="bg-slate-700 p-1.5 rounded"><ArrowRight size={14} /></span> 右移</li>
               <li className="flex items-center gap-3"><span className="bg-slate-700 p-1.5 rounded"><ArrowDown size={14} /></span> 加速</li>
               <li className="flex items-center gap-3"><span className="bg-slate-700 p-1.5 rounded"><RotateCw size={14} /></span> 旋转</li>
               <li className="flex items-center gap-3"><span className="bg-slate-700 px-2 py-1 rounded text-xs font-bold">SPACE</span> 暂停</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden mt-6 w-full max-w-[300px] grid grid-cols-3 gap-3">
         <div className="col-start-2"><button className="w-16 h-16 bg-slate-800 rounded-2xl active:bg-slate-700 flex items-center justify-center shadow-lg border border-slate-700 text-white" onClick={handleRotate}><RotateCw size={24}/></button></div>
         <div className="col-start-1 row-start-2"><button className="w-16 h-16 bg-slate-800 rounded-2xl active:bg-slate-700 flex items-center justify-center shadow-lg border border-slate-700 text-white" onClick={() => handleMove(-1)}><ArrowLeft size={24}/></button></div>
         <div className="col-start-2 row-start-2"><button className="w-16 h-16 bg-slate-800 rounded-2xl active:bg-slate-700 flex items-center justify-center shadow-lg border border-slate-700 text-white" onClick={() => handleDrop()}><ArrowDown size={24}/></button></div>
         <div className="col-start-3 row-start-2"><button className="w-16 h-16 bg-slate-800 rounded-2xl active:bg-slate-700 flex items-center justify-center shadow-lg border border-slate-700 text-white" onClick={() => handleMove(1)}><ArrowRight size={24}/></button></div>
         
         <div className="col-start-1 row-start-3 mt-4"><button className="w-full h-12 bg-slate-800 rounded-xl active:bg-slate-700 flex items-center justify-center text-red-400 font-bold text-sm" onClick={onExit}>退出</button></div>
         <div className="col-start-2 row-start-3 mt-4"><button className="w-full h-12 bg-indigo-600 rounded-xl active:bg-indigo-500 flex items-center justify-center text-white" onClick={() => { restart(); playSound('select'); }}><RotateCcw /></button></div>
         <div className="col-start-3 row-start-3 mt-4"><button className="w-full h-12 bg-slate-800 rounded-xl active:bg-slate-700 flex items-center justify-center text-white" onClick={() => setIsPaused(!isPaused)}>{isPaused ? <Play /> : <Pause />}</button></div>
      </div>
    </div>
  );
};

export default GameTetris;