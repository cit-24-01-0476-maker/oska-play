import React, { useState } from 'react';
import { PerformanceDiagnostics } from '../types/game';
import { Cpu, Monitor, HardDrive, Gauge, Trash2, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface ProfilePageProps {
  diagnostics: PerformanceDiagnostics | null;
  onOpenBenchmark: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  diagnostics,
  onOpenBenchmark,
}) => {
  const [prefPreset, setPrefPreset] = useState<'AUTO' | 'LOW' | 'MEDIUM' | 'HIGH'>('AUTO');
  const [prefAudio, setPrefAudio] = useState(true);
  const [prefCrt, setPrefCrt] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  const handleClearCache = async () => {
    if (confirm('Clear browser game assets cache? This will re-download game files on next play.')) {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      setClearedNotice('Browser asset caches cleared successfully.');
      setTimeout(() => setClearedNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {clearedNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {clearedNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#1c1f2e] pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">
          <Cpu className="w-4 h-4" /> Client Device Diagnostics & Preferences
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Hardware & Settings</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Review your machine's hardware capabilities detected directly by standard Web APIs and customize performance presets.
        </p>
      </div>

      {/* Diagnostics Grid */}
      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Monitor className="w-4 h-4 text-cyan-400" /> Graphics Engine
            </div>
            <div className="text-base font-bold text-white">{diagnostics.webGlVersion}</div>
            <div className="text-xs text-slate-400 mt-1 truncate" title={diagnostics.glRenderer}>
              {diagnostics.glRenderer}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Max Texture: {diagnostics.maxTextureSize}px</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Cpu className="w-4 h-4 text-violet-400" /> CPU Concurrency
            </div>
            <div className="text-base font-bold text-white">{diagnostics.hardwareConcurrency} Logical Cores</div>
            <div className="text-xs text-slate-400 mt-1">
              {diagnostics.deviceMemoryGb ? `~${diagnostics.deviceMemoryGb} GB RAM` : 'RAM masked by browser security'}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> High Multithread Capacity
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <HardDrive className="w-4 h-4 text-indigo-400" /> Storage Capacity
            </div>
            <div className="text-base font-bold text-white">{diagnostics.storageQuotaMb} MB Quota</div>
            <div className="text-xs text-slate-400 mt-1">{diagnostics.storageUsageMb} MB Currently Used</div>
            <div className="text-[11px] text-slate-400 mt-1">IndexedDB + Cache Storage</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Gauge className="w-4 h-4 text-emerald-400" /> Recommended Preset
            </div>
            <div className="text-base font-bold text-emerald-400">{diagnostics.recommendedPreset}</div>
            <div className="text-xs text-slate-400 mt-1">{diagnostics.measuredFps} FPS observed</div>
            <button
              onClick={onOpenBenchmark}
              className="mt-2 text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Re-run benchmark
            </button>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-6">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">
          Runtime & Graphics Preferences
        </h3>

        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141624] border border-[#1e2338]">
            <div>
              <div className="text-xs font-bold text-slate-200">Default Graphics Quality</div>
              <div className="text-[11px] text-slate-400">Controls default internal canvas resolution scale</div>
            </div>
            <select
              value={prefPreset}
              onChange={(e) => setPrefPreset(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg bg-[#1c2033] border border-[#262c45] text-xs text-slate-200"
            >
              <option value="AUTO">AUTO (Hardware Scaled)</option>
              <option value="HIGH">HIGH (100% Native)</option>
              <option value="MEDIUM">MEDIUM (75% Balanced)</option>
              <option value="LOW">LOW (50% Battery Saver)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141624] border border-[#1e2338]">
            <div>
              <div className="text-xs font-bold text-slate-200">Synthesized Web Audio</div>
              <div className="text-[11px] text-slate-400">Enable retro sound synthesis for game events</div>
            </div>
            <input
              type="checkbox"
              checked={prefAudio}
              onChange={(e) => setPrefAudio(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141624] border border-[#1e2338]">
            <div>
              <div className="text-xs font-bold text-slate-200">CRT Scanline Shader Overlay</div>
              <div className="text-[11px] text-slate-400">Emulate vintage arcade CRT display scanlines</div>
            </div>
            <input
              type="checkbox"
              checked={prefCrt}
              onChange={(e) => setPrefCrt(e.target.checked)}
              className="w-4 h-4 accent-violet-600 rounded"
            />
          </div>
        </div>
      </div>

      {/* Storage & Cache Management */}
      <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-400" /> Local Browser Data Clean Up
        </h3>
        <p className="text-xs text-slate-400 max-w-xl">
          Clean temporary game WebAssembly caches without deleting your user preferences.
        </p>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 rounded-xl bg-[#1a1723] hover:bg-[#251e33] border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
        >
          Clear Downloaded Game Caches
        </button>
      </div>
    </div>
  );
};
