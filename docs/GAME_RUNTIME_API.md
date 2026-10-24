# OSKA PLAY — Game Runtime API Specification

This document details the interface definitions for OSKA PLAY game runtime adapters.

---

## 1. GameRuntimeAdapter Interface

```typescript
export interface GameRuntimeAdapter {
  start(): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  requestFullscreen(): void;
}
```

---

## 2. Doom WebAssembly Imports & Exports

### Imports provided by OSKA PLAY to `doom.wasm`:

```javascript
const imports = {
  loading: {
    onGameInit: (width, height) => void,
    wadSizes: () => void,
    readWads: () => void,
  },
  ui: {
    drawFrame: (indexOfFrameBuffer: number) => void,
  },
  runtimeControl: {
    timeInMilliseconds: () => BigInt,
  },
  console: {
    onInfoMessage: (ptr: number, length: number) => void,
    onErrorMessage: (ptr: number, length: number) => void,
  },
  gameSaving: {
    sizeOfSaveGame: () => number,
    readSaveGame: (destPtr: number) => number,
    writeSaveGame: (srcPtr: number, length: number) => number,
  },
};
```

### Exports callable by OSKA PLAY from `doom.wasm`:
- `initGame()`: Initializes Doom engine state and virtual filesystem.
- `tickGame()`: Executes one frame tick (recommended interval: 35 FPS / 28.57ms).
- `reportKeyDown(doomKey: number)`: Passes translated key events into the engine.
- `reportKeyUp(doomKey: number)`: Releases key events.
- `memory`: WebAssembly linear memory buffer.
