import React, { useState } from 'react';
import { PerformanceDiagnostics } from '../types/game';
import { DeviceCapabilityDetector } from '../modules/performance/DeviceBenchmark';
import { X, Cpu, HardDrive, Monitor, Gauge, CheckCircle2, AlertTriangle, Play } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: PerformanceDiagnostics | null;
  onUpdateDiagnostics: (d: PerformanceDiagnostics) => void;
}

export const DeviceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  diagnostics,
  onUpdateDiagnostics,
}) => {
  const [isRunningBench, setIsRunningBench] = useState(false);
  const [benchResult, setBenchResult] = useState<{
    fps: number;
    frameTimeMs: number;
    recommendedPreset: 'LOW' | 'MEDIUM' | 'HIGH';
  } | null>(null);

  if (!isOpen || !diagnostics) return null;

  const handleRunBench = async () => {
    setIsRunningBench(true);
    try {
      const res = await DeviceCapabilityDetector.runBenchmark();
      setBenchResult(res);
      onUpdateDiagnostics({
        ...diagnostics,
        measuredFps: res.fps,
        measuredFrameTimeMs: res.frameTimeMs,
        recommendedPreset: res.recommendedPreset,
      });
    } finally {
      setIsRunningBench(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f111a] border border-[#23273a] rounded-2xl p-6 shadow-2xl text-slate-200 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-[#1c1f2e] mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Browser Hardware Detection</h2>
              <p className="text-xs text-slate-400">
                Direct client-side capabilities exposed via standard Web APIs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1d2d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-xl bg-[#141624] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Monitor className="w-4 h-4 text-cyan-400" />
              Graphics Engine
            </div>
            <div className="text-sm font-semibold text-slate-100 truncate">
              {diagnostics.webGlVersion}
            </div>
            <div className="text-[11px] text-slate-400 truncate mt-0.5" title={diagnostics.glRenderer}>
              {diagnostics.glRenderer}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141624] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Gauge className="w-4 h-4 text-violet-400" />
              WebGPU Acceleration
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              {diagnostics.webGpuSupported ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Available & Active</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">WebGL Fallback Mode</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Max Texture Size: {diagnostics.maxTextureSize}px
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141624] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Cpu className="w-4 h-4 text-indigo-400" />
              CPU Concurrency & Memory
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {diagnostics.hardwareConcurrency} Logical Cores
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {diagnostics.deviceMemoryGb ? `~${diagnostics.deviceMemoryGb} GB Device RAM` : 'RAM masked by browser security'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141624] border border-[#1e2235]">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Local Storage Quota
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {diagnostics.storageQuotaMb} MB Available
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {diagnostics.storageUsageMb} MB Used (IndexedDB & Cache)
            </div>
          </div>
        </div>

        {/* Benchmark section */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/40 to-cyan-950/30 border border-violet-500/20 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Real-Time Canvas & WebGL Benchmark
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Measures actual frame draw deltas to recommend optimal graphics settings
              </p>
            </div>
            <button
              onClick={handleRunBench}
              disabled={isRunningBench}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-all shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunningBench ? 'Benchmarking...' : 'Run Benchmark'}
            </button>
          </div>

          {benchResult && (
            <div className="mt-4 pt-3 border-t border-violet-500/20 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Observed FPS</div>
                <div className="text-base font-bold text-emerald-400">{benchResult.fps} FPS</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Frame Time</div>
                <div className="text-base font-bold text-cyan-400">{benchResult.frameTimeMs} ms</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase">Recommended Preset</div>
                <div className="text-base font-bold text-violet-400">{benchResult.recommendedPreset}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#1c1f2e] hover:bg-[#25293d] text-xs font-semibold text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
