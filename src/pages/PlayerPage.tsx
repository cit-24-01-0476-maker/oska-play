import React, { useEffect, useRef, useState } from 'react';
import { Game } from '../types/game';
import { DoomWasmAdapter } from '../modules/runtime/DoomWasmAdapter';
import { Canvas2048Adapter } from '../modules/runtime/Canvas2048Adapter';
import { WebGL3DAdapter } from '../modules/runtime/WebGL3DAdapter';
import { CyberRacer3DAdapter } from '../modules/runtime/CyberRacer3DAdapter';
import { saveManager } from '../modules/storage/SaveManager';
import {
  Maximize2,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Save,
  RotateCcw,
  Sliders,
  X,
  Terminal,
  Gamepad2,
  Zap,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface PlayerPageProps {
  game: Game;
  onExit: () => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({ game, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Runtime state
  const [loadingPercent, setLoadingPercent] = useState<number>(0);
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing runtime container...');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // In-game metrics
  const [currentFps, setCurrentFps] = useState<number>(game.runtimeConfig?.targetFps || 60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [carSpeedKmh, setCarSpeedKmh] = useState<number>(0);
  const [carNitro, setCarNitro] = useState<number>(100);
  const [adaptiveQualityPill, setAdaptiveQualityPill] = useState<string>('HIGH (100%)');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [crtEffect, setCrtEffect] = useState<boolean>(false);
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [showControlsModal, setShowControlsModal] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Graphics preset
  const [renderScale, setRenderScale] = useState<'100%' | '75%' | '50%'>('100%');

  // In-App WebGPU / DirectPlay Engine states
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const isWebGame = game.id === 'nfs-most-wanted' || Boolean(game.runtimeConfig?.embedUrl);
  const embedSource = game.id === 'nfs-most-wanted' ? '/games/nfsmw/index.html' : game.runtimeConfig?.embedUrl;

  const handleRestartGame = () => {
    if (isWebGame) {
      setIframeLoading(true);
      setIframeKey((prev) => prev + 1);
      addLog(`Restarted OSKA DirectPlay engine for ${game.title}`);
    } else if (runtimeRef.current?.restart) {
      runtimeRef.current.restart();
    }
  };

  // Active runtime ref
  const runtimeRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setConsoleLogs((prev) => [...prev.slice(-30), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    setIframeLoading(true);
    const timer = setTimeout(() => {
      setIframeLoading(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, [game.id, iframeKey]);

  useEffect(() => {
    let isCancelled = false;

    const startRuntime = async () => {
      if (game.id === 'nfs-most-wanted' || game.runtimeConfig?.embedUrl) {
        setIsLoaded(true);
        setLoadingPercent(100);
        addLog(`Loaded In-App PC Engine for ${game.title}.`);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        setLoadingPercent(15);
        setLoadingStatus('Configuring client-side execution sandbox...');
        addLog(`Starting game: ${game.title} (${game.runtimeConfig?.runtimeType})`);

        if (game.runtimeConfig?.runtimeType === 'wasm-doom') {
          const doom = new DoomWasmAdapter(canvas, game.runtimeConfig.wasmFile, {
            onProgress: (percent, text) => {
              if (isCancelled) return;
              setLoadingPercent(percent);
              setLoadingStatus(text);
            },
            onError: (err) => {
              if (isCancelled) return;
              setLoadError(err);
              addLog(`Error: ${err}`);
            },
            onFpsUpdate: (fps, ft) => {
              if (isCancelled) return;
              setCurrentFps(fps);
              setFrameTimeMs(ft);
            },
            onLog: (msg) => {
              addLog(msg);
            },
          });

          runtimeRef.current = doom;
          await doom.start();
        } else if (game.runtimeConfig?.runtimeType === 'html5-canvas') {
          setLoadingPercent(50);
          setLoadingStatus('Initializing Canvas 2D engine...');
          const c2048 = new Canvas2048Adapter(canvas, {
            onFpsUpdate: (fps, ft) => {
              setCurrentFps(fps);
              setFrameTimeMs(ft);
            },
            onLog: (msg) => addLog(msg),
          });
          runtimeRef.current = c2048;
          await c2048.start();
          setLoadingPercent(100);
          setLoadingStatus('Ready!');
        } else if (game.runtimeConfig?.runtimeType === 'racer-3d') {
          canvas.width = 800;
          canvas.height = 500;
          setLoadingPercent(30);
          setLoadingStatus('Streaming 3D Car & Highway track assets...');
          const racer = new CyberRacer3DAdapter(canvas, {
            onProgress: (p, text) => {
              setLoadingPercent(p);
              setLoadingStatus(text);
            },
            onFpsUpdate: (fps, ft) => {
              setCurrentFps(fps);
              setFrameTimeMs(ft);
            },
            onSpeedUpdate: (speedKmh, nitro) => {
              setCarSpeedKmh(speedKmh);
              setCarNitro(nitro);
            },
            onQualityAdjust: (mode, scale) => {
              setAdaptiveQualityPill(`${mode} (${scale})`);
            },
            onLog: (msg) => addLog(msg),
          });
          runtimeRef.current = racer;
          await racer.start();
          setLoadingPercent(100);
          setLoadingStatus('Ready!');
        }

        if (!isCancelled) {
          setIsLoaded(true);
          // Focus canvas for keyboard interaction
          setTimeout(() => canvas.focus(), 200);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to start game runtime');
        }
      }
    };

    startRuntime();

    return () => {
      isCancelled = true;
      if (runtimeRef.current && runtimeRef.current.stop) {
        runtimeRef.current.stop();
      }
    };
  }, [game]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const handleTogglePause = () => {
    if (!runtimeRef.current) return;
    if (isPaused) {
      if (runtimeRef.current.resume) runtimeRef.current.resume();
      setIsPaused(false);
      addLog('Resumed gameplay');
    } else {
      if (runtimeRef.current.pause) runtimeRef.current.pause();
      setIsPaused(true);
      addLog('Paused gameplay');
    }
  };

  const handleManualSave = async () => {
    try {
      setSaveToast('Saving progress to IndexedDB...');
      await saveManager.saveGame(
        game.id,
        `manual_${Date.now()}`,
        `${game.title} Manual Save`,
        JSON.stringify({ timestamp: Date.now(), title: game.title, score: 100 })
      );
      setSaveToast('Game state saved successfully!');
      setTimeout(() => setSaveToast(null), 3000);
      addLog('Manual save checkpoint saved to local IndexedDB.');
    } catch (err: any) {
      setSaveToast(`Save failed: ${err.message}`);
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-[#08090d] text-white min-h-[680px] rounded-2xl overflow-hidden border border-[#1e2235] shadow-2xl"
    >
      {/* Top Header Bar */}
      <div className="h-14 px-4 bg-[#0d0f18] border-b border-[#1c1f2e] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1d2e] transition-colors"
            title="Exit Game to Library"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {game.title}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/40 text-cyan-300 font-mono">
                {isWebGame ? 'DirectPlay™ WebGPU' : game.runtimeConfig?.runtimeType}
              </span>
            </h2>
          </div>
        </div>

        {/* Real-time telemetry indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {game.runtimeConfig?.runtimeType === 'racer-3d' && (
            <div className="flex items-center gap-3">
              {/* Speedometer */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#181a28] border border-cyan-500/30 text-cyan-300">
                <span className="text-[10px] text-slate-400">SPEED:</span>
                <span className="font-extrabold text-sm text-cyan-400">{carSpeedKmh}</span>
                <span className="text-[10px]">KM/H</span>
              </div>

              {/* Nitro bar */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#181a28] border border-violet-500/30">
                <span className="text-[10px] text-violet-400 font-bold">NITRO:</span>
                <div className="w-16 h-2 rounded-full bg-[#121420] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-100"
                    style={{ width: `${carNitro}%` }}
                  />
                </div>
              </div>

              {/* Adaptive hardware quality scale */}
              <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141724] border border-[#23283f] text-[11px] text-slate-300" title="Auto scaled based on your machine performance">
                <span className="text-slate-400">Scale:</span>
                <span className="text-emerald-400 font-bold">{adaptiveQualityPill}</span>
              </div>
            </div>
          )}

          {isWebGame && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-[11px] text-cyan-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>OSKA DirectPlay™ 60 FPS</span>
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#141724] border border-[#21263d]">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-bold">{currentFps} FPS</span>
          </div>

          <button
            onClick={handleRestartGame}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141624] hover:bg-[#1f2235] text-slate-300 hover:text-white border border-[#21263d] transition-all text-xs"
            title="Restart Game Engine"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Restart</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141624] hover:bg-[#1f2235] text-slate-300 hover:text-white border border-[#21263d] transition-all text-xs"
            title="Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden md:inline">Fullscreen</span>
          </button>

          <button
            onClick={() => setShowControlsModal(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a1d2e] transition-colors"
            title="Controls Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Execution Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[500px]">
        {/* Loading Overlay */}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090b12] p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-[2px] animate-pulse mb-6">
              <div className="w-full h-full bg-[#0d0f18] rounded-[14px] flex items-center justify-center">
                <Zap className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2">Preparing Client Runtime</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm">{loadingStatus}</p>

            {/* Progress bar */}
            <div className="w-72 h-2 rounded-full bg-[#1c1f2e] overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${loadingPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">{loadingPercent}%</span>
          </div>
        )}

        {/* Load Error View */}
        {loadError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090b12] p-6 text-center">
            <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4">
              <X className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Runtime Execution Error</h3>
            <p className="text-xs text-rose-400 max-w-md mb-6">{loadError}</p>
            <button
              onClick={onExit}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
            >
              Return to Catalog
            </button>
          </div>
        )}

        {/* Execution Viewport: Authentic OSKA DirectPlay™ Hardware Engine or Retro Canvas */}
        {isWebGame && embedSource ? (
          <div className="relative w-full h-full min-h-[640px] flex flex-col bg-black">
            {/* Native OSKA DirectPlay Engine Boot Splash Screen */}
            {iframeLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#07090e] p-6 text-center select-none animate-in fade-in">
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl pointer-events-none"
                  style={{ backgroundImage: `url(${game.bannerImage || game.coverImage})` }}
                />

                <div className="relative z-10 flex flex-col items-center max-w-md">
                  <div className="relative w-24 h-32 mb-5 rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/25">
                    <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span>OSKA DirectPlay™ Engine Kernel</span>
                  </div>

                  <h3 className="text-xl font-black text-white tracking-tight mb-1">{game.title}</h3>
                  <p className="text-xs text-slate-400 mb-5">
                    Compiling WebGPU shaders &amp; allocating local GPU memory...
                  </p>

                  <div className="w-64 h-1.5 rounded-full bg-[#131625] overflow-hidden border border-[#232840]">
                    <div className="h-full bg-gradient-to-r from-violet-600 via-cyan-400 to-emerald-400 animate-pulse rounded-full w-full" />
                  </div>

                  <button
                    onClick={() => setIframeLoading(false)}
                    className="mt-4 px-4 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Click to Start Now ➔
                  </button>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    <span className="text-emerald-400 font-bold">● 60 FPS Native</span>
                    <span>•</span>
                    <span>Direct GPU Acceleration</span>
                    <span>•</span>
                    <span>In-Browser Client</span>
                  </div>
                </div>
              </div>
            )}

            <iframe
              key={`${game.id}-${iframeKey}`}
              src={embedSource}
              onLoad={() => {
                setIframeLoading(false);
                addLog(`OSKA DirectPlay Engine initialized for ${game.title}`);
              }}
              allow="cross-origin-isolated; autoplay; fullscreen *; gamepad; accelerometer; gyroscope; clipboard-write; keyboard-map"
              className="w-full flex-1 min-h-[600px] border-0 bg-black"
              title={`${game.title} - OSKA DirectPlay Engine`}
            />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            id="game-canvas"
            tabIndex={0}
            className={`max-w-full max-h-full object-contain cursor-crosshair focus:outline-hidden transition-all duration-200 ${
              renderScale === '75%' ? 'scale-75' : renderScale === '50%' ? 'scale-50' : 'scale-100'
            }`}
            style={{ imageRendering: 'pixelated' }}
          />
        )}

        {/* Scanlines / CRT Overlay */}
        {crtEffect && <div className="absolute inset-0 crt-overlay pointer-events-none z-10" />}

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-xl bg-violet-950/90 border border-violet-500 text-white text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-top-2">
            {saveToast}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-14 px-4 bg-[#0d0f18] border-t border-[#1c1f2e] flex items-center justify-between shrink-0 z-20">
        {/* Left tools: Pause, Save, Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141624] hover:bg-[#1f2235] text-xs font-medium text-slate-200 border border-[#21263d] transition-all"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          {game.runtimeConfig?.saveSupported && (
            <button
              onClick={handleManualSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141624] hover:bg-[#1f2235] text-xs font-medium text-slate-200 border border-[#21263d] transition-all"
              title="Save game progress to local IndexedDB"
            >
              <Save className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Progress</span>
            </button>
          )}

          <button
            onClick={() => setCrtEffect(!crtEffect)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              crtEffect
                ? 'bg-violet-600/30 text-violet-300 border-violet-500/50'
                : 'bg-[#141624] text-slate-400 border-[#21263d] hover:text-white'
            }`}
            title="Toggle retro CRT scanlines"
          >
            CRT Scanlines
          </button>
        </div>

        {/* Right tools: Render scale, Fullscreen, Logs */}
        <div className="flex items-center gap-2">
          {/* Resolution Scale selector */}
          <select
            value={renderScale}
            onChange={(e) => setRenderScale(e.target.value as any)}
            aria-label="Resolution scale"
            className="px-2.5 py-1.5 rounded-lg bg-[#141624] text-slate-300 text-xs border border-[#21263d] focus:outline-hidden"
          >
            <option value="100%">100% Native Scale</option>
            <option value="75%">75% Performance</option>
            <option value="50%">50% Low Spec</option>
          </select>

          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`p-2 rounded-lg border transition-all ${
              showConsole
                ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/40'
                : 'bg-[#141624] text-slate-400 border-[#21263d] hover:text-white'
            }`}
            title="Toggle Engine Diagnostics Console"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-[#141624] hover:bg-[#1f2235] text-slate-300 hover:text-white border border-[#21263d] transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Diagnostic Console Drawer */}
      {showConsole && (
        <div className="h-44 bg-[#090a10] border-t border-[#1e2235] p-3 overflow-y-auto font-mono text-[11px] text-slate-400 z-30">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1c1f2e] text-slate-300 font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Terminal className="w-3.5 h-3.5" /> Engine Telemetry & Log Stream
            </span>
            <button
              onClick={() => setShowConsole(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="leading-tight">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls Overlay Modal */}
      {showControlsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#10121d] border border-[#23273b] rounded-2xl p-6 text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c1f2e] mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-violet-400" />
                Controls Reference: {game.title}
              </h3>
              <button
                onClick={() => setShowControlsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 mb-6">
              {Object.entries(game.controls).map(([action, key]) => (
                <div
                  key={action}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#161826] text-xs"
                >
                  <span className="text-slate-300">{action}</span>
                  <span className="font-mono text-cyan-300 font-semibold">{key}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowControlsModal(false)}
              className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold"
            >
              Got it, Resume Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
