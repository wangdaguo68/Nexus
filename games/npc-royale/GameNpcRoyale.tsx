import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Skull, Target, AlertTriangle, Play, RotateCcw } from 'lucide-react';
import { playSound } from '../../utils/audio';

// Game Constants
const ENTITY_COUNT = 80;
const BOT_COUNT = 6;
const MAP_SIZE = 1200;
const VIEWPORT_SIZE = 600; // Will be responsive
const PLAYER_SPEED = 2;
const SPRINT_SPEED = 4.5;
const NPC_SPEED = 1.8;
const ATTACK_RANGE = 40;
const ATTACK_COOLDOWN = 60; // Frames

interface Entity {
  id: number;
  type: 'PLAYER' | 'NPC' | 'BOT';
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  color: string;
  dead: boolean;
  deadTimer: number; // For fading out
  behaviorTimer: number; // For bots to change behavior
  sprinting: boolean;
}

const GameNpcRoyale: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'VICTORY' | 'DEFEAT'>('START');
  const [suspicion, setSuspicion] = useState(0);
  const [targetsLeft, setTargetsLeft] = useState(BOT_COUNT);
  const [message, setMessage] = useState<string>('');
  const [canAttack, setCanAttack] = useState(true);

  // Refs for game loop to avoid re-renders
  const entitiesRef = useRef<Entity[]>([]);
  const playerRef = useRef<Entity | null>(null);
  const camRef = useRef({ x: 0, y: 0 });
  const keysRef = useRef<Record<string, boolean>>({});
  const attackCooldownRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const suspicionRef = useRef(0); // Mutable ref for loop updates

  // --- Core Logic ---

  const initGame = () => {
    const entities: Entity[] = [];
    
    // Create Player
    const player: Entity = {
      id: 0,
      type: 'PLAYER',
      x: MAP_SIZE / 2,
      y: MAP_SIZE / 2,
      vx: 0,
      vy: 0,
      color: '#ffffff', // Will render special, but base color white
      dead: false,
      deadTimer: 0,
      behaviorTimer: 0,
      sprinting: false
    };
    entities.push(player);
    playerRef.current = player;

    // Create Bots (Targets)
    for (let i = 0; i < BOT_COUNT; i++) {
      entities.push(createEntity(i + 1, 'BOT'));
    }

    // Create NPCs
    for (let i = 0; i < ENTITY_COUNT - BOT_COUNT - 1; i++) {
      entities.push(createEntity(i + 100, 'NPC'));
    }

    entitiesRef.current = entities;
    suspicionRef.current = 0;
    setSuspicion(0);
    setTargetsLeft(BOT_COUNT);
    setGameState('PLAYING');
    setMessage('');
    attackCooldownRef.current = 0;
  };

  const createEntity = (id: number, type: 'NPC' | 'BOT'): Entity => {
    return {
      id,
      type,
      x: Math.random() * MAP_SIZE,
      y: Math.random() * MAP_SIZE,
      vx: 0,
      vy: 0,
      targetX: Math.random() * MAP_SIZE,
      targetY: Math.random() * MAP_SIZE,
      color: '#94a3b8', // Slate 400
      dead: false,
      deadTimer: 0,
      behaviorTimer: Math.random() * 200,
      sprinting: false
    };
  };

  // --- Game Loop ---

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      if (gameState !== 'PLAYING') {
         // Just render static if paused/ended, or keep animating background?
         // Let's keep animating slightly
      }

      const player = playerRef.current;
      if (!player) return;

      // 1. Update Player
      if (gameState === 'PLAYING' && !player.dead) {
        let speed = PLAYER_SPEED;
        player.sprinting = false;

        // Sprint logic
        if (keysRef.current['Shift']) {
          speed = SPRINT_SPEED;
          player.sprinting = true;
          suspicionRef.current = Math.min(100, suspicionRef.current + 0.5); // Sprinting raises suspicion fast
        } else {
          suspicionRef.current = Math.max(0, suspicionRef.current - 0.1); // Decay
        }

        player.vx = 0;
        player.vy = 0;
        if (keysRef.current['ArrowUp'] || keysRef.current['w']) player.vy = -speed;
        if (keysRef.current['ArrowDown'] || keysRef.current['s']) player.vy = speed;
        if (keysRef.current['ArrowLeft'] || keysRef.current['a']) player.vx = -speed;
        if (keysRef.current['ArrowRight'] || keysRef.current['d']) player.vx = speed;

        // Normalize vector
        if (player.vx !== 0 && player.vy !== 0) {
          const factor = speed / Math.sqrt(player.vx * player.vx + player.vy * player.vy);
          player.vx *= factor;
          player.vy *= factor;
        }

        player.x += player.vx;
        player.y += player.vy;

        // Boundary check
        player.x = Math.max(0, Math.min(MAP_SIZE, player.x));
        player.y = Math.max(0, Math.min(MAP_SIZE, player.y));

        // Attack Logic
        if (attackCooldownRef.current > 0) attackCooldownRef.current--;
        setCanAttack(attackCooldownRef.current === 0);

        if (keysRef.current[' '] && attackCooldownRef.current === 0) {
           handleAttack();
        }
      }

      // Update Suspicion State
      if (suspicionRef.current >= 100 && gameState === 'PLAYING') {
         handlePlayerExposed();
      }
      setSuspicion(suspicionRef.current);

      // 2. Update Entities (AI)
      entitiesRef.current.forEach(entity => {
        if (entity.type === 'PLAYER' || entity.dead) return;

        // Behavior Logic
        entity.behaviorTimer--;
        
        // NPC Simple Logic
        if (entity.type === 'NPC') {
           if (entity.behaviorTimer <= 0 || hasReachedTarget(entity)) {
              entity.targetX = Math.random() * MAP_SIZE;
              entity.targetY = Math.random() * MAP_SIZE;
              entity.behaviorTimer = 200 + Math.random() * 300;
              // NPCs stop occasionally
              if (Math.random() < 0.3) {
                 entity.targetX = entity.x;
                 entity.targetY = entity.y;
              }
           }
           moveEntityTowardsTarget(entity, NPC_SPEED);
        }

        // Bot Advanced Logic (The "Imitation")
        if (entity.type === 'BOT') {
           // Bots react to high suspicion by looking at player or running
           if (suspicionRef.current > 70 && !player.dead) {
              const distToPlayer = Math.hypot(player.x - entity.x, player.y - entity.y);
              if (distToPlayer < 300) {
                 // Run away or chase? Let's make them hunt if exposed!
                 entity.targetX = player.x;
                 entity.targetY = player.y;
              }
           }

           if (entity.behaviorTimer <= 0 || hasReachedTarget(entity)) {
              // Bots change direction more often and more abruptly
              entity.targetX = Math.random() * MAP_SIZE;
              entity.targetY = Math.random() * MAP_SIZE;
              entity.behaviorTimer = 50 + Math.random() * 150; 
              
              // Randomly "sprint" briefly to mimic a player
              entity.sprinting = Math.random() < 0.1;
           }

           const speed = entity.sprinting ? SPRINT_SPEED : NPC_SPEED;
           moveEntityTowardsTarget(entity, speed);
        }
      });

      // 3. Render
      render(ctx);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    const hasReachedTarget = (e: Entity) => {
       if (e.targetX === undefined || e.targetY === undefined) return true;
       const dist = Math.hypot(e.targetX - e.x, e.targetY - e.y);
       return dist < 5;
    };

    const moveEntityTowardsTarget = (e: Entity, speed: number) => {
       if (e.targetX === undefined || e.targetY === undefined) return;
       const dx = e.targetX - e.x;
       const dy = e.targetY - e.y;
       const dist = Math.hypot(dx, dy);
       
       if (dist > 1) {
         e.vx = (dx / dist) * speed;
         e.vy = (dy / dist) * speed;
         e.x += e.vx;
         e.y += e.vy;
       } else {
         e.vx = 0;
         e.vy = 0;
       }
       
       // Map bounds
       e.x = Math.max(0, Math.min(MAP_SIZE, e.x));
       e.y = Math.max(0, Math.min(MAP_SIZE, e.y));
    };

    const handleAttack = () => {
      attackCooldownRef.current = ATTACK_COOLDOWN;
      const player = playerRef.current;
      if (!player) return;

      playSound('shoot'); // Whoosh sound

      // Find closest entity
      let closest: Entity | null = null;
      let minDst = ATTACK_RANGE;

      entitiesRef.current.forEach(e => {
        if (e.type === 'PLAYER' || e.dead) return;
        const dist = Math.hypot(e.x - player.x, e.y - player.y);
        if (dist < minDst) {
          minDst = dist;
          closest = e;
        }
      });

      if (closest) {
        const target = closest as Entity;
        target.dead = true;
        
        if (target.type === 'BOT') {
           // Correct Kill
           playSound('win'); // Satisfying sound
           setTargetsLeft(prev => {
             const left = prev - 1;
             if (left === 0) handleVictory();
             return left;
           });
           setMessage('目标确认！击杀成功');
           // Lower suspicion slightly on success
           suspicionRef.current = Math.max(0, suspicionRef.current - 20);
        } else {
           // Wrong Kill (Civilian)
           playSound('lose'); // Alarm sound
           suspicionRef.current = 100; // Instantly exposed
           setMessage('误杀平民！位置暴露！');
        }
      } else {
        // Missed swing - suspicious!
        suspicionRef.current += 15;
      }
    };

    const handlePlayerExposed = () => {
       setMessage('你暴露了！所有杀手正在接近！');
       // In a real game, bots would shoot. Here, let's say if you stay exposed too long, you die.
       // For this simple version, 100% suspicion acts as "Game Over" timer basically
       // But let's make bots chase player
    };
    
    // Check if player is caught by a Bot when exposed
    if (suspicionRef.current >= 100) {
       entitiesRef.current.forEach(e => {
          if (e.type === 'BOT' && !e.dead && playerRef.current) {
             const dist = Math.hypot(e.x - playerRef.current.x, e.y - playerRef.current.y);
             if (dist < 30) {
                handleDefeat();
             }
          }
       });
    }

    const handleVictory = () => {
       setGameState('VICTORY');
       playSound('win');
    };

    const handleDefeat = () => {
       if (gameState === 'DEFEAT') return;
       setGameState('DEFEAT');
       if (playerRef.current) playerRef.current.dead = true;
       playSound('lose');
    };

    // --- Rendering ---
    const render = (ctx: CanvasRenderingContext2D) => {
       const player = playerRef.current;
       if (!player) return;

       // Camera Follow
       // Smooth lerp camera
       camRef.current.x += (player.x - camRef.current.x) * 0.1;
       camRef.current.y += (player.y - camRef.current.y) * 0.1;

       ctx.fillStyle = '#0f172a'; // BG
       ctx.fillRect(0, 0, canvas.width, canvas.height);

       ctx.save();
       ctx.translate(canvas.width / 2 - camRef.current.x, canvas.height / 2 - camRef.current.y);

       // Draw Map Grid
       ctx.strokeStyle = '#1e293b';
       ctx.lineWidth = 2;
       ctx.beginPath();
       for(let x=0; x<=MAP_SIZE; x+=100) { ctx.moveTo(x, 0); ctx.lineTo(x, MAP_SIZE); }
       for(let y=0; y<=MAP_SIZE; y+=100) { ctx.moveTo(0, y); ctx.lineTo(MAP_SIZE, y); }
       ctx.stroke();

       // Draw Attack Radius (Indicator when cooldown ready)
       if (!player.dead) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, ATTACK_RANGE, 0, Math.PI * 2);
        ctx.fillStyle = canAttack ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 0, 0, 0.05)';
        ctx.fill();
        ctx.strokeStyle = canAttack ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)';
        ctx.stroke();
       }

       // Draw Entities
       // Sort by Y for simple depth effect
       entitiesRef.current.sort((a, b) => a.y - b.y);

       entitiesRef.current.forEach(e => {
          if (e.dead) {
             ctx.fillStyle = '#334155'; // Dead color
             ctx.beginPath();
             ctx.arc(e.x, e.y, 8, 0, Math.PI * 2);
             ctx.fill();
             // X mark
             ctx.strokeStyle = '#ef4444';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(e.x - 4, e.y - 4); ctx.lineTo(e.x + 4, e.y + 4);
             ctx.moveTo(e.x + 4, e.y - 4); ctx.lineTo(e.x - 4, e.y + 4);
             ctx.stroke();
             return;
          }

          // Body
          ctx.fillStyle = e.type === 'PLAYER' ? '#f8fafc' : '#94a3b8'; // Player is white, NPCs grey
          if (e.type === 'BOT' && (gameState === 'VICTORY' || gameState === 'DEFEAT')) {
             ctx.fillStyle = '#ef4444'; // Reveal bots at end
          }
          if (e.type === 'BOT' && suspicionRef.current >= 100) {
             ctx.fillStyle = '#ef4444'; // Reveal bots when exposed
          }

          ctx.beginPath();
          ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
          ctx.fill();

          // Direction Indicator (Eyes)
          const angle = Math.atan2(e.vy, e.vx);
          const eyeX = e.x + Math.cos(angle) * 6;
          const eyeY = e.y + Math.sin(angle) * 6;
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
          ctx.fill();

          // Player highlight (Only for user)
          if (e.type === 'PLAYER') {
             ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
             ctx.stroke();
          }
       });

       ctx.restore();
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState]);


  // Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Resize handler
    const resize = () => {
        if(canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
            canvasRef.current.height = window.innerHeight - 150;
        }
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
      if (gameState === 'START') initGame();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-900 overflow-hidden relative">
       
       {/* HUD */}
       <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
          
          {/* Suspicion Meter */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl w-64">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-300">
                   {suspicion < 50 ? <Eye size={18}/> : <AlertTriangle size={18} className="text-yellow-400"/>}
                   暴露指数
                </div>
                <span className={`font-mono font-bold ${suspicion > 80 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    {Math.round(suspicion)}%
                </span>
             </div>
             <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                   className={`h-full transition-all duration-200 ${suspicion > 80 ? 'bg-red-500' : suspicion > 50 ? 'bg-yellow-500' : 'bg-indigo-500'}`} 
                   style={{width: `${suspicion}%`}}
                />
             </div>
          </div>

          {/* Targets Left */}
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-xl">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                   <Skull className="text-red-500" size={24} />
                </div>
                <div>
                   <p className="text-[10px] text-slate-400 uppercase font-bold">剩余目标</p>
                   <p className="text-2xl font-bold text-white tabular-nums">{targetsLeft}</p>
                </div>
             </div>
          </div>
       </div>

       {/* Message Toast */}
       {message && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 animate-bounce">
             <div className="bg-black/60 backdrop-blur px-6 py-2 rounded-full border border-white/10 text-white font-bold text-sm shadow-xl">
                {message}
             </div>
          </div>
       )}

       {/* Game Canvas */}
       <div className="relative w-full h-full flex items-center justify-center">
          <canvas 
             ref={canvasRef} 
             className="bg-slate-950 shadow-2xl cursor-none"
             style={{ width: '100%', height: 'calc(100vh - 150px)' }}
          />
          
          {/* Overlay Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.8)_100%)]"></div>

          {/* Start Screen */}
          {gameState === 'START' && (
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-30">
                <div className="text-center max-w-md p-8">
                   <h2 className="text-5xl font-extrabold text-white mb-6">我就在人群中</h2>
                   <div className="space-y-4 text-slate-300 text-sm mb-8 text-left bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                      <p className="flex items-center gap-2"><Target size={16} className="text-red-400"/> 找出并消灭 {BOT_COUNT} 个异常的杀手 Bot</p>
                      <p className="flex items-center gap-2"><EyeOff size={16} className="text-indigo-400"/> 混入人群，模仿 NPC 移动，不要暴露</p>
                      <p className="flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400"/> 奔跑 (Shift) 或 攻击空处 会增加暴露值</p>
                      <p className="flex items-center gap-2"><span className="border border-slate-600 px-1 rounded text-xs">WASD</span> 移动 <span className="border border-slate-600 px-1 rounded text-xs">SPACE</span> 攻击</p>
                   </div>
                   <button onClick={() => setGameState('PLAYING')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/25 transition-all hover:scale-105">
                      开始潜入
                   </button>
                </div>
             </div>
          )}

          {/* End Screen */}
          {(gameState === 'VICTORY' || gameState === 'DEFEAT') && (
             <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-30 animate-fade-in">
                <div className="text-center">
                   <h2 className={`text-6xl font-extrabold mb-4 ${gameState === 'VICTORY' ? 'text-green-500' : 'text-red-500'}`}>
                      {gameState === 'VICTORY' ? '任务完成' : '行动失败'}
                   </h2>
                   <p className="text-xl text-slate-400 mb-8">
                      {gameState === 'VICTORY' ? '所有目标已被清除。你就是幽灵。' : '你的伪装被识破了。'}
                   </p>
                   <div className="flex gap-4 justify-center">
                      <button onClick={initGame} className="flex items-center gap-2 bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors">
                         <RotateCcw size={20}/> 再试一次
                      </button>
                      <button onClick={onExit} className="px-8 py-3 rounded-full font-bold text-slate-400 hover:text-white transition-colors">
                         退出
                      </button>
                   </div>
                </div>
             </div>
          )}
       </div>

    </div>
  );
};

export default GameNpcRoyale;