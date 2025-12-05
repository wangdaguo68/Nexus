import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { GameCard } from './components/GameCard';
import { GAME_REGISTRY } from './games/registry';
import { Sparkles, Gamepad, Zap, Ghost, Lightbulb, Joystick } from 'lucide-react';

const App: React.FC = () => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const activeGame = activeGameId ? GAME_REGISTRY.find(g => g.id === activeGameId) : null;
  const ActiveComponent = activeGame ? activeGame.component : null;

  const creativeGames = GAME_REGISTRY.filter(g => g.collection === 'creative');
  const classicGames = GAME_REGISTRY.filter(g => g.collection === 'classic');

  return (
    <Layout 
      isGameActive={!!activeGameId} 
      onGoHome={() => setActiveGameId(null)}
    >
      {activeGameId && ActiveComponent ? (
        <ActiveComponent onExit={() => setActiveGameId(null)} />
      ) : (
        <div className="container mx-auto px-4 py-8">
          
          {/* Hero Section */}
          <div className="mb-12 text-center py-12 rounded-3xl bg-gradient-to-b from-indigo-900/20 to-transparent border border-indigo-500/10 relative overflow-hidden">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
             
             <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6 border border-indigo-500/20">
                  <Sparkles className="w-3 h-3" />
                  每周新增游戏
                </span>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">
                  欢迎来到 <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">Nexus</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                  打造次世代极简、高性能的游戏平台。
                  无需下载，在浏览器中即可畅玩精选休闲游戏。
                </p>
                
                <div className="flex justify-center gap-8 text-slate-500 text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>极速加载</span>
                  </div>
                   <div className="flex items-center gap-2">
                    <Gamepad className="w-4 h-4 text-indigo-400" />
                    <span>无需安装</span>
                  </div>
                </div>
             </div>
          </div>

          {/* Creative Games Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg">
                <Lightbulb size={18} className="text-white" />
              </span>
              创意实验室
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creativeGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={setActiveGameId} 
                />
              ))}
            </div>
          </div>

          {/* Classic Games Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="p-1.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Joystick size={18} className="text-white" />
              </span>
              经典街机
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {classicGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={setActiveGameId} 
                />
              ))}
              
              {/* Coming Soon Placeholders - Moved to Classic section */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center opacity-60 border-dashed min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <Gamepad className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-white font-semibold mb-1">太空侵略者</h3>
                <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">敬请期待</span>
              </div>
              
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center text-center opacity-60 border-dashed min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                   <Ghost className="w-6 h-6 text-slate-600" />
                </div>
                <h3 className="text-white font-semibold mb-1">吃豆人</h3>
                <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">敬请期待</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </Layout>
  );
};

export default App;