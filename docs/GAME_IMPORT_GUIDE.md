# OSKA PLAY — Game Import & Staging Guide

This guide describes how administrators import, stage, validate, and publish games to the OSKA PLAY platform.

---

## 1. Supported Input Formats

1. **WebAssembly Game Archives (`.zip`)**:
   - Contains compiled `.wasm` file.
   - Accompanying `.js` loader glue code (if Emscripten runtime).
   - Game asset data packages (e.g. `.wad`, `.pak`, or audio sprites).
2. **HTML5 Canvas Game Archives (`.zip`)**:
   - Contains root `index.html` entry point.
   - Supporting scripts and assets.
3. **Standalone Windows Native Builds (`.zip`)**:
   - Contains Windows x64 executable and dependencies.
   - For Class C Download-Only games.

---

## 2. Ingestion Security Pipeline

Before any file is staged or published, it passes through `GameImportEngine`:

```
Google Drive Source
       |
       v
[Step 1: Checksum Verification] -> Calculate SHA-256 and compare with catalog manifest
       |
       v
[Step 2: Path Traversal Check]  -> Reject any file path containing '../' or absolute drives
       |
       v
[Step 3: Zip Bomb Prevention]   -> Verify decompression ratio < 100:1 and max size < 500MB
       |
       v
[Step 4: Sandbox Check]         -> Reject native executables for Class A browser games
       |
       v
[Step 5: Legal Clearance]       -> Verify open source license (GPL, MIT, BSD) or distribution grant
       |
       v
Approved Public Hosting
```

---

## 3. Package Manifest Specification

Each browser game archive may include a `game.manifest.json` file:

```json
{
  "name": "Freedoom Phase 1",
  "version": "0.13.0",
  "runtime": "wasm-doom",
  "entryPoint": "doom.wasm",
  "canvas": {
    "width": 640,
    "height": 400,
    "aspectRatio": "16:10",
    "targetFps": 35
  },
  "capabilities": {
    "audio": true,
    "gamepad": true,
    "saves": true
  },
  "license": {
    "type": "GPL-2.0",
    "clearance": true
  }
}
```
