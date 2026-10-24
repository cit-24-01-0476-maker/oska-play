import { describe, it, expect } from 'vitest';
import { INITIAL_GAMES } from '../src/modules/games/gameCatalog';

describe('Game Catalog Compliance & Licensing Audit', () => {
  it('should ensure all games have complete, non-null licensing metadata', () => {
    for (const game of INITIAL_GAMES) {
      expect(game.license).toBeDefined();
      expect(game.license.creator).toBeTruthy();
      expect(game.license.sourceCodeLicense).toBeTruthy();
      expect(game.license.assetLicense).toBeTruthy();
      expect(game.license.licenseVerificationStatus).toBeDefined();
    }
  });

  it('should only mark games PLAY_READY if browser distribution is legally permitted', () => {
    for (const game of INITIAL_GAMES) {
      if (game.status === 'PLAY_READY') {
        expect(game.compatibilityClass).toBe('CLASS_A');
        expect(game.license.browserDistributionPermitted).toBe(true);
        expect(game.runtimeConfig).toBeDefined();
      }
    }
  });

  it('should support dual mode for NFS Most Wanted with Web play and Google Drive PC download', () => {
    const nfs = INITIAL_GAMES.find((g) => g.id === 'nfs-most-wanted');
    expect(nfs).toBeDefined();
    expect(nfs?.status).toBe('PLAY_READY');
    expect(nfs?.compatibilityClass).toBe('CLASS_A');
    expect(nfs?.license.browserDistributionPermitted).toBe(true);
    expect(nfs?.downloadInfo?.available).toBe(true);
    expect(nfs?.downloadInfo?.directDownloadUrl).toContain('1vS_sS4Rn4ElQDYznLGBggVtv_7KYSHZN');
  });

  it('should classify native-only open source games (OpenTyrian) as DOWNLOAD_ONLY', () => {
    const ot = INITIAL_GAMES.find((g) => g.id === 'opentyrian');
    expect(ot).toBeDefined();
    expect(ot?.status).toBe('DOWNLOAD_ONLY');
    expect(ot?.compatibilityClass).toBe('CLASS_C');
    expect(ot?.downloadInfo?.available).toBe(true);
    expect(ot?.downloadInfo?.sha256Checksum).toBeTruthy();
  });
});
