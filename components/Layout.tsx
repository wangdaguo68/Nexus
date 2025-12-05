import React from 'react';
import { Gamepad2, Trophy, Ghost } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  isGameActive: boolean;
  onGoHome: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, isGameActive, onGoHome }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onGoHome}
          >
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Nexus<span className="text-indigo-500">Play</span>
            </h1>
          </div>
          
          <nav className="flex items-center gap-6">
            {!isGameActive && (
              <>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                  <Trophy className="w-4 h-4" />
                  排行榜
                </button>
                <div className="w-px h-4 bg-slate-700"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <Ghost className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </>
            )}
            {isGameActive && (
               <button 
               onClick={onGoHome}
               className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
             >
               退出游戏
             </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {children}
      </main>

      {/* Footer */}
      {!isGameActive && (
        <footer className="border-t border-slate-800 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Nexus 游戏平台。 基于 React & Tailwind 构建。</p>
          </div>
        </footer>
      )}
    </div>
  );
};