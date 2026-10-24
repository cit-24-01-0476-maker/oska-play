# OSKA PLAY — Game Porting Guide (C/C++ to WebAssembly)

This guide documents how C/C++ games are compiled to WebAssembly for client-side browser execution on OSKA PLAY.

---

## 1. Prerequisites
- **Emscripten SDK (emsdk)**: v3.1.40 or later.
- **Python**: 3.10+.
- **CMake / GNU Make**.

```bash
# Clone and activate emsdk
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh  # or emsdk_env.bat on Windows
```

---

## 2. Doom Generic / id Tech C Porting Pattern

Doom uses a framebuffer abstraction (`doomgeneric`) where video output, keyboard inputs, and sound are mapped to Emscripten/WASM exports:

```c
// Sample C bridge function for Framebuffer
void DG_DrawFrame() {
  ui_drawFrame((uint32_t)DG_ScreenBuffer);
}

// Sample C bridge function for Timing
uint32_t DG_GetTicksMs() {
  return (uint32_t)runtimeControl_timeInMilliseconds();
}
```

### Compilation Flags:
```bash
emcc -O3 \
  -s WASM=1 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s INITIAL_MEMORY=33554432 \
  -s EXPORTED_FUNCTIONS="['_initGame', '_tickGame', '_reportKeyDown', '_reportKeyUp']" \
  src/*.c -o doom.wasm
```

---

## 3. Storage & Save Game Adapters (IDBFS)

Emscripten games with filesystem saves can mount `IDBFS` to persist saves in IndexedDB:

```javascript
FS.mkdir('/saves');
FS.mount(IDBFS, {}, '/saves');
FS.syncfs(true, function (err) {
  // Save files loaded from IndexedDB
});

// To write back:
FS.syncfs(false, function (err) {
  // Saves synchronized to browser storage
});
```
