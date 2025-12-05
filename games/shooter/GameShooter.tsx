import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Trophy, Zap, Shield, Target } from 'lucide-react';
import { playSound } from '../../utils/audio';

const GameShooter: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hp, setHp] = useState(100);
  const [weaponLevel, setWeaponLevel] = useState(1);
  const [showHint, setShowHint] = useState(true);

  // Game configuration
  const CONFIG = {
    playerSpeed: 6,
    bulletSpeed: 8,
    enemySpeed: 2,
    spawnRate: 60,
  };

  useEffect(() => {
    const hideHint = () => setShowHint(false);
    window.addEventListener('keydown', hideHint);
    window.addEventListener('touchstart', hideHint);
    return () => {
        window.removeEventListener('keydown', hideHint);
        window.removeEventListener('touchstart', hideHint);
    };
  }, []);

  // Update weapon level based on score
  useEffect(() => {
    if (score > 1500 && weaponLevel < 3) {
        setWeaponLevel(3);
        playSound('powerup');
    } else if (score > 500 && weaponLevel < 2) {
        setWeaponLevel(2);
        playSound('powerup');
    }
  }, [score, weaponLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setSize = () => {
        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = Math.min(600, parent.clientWidth);
            canvas.height = Math.min(800, window.innerHeight - 150);
        }
    };
    setSize();
    window.addEventListener('resize', setSize);

    let animationFrameId: number;
    let frames = 0;
    let isActive = true;

    const player = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      width: 44,
      height: 44,
      color: '#6366f1',
    };

    let bullets: {x: number, y: number, width: number, height: number, color: string, markedForDeletion: boolean}[] = [];
    let enemies: {x: number, y: number, width: number, height: number, color: string, markedForDeletion: boolean, hp: number, type: number}[] = [];
    let particles: {x: number, y: number, vx: number, vy: number, life: number, color: string}[] = [];
    let stars: {x: number, y: number, size: number, speed: number}[] = [];

    // Initialize stars
    for(let i=0; i<50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: 0.5 + Math.random() * 2
        });
    }

    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => keys[e.key] = true;
    const handleKeyUp = (e: KeyboardEvent) => keys[e.key] = false;
    
    let touchX: number | null = null;
    const handleTouchMove = (e: TouchEvent) => {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        touchX = touch.clientX - rect.left;
    };
    const handleTouchEnd = () => touchX = null;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchmove', handleTouchMove, {passive: false});
    canvas.addEventListener('touchend', handleTouchEnd);

    const loop = () => {
      if (!isActive) return;
      
      // Clear with trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Stars
      ctx.fillStyle = '#ffffff';
      stars.forEach(star => {
          star.y += star.speed;
          if(star.y > canvas.height) {
              star.y = 0;
              star.x = Math.random() * canvas.width;
          }
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Player Movement
      if (keys['ArrowLeft']) player.x -= CONFIG.playerSpeed;
      if (keys['ArrowRight']) player.x += CONFIG.playerSpeed;
      if (touchX !== null) {
          const diff = touchX - player.x;
          if (Math.abs(diff) > CONFIG.playerSpeed) {
              player.x += Math.sign(diff) * CONFIG.playerSpeed;
          }
      }
      player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));

      // Draw Player
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#818cf8';
      ctx.fillStyle = player.color;
      // Futuristic Fighter Shape
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 25);
      ctx.lineTo(player.x - 22, player.y + 15);
      ctx.lineTo(player.x - 10, player.y + 10);
      ctx.lineTo(player.x - 15, player.y + 25);
      ctx.lineTo(player.x, player.y + 15);
      ctx.lineTo(player.x + 15, player.y + 25);
      ctx.lineTo(player.x + 10, player.y + 10);
      ctx.lineTo(player.x + 22, player.y + 15);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Engine Thruster
      ctx.fillStyle = `rgba(56, 189, 248, ${0.5 + Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(player.x - 8, player.y + 20);
      ctx.lineTo(player.x, player.y + 35 + Math.random() * 10);
      ctx.lineTo(player.x + 8, player.y + 20);
      ctx.fill();

      // Shooting Logic
      // We need to access the current weapon level, but we can't use the state inside the loop easily without refs
      // For simplicity in this structure, we'll pass weaponLevel via a closure if possible, or assume it updates
      // Since this effect runs once, we'll read a mutable ref or check score
      let currentLevel = 1;
      setScore(s => { currentLevel = s > 1500 ? 3 : s > 500 ? 2 : 1; return s; });

      if (frames % 12 === 0) {
          playSound('shoot');
          const bulletProps = { width: 4, height: 12, color: '#facc15', markedForDeletion: false };
          
          bullets.push({ ...bulletProps, x: player.x, y: player.y - 25 });
          
          if (currentLevel >= 2) {
              bullets.push({ ...bulletProps, x: player.x - 12, y: player.y - 15 });
              bullets.push({ ...bulletProps, x: player.x + 12, y: player.y - 15 });
          }
          if (currentLevel >= 3) {
             bullets.push({ ...bulletProps, x: player.x - 24, y: player.y - 5 });
             bullets.push({ ...bulletProps, x: player.x + 24, y: player.y - 5 });
          }
      }

      // Bullets
      bullets.forEach(b => {
          b.y -= CONFIG.bulletSpeed;
          if (b.y < 0) b.markedForDeletion = true;
          ctx.fillStyle = b.color;
          ctx.shadowBlur = 5;
          ctx.shadowColor = b.color;
          ctx.fillRect(b.x - b.width/2, b.y, b.width, b.height);
          ctx.shadowBlur = 0;
      });

      // Enemies
      if (frames % Math.max(20, CONFIG.spawnRate - Math.floor(frames/500)) === 0) {
          const size = 30 + Math.random() * 20;
          const type = Math.random() > 0.8 ? 2 : 1; // Type 2 is tankier
          enemies.push({
              x: Math.random() * (canvas.width - size) + size/2,
              y: -size,
              width: size,
              height: size,
              color: type === 2 ? '#c026d3' : '#ef4444', 
              markedForDeletion: false,
              hp: Math.floor(size / 10) * type,
              type
          });
      }

      enemies.forEach(e => {
          e.y += CONFIG.enemySpeed + (frames / 3000);
          
          if (e.y > canvas.height) {
              e.markedForDeletion = true;
              setHp(h => {
                  if (h - 10 <= 0) playSound('lose');
                  return Math.max(0, h - 10);
              });
          }

          // Player Hit
          const dist = Math.hypot(player.x - e.x, player.y - e.y);
          if (dist < (player.width + e.width)/2) {
              e.markedForDeletion = true;
              setHp(h => {
                  if (h - 20 <= 0) playSound('lose');
                  return Math.max(0, h - 20);
              });
              playSound('explosion');
              createParticles(e.x, e.y, e.color, 15);
          }

          // Bullet Hit
          bullets.forEach(b => {
             if (!b.markedForDeletion && 
                 Math.abs(b.x - e.x) < e.width/2 + b.width/2 && 
                 Math.abs(b.y - e.y) < e.height/2 + b.height/2) {
                 
                 b.markedForDeletion = true;
                 e.hp--;
                 createParticles(b.x, b.y, '#fff', 2);
                 
                 if (e.hp <= 0) {
                     e.markedForDeletion = true;
                     setScore(s => s + (e.type === 2 ? 200 : 100));
                     playSound('explosion');
                     createParticles(e.x, e.y, e.color, 10);
                 } 
             }
          });

          // Draw Enemy
          ctx.save();
          ctx.translate(e.x, e.y);
          ctx.rotate(frames * 0.02);
          ctx.fillStyle = e.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = e.color;
          if (e.type === 2) {
             ctx.fillRect(-e.width/2, -e.height/2, e.width, e.height);
          } else {
             ctx.beginPath();
             ctx.moveTo(0, -e.height/2);
             ctx.lineTo(e.width/2, e.height/2);
             ctx.lineTo(-e.width/2, e.height/2);
             ctx.fill();
          }
          ctx.restore();
      });

      // Particles
      particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, 3, 3);
          ctx.globalAlpha = 1;
      });
      particles = particles.filter(p => p.life > 0);

      bullets = bullets.filter(b => !b.markedForDeletion);
      enemies = enemies.filter(e => !e.markedForDeletion);

      frames++;
      animationFrameId = requestAnimationFrame(loop);
    };

    const createParticles = (x: number, y: number, color: string, count: number) => {
        for(let i=0; i<count; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color
            });
        }
    };

    loop();

    return () => {
        isActive = false;
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', setSize);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (hp <= 0 && !gameOver) {
        setGameOver(true);
        playSound('lose');
    }
  }, [hp]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-900 overflow-hidden relative">
      
      {/* Cockpit HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
         {/* Score Panel */}
         <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/50 p-3 rounded-tr-xl rounded-bl-xl shadow-[0_0_15px_rgba(99,102,241,0.3)]">
             <div className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <Target size={12} /> 积分系统
             </div>
             <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {score.toString().padStart(6, '0')}
             </div>
         </div>

         {/* Weapon Status */}
         <div className="flex flex-col gap-2 items-end">
             <div className="bg-slate-900/80 backdrop-blur border border-indigo-500/50 p-2 rounded-tl-xl rounded-br-xl flex items-center gap-3">
                <Zap className={`w-5 h-5 ${weaponLevel >= 2 ? 'text-yellow-400 animate-pulse' : 'text-slate-600'}`} />
                <div className="flex gap-1">
                   {[1, 2, 3].map(l => (
                       <div key={l} className={`w-2 h-4 rounded-sm ${l <= weaponLevel ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-slate-700'}`} />
                   ))}
                </div>
             </div>
             <div className="bg-slate-900/80 backdrop-blur border border-red-500/50 p-2 rounded-tl-xl rounded-br-xl w-48">
                 <div className="flex justify-between text-xs text-red-300 mb-1 font-bold">
                    <span className="flex items-center gap-1"><Shield size={12}/> 护盾完整度</span>
                    <span>{Math.round(hp)}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full transition-all duration-300 ${hp > 50 ? 'bg-cyan-400' : hp > 20 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} 
                        style={{ width: `${hp}%` }} 
                    />
                 </div>
             </div>
         </div>
      </div>

      {/* Main Game Area */}
      <div className="relative w-full h-full flex items-center justify-center">
         <canvas 
            ref={canvasRef} 
            className="w-full h-full max-w-[600px] max-h-[800px] bg-slate-950 shadow-2xl cursor-none touch-none border-x-2 border-indigo-500/10"
         />
         
         {/* Vignette & Scanlines Overlay for retro feel */}
         <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
         <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/20"></div>

         {/* Game Over */}
         {gameOver && (
             <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                 <div className="bg-slate-900 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center max-w-sm mx-4">
                     <h2 className="text-4xl font-extrabold text-red-500 mb-2 tracking-tighter">系统瘫痪</h2>
                     <p className="text-slate-400 mb-6">最终战绩: <span className="text-white font-mono text-xl">{score}</span></p>
                     <div className="flex flex-col gap-3">
                         <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25">
                            重启系统
                         </button>
                         <button onClick={onExit} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg font-bold transition-colors">
                            放弃任务
                         </button>
                     </div>
                 </div>
             </div>
         )}
         
         {/* Hint */}
         {!gameOver && showHint && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="bg-black/50 backdrop-blur px-6 py-3 rounded-full text-cyan-300 border border-cyan-500/30 text-sm font-mono animate-pulse">
                     &lt; 滑动 / 按键以移动 &gt;
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};

export default GameShooter;