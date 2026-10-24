import React, { useState } from 'react';
import { Game } from '../types/game';
import { GameCard } from '../components/GameCard';
import { Play, Sparkles, Cpu, HardDrive, ShieldCheck, ArrowRight, Zap, Flame } from 'lucide-react';

interface HomePageProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onDetails: (game: Game) => void;
  onExploreLibrary: () => void;
  onOpenBenchmark: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  games,
  onPlay,
  onDetails,
  onExploreLibrary,
  onOpenBenchmark,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  const featuredGame = games.find((g) => g.id === 'freedoom-wasm') || games[0];
  const genres = ['All', 'Shooter', 'Action', 'Puzzle', 'Racing'];

  const filteredGames = selectedGenre === 'All'
    ? games
    : games.filter((g) => g.genre === selectedGenre);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative min-h-[540px] rounded-3xl overflow-hidden border border-[#23273a] bg-[#0c0e17] flex items-center shadow-2xl">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={featuredGame.bannerImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-30 filter blur-xs scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c14] via-[#0a0c14]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c14] via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-2xl p-8 sm:p-12 lg:p-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            True Client-Side Browser Gaming
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-4">
            PLAY BEYOND <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">
              ALL LIMITS.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Experience genuine PC games executing directly on your computer's CPU and GPU inside your web browser.
            Zero remote cloud gaming queues. Zero native installers. Pure WebAssembly performance.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => onPlay(featuredGame)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-violet-600/30 hover:shadow-violet-600/50 hover:scale-102 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Play Freedoom Now
            </button>

            <button
              onClick={() => onDetails(featuredGame)}
              className="px-5 py-3.5 rounded-xl bg-[#161826] hover:bg-[#1f2235] text-slate-200 border border-[#2a2e45] text-sm font-semibold transition-all"
            >
              View Game Specs
            </button>
          </div>

          {/* Quick Pillars */}
          <div className="grid grid-cols-3 gap-4 mt-10 pt-6 border-t border-white/10">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Local Computing
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Your RTX / Intel GPU</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-violet-400" /> 5TB G-Drive Hub
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Admin Staged Source</div>
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Legal
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">GPLv2 & MIT Audited</div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Play Highlights */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4" /> Real Playable Catalog
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Browser-Ready Games
            </h2>
          </div>

          {/* Genres filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGenre(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === g
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-[#12141f] text-slate-400 hover:text-white hover:bg-[#1a1d2c] border border-[#212538]'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlay}
              onDetails={onDetails}
            />
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={onExploreLibrary}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#141624] hover:bg-[#1d2033] border border-[#262b42] text-slate-200 text-xs font-semibold transition-all group"
          >
            Explore Complete Library & Native PC Downloads
            <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Technical Reality Section */}
      <section className="p-8 rounded-3xl bg-gradient-to-br from-[#10121d] via-[#121422] to-[#0d0f17] border border-[#23273b] shadow-xl">
        <div className="max-w-3xl mb-6">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Technical Reality & Architecture
          </span>
          <h3 className="text-2xl font-black text-white mt-1">
            How OSKA PLAY Executes Games Locally
          </h3>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Unlike cloud streaming services that broadcast compressed video from distant server farms,
            OSKA PLAY compiles C/C++ game engines into high-efficiency WebAssembly (WASM).
            The game code, physics, and rasterization run directly on your browser via your local hardware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#151827] border border-[#21263d]">
            <div className="text-xs font-mono text-emerald-400 font-bold mb-1">CLASS A</div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">Browser-Ready WASM</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full WebAssembly ports. Instant browser play, keyboard/gamepad inputs, and IndexedDB saves.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151827] border border-[#21263d]">
            <div className="text-xs font-mono text-blue-400 font-bold mb-1">CLASS C</div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">Native PC Downloads</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Windows x64 binaries with verified SHA-256 checksums and system requirements for desktop play.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#151827] border border-[#21263d]">
            <div className="text-xs font-mono text-rose-400 font-bold mb-1">CLASS D</div>
            <h4 className="text-sm font-bold text-slate-100 mb-1">Compliance Audited</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proprietary games without legal web distribution rights are blocked from execution to respect copyright.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
