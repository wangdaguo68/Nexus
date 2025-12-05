import React, { useEffect } from 'react';
import { useSnake } from '../../hooks/useSnake';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Pause, Play, Zap } from 'lucide-react';
import { playSound } from '../../utils/audio';

const GameSnake: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { snake, food, changeDirection, gameOver, score, restart, isPaused, setIsPaused, gridSize } = useSnake();

  // Handle sounds
  useEffect(() => {
     if (score > 0) playSound('powerup');
  }, [score]);

  useEffect(() => {
     if (gameOver) playSound('lose');
  }, [gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Sound feedback for keys
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
         // playSound('move'); // Maybe too noisy
      }
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); changeDirection('UP'); break;
        case 'ArrowDown': e.preventDefault(); changeDirection('DOWN'); break;
        case 'ArrowLeft': e.preventDefault(); changeDirection('LEFT'); break;
        case 'ArrowRight': e.preventDefault(); changeDirection('RIGHT'); break;
        case ' ': e.preventDefault(); setIsPaused(p => !p); playSound('select'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeDirection, setIsPaused]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 bg-slate-900">
      
      <div className="w-full max-w-md flex justify-between items-center mb-6">
        <div>
           <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 mb-1 drop-shadow-sm">霓虹贪吃蛇</h2>
           <p className="text-slate-400 text-xs">CYBER_SNAKE_V1.0</p>
        </div>
        <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
          <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-widest">SCORE</span>
          <span className="text-2xl font-mono text-green-400 font-bold tabular-nums">{score}</span>
        </div>
      </div>

      <div className="relative p-2 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div 
          className="relative overflow-hidden rounded-lg bg-slate-900"
          style={{ 
            width: 'min(90vw, 400px)', 
            height: 'min(90vw, 400px)',
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
          }}
        >
          {/* Grid Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-10" 
               style={{ 
                   backgroundImage: `
                     linear-gradient(to right, #334155 1px, transparent 1px),
                     linear-gradient(to bottom, #334155 1px, transparent 1px)
                   `, 
                   backgroundSize: `${100/gridSize.cols}% ${100/gridSize.rows}%` 
               }}>
          </div>

          {/* Render Snake */}
          {snake.map((seg, i) => (
             <div 
               key={`${seg.x}-${seg.y}-${i}`}
               className={`${i === 0 ? 'bg-green-400 z-10 shadow-[0_0_15px_rgba(74,222,128,0.8)]' : 'bg-green-600/90 shadow-[0_0_5px_rgba(22,163,74,0.5)]'} rounded-sm transition-all duration-75`}
               style={{ gridColumn: seg.x + 1, gridRow: seg.y + 1 }}
             >
                {i === 0 && (
                  <div className="w-full h-full flex items-center justify-center gap-[2px]">
                     <div className="w-1 h-1 bg-black rounded-full opacity-60"></div>
                     <div className="w-1 h-1 bg-black rounded-full opacity-60"></div>
                  </div>
                )}
             </div>
          ))}

          {/* Render Food */}
          <div 
            className="bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse flex items-center justify-center"
            style={{ gridColumn: food.x + 1, gridRow: food.y + 1 }}
          >
              <div className="w-[60%] h-[60%] bg-red-300 rounded-full animate-ping opacity-75"></div>
          </div>

        </div>

        {/* Overlay */}
        {(gameOver || isPaused) && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-20">
              <h3 className={`text-4xl font-extrabold mb-2 ${gameOver ? 'text-red-500' : 'text-white'}`}>
                  {gameOver ? '系统崩溃' : '系统暂停'}
              </h3>
              {gameOver && <p className="text-slate-300 mb-6 font-mono">最终数据: <span className="text-green-400">{score}</span></p>}
              <div className="flex gap-4">
                <button onClick={() => { if(gameOver) restart(); else setIsPaused(false); playSound('select'); }} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-500/25">
                   {gameOver ? <RotateCcw size={18}/> : <Play size={18}/>}
                   {gameOver ? '重启' : '继续'}
                </button>
                <button onClick={onExit} className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold">退出</button>
              </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-8 grid grid-cols-3 gap-3 w-[200px]">
         <div className="col-start-2"><button className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-green-600 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700" onClick={() => {changeDirection('UP'); playSound('move');}}><ArrowUp /></button></div>
         <div className="col-start-1 row-start-2"><button className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-green-600 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700" onClick={() => {changeDirection('LEFT'); playSound('move');}}><ArrowLeft /></button></div>
         <div className="col-start-2 row-start-2"><button className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-green-600 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700" onClick={() => {changeDirection('DOWN'); playSound('move');}}><ArrowDown /></button></div>
         <div className="col-start-3 row-start-2"><button className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:bg-green-600 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-lg border border-slate-700" onClick={() => {changeDirection('RIGHT'); playSound('move');}}><ArrowRight /></button></div>
      </div>

    </div>
  );
};

export default GameSnake;