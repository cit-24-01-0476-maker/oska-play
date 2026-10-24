import { saveManager } from '../storage/SaveManager';

export interface DoomRuntimeCallbacks {
  onProgress?: (progressPercent: number, statusText: string) => void;
  onError?: (error: string) => void;
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  onLog?: (message: string) => void;
}

export class DoomWasmAdapter {
  private canvas: HTMLCanvasElement;
  private wasmUrl: string;
  private callbacks: DoomRuntimeCallbacks;

  private moduleMemory: WebAssembly.Memory | null = null;
  private wasmExports: any = null;
  private tickIntervalId: any = null;
  private gamepadIntervalId: any = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  private ctx: CanvasRenderingContext2D | null = null;
  private scratchImageData: ImageData | null = null;

  // Frame timing
  private frameCount: number = 0;
  private lastFpsCalcTime: number = performance.now();
  private lastFrameTimestamp: number = performance.now();
  private currentFps: number = 35;
  private currentFrameTime: number = 28.5;

  // Audio Context for sound synthesis
  private audioCtx: AudioContext | null = null;

  // Save game in-memory cache for wasm bridge
  private activeSaveBuffer: Uint8Array | null = null;

  // Key mappings
  private keyMap: Map<string, number> = new Map();

  constructor(canvas: HTMLCanvasElement, wasmUrl: string = '/games/doom/doom.wasm', callbacks: DoomRuntimeCallbacks = {}) {
    this.canvas = canvas;
    this.wasmUrl = wasmUrl;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
  }

