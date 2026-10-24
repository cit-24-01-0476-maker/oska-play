# OSKA PLAY — Master System Architecture

> **Tagline:** PLAY BEYOND LIMITS  
> **System Class:** Client-Side Browser Gaming Platform & Source Library  

---

## 1. High-Level System Architecture

OSKA PLAY executes games **locally on the user's computer** using modern standard Web APIs: WebAssembly (WASM), WebGL 2, Canvas 2D, Web Audio, Gamepad API, and IndexedDB for persistence.

```
+-------------------------------------------------------------------------------+
|                               PLAYER CLIENT                                   |
|                                                                               |
|  +-------------------------------------------------------------------------+  |
|  |                  OSKA PLAY Frontend (React 19 + TypeScript + Vite)      |  |
|  +-------------------------------------------------------------------------+  |
|                                     |                                         |
|  +----------------------------------v--------------------------------------+  |
|  |                         Modular Runtime Adapters                         |  |
|  |  +---------------------+  +---------------------+  +-----------------+  |  |
|  |  |  DoomWasmAdapter    |  | Canvas2048Adapter   |  | WebGL3DAdapter  |  |  |
|  |  |  (id Tech C / WASM) |  | (HTML5 Canvas 2D)   |  | (3D Raycaster)  |  |  |
|  |  +---------------------+  +---------------------+  +-----------------+  |  |
|  +----------------------------------+--------------------------------------+  |
|                                     |                                         |
|  +----------------------------------v--------------------------------------+  |
|  |                     Hardware Subsystems & Web APIs                      |  |
|  |  * CPU/GPU: WebAssembly / WebGL Framebuffer -> Canvas Context 2D        |  |
|  |  * Audio: Web Audio API Oscillator & Synthesis Subsystem                |  |
|  |  * Input: Gamepad API + KeyDown/KeyUp Matrix Event Mapping              |  |
|  |  * Storage: IndexedDB IDBFS Save Game Persistence & Export/Import       |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
                                      ^
                                      | HTTP Range Requests & Static Assets
+-------------------------------------+-----------------------------------------+
|                  APPROVED PUBLIC ASSET HOSTING / CDN                          |
|  - Cloudflare Pages / Workers Free Tier Edge                                  |
|  - Pre-compiled .wasm binaries, static assets, manifests, cover artwork       |
+-------------------------------------+-----------------------------------------+
                                      ^
                                      | Staged & Validated Builds
+-------------------------------------+-----------------------------------------+
|                    SECURE STAGING & INGESTION PIPELINE                        |
|  +-------------------------------------------------------------------------+  |
|  | GameImportEngine:                                                       |  |
|  |  1. Zip Slip (path traversal) vulnerability prevention                   |  |
|  |  2. Zip Bomb (decompression ratio < 100:1) security check                |  |
|  |  3. Host Executable Sandboxing (rejection of untrusted server .exe)      |  |
|  |  4. Manifest & Entrypoint Integrity Verification                        |  |
|  |  5. Legal Redistribution & License Clearance Audit                      |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------+-----------------------------------------+
                                      ^
                                      | Authorized Admin OAuth2 (drive.file scope)
+-------------------------------------+-----------------------------------------+
|                  OWNER'S PRIVATE GOOGLE DRIVE (5TB HUB)                       |
|  Root: OSKA-PLAY/                                                             |
|  |-- 01-GAME-SOURCE-LIBRARY/                                                  |
|  |-- 02-APPROVED-BROWSER-BUILDS/                                              |
|  |-- 03-NATIVE-PC-DOWNLOADS/                                                  |
|  |-- 04-GAME-ARTWORK/                                                         |
|  |-- 05-GAME-METADATA/                                                        |
|  |-- 06-LICENSE-DOCUMENTS/                                                    |
|  |-- 07-PRIVATE-BACKUPS/                                                      |
+-------------------------------------------------------------------------------+
```

---

## 2. Compatibility Classification Hierarchy

To eliminate deceptive marketing and respect software licenses, OSKA PLAY classifies all catalog entries into four strict tiers:

| Tier | Category | Execution Model | Requirements | Example |
| :--- | :--- | :--- | :--- | :--- |
| **CLASS A** | Browser-Ready | Direct Client Execution | Compiled to `.wasm` or HTML5 Canvas, verified legal web license | Freedoom Phase 1, 2048, Neon Citadel 3D |
| **CLASS B** | Source-Available | Porting Candidate | C/C++ source code available; requires Emscripten toolchain compilation | Open-source PC games undergoing porting |
| **CLASS C** | Windows-Native | Download-Only (Standalone) | Windows x86/x64 binaries with SHA-256 checksums and verified distribution rights | OpenTyrian v2.1 (GPLv2) |
| **CLASS D** | Unsupported / Blocked | Reference Only | Commercial proprietary software without redistribution rights; DRM-protected | NFS Most Wanted, GTA San Andreas |

---

## 3. Storage & Delivery Separation Principle

**Google Drive is NOT a public CDN.**  
Google Drive enforces strict per-user download bandwidth quotas and API rate limits. Serving game packages directly from Google Drive links would cause immediate quota throttling and expose private file tokens.

**The Pipeline:**
1. **Google Drive** stores the owner's master 5TB private source files.
2. The **Admin Console** imports selected files using minimal OAuth (`drive.file`).
3. Files enter **Secure Staging** where checksums (SHA-256) and structure are validated.
4. Only approved and legally cleared builds are copied to **Cloudflare Pages / R2 public hosting**.
5. Visitors download game assets from the fast static CDN directly into browser cache.
