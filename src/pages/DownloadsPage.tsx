import React, { useState } from 'react';
import { Game } from '../types/game';
import { Download, ShieldCheck, FileCheck, CheckCircle2, Copy } from 'lucide-react';

interface DownloadsPageProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export const DownloadsPage: React.FC<DownloadsPageProps> = ({ games, onSelectGame }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const downloadableGames = games.filter((g) => g.downloadInfo && g.downloadInfo.available);

  const handleStartDownload = (game: Game) => {
    if (!game.downloadInfo) return;

    if (game.downloadInfo.directDownloadUrl) {
      window.open(game.downloadInfo.directDownloadUrl, '_blank');
      return;
    }

    setDownloadingId(game.id);
    setDownloadProgress(10);

    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setDownloadingId(null);
            setDownloadProgress(0);
            // Trigger sample verified payload download
            const blob = new Blob(
              [`[OSKA PLAY NATIVE BUILD ARCHIVE]\nGame: ${game.title}\nVersion: ${game.downloadInfo?.version}\nSHA-256: ${game.downloadInfo?.sha256Checksum}\nInstructions: ${game.downloadInfo?.installationInstructions}`],
              { type: 'text/plain' }
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = game.downloadInfo?.fileName || `${game.slug}-win64.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }, 500);
          return 100;
        }
        return prev + 30;
      });
    }, 200);
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="border-b border-[#1c1f2e] pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
          <Download className="w-4 h-4" /> Native PC Distributions
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">PC Downloads Hub</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Verified, legally distributable standalone Windows PC builds with cryptographic SHA-256 integrity checks.
        </p>
      </div>

      {/* Downloads Table */}
      <div className="space-y-4">
        {downloadableGames.map((game) => {
          const dl = game.downloadInfo!;
          const isDownloading = downloadingId === game.id;

          return (
            <div
              key={game.id}
              className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] hover:border-[#2a304a] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              <div className="flex items-start gap-4">
                <img
                  src={game.coverImage}
                  alt={game.title}
                  className="w-16 h-20 rounded-xl object-cover shrink-0 border border-white/10"
                />

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white hover:text-cyan-400 cursor-pointer" onClick={() => onSelectGame(game)}>
                      {game.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-950/60 border border-blue-800/40 text-blue-300">
                      v{dl.version}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 max-w-xl line-clamp-1">
                    {game.tagline}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="font-semibold text-slate-300">{dl.formattedSize}</span>
                    <span>•</span>
                    <span className="text-cyan-400">{dl.targetOS}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified Legal (GPLv2)
                    </span>
                  </div>

                  {/* SHA-256 Hash pill */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 pt-1">
                    <span className="text-slate-400">SHA-256:</span>
                    <span className="bg-[#161827] px-2 py-0.5 rounded-md border border-[#23283d] text-slate-300 truncate max-w-xs">
                      {dl.sha256Checksum}
                    </span>
                    <button
                      onClick={() => copyHash(dl.sha256Checksum)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy SHA-256 Checksum"
                    >
                      {copiedHash === dl.sha256Checksum ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Download Action */}
              <div className="w-full md:w-auto shrink-0 flex flex-col items-stretch md:items-end gap-2">
                {isDownloading ? (
                  <div className="w-48 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-cyan-400">
                      <span>Downloading...</span>
                      <span>{downloadProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1c2033] overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartDownload(game)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Standalone Build
                  </button>
                )}

                <span className="text-[10px] text-slate-400 text-center md:text-right">
                  Direct HTTP range request support
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compliance Policy Notice */}
      <div className="p-6 rounded-2xl bg-[#0f111a] border border-[#1e2235] text-xs text-slate-400 space-y-2">
        <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Strict Redistribution Compliance Policy
        </h4>
        <p className="leading-relaxed">
          OSKA PLAY provides direct native downloads only for games whose software licenses explicitly authorize
          unrestricted redistribution (e.g., GNU General Public License, MIT, BSD, or verified freeware agreements).
          Proprietary commercial game packages and DRM-protected software are strictly prohibited from public distribution.
        </p>
      </div>
    </div>
  );
};
