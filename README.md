# OSKA PLAY — PLAY BEYOND LIMITS
### Ultimate Full-Stack Client-Side Browser Gaming Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Tests](https://img.shields.io/badge/tests-14%2F14%20passing-brightgreen)](https://github.com)
[![WebAssembly](https://img.shields.io/badge/runtime-WebAssembly%20%7C%20WebGL%202-blueviolet)](https://webassembly.org)
[![Storage](https://img.shields.io/badge/Google%20Drive-5TB%20Hub-blue)](https://drive.google.com)
[![License](https://img.shields.io/badge/license-GPLv2%20%7C%20MIT-emerald)](LICENSE)

---

## 🎮 What is OSKA PLAY?

**OSKA PLAY** is a modern browser gaming platform and game library where visitors can play real, verified PC games **directly in their web browser** using their own computer's CPU and GPU.

Unlike remote cloud gaming services that stream video from costly GPU server clusters, OSKA PLAY uses a **100% Client-Side Gaming Model**:
- Game engines (written in C/C++) are compiled directly into **WebAssembly (WASM)**.
- Graphics render through **WebGL 2 and HTML5 Canvas 2D**.
- Audio executes via the **Web Audio API**.
- Saves persist across reloads in browser **IndexedDB (IDBFS)**.
- Full hardware support: **Gamepad API, Pointer Lock, Fullscreen, and Keyboard strafe matrix**.

---

## ⚡ Key Highlights & Architecture

1. **Genuine Playable PC Game Included**:
   - Includes **Freedoom: Phase 1** powered by the id Tech Doom engine compiled to WebAssembly (`doom.wasm`, 4.55MB).
   - Real 35 FPS framebuffer rendering directly to HTML5 canvas.
   - Real keyboard controls (`WASD` / arrows, `Ctrl` / click fire, `Space` open door, `Shift` run).
   - Real audio effects synthesizer and IndexedDB quicksave persistence.
2. **Compatibility Classification System**:
   - **CLASS A**: Browser-Ready WebAssembly & HTML5 games (e.g. *Freedoom Phase 1*, *2048*, *Neon Citadel 3D*).
   - **CLASS B**: Source-Available PC games ported/portable to WASM.
   - **CLASS C**: Windows-Native games available for direct PC download with SHA-256 checksums (e.g. *OpenTyrian*).
   - **CLASS D**: Commercial proprietary titles without web licenses (*strictly audited & blocked from execution* to prevent copyright infringement).
3. **Google Drive 5TB Staging Hub**:
   - Connects to the owner's 5TB Google Drive via minimal OAuth2 (`drive.file` scope).
   - Structured hierarchy: `OSKA-PLAY/01-GAME-SOURCE-LIBRARY/`, `02-APPROVED-BROWSER-BUILDS/`, etc.
   - Google Drive is used for private source storage; approved builds are securely staged and deployed to fast edge hosting.
4. **Security & Package Validation Engine**:
   - Protects against **Zip Slip path traversal** attacks (`../` and absolute paths).
   - Protects against **Zip bombs** (decompression ratios > 100:1 or archives > 500MB).
   - Blocks untrusted native host executables.
   - Enforces legal license audits before allowing any game to be published.
5. **Hardware Benchmark & Detection**:
   - Real client detection: WebGPU support, WebGL 2 unmasked renderer/vendor, logical cores, storage quotas.
   - Micro-benchmark measuring real frame rendering deltas to suggest AUTO / LOW / MEDIUM / HIGH graphics presets.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or later (Tested on Node v24.16.0).
- **npm**: v9.0.0 or later.
- Modern browser: Chrome, Edge, Firefox, or Brave.

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/play-game-web.git
cd "Play game Web"

# Install dependencies
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```
*Executes all 14 unit and integration tests verifying package security, license audits, device benchmarks, and Google Drive staging.*

### 3. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 📂 Project Directory Structure

```
oska-play/
|-- public/
|   |-- games/
|       |-- doom/
|           |-- doom.wasm          # Verified id Tech Doom WebAssembly binary (4.55MB)
|-- src/
|   |-- components/
|   |   |-- Navbar.tsx             # Brand header with GPU status pill & navigation
|   |   |-- Footer.tsx             # Compliance & architecture footer
|   |   |-- GameCard.tsx           # Game card with badges, hover glow & CTA
|   |   |-- CompatibilityBadge.tsx # Class A/B/C/D visual indicators
|   |   |-- DeviceModal.tsx        # Hardware benchmark & diagnostics modal
|   |-- modules/
|   |   |-- runtime/
|   |   |   |-- DoomWasmAdapter.ts # C/WASM Doom engine adapter (Canvas, Audio, Saves)
|   |   |   |-- Canvas2048Adapter.ts# 2048 HTML5 Canvas runtime
|   |   |   |-- WebGL3DAdapter.ts  # Neon Citadel 3D raycaster runtime
|   |   |-- storage/
|   |   |   |-- SaveManager.ts     # IndexedDB save persistence & export/import
|   |   |-- gdrive/
|   |   |   |-- GoogleDriveService.ts # 5TB Google Drive OAuth & staging pipeline
|   |   |-- importer/
|   |   |   |-- GameImportEngine.ts# Zip Slip, Zip Bomb, and license validator
|   |   |-- performance/
|   |   |   |-- DeviceBenchmark.ts # Real rendering benchmark & capability detector
|   |   |-- games/
|   |       |-- gameCatalog.ts     # Verified game records with legal licenses
|   |-- pages/
|   |   |-- HomePage.tsx           # Cinematic hero & instant play highlights
|   |   |-- LibraryPage.tsx        # Searchable global catalog & filters
|   |   |-- GameDetailsPage.tsx    # Specifications, controls, & license audit
|   |   |-- PlayerPage.tsx         # Genuine execution screen with canvas & telemetry
|   |   |-- MyLibraryPage.tsx      # Saved games manager (IndexedDB)
|   |   |-- DownloadsPage.tsx      # Standalone Windows PC builds & checksums
|   |   |-- ProfilePage.tsx        # Client diagnostics & graphics preferences
|   |   |-- AdminPage.tsx          # Google Drive 5TB manager & package publisher
|   |-- types/
|   |   |-- game.ts                # TypeScript schemas for runtimes, licenses, saves
|   |-- App.tsx                    # Master application state router
|   |-- main.tsx                   # React root entrypoint
|-- tests/
|   |-- manifest-validation.test.ts # Zip Slip, Zip bomb, and manifest test suite
|   |-- license-audit.test.ts      # Compliance and DRM audit test suite
|   |-- device-capability.test.ts  # Benchmark and hardware test suite
|   |-- gdrive-importer.test.ts    # Google Drive OAuth and staging test suite
|-- docs/
|   |-- ARCHITECTURE.md            # Complete system design & data flow
|   |-- IMPLEMENTATION_PLAN.md     # Phase matrix & delivery milestones
|   |-- GAME_IMPORT_GUIDE.md       # Ingestion & package validation guide
|   |-- GOOGLE_DRIVE_SETUP.md      # Google Cloud OAuth & 5TB folder tree guide
|   |-- GAME_PORTING_GUIDE.md      # C/C++ to WASM compilation with Emscripten
|   |-- LICENSE_AUDIT.md           # Legal register & DRM compliance audit
|   |-- GAME_RUNTIME_API.md        # Adapter interface and WASM export/import spec
|   |-- DEPLOYMENT_GUIDE.md        # Cloudflare Pages free deployment instructions
|   |-- FREE_TIER_LIMITS.md        # Transparent free-tier capacity & cost report
|   |-- TEST_RESULTS.md            # Verified test execution log
|-- package.json
|-- tsconfig.json
|-- vite.config.ts
|-- README.md
```

---

## 🛡️ Legal & Compliance Statement

OSKA PLAY strictly adheres to software licensing and copyright laws:
- Proprietary commercial games (e.g. *Need for Speed: Most Wanted*) without explicit redistribution permissions are **strictly blocked from execution**.
- No DRM circumvention or unauthorized binary cracking is permitted.
- Only verified open-source games (GPL, MIT, BSD) or authorized distributions are playable in browser or downloadable.

---

## 📄 License
This platform framework is licensed under the **MIT License**.  
Integrated game engines and assets retain their respective licenses (e.g., id Software Doom Engine GPLv2, Freedoom BSD 3-Clause).
