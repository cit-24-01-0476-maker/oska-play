import React from 'react';
import { Game } from '../types/game';
import { CompatibilityBadge } from '../components/CompatibilityBadge';
import {
  Play,
  Download,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Cpu,
  Monitor,
  HardDrive,
  Gamepad2,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';

interface GameDetailsPageProps {
  game: Game;
  onPlay: (game: Game) => void;
  onBack: () => void;
  onDownload: (game: Game) => void;
}

export const GameDetailsPage: React.FC<GameDetailsPageProps> = ({
  game,
  onPlay,
  onBack,
  onDownload,
}) => {
  const isPlayable = game.status === 'PLAY_READY';
  const hasDownload = game.downloadInfo?.available;
  const isBlocked = game.status === 'BLOCKED_LICENSE' || game.compatibilityClass === 'CLASS_D';

  return (
    <div className="space-y-10 pb-20">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#12141f] border border-[#212538] hover:bg-[#1a1d2c] text-xs font-semibold text-slate-300 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Library
      </button>

      {/* Hero Banner Header */}
      <div className="relative rounded-3xl overflow-hidden border border-[#23273b] bg-[#0c0e18]">
        {/* Banner Image */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={game.bannerImage}
            alt={game.title}
            className="w-full h-full object-cover filter blur-xs opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e18] via-[#0c0e18]/80 to-transparent" />
        </div>

        {/* Floating Content Bar */}
        <div className="relative z-10 px-6 sm:px-10 pb-8 -mt-24 sm:-mt-28 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
            {/* Cover Thumbnail */}
            <div className="w-36 sm:w-44 aspect-3/4 rounded-2xl overflow-hidden border-2 border-violet-500/40 shadow-2xl bg-black shrink-0">
              <img
                src={game.coverImage}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <CompatibilityBadge compatibilityClass={game.compatibilityClass} status={game.status} showDetails />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-950/60 text-violet-300 border border-violet-800/40">
                  {game.genre}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {game.title}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                By <span className="text-slate-200 font-semibold">{game.developer}</span> • Released in {game.releaseYear} • Version {game.version}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {isPlayable && (
              <button
                onClick={() => onPlay(game)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-violet-600/30 transition-all hover:scale-102"
              >
                <Play className="w-4 h-4 fill-current" />
                PLAY IN BROWSER
              </button>
            )}

            {hasDownload && (
              <button
                onClick={() => {
                  if (game.downloadInfo?.directDownloadUrl) {
                    window.open(game.downloadInfo.directDownloadUrl, '_blank');
                  } else {
                    onDownload(game);
                  }
                }}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-102"
              >
                <Download className="w-4 h-4" />
                DOWNLOAD FOR PC ({game.downloadInfo?.formattedSize})
              </button>
            )}

            {isBlocked && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Commercial Proprietary (Distribution Blocked)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Description, Specs, Controls, License */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Overview, Controls, Screenshots */}
        <div className="lg:col-span-2 space-y-8">
          {/* About / Description */}
          <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider mb-3">
              About The Game
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {game.description}
            </p>
          </div>

          {/* Controls Guide */}
          <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Gamepad2 className="w-4 h-4 text-violet-400" />
              Game Controls & Mapping
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(game.controls).map(([action, key]) => (
                <div
                  key={action}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#151726] border border-[#21263d]"
                >
                  <span className="text-xs text-slate-300 font-medium">{action}</span>
                  <kbd className="px-2.5 py-1 rounded-md bg-[#22273d] text-cyan-300 font-mono text-xs border border-cyan-500/20 shadow-xs">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Verified License Audit */}
          <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1f2e] pb-3">
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Verified Legal & License Audit
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                game.license.licenseVerificationStatus === 'VERIFIED_LEGAL'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}>
                {game.license.licenseVerificationStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Source Code License:</span>
                <span className="font-mono text-slate-200 font-semibold">{game.license.sourceCodeLicense}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Asset License:</span>
                <span className="font-mono text-slate-200 font-semibold">{game.license.assetLicense}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Copyright Owner:</span>
                <span className="text-slate-200">{game.license.copyrightOwner}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Browser Redistribution:</span>
                <span className={game.license.browserDistributionPermitted ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {game.license.browserDistributionPermitted ? 'Authorized & Lawful' : 'Prohibited / Blocked'}
                </span>
              </div>
            </div>

            {game.license.requiredAttribution && (
              <div className="p-3 rounded-xl bg-[#141624] text-xs text-slate-400 border border-[#202438]">
                <span className="font-semibold text-slate-300">Attribution Notice: </span>
                {game.license.requiredAttribution}
              </div>
            )}

            {game.license.licenseNotes && (
              <p className="text-xs text-slate-400 leading-relaxed italic">
                Note: {game.license.licenseNotes}
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Runtime Config & System Requirements */}
        <div className="space-y-6">
          {/* Runtime Configuration */}
          {game.runtimeConfig && (
            <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-4">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Browser Runtime Architecture
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#1b1e2e]">
                  <span className="text-slate-400">Runtime Engine</span>
                  <span className="font-mono text-violet-400 font-semibold uppercase">{game.runtimeConfig.runtimeType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1b1e2e]">
                  <span className="text-slate-400">Internal Framebuffer</span>
                  <span className="font-mono text-slate-200">{game.runtimeConfig.canvasWidth}x{game.runtimeConfig.canvasHeight} ({game.runtimeConfig.aspectRatio})</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1b1e2e]">
                  <span className="text-slate-400">Target Frame Rate</span>
                  <span className="font-mono text-emerald-400 font-bold">{game.runtimeConfig.targetFps} FPS</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1b1e2e]">
                  <span className="text-slate-400">Save Persistence</span>
                  <span className="text-slate-200">{game.runtimeConfig.saveSupported ? 'IndexedDB IDBFS' : 'Not Supported'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#1b1e2e]">
                  <span className="text-slate-400">Gamepad API</span>
                  <span className="text-slate-200">{game.runtimeConfig.gamepadSupported ? 'Supported' : 'No'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Execution Model</span>
                  <span className="text-cyan-400 font-semibold">100% Client-Side</span>
                </div>
              </div>
            </div>
          )}

          {/* System Requirements */}
          <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-4 h-4 text-violet-400" />
              Hardware & Browser Requirements
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              {game.requirements.browserRequirements && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Browser Compatibility:</span>
                  <span>{game.requirements.browserRequirements}</span>
                </div>
              )}
              {game.requirements.cpu && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Processor:</span>
                  <span>{game.requirements.cpu}</span>
                </div>
              )}
              {game.requirements.memory && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Memory:</span>
                  <span>{game.requirements.memory}</span>
                </div>
              )}
              {game.requirements.storage && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Storage Quota:</span>
                  <span>{game.requirements.storage}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