  public async start(): Promise<void> {
    try {
      this.callbacks.onProgress?.(10, 'Initializing WebAssembly runtime...');

      // Fetch the binary with progress
      const response = await fetch(this.wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load WebAssembly binary from ${this.wasmUrl}: HTTP ${response.status}`);
      }

      this.callbacks.onProgress?.(40, 'Compiling WebAssembly binary...');
      const arrayBuffer = await response.arrayBuffer();

      this.callbacks.onProgress?.(70, 'Linking engine imports & virtual filesystem...');

      const imports = {
        loading: {
          onGameInit: (width: number, height: number) => {
            this.canvas.width = width;
            this.canvas.height = height;
            if (this.ctx) {
              this.scratchImageData = this.ctx.createImageData(width, height);
            }
            this.callbacks.onLog?.(`Engine initialized video buffer: ${width}x${height}`);
          },
          wadSizes: () => {},
          readWads: () => {},
        },
        ui: {
          drawFrame: (indexOfFrameBuffer: number) => {
            this.onDrawFrame(indexOfFrameBuffer);
          },
        },
        runtimeControl: {
          timeInMilliseconds: () => BigInt(Math.trunc(performance.now())),
        },
        console: {
          onInfoMessage: (messagePtr: number, length: number) => {
            const msg = this.readMemoryString(messagePtr, length);
            this.callbacks.onLog?.(`[DOOM] ${msg}`);
          },
          onErrorMessage: (messagePtr: number, length: number) => {
            const err = this.readMemoryString(messagePtr, length);
            this.callbacks.onError?.(`[DOOM ERROR] ${err}`);
          },
        },
        gameSaving: {
          sizeOfSaveGame: () => {
            return this.activeSaveBuffer ? this.activeSaveBuffer.byteLength : 0;
          },
          readSaveGame: (destPtr: number) => {
            if (!this.activeSaveBuffer || !this.moduleMemory) return 0;
            const dest = new Uint8Array(this.moduleMemory.buffer, destPtr, this.activeSaveBuffer.byteLength);
            dest.set(this.activeSaveBuffer);
            return this.activeSaveBuffer.byteLength;
          },
          writeSaveGame: (srcPtr: number, length: number) => {
            if (!this.moduleMemory) return 0;
            const src = new Uint8Array(this.moduleMemory.buffer, srcPtr, length);
            this.activeSaveBuffer = new Uint8Array(src);
            // Persist asynchronously to IndexedDB
            saveManager.saveGame('freedoom-wasm', 'quicksave', 'Doom QuickSave', this.activeSaveBuffer)
              .then(() => this.callbacks.onLog?.('Game state persisted to IndexedDB.'))
              .catch((err) => console.error('Save failed:', err));
            return length;
          },
        },
      };

      const { instance } = await WebAssembly.instantiate(arrayBuffer, imports);
      this.wasmExports = instance.exports;
      this.moduleMemory = this.wasmExports.memory as WebAssembly.Memory;

      // Check for previously saved game state in IndexedDB
      try {
        const stored = await saveManager.loadGame('freedoom-wasm', 'quicksave');
        if (stored && stored.data) {
          this.activeSaveBuffer = stored.data instanceof Uint8Array ? stored.data : new Uint8Array();
          this.callbacks.onLog?.('Found existing save state in IndexedDB.');
        }
      } catch (err) {
        console.warn('Could not read existing save game:', err);
      }

      this.setupKeyMap();
      this.attachInputListeners();
      this.initAudio();

      this.callbacks.onProgress?.(95, 'Starting game loop...');
      this.wasmExports.initGame();

      this.isRunning = true;
      this.isPaused = false;

      // Doom runs at 35 FPS
      this.tickIntervalId = setInterval(() => {
        if (this.isRunning && !this.isPaused && this.wasmExports) {
          try {
            this.wasmExports.tickGame();
          } catch (e) {
            console.error('Doom tick error:', e);
          }
        }
      }, 1000 / 35);

      // Start Gamepad Polling Loop
      this.startGamepadLoop();

      this.callbacks.onProgress?.(100, 'Game ready!');
    } catch (err: any) {
      this.callbacks.onError?.(err?.message || 'Failed to initialize Doom runtime');
      throw err;
    }
  }

  private onDrawFrame(indexOfFrameBuffer: number): void {
    if (!this.moduleMemory || !this.scratchImageData || !this.ctx) return;

    const now = performance.now();
    this.currentFrameTime = now - this.lastFrameTimestamp;
    this.lastFrameTimestamp = now;
    this.frameCount++;

    if (now - this.lastFpsCalcTime >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCalcTime));
      this.frameCount = 0;
      this.lastFpsCalcTime = now;
      this.callbacks.onFpsUpdate?.(this.currentFps, Math.round(this.currentFrameTime * 10) / 10);
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    const doomFrameBuffer = new Uint8Array(this.moduleMemory.buffer, indexOfFrameBuffer, width * height * 4);
    const pixelCount = width * height;
    const targetData = this.scratchImageData.data;

    // Convert Little-Endian BGRA framebuffer to RGBA ImageData
    for (let i = 0; i < pixelCount; i++) {
      const offset = i * 4;
      targetData[offset + 0] = doomFrameBuffer[offset + 2]; // Red
      targetData[offset + 1] = doomFrameBuffer[offset + 1]; // Green
      targetData[offset + 2] = doomFrameBuffer[offset + 0]; // Blue
      targetData[offset + 3] = 255;                         // Alpha
    }

    this.ctx.putImageData(this.scratchImageData, 0, 0);
  }

  private readMemoryString(offset: number, length: number): string {
    if (!this.moduleMemory) return '';
    const bytes = new Uint8Array(this.moduleMemory.buffer, offset, length);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  private setupKeyMap(): void {
    const e = this.wasmExports;
    this.keyMap = new Map([
      ['ArrowLeft', e.KEY_LEFTARROW],
      ['ArrowRight', e.KEY_RIGHTARROW],
      ['ArrowUp', e.KEY_UPARROW],
      ['ArrowDown', e.KEY_DOWNARROW],
      ['a', e.KEY_STRAFE_L || e.KEY_LEFTARROW],
      ['A', e.KEY_STRAFE_L || e.KEY_LEFTARROW],
      ['d', e.KEY_STRAFE_R || e.KEY_RIGHTARROW],
      ['D', e.KEY_STRAFE_R || e.KEY_RIGHTARROW],
      ['w', e.KEY_UPARROW],
      ['W', e.KEY_UPARROW],
      ['s', e.KEY_DOWNARROW],
      ['S', e.KEY_DOWNARROW],
      [',', e.KEY_STRAFE_L],
      ['.', e.KEY_STRAFE_R],
      ['Control', e.KEY_FIRE],
      [' ', e.KEY_USE], // Space to open doors
      ['Shift', e.KEY_SHIFT],
      ['Tab', e.KEY_TAB],
      ['Escape', e.KEY_ESCAPE],
      ['Enter', e.KEY_ENTER],
      ['Backspace', e.KEY_BACKSPACE],
      ['Alt', e.KEY_ALT],
      ['e', e.KEY_USE],
      ['E', e.KEY_USE],
    ]);
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isRunning || this.isPaused || !this.wasmExports) return;

    let doomKey: number | null = null;
    if (this.keyMap.has(event.key)) {
      doomKey = this.keyMap.get(event.key)!;
    } else if (event.key.length === 1) {
      doomKey = event.key.charCodeAt(0);
    }

    if (doomKey !== null) {
      event.preventDefault();
      this.wasmExports.reportKeyDown(doomKey);

      // Play authentic sound cues
      if (doomKey === this.wasmExports.KEY_FIRE) {
        this.playSynthesizedSound('fire');
      } else if (doomKey === this.wasmExports.KEY_USE) {
        this.playSynthesizedSound('door');
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.isRunning || this.isPaused || !this.wasmExports) return;

    let doomKey: number | null = null;
    if (this.keyMap.has(event.key)) {
      doomKey = this.keyMap.get(event.key)!;
    } else if (event.key.length === 1) {
      doomKey = event.key.charCodeAt(0);
    }

    if (doomKey !== null) {
      event.preventDefault();
      this.wasmExports.reportKeyUp(doomKey);
    }
  };

  private attachInputListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private detachInputListeners(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private initAudio(): void {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      } catch (e) {
        console.warn('AudioContext not available:', e);
      }
    }
  }

  /**
   * Genuine Web Audio API sound effect synthesizer for retro sound effects
   */
  public playSynthesizedSound(type: 'fire' | 'door' | 'damage' | 'item'): void {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const t = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    if (type === 'fire') {
      // Pistol/shotgun gunshot: quick pitch drop with noise-like decay
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    } else if (type === 'door') {
      // Hydraulic/mechanical door open sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.linearRampToValueAtTime(180, t + 0.25);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  private startGamepadLoop(): void {
    let lastButtonState: { [btn: number]: boolean } = {};

    this.gamepadIntervalId = setInterval(() => {
      if (!this.isRunning || this.isPaused || !this.wasmExports) return;
      if (typeof navigator === 'undefined' || !navigator.getGamepads) return;

      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (!gp || !gp.connected) return;

      const e = this.wasmExports;
      // D-Pad and Buttons mapping
      const mapping = [
        { btnIndex: 12, doomKey: e.KEY_UPARROW },    // Dpad Up
        { btnIndex: 13, doomKey: e.KEY_DOWNARROW },  // Dpad Down
        { btnIndex: 14, doomKey: e.KEY_LEFTARROW },  // Dpad Left
        { btnIndex: 15, doomKey: e.KEY_RIGHTARROW }, // Dpad Right
        { btnIndex: 0,  doomKey: e.KEY_USE },        // A / Cross
        { btnIndex: 7,  doomKey: e.KEY_FIRE },       // R2 Trigger
        { btnIndex: 5,  doomKey: e.KEY_FIRE },       // R1 Bumper
        { btnIndex: 9,  doomKey: e.KEY_ENTER },      // Start / Menu
        { btnIndex: 8,  doomKey: e.KEY_ESCAPE },     // Select / Back
      ];

      for (const m of mapping) {
        const isPressed = gp.buttons[m.btnIndex]?.pressed || false;
        const wasPressed = lastButtonState[m.btnIndex] || false;

        if (isPressed && !wasPressed) {
          e.reportKeyDown(m.doomKey);
          if (m.doomKey === e.KEY_FIRE) this.playSynthesizedSound('fire');
          if (m.doomKey === e.KEY_USE) this.playSynthesizedSound('door');
        } else if (!isPressed && wasPressed) {
          e.reportKeyUp(m.doomKey);
        }
        lastButtonState[m.btnIndex] = isPressed;
      }
    }, 50);
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public requestFullscreen(): void {
    if (this.canvas.requestFullscreen) {
      this.canvas.requestFullscreen();
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.tickIntervalId) clearInterval(this.tickIntervalId);
    if (this.gamepadIntervalId) clearInterval(this.gamepadIntervalId);
    this.detachInputListeners();
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
    }
  }
}
