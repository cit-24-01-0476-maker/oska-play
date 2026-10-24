import { saveManager } from '../storage/SaveManager';

export interface CanvasGameCallbacks {
  onScoreUpdate?: (score: number, bestScore: number) => void;
  onFpsUpdate?: (fps: number, frameTimeMs: number) => void;
  onLog?: (msg: string) => void;
}

export class Canvas2048Adapter {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private callbacks: CanvasGameCallbacks;
  private size: number = 4;
  private grid: number[][] = [];
  private score: number = 0;
  private bestScore: number = 0;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: CanvasGameCallbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    this.canvas.width = 500;
    this.canvas.height = 500;
    this.isRunning = true;

    // Load persisted state if exists
    try {
      const stored = await saveManager.loadGame('2048-arcade', 'slot1');
      if (stored && typeof stored.data === 'string') {
        const parsed = JSON.parse(stored.data);
        this.grid = parsed.grid;
        this.score = parsed.score;
        this.bestScore = parsed.bestScore || 0;
        this.callbacks.onLog?.('Loaded previous 2048 game session from IndexedDB');
      } else {
        this.initGrid();
      }
    } catch {
      this.initGrid();
    }

    this.callbacks.onScoreUpdate?.(this.score, this.bestScore);
    this.attachInputs();
    this.render();
  }

  private initGrid(): void {
    this.grid = Array(this.size).fill(0).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.addRandomTile();
    this.addRandomTile();
  }

  private addRandomTile(): void {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isRunning) return;
    let moved = false;

    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      moved = this.moveUp();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      moved = this.moveDown();
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      moved = this.moveLeft();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      moved = this.moveRight();
    }

    if (moved) {
      e.preventDefault();
      this.addRandomTile();
      if (this.score > this.bestScore) this.bestScore = this.score;
      this.callbacks.onScoreUpdate?.(this.score, this.bestScore);
      this.render();
      this.saveState();
    }
  };

  private async saveState(): Promise<void> {
    const data = JSON.stringify({
      grid: this.grid,
      score: this.score,
      bestScore: this.bestScore,
    });
    await saveManager.saveGame('2048-arcade', 'slot1', '2048 AutoSave', data);
  }

  private moveLeft(): boolean {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const row = this.grid[r].filter((v) => v !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
          moved = true;
        }
      }
      while (row.length < this.size) row.push(0);
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] !== row[c]) moved = true;
        this.grid[r][c] = row[c];
      }
    }
    return moved;
  }

  private moveRight(): boolean {
    this.rotateGrid();
    this.rotateGrid();
    const moved = this.moveLeft();
    this.rotateGrid();
    this.rotateGrid();
    return moved;
  }

  private moveUp(): boolean {
    this.rotateGrid();
    this.rotateGrid();
    this.rotateGrid();
    const moved = this.moveLeft();
    this.rotateGrid();
    return moved;
  }

  private moveDown(): boolean {
    this.rotateGrid();
    const moved = this.moveLeft();
    this.rotateGrid();
    this.rotateGrid();
    this.rotateGrid();
    return moved;
  }

  private rotateGrid(): void {
    const next = Array(this.size).fill(0).map(() => Array(this.size).fill(0));
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        next[c][this.size - 1 - r] = this.grid[r][c];
      }
    }
    this.grid = next;
  }

  private attachInputs(): void {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private detachInputs(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  public render(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = 14;
    const cellSize = (w - padding * (this.size + 1)) / this.size;

    // Background
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(0, 0, w, h);

    const colors: { [val: number]: { bg: string; text: string } } = {
      0: { bg: '#1c1f2e', text: '#1c1f2e' },
      2: { bg: '#292d3f', text: '#e2e8f0' },
      4: { bg: '#373d57', text: '#f8fafc' },
      8: { bg: '#7c3aed', text: '#ffffff' },
      16: { bg: '#8b5cf6', text: '#ffffff' },
      32: { bg: '#06b6d4', text: '#ffffff' },
      64: { bg: '#0ea5e9', text: '#ffffff' },
      128: { bg: '#10b981', text: '#ffffff' },
      256: { bg: '#f59e0b', text: '#ffffff' },
      512: { bg: '#ef4444', text: '#ffffff' },
      1024: { bg: '#ec4899', text: '#ffffff' },
      2048: { bg: '#e11d48', text: '#ffffff' },
    };

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const x = padding + c * (cellSize + padding);
        const y = padding + r * (cellSize + padding);
        const style = colors[val] || { bg: '#e11d48', text: '#ffffff' };

        // Rounded rect
        ctx.fillStyle = style.bg;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 8);
        ctx.fill();

        if (val > 0) {
          ctx.fillStyle = style.text;
          ctx.font = `bold ${val >= 1000 ? 28 : val >= 100 ? 34 : 40}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(val.toString(), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }
  }

  public restart(): void {
    this.initGrid();
    this.callbacks.onScoreUpdate?.(this.score, this.bestScore);
    this.render();
    this.saveState();
  }

  public stop(): void {
    this.isRunning = false;
    this.detachInputs();
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}
