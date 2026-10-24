import { Game, GameCompatibilityClass, GameStatus } from '../../types/game';

export interface PackageManifest {
  name: string;
  version: string;
  entryPoint: string;
  runtime: string;
  files: Array<{
    path: string;
    sizeBytes: number;
    sha256?: string;
  }>;
  totalUncompressedSize: number;
  compressedSize: number;
}

export interface ValidationReport {
  isValid: boolean;
  gameClass: GameCompatibilityClass;
  targetStatus: GameStatus;
  errors: string[];
  warnings: string[];
  securityChecks: {
    noPathTraversal: boolean;
    noZipBomb: boolean;
    noHostExecutables: boolean;
    manifestIntegrity: boolean;
    legalClearance: boolean;
  };
}

export class GameImportEngine {
  /**
   * Safely inspects archive manifest and performs rigorous security validation
   */
  public static validatePackage(
    manifest: PackageManifest,
    declaredClass: GameCompatibilityClass,
    licenseClearance: boolean
  ): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Path traversal check (Zip Slip)
    let noPathTraversal = true;
    for (const f of manifest.files) {
      if (
        f.path.includes('../') ||
        f.path.includes('..\\') ||
        f.path.startsWith('/') ||
        f.path.startsWith('\\') ||
        /^[a-zA-Z]:/.test(f.path)
      ) {
        noPathTraversal = false;
        errors.push(`Critical Security Violation: Zip path traversal detected in file "${f.path}"`);
      }
    }

    // 2. Zip bomb check
    let noZipBomb = true;
    const compressionRatio =
      manifest.compressedSize > 0
        ? manifest.totalUncompressedSize / manifest.compressedSize
        : 1;

    if (compressionRatio > 100 || manifest.totalUncompressedSize > 500 * 1024 * 1024) {
      noZipBomb = false;
      errors.push(
        `Critical Security Violation: Potential Zip Bomb detected (Compression ratio: ${compressionRatio.toFixed(
          1
        )}:1, uncompressed size: ${(manifest.totalUncompressedSize / (1024 * 1024)).toFixed(1)}MB)`
      );
    }

    // 3. Executable check for browser packages
    let noHostExecutables = true;
    if (declaredClass === 'CLASS_A' || declaredClass === 'CLASS_B') {
      const forbiddenExts = ['.exe', '.dll', '.bat', '.cmd', '.sh', '.vbs', '.msi'];
      for (const f of manifest.files) {
        const lower = f.path.toLowerCase();
        if (forbiddenExts.some((ext) => lower.endsWith(ext))) {
          noHostExecutables = false;
          errors.push(
            `Invalid Browser Package: Native executable or script "${f.path}" cannot run in browser runtime.`
          );
        }
      }
    }

    // 4. Manifest integrity & entry point check
    let manifestIntegrity = true;
    if (!manifest.entryPoint) {
      manifestIntegrity = false;
      errors.push('Manifest missing required entryPoint');
    } else {
      const entryFound = manifest.files.some((f) => f.path === manifest.entryPoint);
      if (!entryFound) {
        manifestIntegrity = false;
        errors.push(`Declared entry point "${manifest.entryPoint}" not found in package files`);
      }
    }

    // 5. Legal Clearance Check
    const legalClearance = licenseClearance;
    if (!legalClearance) {
      errors.push('Legal license verification failed: redistribution or browser hosting not permitted');
    }

    // Determine target status
    let targetStatus: GameStatus = 'ERROR';
    if (!noPathTraversal || !noZipBomb || !noHostExecutables || !manifestIntegrity) {
      targetStatus = 'ERROR';
    } else if (!legalClearance) {
      targetStatus = 'BLOCKED_LICENSE';
    } else if (declaredClass === 'CLASS_A') {
      targetStatus = 'PLAY_READY';
    } else if (declaredClass === 'CLASS_B') {
      targetStatus = 'VALIDATING';
    } else if (declaredClass === 'CLASS_C') {
      targetStatus = 'DOWNLOAD_ONLY';
    } else {
      targetStatus = 'UNSUPPORTED';
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      gameClass: declaredClass,
      targetStatus,
      errors,
      warnings,
      securityChecks: {
        noPathTraversal,
        noZipBomb,
        noHostExecutables,
        manifestIntegrity,
        legalClearance,
      },
    };
  }
}
