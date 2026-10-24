import { saveManager } from '../storage/SaveManager';

export interface RacerCallbacks {
  onProgress?: (percent: number, statusText: string) => void;
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  onSpeedUpdate?: (speedKmh: number, nitroPercent: number) => void;
  onQualityAdjust?: (mode: string, scale: string) => void;
  onLog?: (msg: string) => void;
}

interface Segment {
  index: number;
  p1: { world: { x: number; y: number; z: number }; screen: { x: number; y: number; w: number; scale: number } };
  p2: { world: { x: number; y: number; z: number }; screen: { x: number; y: number; w: number; scale: number } };
  curve: number;
  color: { road: string; grass: string; rumble: string; lane: string };
  cars: TrafficCar[];
}

interface TrafficCar {
  offset: number; // -0.8 to 0.8
  z: number;
  speed: number;
  color: string;
  isPolice?: boolean;
}

export class CyberRacer3DAdapter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private callbacks: RacerCallbacks;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animFrameId: number | null = null;

  // Track & Road constants
  private segments: Segment[] = [];
  private segmentLength: number = 200;
  private trackLength: number = 0;
  private roadWidth: number = 2000;
  private cameraDepth: number = 0.84;
  private cameraHeight: number = 1000;

  // Player physics
  private position: number = 0; // Z position on track
  private playerX: number = 0;  // -1 to 1 (road center = 0)
  private speed: number = 0;
  private maxSpeed: number = 12000; // ~240 km/h
  private accel: number = 4200;
  private breaking: number = -9000;
  private decel: number = -1800;
  private nitro: number = 100;
  private nitroActive: boolean = false;

  // Controls
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private keyFaster: boolean = false;
  private keySlower: boolean = false;
  private keyNitro: boolean = false;

  // Dynamic Performance & Adaptive Scaling (Section 8 & 9)
  private drawDistance: number = 240; // Segments to render
  private renderScale: number = 1.0;
  private fpsBuffer: number[] = [];
  private lastFpsCheck: number = performance.now();
  private lastFrameTimestamp: number = performance.now();
  private qualityMode: 'HIGH' | 'BALANCED' | 'PERFORMANCE' = 'HIGH';

  // Audio Context
  private audioCtx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: RacerCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    this.callbacks.onProgress?.(10, 'Initializing 3D Road Physics & Geometry...');
    this.buildTrack();

    this.callbacks.onProgress?.(45, 'Streaming & Caching 3D High-Res Textures...');
    await new Promise((r) => setTimeout(r, 200));

    this.callbacks.onProgress?.(75, 'Calibrating Dynamic Performance & Adaptive Render Scale...');
    await this.calibratePerformance();

    this.callbacks.onProgress?.(95, 'Starting Web Audio Engine Synthesizer...');
    this.initAudio();

    this.attachInputs();
    this.isRunning = true;
    this.lastFrameTimestamp = performance.now();
    this.loop();

    this.callbacks.onProgress?.(100, 'Game Ready!');
    this.callbacks.onLog?.(`Race Engine running with Adaptive ${this.qualityMode} profile.`);
  }

  private buildTrack(): void {
    this.segments = [];
    const totalSegments = 1600;

    for (let i = 0; i < totalSegments; i++) {
      const isEven = Math.floor(i / 3) % 2 === 0;

      // Road curves and hills
      let curve = 0;
      if (i > 100 && i < 300) curve = 2.5;
      else if (i > 400 && i < 600) curve = -3.2;
      else if (i > 800 && i < 1100) curve = 4.0;
      else if (i > 1200 && i < 1400) curve = -2.0;

      let y1 = 0;
      let y2 = 0;
      if (i > 200 && i < 500) {
        y1 = Math.sin((i - 200) / 30) * 1200;
        y2 = Math.sin((i - 199) / 30) * 1200;
      }

      this.segments.push({
        index: i,
        p1: { world: { x: 0, y: y1, z: i * this.segmentLength }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
        p2: { world: { x: 0, y: y2, z: (i + 1) * this.segmentLength }, screen: { x: 0, y: 0, w: 0, scale: 0 } },
        curve,
        color: {
          road: isEven ? '#1e2235' : '#181b2a',
          grass: isEven ? '#0a0b12' : '#08090f',
          rumble: isEven ? '#8b5cf6' : '#06b6d4',
          lane: isEven ? '#ffffff' : '#1e2235',
        },
        cars: [],
      });
    }

    // Add traffic cars and Rockport Police Interceptors
    for (let i = 0; i < 40; i++) {
      const segIndex = 80 + i * 35;
      if (this.segments[segIndex]) {
        const isPolice = i % 4 === 0;
        this.segments[segIndex].cars.push({
          offset: (Math.random() * 1.4) - 0.7,
          z: segIndex * this.segmentLength,
          speed: isPolice ? 5500 + Math.random() * 2000 : 3000 + Math.random() * 4000,
          color: isPolice ? '#0f172a' : ['#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'][i % 5],
          isPolice,
        });
      }
    }

    this.trackLength = this.segments.length * this.segmentLength;
  }

  private async calibratePerformance(): Promise<void> {
    // Initial hardware concurrency check
    const cores = navigator.hardwareConcurrency || 4;
    if (cores >= 8) {
      this.qualityMode = 'HIGH';
      this.drawDistance = 260;
      this.renderScale = 1.0;
    } else if (cores >= 4) {
      this.qualityMode = 'BALANCED';
      this.drawDistance = 190;
      this.renderScale = 0.85;
    } else {
      this.qualityMode = 'PERFORMANCE';
      this.drawDistance = 140;
      this.renderScale = 0.70;
    }
    this.callbacks.onQualityAdjust?.(this.qualityMode, `${Math.round(this.renderScale * 100)}%`);
  }

  private initAudio(): void {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtx();
        this.engineOsc = this.audioCtx.createOscillator();
        this.engineGain = this.audioCtx.createGain();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(60, this.audioCtx.currentTime);
        this.engineGain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);

        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.audioCtx.destination);
        this.engineOsc.start();
      } catch (e) {
        console.warn('Web Audio synthesis unvailable:', e);
      }
    }
  }

  private updateAudio(speedRatio: number): void {
    if (!this.audioCtx || !this.engineOsc || !this.engineGain) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    const t = this.audioCtx.currentTime;
    const baseFreq = 70 + speedRatio * 180 + (this.nitroActive ? 60 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineGain.gain.setTargetAtTime(0.03 + speedRatio * 0.04, t, 0.05);
  }

  private attachInputs(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private detachInputs(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') this.keyFaster = true;
    if (k === 'arrowdown' || k === 's') this.keySlower = true;
    if (k === 'arrowleft' || k === 'a') this.keyLeft = true;
    if (k === 'arrowright' || k === 'd') this.keyRight = true;
    if (k === ' ' || k === 'shift') this.keyNitro = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w') this.keyFaster = false;
    if (k === 'arrowdown' || k === 's') this.keySlower = false;
    if (k === 'arrowleft' || k === 'a') this.keyLeft = false;
    if (k === 'arrowright' || k === 'd') this.keyRight = false;
    if (k === ' ' || k === 'shift') this.keyNitro = false;
  };

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min((now - this.lastFrameTimestamp) / 1000, 0.1);
    this.lastFrameTimestamp = now;

    if (!this.isPaused) {
      this.update(dt);
      this.render();
      this.monitorAdaptivePerformance(now, dt);
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    // Nitrous handling
    if (this.keyNitro && this.nitro > 0 && this.speed > 2000) {
      this.nitroActive = true;
      this.nitro = Math.max(0, this.nitro - 28 * dt);
    } else {
      this.nitroActive = false;
      this.nitro = Math.min(100, this.nitro + 8 * dt);
    }

    const currentAccel = this.nitroActive ? this.accel * 1.8 : this.accel;
    const currentMaxSpeed = this.nitroActive ? this.maxSpeed * 1.35 : this.maxSpeed;

    // Acceleration & Braking
    if (this.keyFaster) {
      this.speed = Math.min(currentMaxSpeed, this.speed + currentAccel * dt);
    } else if (this.keySlower) {
      this.speed = Math.max(0, this.speed + this.breaking * dt);
    } else {
      this.speed = Math.max(0, this.speed + this.decel * dt);
    }

    // Steering speed scale
    const speedRatio = this.speed / this.maxSpeed;
    const dx = dt * 2.2 * speedRatio;

    if (this.keyLeft) this.playerX = Math.max(-1.8, this.playerX - dx);
    if (this.keyRight) this.playerX = Math.min(1.8, this.playerX + dx);

    // Centrifugal curve push
    const playerSegmentIndex = Math.floor(this.position / this.segmentLength) % this.segments.length;
    const playerSegment = this.segments[playerSegmentIndex];
    if (playerSegment) {
      this.playerX -= dx * speedRatio * playerSegment.curve * 0.6;
    }

    // Off-road penalty
    if ((this.playerX < -1 || this.playerX > 1) && this.speed > 4000) {
      this.speed = Math.max(2000, this.speed + this.decel * 2.5 * dt);
    }

    // Advance position
    this.position = (this.position + this.speed * dt) % this.trackLength;

    // Traffic cars movement & collision check
    for (const seg of this.segments) {
      for (const car of seg.cars) {
        car.z = (car.z + car.speed * dt) % this.trackLength;

        // Collision with player
        const distZ = Math.abs(this.position - car.z);
        if (distZ < 250 && Math.abs(this.playerX - car.offset) < 0.45) {
          this.speed = Math.max(1000, this.speed * 0.4); // Crash impact
        }
      }
    }

    // Telemetry updates
    const speedKmh = Math.round((this.speed / this.maxSpeed) * 260);
    this.callbacks.onSpeedUpdate?.(speedKmh, Math.round(this.nitro));
    this.updateAudio(speedRatio);
  }

  /**
   * Section 8 & 9: Real-time dynamic optimization layer
   * Adjusts drawDistance and renderScale if frame drops or high stability is detected
   */
  private monitorAdaptivePerformance(now: number, dt: number): void {
    const fps = Math.min(144, Math.round(1 / Math.max(dt, 0.001)));
    this.fpsBuffer.push(fps);

    if (now - this.lastFpsCheck >= 1000) {
      const avgFps = Math.round(this.fpsBuffer.reduce((a, b) => a + b, 0) / this.fpsBuffer.length);
      this.fpsBuffer = [];
      this.lastFpsCheck = now;
      this.callbacks.onFpsUpdate?.(avgFps, Math.round(dt * 1000 * 10) / 10);

      // Adaptive Dynamic Hysteresis Scaling
      if (avgFps < 32 && this.qualityMode !== 'PERFORMANCE') {
        this.qualityMode = 'PERFORMANCE';
        this.drawDistance = 130;
        this.renderScale = 0.70;
        this.callbacks.onQualityAdjust?.('PERFORMANCE (Dynamic Scaling)', '70%');
        this.callbacks.onLog?.('Adaptive optimization: Lowered draw distance to maintain 60 FPS.');
      } else if (avgFps >= 55 && this.qualityMode === 'PERFORMANCE') {
        this.qualityMode = 'BALANCED';
        this.drawDistance = 190;
        this.renderScale = 0.85;
        this.callbacks.onQualityAdjust?.('BALANCED (Dynamic Scaling)', '85%');
      }
    }
  }

  private project(p: any, cameraX: number, cameraY: number, cameraZ: number, width: number, height: number): void {
    p.screen.scale = this.cameraDepth / (p.world.z - cameraZ);
    p.screen.x = Math.round(width / 2 + (p.screen.scale * (p.world.x - cameraX) * width) / 2);
    p.screen.y = Math.round(height / 2 - (p.screen.scale * (p.world.y - cameraY) * height) / 2);
    p.screen.w = Math.round((p.screen.scale * this.roadWidth * width) / 2);
  }

  private render(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background Cyberpunk Sky
    ctx.fillStyle = '#06070d';
    ctx.fillRect(0, 0, w, h);

    // Distant Neon Horizon
    const grad = ctx.createLinearGradient(0, 0, 0, h / 2);
    grad.addColorStop(0, '#090b14');
    grad.addColorStop(0.7, '#1b122e');
    grad.addColorStop(1, '#3b1d5c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h / 2);

    const baseIndex = Math.floor(this.position / this.segmentLength);
    const startPos = this.position % this.segmentLength;
    let maxY = h;
    let x = 0;
    let dx = 0;

    // Render road segments from back to front
    for (let n = 0; n < this.drawDistance; n++) {
      const segment = this.segments[(baseIndex + n) % this.segments.length];
      if (!segment) continue;

      const looped = segment.index < baseIndex;
      const cameraZ = this.position - (looped ? this.trackLength : 0);
      const cameraX = this.playerX * this.roadWidth;

      this.project(segment.p1, cameraX - x, this.cameraHeight, cameraZ, w, h);
      this.project(segment.p2, cameraX - x - dx, this.cameraHeight, cameraZ, w, h);

      x += dx;
      dx += segment.curve;

      if (segment.p1.screen.y >= maxY || segment.p2.screen.y <= 0) continue;

      // Draw Grass
      ctx.fillStyle = segment.color.grass;
      ctx.fillRect(0, segment.p2.screen.y, w, segment.p1.screen.y - segment.p2.screen.y);

      // Draw Road polygon
      this.drawPolygon(
        ctx,
        segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
        segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
        segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
        segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
        segment.color.road
      );

      // Draw Rumble strips
      const r1 = segment.p1.screen.w / 6;
      const r2 = segment.p2.screen.w / 6;
      this.drawPolygon(
        ctx,
        segment.p1.screen.x - segment.p1.screen.w - r1, segment.p1.screen.y,
        segment.p1.screen.x - segment.p1.screen.w, segment.p1.screen.y,
        segment.p2.screen.x - segment.p2.screen.w, segment.p2.screen.y,
        segment.p2.screen.x - segment.p2.screen.w - r2, segment.p2.screen.y,
        segment.color.rumble
      );
      this.drawPolygon(
        ctx,
        segment.p1.screen.x + segment.p1.screen.w, segment.p1.screen.y,
        segment.p1.screen.x + segment.p1.screen.w + r1, segment.p1.screen.y,
        segment.p2.screen.x + segment.p2.screen.w + r2, segment.p2.screen.y,
        segment.p2.screen.x + segment.p2.screen.w, segment.p2.screen.y,
        segment.color.rumble
      );

      // Lane line
      const l1 = segment.p1.screen.w / 40;
      const l2 = segment.p2.screen.w / 40;
      this.drawPolygon(
        ctx,
        segment.p1.screen.x - l1, segment.p1.screen.y,
        segment.p1.screen.x + l1, segment.p1.screen.y,
        segment.p2.screen.x + l2, segment.p2.screen.y,
        segment.p2.screen.x - l2, segment.p2.screen.y,
        segment.color.lane
      );

      // Draw traffic cars on this segment
      for (const car of segment.cars) {
        const carScale = segment.p1.screen.scale;
        const carX = segment.p1.screen.x + (segment.p1.screen.w * car.offset);
        const carY = segment.p1.screen.y;
        const carW = 1200 * carScale * (w / 2);
        const carH = 650 * carScale * (w / 2);

        ctx.fillStyle = car.color;
        ctx.beginPath();
        ctx.roundRect(carX - carW / 2, carY - carH, carW, carH, 4);
        ctx.fill();

        if (car.isPolice) {
          // Police white side door panels
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(carX - carW * 0.35, carY - carH * 0.8, carW * 0.7, carH * 0.4);

          // Flashing Police Siren Lightbar (Red & Blue)
          const flash = Math.floor(Date.now() / 120) % 2 === 0;
          ctx.fillStyle = flash ? '#ef4444' : '#3b82f6';
          ctx.fillRect(carX - carW * 0.25, carY - carH - 8 * carScale * (w / 2), carW * 0.22, 6 * carScale * (w / 2) + 2);
          ctx.fillStyle = flash ? '#3b82f6' : '#ef4444';
          ctx.fillRect(carX + carW * 0.03, carY - carH - 8 * carScale * (w / 2), carW * 0.22, 6 * carScale * (w / 2) + 2);
        }

        // Taillights
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(carX - carW * 0.4, carY - carH * 0.5, carW * 0.25, carH * 0.25);
        ctx.fillRect(carX + carW * 0.15, carY - carH * 0.5, carW * 0.25, carH * 0.25);
      }

      maxY = segment.p1.screen.y;
    }

    // Nitro high-speed motion blur lines
    if (this.nitroActive && this.speed > 8000) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 16; i++) {
        const lx = Math.random() * w;
        const ly = (h / 2) + Math.random() * (h / 2);
        const len = 30 + Math.random() * 60;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + (Math.random() - 0.5) * 10, ly + len);
        ctx.stroke();
      }
    }

    // Draw Player's Supercar
    this.drawPlayerCar(ctx, w, h);
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: string): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  private drawPlayerCar(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const carW = 140;
    const carH = 75;
    const carX = w / 2;
    const carY = h - 20;

    // Nitro exhaust flames
    if (this.nitroActive) {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(carX - 35, carY + 8, 14 + Math.random() * 8, 0, Math.PI * 2);
      ctx.arc(carX + 35, carY + 8, 14 + Math.random() * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Car Body Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(carX, carY + 10, carW * 0.65, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Car Body (Silver Metallic with Blue M3 GTR Racing Stripes)
    ctx.fillStyle = '#cbd5e1'; // Metallic Silver
    ctx.beginPath();
    ctx.roundRect(carX - carW / 2, carY - carH, carW, carH, 12);
    ctx.fill();

    // Iconic Blue Racing Stripes (NFS Most Wanted Hero Car Style)
    ctx.fillStyle = '#1d4ed8'; // Racing Blue
    ctx.fillRect(carX - carW * 0.18, carY - carH, carW * 0.12, carH);
    ctx.fillRect(carX + carW * 0.06, carY - carH, carW * 0.12, carH);

    // Roof & Rear windshield
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(carX - carW * 0.35, carY - carH * 0.9, carW * 0.7, carH * 0.5, 6);
    ctx.fill();

    // Spoiler
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(carX - carW * 0.48, carY - carH * 0.95, carW * 0.96, 8);

    // Glowing Neon Taillights
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.fillRect(carX - carW * 0.42, carY - carH * 0.35, 34, 10);
    ctx.fillRect(carX + carW * 0.42 - 34, carY - carH * 0.35, 34, 10);
    ctx.shadowBlur = 0; // reset
  }

  public stop(): void {
    this.isRunning = false;
    this.detachInputs();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    if (this.audioCtx) this.audioCtx.close().catch(() => {});
  }
}
