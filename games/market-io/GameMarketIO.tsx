import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Users, MessageCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { playSound } from '../../utils/audio';

// --- Constants & Types ---
const GAME_DURATION = 180; // seconds
const INITIAL_CASH = 10000;
const INITIAL_PRICE = 100;
const TICK_RATE = 50; // ms per loop
const CANDLE_PERIOD = 2000; // ms per candle

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: number; // relative time index
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  type: 'bull' | 'bear' | 'neutral' | 'system';
  color: string;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const EMOJIS = {
  BULL: ['🚀', '💎', '🐂', '🔥', '📈'],
  BEAR: ['📉', '🐻', '🩸', '😭', '🥀'],
};

const BOT_NAMES = ['ElonMusk_Fan', 'DiamondHands', 'WallStBetz', 'PaperHands', 'HODLer', 'CryptoKing', 'NoobTrader', 'Whale_0x'];

const GameMarketIO: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  // --- State ---
  const [gameState, setGameState] = useState<'PLAYING' | 'GAME_OVER'>('PLAYING');
  const [cash, setCash] = useState(INITIAL_CASH);
  const [shares, setShares] = useState(0); // + for Long, - for Short
  const [avgPrice, setAvgPrice] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(INITIAL_PRICE);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [sentiment, setSentiment] = useState(0); // -100 to 100
  const [onlineUsers, setOnlineUsers] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Refs for loop
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    candles: [] as Candle[],
    currentCandle: { open: INITIAL_PRICE, high: INITIAL_PRICE, low: INITIAL_PRICE, close: INITIAL_PRICE, volume: 0, time: 0 } as Candle,
    price: INITIAL_PRICE,
    sentiment: 0, // Sync with state
    lastCandleTime: 0,
    startTime: Date.now(),
    emojis: [] as FloatingEmoji[],
  });
  const requestRef = useRef<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const formatMoney = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const getPL = () => {
    if (shares === 0) return 0;
    return (currentPrice - avgPrice) * shares;
  };
  const getPLPercent = () => {
    if (shares === 0 || avgPrice === 0) return 0;
    return ((currentPrice - avgPrice) / avgPrice) * (shares > 0 ? 1 : -1) * 100;
  };

  // --- Game Loop ---
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    
    // Seed initial candles for visuals
    const initialCandles: Candle[] = [];
    let p = INITIAL_PRICE;
    for(let i=0; i<30; i++) {
        const change = (Math.random() - 0.5) * 2;
        initialCandles.push({
            open: p,
            close: p + change,
            high: p + Math.max(0, change) + Math.random(),
            low: p + Math.min(0, change) - Math.random(),
            volume: Math.random() * 100,
            time: -30 + i
        });
        p += change;
    }
    stateRef.current.candles = initialCandles;
    stateRef.current.price = p;
    stateRef.current.currentCandle = { open: p, high: p, low: p, close: p, volume: 0, time: 0 };

    const loop = () => {
      const now = Date.now();
      const ref = stateRef.current;
      
      // 1. Logic Update
      
      // Sentiment Decay
      ref.sentiment *= 0.99; 
      
      // Random Bot Sentiment injection
      if (Math.random() < 0.05) {
          const change = (Math.random() - 0.5) * 10;
          ref.sentiment += change;
          // Bot Chat
          if (Math.abs(change) > 3) {
             const isBull = change > 0;
             addBotMessage(isBull);
             // Spawn bot emojis
             const emoji = isBull ? EMOJIS.BULL[Math.floor(Math.random()*EMOJIS.BULL.length)] : EMOJIS.BEAR[Math.floor(Math.random()*EMOJIS.BEAR.length)];
             spawnEmoji(emoji, Math.random() * window.innerWidth, window.innerHeight);
          }
      }

      // Price Movement
      // Volatility based on sentiment magnitude
      const volatility = 0.2 + (Math.abs(ref.sentiment) / 100) * 0.5;
      const sentimentBias = ref.sentiment * 0.005; 
      const noise = (Math.random() - 0.5) * volatility;
      
      let nextPrice = ref.price + noise + sentimentBias;
      nextPrice = Math.max(0.1, nextPrice); // No negative price

      ref.price = nextPrice;
      
      // Update Candle
      ref.currentCandle.close = nextPrice;
      ref.currentCandle.high = Math.max(ref.currentCandle.high, nextPrice);
      ref.currentCandle.low = Math.min(ref.currentCandle.low, nextPrice);
      ref.currentCandle.volume += Math.random() * 10 + Math.abs(ref.sentiment);

      // Push Candle
      if (now - ref.lastCandleTime > CANDLE_PERIOD) {
          ref.candles.push({ ...ref.currentCandle });
          if (ref.candles.length > 50) ref.candles.shift(); // Keep buffer size fixed
          
          ref.currentCandle = { 
              open: nextPrice, 
              high: nextPrice, 
              low: nextPrice, 
              close: nextPrice, 
              volume: 0, 
              time: ref.candles[ref.candles.length - 1].time + 1 
          };
          ref.lastCandleTime = now;
      }

      // Update Floating Emojis
      ref.emojis.forEach(e => {
          e.x += e.vx;
          e.y += e.vy;
          e.life -= 0.01;
      });
      ref.emojis = ref.emojis.filter(e => e.life > 0);

      // Sync React State for UI (throttled slightly visually, but here run every frame is ok for simple apps)
      setCurrentPrice(ref.price);
      setSentiment(ref.sentiment);
      
      // Timer
      const elapsed = (Date.now() - ref.startTime) / 1000;
      const newTimeLeft = Math.max(0, GAME_DURATION - elapsed);
      setTimeLeft(newTimeLeft);
      if (newTimeLeft <= 0) {
          setGameState('GAME_OVER');
          return; // Stop loop
      }

      // Fake Online Users fluctuation
      if (Math.random() < 0.01) {
          setOnlineUsers(prev => Math.max(1, prev + Math.floor((Math.random() - 0.5) * 5)));
      }

      // 2. Render Canvas
      if (ctx && canvasRef.current) {
          drawChart(ctx, canvasRef.current.width, canvasRef.current.height, ref.candles, ref.currentCandle);
          drawEmojis(ctx, ref.emojis);
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState]);

  // --- Rendering Functions ---

  const drawChart = (ctx: CanvasRenderingContext2D, width: number, height: number, candles: Candle[], current: Candle) => {
      ctx.clearRect(0, 0, width, height);
      
      const allCandles = [...candles, current];
      const minPrice = Math.min(...allCandles.map(c => c.low)) * 0.99;
      const maxPrice = Math.max(...allCandles.map(c => c.high)) * 1.01;
      const priceRange = maxPrice - minPrice;
      
      const candleWidth = width / 40;
      const padding = 50; // Right padding for price labels

      // Grid
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<5; i++) {
          const y = (height * i) / 5;
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Draw Candles
      allCandles.forEach((c, i) => {
          const x = width - ((allCandles.length - i) * candleWidth) - padding;
          if (x < -candleWidth) return;

          const isUp = c.close >= c.open;
          const color = isUp ? '#22c55e' : '#ef4444'; // Green / Red

          const yOpen = height - ((c.open - minPrice) / priceRange) * height;
          const yClose = height - ((c.close - minPrice) / priceRange) * height;
          const yHigh = height - ((c.high - minPrice) / priceRange) * height;
          const yLow = height - ((c.low - minPrice) / priceRange) * height;

          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          
          // Wick
          ctx.beginPath();
          ctx.moveTo(x + candleWidth/2, yHigh);
          ctx.lineTo(x + candleWidth/2, yLow);
          ctx.stroke();

          // Body
          ctx.fillStyle = color;
          const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));
          ctx.fillRect(x + 2, Math.min(yOpen, yClose), candleWidth - 4, bodyHeight);
      });

      // Current Price Line
      const yCurrent = height - ((current.close - minPrice) / priceRange) * height;
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, yCurrent);
      ctx.lineTo(width, yCurrent);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price Label
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width - 45, yCurrent - 10, 45, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(current.close.toFixed(2), width - 40, yCurrent + 4);
  };

  const drawEmojis = (ctx: CanvasRenderingContext2D, emojis: FloatingEmoji[]) => {
      ctx.font = '24px serif';
      emojis.forEach(e => {
          ctx.globalAlpha = e.life;
          ctx.fillText(e.emoji, e.x, e.y);
      });
      ctx.globalAlpha = 1;
  };

  const spawnEmoji = (emoji: string, x: number, y: number) => {
      stateRef.current.emojis.push({
          id: Math.random(),
          emoji,
          x,
          y,
          vx: (Math.random() - 0.5) * 2,
          vy: -2 - Math.random() * 3,
          life: 1.5
      });
  };

  // --- Chat Logic ---
  const addBotMessage = (isBull: boolean) => {
      const user = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      const bullMsgs = ['TO THE MOON! 🚀', 'BUY THE DIP!', 'Green candles only', 'LFG!!!', 'Shorts getting rekt'];
      const bearMsgs = ['It\'s over...', 'DUMP IT', 'Sell everything!', 'Bubble popping 📉', 'Rug pull incoming'];
      const text = isBull ? bullMsgs[Math.floor(Math.random()*bullMsgs.length)] : bearMsgs[Math.floor(Math.random()*bearMsgs.length)];
      
      setMessages(prev => [...prev.slice(-15), {
          id: Math.random(),
          user,
          text,
          type: isBull ? 'bull' : 'bear',
          color: isBull ? 'text-green-400' : 'text-red-400'
      }]);
  };

  useEffect(() => {
      if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages]);


  // --- User Actions ---
  const handleBuy = () => {
      if (cash < currentPrice) return;
      playSound('select');
      setAvgPrice(oldAvg => {
          const totalCost = oldAvg * shares + currentPrice;
          return totalCost / (shares + 1);
      });
      setShares(s => s + 1);
      setCash(c => c - currentPrice);
      spawnEmoji('💸', window.innerWidth/2, window.innerHeight/2);
  };

  const handleSell = () => {
      // Allow shorting? Let's say yes, but simplified. 
      // Actually let's just do Buy/Sell to close for simplicity, OR Long/Short buttons.
      // Let's implement Long/Short buttons.
      // If Long, Sell closes position. If Short, Buy closes position.
      // Simplified: "Buy" adds +1 share, "Sell" adds -1 share.
      
      playSound('select');
      
      // Calculate Avg Price impact if flipping position direction? Too complex for this toy.
      // Simplified P&L tracking:
      // If we are LONG (shares > 0), Selling reduces position.
      // If we are FLAT (shares == 0), Selling initiates SHORT.
      
      if (shares > 0) {
          // Closing long
           setCash(c => c + currentPrice);
      } else {
          // Opening short (requires margin? let's just deduct cash as collateral)
           if (cash < currentPrice) return; // No margin
           setCash(c => c + currentPrice); // Short selling gives cash immediately? No, keeps as collateral.
           // Simplified: Just track position count. Cash updates on Realized P&L?
           // Let's stick to: Cash is available balance.
           // Opening Short: Use cash as collateral.
      }
      
      // Let's redesign simplified trading:
      // Two buttons: [BUY / LONG] [SELL / SHORT]
      // Buying always +1 share. Selling always -1 share.
      
      setShares(s => {
          if (s === -1) {
              // Closing short, calculate P&L
              // Profit = Entry - Current
              // We need to track entry properly.
          }
          return s - 1;
      });
      
      // Re-doing simple logic:
      // You buy at Price. Cash decreases. Shares increase.
      // You sell at Price. Cash increases. Shares decrease.
      // Shorting means Shares goes negative. Cash increases (you got money from selling borrowed stock).
      // But you have unlimited risk.
      
      setCash(c => c + currentPrice);
      setShares(s => s - 1);
      
      // Fix Avg Price logic for Shorting is tricky in 10 lines.
      // Let's just use weighted average for position.
      if (shares <= 0) {
         // Adding to short position
          setAvgPrice(oldAvg => {
             const size = Math.abs(shares);
             return (oldAvg * size + currentPrice) / (size + 1);
          });
      }
      
      spawnEmoji('💸', window.innerWidth/2, window.innerHeight/2);
  };
  
  const handleEmoji = (emoji: string, isBull: boolean) => {
      playSound('shoot');
      stateRef.current.sentiment += isBull ? 5 : -5;
      spawnEmoji(emoji, Math.random() * window.innerWidth, window.innerHeight - 100);
      // Add user message
      setMessages(prev => [...prev.slice(-15), {
          id: Math.random(),
          user: 'YOU',
          text: emoji,
          type: isBull ? 'bull' : 'bear',
          color: 'text-white'
      }]);
  };

  const totalEquity = cash + (shares * currentPrice);
  const profit = totalEquity - INITIAL_CASH;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-200 overflow-hidden relative font-mono">
        
        {/* Top Bar: Status */}
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-800 z-10">
            <div className="flex gap-6">
                <div className={`flex flex-col ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1"><Clock size={10}/> Time Left</span>
                    <span className="text-2xl font-bold leading-none">{Math.floor(timeLeft)}s</span>
                </div>
                <div className="flex flex-col text-slate-400">
                    <span className="text-[10px] uppercase font-bold flex items-center gap-1"><Users size={10}/> Online</span>
                    <span className="text-2xl font-bold leading-none text-green-400">{234 + onlineUsers}</span>
                </div>
            </div>
            
            <div className="flex gap-8">
                <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Equity</span>
                    <span className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatMoney(totalEquity)}</span>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">P&L</span>
                    <span className={`text-xl font-bold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                    </span>
                </div>
            </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 relative flex">
            {/* Chart Container */}
            <div className="flex-1 relative bg-slate-950">
                 <canvas ref={canvasRef} className="w-full h-full block" width={window.innerWidth > 800 ? window.innerWidth - 300 : window.innerWidth} height={window.innerHeight - 200} />
                 
                 {/* Floating HUD */}
                 <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                     <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-xs">
                         <span className="text-slate-500 block">Current Price</span>
                         <span className="text-xl font-bold text-white">{currentPrice.toFixed(2)}</span>
                     </div>
                     <div className="bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded text-xs">
                         <span className="text-slate-500 block">Sentiment</span>
                         <div className="w-32 h-2 bg-slate-800 mt-1 rounded-full overflow-hidden relative">
                             <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white z-10"></div>
                             <div 
                                className={`h-full transition-all duration-300 ${sentiment > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                style={{
                                    width: `${Math.min(50, Math.abs(sentiment)/2)}%`,
                                    left: sentiment > 0 ? '50%' : `calc(50% - ${Math.min(50, Math.abs(sentiment)/2)}%)`
                                }} 
                             />
                         </div>
                     </div>
                 </div>
            </div>

            {/* Chat / Feed Sidebar */}
            <div className="w-64 border-l border-slate-800 bg-slate-900 flex flex-col hidden md:flex">
                <div className="p-2 border-b border-slate-800 font-bold text-xs text-slate-500 flex items-center gap-2">
                    <MessageCircle size={12}/> LIVE FEED
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
                    {messages.map((m) => (
                        <div key={m.id} className="animate-fade-in">
                            <span className="font-bold text-slate-400">{m.user}: </span>
                            <span className={m.color}>{m.text}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
        </div>

        {/* Bottom Controls */}
        <div className="h-24 bg-slate-900 border-t border-slate-800 p-2 flex items-center justify-between gap-4 z-20">
             
             {/* Position Info */}
             <div className="flex flex-col justify-center min-w-[100px]">
                 <div className="text-[10px] text-slate-500 uppercase font-bold">Position</div>
                 <div className={`text-xl font-bold ${shares > 0 ? 'text-green-400' : shares < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                     {shares > 0 ? `LONG ${shares}` : shares < 0 ? `SHORT ${Math.abs(shares)}` : 'FLAT'}
                 </div>
                 {shares !== 0 && (
                     <div className="text-xs text-slate-500">
                         Avg: {avgPrice.toFixed(2)} ({getPLPercent().toFixed(2)}%)
                     </div>
                 )}
             </div>

             {/* Trade Buttons */}
             <div className="flex gap-2 flex-1 max-w-md justify-center">
                 <button 
                    onClick={handleSell}
                    className="flex-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded flex flex-col items-center justify-center p-1 transition-all"
                 >
                     <div className="flex items-center gap-1"><ArrowDown size={16}/> SELL</div>
                     <span className="text-[10px] opacity-70">Short / Close</span>
                 </button>
                 <button 
                    onClick={handleBuy}
                    className="flex-1 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold rounded flex flex-col items-center justify-center p-1 transition-all"
                 >
                     <div className="flex items-center gap-1"><ArrowUp size={16}/> BUY</div>
                     <span className="text-[10px] opacity-70">Long / Close</span>
                 </button>
             </div>

             {/* Emoji Bar */}
             <div className="flex gap-2 overflow-x-auto p-1">
                 {EMOJIS.BEAR.map(e => (
                     <button key={e} onClick={() => handleEmoji(e, false)} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                 ))}
                 <div className="w-px bg-slate-700 mx-1"></div>
                 {EMOJIS.BULL.map(e => (
                     <button key={e} onClick={() => handleEmoji(e, true)} className="text-2xl hover:scale-125 transition-transform">{e}</button>
                 ))}
             </div>
        </div>

        {/* Game Over Modal */}
        {gameState === 'GAME_OVER' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
                    <h2 className="text-4xl font-extrabold text-white mb-2">市场收盘</h2>
                    <div className="text-6xl font-bold mb-6 font-mono">
                        {profit >= 0 ? '🤑' : '💸'}
                    </div>
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-400">初始资金</span>
                            <span>{formatMoney(INITIAL_CASH)}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                            <span className="text-slate-400">最终资产</span>
                            <span className="text-white font-bold">{formatMoney(totalEquity)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400">总收益</span>
                            <span className={`text-2xl font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {profit >= 0 ? '+' : ''}{formatMoney(profit)}
                            </span>
                        </div>
                    </div>
                    
                    <button onClick={onExit} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-indigo-500/25">
                        离开市场
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};

export default GameMarketIO;