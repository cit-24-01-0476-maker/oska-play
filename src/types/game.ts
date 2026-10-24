export type GameCompatibilityClass =
  | 'CLASS_A' // Browser-ready HTML5 / WebAssembly games
  | 'CLASS_B' // Source-available PC games ported / portable to WebAssembly
  | 'CLASS_C' // Windows-native games without browser runtime (Download-Only)
  | 'CLASS_D'; // Unsupported, unverified, or improperly licensed games (Blocked)

export type GameStatus =
  | 'DRAFT'
  | 'IMPORTING'
  | 'PROCESSING'
  | 'VALIDATING'
  | 'PLAY_READY'
  | 'DOWNLOAD_ONLY'
  | 'UNSUPPORTED'
  | 'BLOCKED_LICENSE'
  | 'ERROR'
  | 'UNPUBLISHED';

export type RuntimeType = 'wasm-doom' | 'wasm-generic' | 'html5-canvas' | 'webgl-3d' | 'racer-3d' | 'native-only' | 'web-tab';

export interface GameLicense {
  creator: string;
  copyrightOwner: string;
  sourceCodeLicense: string;
  assetLicense: string;
  browserDistributionPermitted: boolean;
  nativeRedistributionPermitted: boolean;
  requiredAttribution: string;
  licenseVerificationStatus: 'VERIFIED_LEGAL' | 'RESTRICTED' | 'PROPRIETARY_UNLICENSED';
  licenseNotes?: string;
}

export interface GameSystemRequirements {
  os?: string;
  cpu?: string;
  memory?: string;
  gpu?: string;
  storage?: string;
  browserRequirements?: string;
}

export interface GameDownloadInfo {
  available: boolean;
  fileName: string;
  fileSizeBytes: number;
  formattedSize: string;
  sha256Checksum: string;
  version: string;
  targetOS: 'Windows 10/11 (x64)' | 'Cross-platform';
  directDownloadUrl?: string;
  installationInstructions?: string;
}

export interface GameRuntimeConfig {
  runtimeType: RuntimeType;
  entryPoint: string;
  wasmFile?: string;
  embedUrl?: string;
  dataFiles?: string[];
  canvasWidth: number;
  canvasHeight: number;
  targetFps: number;
  audioEnabled: boolean;
  gamepadSupported: boolean;
  saveSupported: boolean;
  supportsAdaptiveResolution: boolean;
  aspectRatio: string;
}

export interface Game {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  genre: 'Action' | 'Shooter' | 'Retro' | 'Puzzle' | 'Racing' | 'Adventure' | 'Strategy' | 'Indie' | 'Open World' | 'Sandbox' | 'Platformer' | 'RPG';
  compatibilityClass: GameCompatibilityClass;
  status: GameStatus;
  developer: string;
  publisher: string;
  releaseYear: number;
  version: string;
  coverImage: string;
  bannerImage: string;
  screenshots: string[];
  controls: { [action: string]: string };
  runtimeConfig?: GameRuntimeConfig;
  downloadInfo?: GameDownloadInfo;
  license: GameLicense;
  requirements: GameSystemRequirements;
  tags: string[];
  featured?: boolean;
  hidden?: boolean;
}

export interface PerformanceDiagnostics {
  webGpuSupported: boolean;
  webGlVersion: 'WebGL 2' | 'WebGL 1' | 'None';
  glRenderer: string;
  glVendor: string;
  maxTextureSize: number;
  hardwareConcurrency: number;
  deviceMemoryGb: number | null;
  screenResolution: string;
  pixelRatio: number;
  gamepadConnected: boolean;
  storageQuotaMb: number;
  storageUsageMb: number;
  measuredFps: number;
  measuredFrameTimeMs: number;
  recommendedPreset: 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO';
}

export interface SaveMetadata {
  gameId: string;
  slotId: string;
  timestamp: number;
  saveName: string;
  dataSizeBytes: number;
}
