import React from 'react';
import { Gamepad2, Compass, Download, Bookmark, Cpu, ShieldAlert, Zap } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  deviceGpuText: string;
  onOpenBenchmark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  deviceGpuText,
  onOpenBenchmark,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090d]/90 border-b border-[#1c1f2e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onSelectTab('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-all">
            <div className="w-full h-full bg-[#0d0e15] rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-400">
                OSKA
              </span>
              <span className="text-xl font-extrabold tracking-wider text-violet-400">
                PLAY
              </span>
            </div>
            <p className="text-[9px] tracking-widest text-slate-400 font-semibold uppercase -mt-1">
              PLAY BEYOND LIMITS
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[#12141e]/80 border border-[#232738] rounded-full p-1">
          <button
            onClick={() => onSelectTab('home')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'home'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1a1d2d]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onSelectTab('library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'library'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1a1d2d]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Games
          </button>
          <button
            onClick={() => onSelectTab('downloads')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'downloads'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1a1d2d]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            PC Downloads
          </button>
          <button
            onClick={() => onSelectTab('my-library')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'my-library'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1a1d2d]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            My Saves
          </button>
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'profile'
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-300 hover:text-white hover:bg-[#1a1d2d]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Hardware
          </button>
          <button
            onClick={() => onSelectTab('boost')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentTab === 'boost'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30'
                : 'text-amber-400 hover:text-amber-300 hover:bg-[#1a1d2d]'
            }`}
            title="100% Game Booster & Hardware Optimization"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
            Boost 100%
          </button>
          <button
            onClick={() => onSelectTab('admin')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              currentTab === 'admin'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-cyan-400/90 hover:text-cyan-300 hover:bg-[#1a1d2d]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            Admin & Drive
          </button>
        </nav>

        {/* Quick Hardware Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenBenchmark}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141624] border border-[#2a2f47] hover:border-violet-500/50 transition-all text-left"
            title="Click to run browser capability detection & benchmark"
          >
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="hidden sm:block">
              <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                Local Engine
              </div>
              <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                {deviceGpuText}
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
