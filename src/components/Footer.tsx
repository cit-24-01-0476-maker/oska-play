import React from 'react';
import { ShieldCheck, HardDrive, Cpu, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#06070a] border-t border-[#161824] py-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold text-white tracking-wider">OSKA PLAY</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-950/80 border border-violet-800/60 text-violet-300 font-mono">
                v1.0-PROD
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-3">
              PLAY BEYOND LIMITS. True client-side browser gaming executing on your own CPU and GPU.
              Zero cloud GPU streaming latency.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <Cpu className="w-3.5 h-3.5 text-violet-400" /> Client Hardware Accelerated
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Architecture
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> WebAssembly (WASM) / WebGL
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> Emscripten C/C++ Engine
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> IndexedDB IDBFS Save System
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Web Audio Synthesizer
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Source & Storage
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Google Drive 5TB Staging Hub
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Free-First Cloudflare Edge
              </li>
              <li className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-violet-400" /> Strict License Audits
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider mb-3">
              Compliance & DRM
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              OSKA PLAY strictly enforces lawful distribution. Commercial closed-source games are classified as
              Download-Only or Blocked Reference. No DRM circumvention or unauthorized software redistribution is
              performed.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-[#12141d] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} OSKA PLAY Engine. All game trademarks belong to their respective creators.
          </div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300">Class A / B / C / D Compatible</span>
            <span>•</span>
            <span className="hover:text-slate-300">Local Browser Computing</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
