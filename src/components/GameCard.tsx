import React from 'react';
import { Game } from '../types/game';
import { CompatibilityBadge } from './CompatibilityBadge';
import { Play, Download, ShieldAlert, ChevronRight } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  onDetails: (game: Game) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, onDetails }) => {
  const isPlayable = game.status === 'PLAY_READY';
  const isDownloadOnly = game.status === 'DOWNLOAD_ONLY';
  const isBlocked = game.status === 'BLOCKED_LICENSE' || game.compatibilityClass === 'CLASS_D';

  return (
    <div className="group relative bg-[#10121d] border border-[#1e2235] hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-violet-950/30 flex flex-col">
      {/* Cover Artwork */}
      <div
        className="relative aspect-video w-full overflow-hidden cursor-pointer"
        onClick={() => onDetails(game)}
      >
        <img
          src={game.coverImage}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#10121d] via-[#10121d]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <CompatibilityBadge compatibilityClass={game.compatibilityClass} status={game.status} />
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
            {game.genre}
          </span>
        </div>

        {/* Play Overlay Icon */}
        {isPlayable && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
            <div className="w-14 h-14 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-lg shadow-violet-600/50 transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3
              onClick={() => onDetails(game)}
              className="text-base font-bold text-slate-100 hover:text-cyan-400 cursor-pointer transition-colors line-clamp-1"
            >
              {game.title}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {game.releaseYear}
            </span>
          </div>

          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {game.tagline}
          </p>
        </div>

        {/* Footer info & CTA */}
        <div className="pt-3 border-t border-[#181a28] flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 truncate">
            {game.developer}
          </div>

          <div className="flex items-center gap-1.5">
            {isPlayable && (
              <button
                onClick={() => onPlay(game)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Play Now
              </button>
            )}

            {isDownloadOnly && (
              <button
                onClick={() => onDetails(game)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            )}

            {isBlocked && (
              <button
                onClick={() => onDetails(game)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#181a26] text-rose-400 border border-rose-500/20 text-xs font-medium hover:bg-[#202232] transition-all"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Audit Info
              </button>
            )}

            <button
              onClick={() => onDetails(game)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c1f2e] transition-colors"
              title="View full specs & licensing details"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
