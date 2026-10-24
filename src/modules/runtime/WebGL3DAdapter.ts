export interface Dungeon3DCallbacks {
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  onLog?: (msg: string) => void;
}

export class WebGL3DAdapter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private callbacks: Dungeon3DCallbacks;

  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  // Player position & angle
  private posX: number = 3.5;
  private posY: number = 3.5;
  private dirX: number = -1;
  private dirY: number = 0;
  private planeX: number = 0;
  private planeY: number = 0.66; // FOV ratio (66 deg)

  private keys: { [k: string]: boolean } = {};

  // Timing
  private lastTime: number = performance.now();
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();

  // World map (1 = brick wall, 2 = metal wall, 3 = neon blue wall, 0 = empty)
  private map: number[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 3, 3, 0, 0, 1, 0, 2, 2, 2, 0, 0, 0, 0, 1],
    [1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1, 0, 3, 3, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  constructor(canvas: HTMLCanvasElement, callbacks: Dungeon3DCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    this.canvas.width = 640;
    this.canvas.height = 400;
    this.isRunning = true;
    this.attachInputs();
    this.loop();
    this.callbacks.onLog?.('Dungeon 3D Raycasting Engine initialized.');
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
    this.keys[e.key.toLowerCase()] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private update(dt: number): void {
    const moveSpeed = 3.2 * dt;
    const rotSpeed = 2.4 * dt;

    // Forward / Backward
    if (this.keys['w'] || this.keys['arrowup']) {
      if (this.map[Math.floor(this.posY)][Math.floor(this.posX + this.dirX * moveSpeed)] === 0) {
        this.posX += this.dirX * moveSpeed;
      }
      if (this.map[Math.floor(this.posY + this.dirY * moveSpeed)][Math.floor(this.posX)] === 0) {
        this.posY += this.dirY * moveSpeed;
      }
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      if (this.map[Math.floor(this.posY)][Math.floor(this.posX - this.dirX * moveSpeed)] === 0) {
        this.posX -= this.dirX * moveSpeed;
      }
      if (this.map[Math.floor(this.posY - this.dirY * moveSpeed)][Math.floor(this.posX)] === 0) {
        this.posY -= this.dirY * moveSpeed;
      }
    }

    // Rotate Left
    if (this.keys['a'] || this.keys['arrowleft']) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(rotSpeed) - this.dirY * Math.sin(rotSpeed);
      this.dirY = oldDirX * Math.sin(rotSpeed) + this.dirY * Math.cos(rotSpeed);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(rotSpeed) - this.planeY * Math.sin(rotSpeed);
      this.planeY = oldPlaneX * Math.sin(rotSpeed) + this.planeY * Math.cos(rotSpeed);
    }
    // Rotate Right
    if (this.keys['d'] || this.keys['arrowright']) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(-rotSpeed) - this.dirY * Math.sin(-rotSpeed);
      this.dirY = oldDirX * Math.sin(-rotSpeed) + this.dirY * Math.cos(-rotSpeed);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(-rotSpeed) - this.planeY * Math.sin(-rotSpeed);
      this.planeY = oldPlaneX * Math.sin(-rotSpeed) + this.planeY * Math.cos(-rotSpeed);
    }
  }

  private loop = (): void => {
    if (!this.isRunning) return;
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.callbacks.onFpsUpdate?.(fps, Math.round(dt * 1000 * 10) / 10);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private render(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Floor and Ceiling
    ctx.fillStyle = '#0a0b12';
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#181b26';
    ctx.fillRect(0, h / 2, w, h / 2);

    // Raycasting algorithm
    for (let x = 0; x < w; x++) {
      const cameraX = (2 * x) / w - 1;
      const rayDirX = this.dirX + this.planeX * cameraX;
      const rayDirY = this.dirY + this.planeY * cameraX;

      let mapX = Math.floor(this.posX);
      let mapY = Math.floor(this.posY);

      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);

      let stepX: number;
      let stepY: number;
      let sideDistX: number;
      let sideDistY: number;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
      }

      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
      }

      let hit = 0;
      let side = 0; // 0 = X side, 1 = Y side
      let wallType = 1;

      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }

        if (this.map[mapY] && this.map[mapY][mapX] > 0) {
          hit = 1;
          wallType = this.map[mapY][mapX];
        }
      }

      let perpWallDist: number;
      if (side === 0) {
        perpWallDist = (mapX - this.posX + (1 - stepX) / 2) / rayDirX;
      } else {
        perpWallDist = (mapY - this.posY + (1 - stepY) / 2) / rayDirY;
      }

      const lineHeight = Math.floor(h / Math.max(perpWallDist, 0.01));
      const drawStart = Math.max(0, -lineHeight / 2 + h / 2);
      const drawEnd = Math.min(h - 1, lineHeight / 2 + h / 2);

      // Color based on wallType & depth lighting
      let baseR = 124, baseG = 58, baseB = 237; // Violet
      if (wallType === 2) {
        baseR = 6; baseG = 182; baseB = 212; // Cyan
      } else if (wallType === 3) {
        baseR = 236; baseG = 72; baseB = 153; // Pink
      }

      // Shading based on distance and orientation
      const fog = Math.max(0.2, Math.min(1.0, 5.0 / (perpWallDist + 0.5)));
      const sideDarken = side === 1 ? 0.75 : 1.0;

      const r = Math.floor(baseR * fog * sideDarken);
      const g = Math.floor(baseG * fog * sideDarken);
      const b = Math.floor(baseB * fog * sideDarken);

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);
    }

    // Mini-map in top-right corner
    this.renderMiniMap(ctx);
  }

  private renderMiniMap(ctx: CanvasRenderingContext2D): void {
    const scale = 5;
    const offsetX = this.canvas.width - this.map[0].length * scale - 10;
    const offsetY = 10;

    ctx.fillStyle = 'rgba(10, 11, 16, 0.75)';
    ctx.fillRect(offsetX - 2, offsetY - 2, this.map[0].length * scale + 4, this.map.length * scale + 4);

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        if (this.map[y][x] > 0) {
          ctx.fillStyle = '#6d28d9';
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
        }
      }
    }

    // Draw player dot
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(offsetX + this.posX * scale, offsetY + this.posY * scale, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  public stop(): void {
    this.isRunning = false;
    this.detachInputs();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}
