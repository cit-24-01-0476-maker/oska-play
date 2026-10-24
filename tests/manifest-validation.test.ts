import { describe, it, expect } from 'vitest';
import { GameImportEngine, PackageManifest } from '../src/modules/importer/GameImportEngine';

describe('GameImportEngine Security & Manifest Validation', () => {
  it('should accept a valid WebAssembly game package with legal clearance', () => {
    const validManifest: PackageManifest = {
      name: 'Freedoom Phase 1',
      version: '0.13.0',
      entryPoint: 'doom.wasm',
      runtime: 'wasm-doom',
      files: [
        { path: 'doom.wasm', sizeBytes: 4559928, sha256: '8edfe49a...' },
        { path: 'engine.js', sizeBytes: 25000 },
      ],
      totalUncompressedSize: 4584928,
      compressedSize: 4200000,
    };

    const report = GameImportEngine.validatePackage(validManifest, 'CLASS_A', true);

    expect(report.isValid).toBe(true);
    expect(report.targetStatus).toBe('PLAY_READY');
    expect(report.errors.length).toBe(0);
    expect(report.securityChecks.noPathTraversal).toBe(true);
    expect(report.securityChecks.noZipBomb).toBe(true);
    expect(report.securityChecks.noHostExecutables).toBe(true);
    expect(report.securityChecks.legalClearance).toBe(true);
  });

  it('should reject packages with Zip Slip path traversal attacks', () => {
    const maliciousManifest: PackageManifest = {
      name: 'Malicious Mod',
      version: '1.0.0',
      entryPoint: 'index.html',
      runtime: 'html5-canvas',
      files: [
        { path: 'index.html', sizeBytes: 1200 },
        { path: '../../Windows/System32/evil.dll', sizeBytes: 50000 },
      ],
      totalUncompressedSize: 51200,
      compressedSize: 20000,
    };

    const report = GameImportEngine.validatePackage(maliciousManifest, 'CLASS_A', true);

    expect(report.isValid).toBe(false);
    expect(report.targetStatus).toBe('ERROR');
    expect(report.securityChecks.noPathTraversal).toBe(false);
    expect(report.errors.some((e) => e.includes('Zip path traversal'))).toBe(true);
  });

  it('should reject zip bomb decompression ratio attacks', () => {
    const zipBombManifest: PackageManifest = {
      name: 'Decompression Bomb',
      version: '1.0.0',
      entryPoint: 'game.wasm',
      runtime: 'wasm-generic',
      files: [{ path: 'game.wasm', sizeBytes: 600 * 1024 * 1024 }],
      totalUncompressedSize: 600 * 1024 * 1024, // 600MB
      compressedSize: 1024 * 1024, // 1MB -> 600:1 ratio
    };

    const report = GameImportEngine.validatePackage(zipBombManifest, 'CLASS_A', true);

    expect(report.isValid).toBe(false);
    expect(report.securityChecks.noZipBomb).toBe(false);
    expect(report.errors.some((e) => e.includes('Potential Zip Bomb'))).toBe(true);
  });

  it('should reject native Windows executables uploaded to browser-ready game classes', () => {
    const exeManifest: PackageManifest = {
      name: 'Fake Web Game',
      version: '1.0.0',
      entryPoint: 'game.exe',
      runtime: 'html5-canvas',
      files: [{ path: 'game.exe', sizeBytes: 15000000 }],
      totalUncompressedSize: 15000000,
      compressedSize: 10000000,
    };

    const report = GameImportEngine.validatePackage(exeManifest, 'CLASS_A', true);

    expect(report.isValid).toBe(false);
    expect(report.securityChecks.noHostExecutables).toBe(false);
    expect(report.errors.some((e) => e.includes('cannot run in browser runtime'))).toBe(true);
  });

  it('should block games that lack legal license clearance', () => {
    const proprietaryManifest: PackageManifest = {
      name: 'Commercial Title',
      version: '1.0.0',
      entryPoint: 'game.wasm',
      runtime: 'wasm-generic',
      files: [{ path: 'game.wasm', sizeBytes: 5000000 }],
      totalUncompressedSize: 5000000,
      compressedSize: 4000000,
    };

    const report = GameImportEngine.validatePackage(proprietaryManifest, 'CLASS_A', false);

    expect(report.isValid).toBe(false);
    expect(report.targetStatus).toBe('BLOCKED_LICENSE');
    expect(report.securityChecks.legalClearance).toBe(false);
  });
});
