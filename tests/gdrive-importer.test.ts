import { describe, it, expect } from 'vitest';
import { googleDriveService } from '../src/modules/gdrive/GoogleDriveService';

describe('Google Drive 5TB Integration & Staging Pipeline', () => {
  it('should support connecting and disconnecting administrative OAuth2 session', async () => {
    // Reset to disconnected state first
    googleDriveService.disconnectAccount();
    expect(googleDriveService.getAuthConfig().isConnected).toBe(false);

    await googleDriveService.connectAccount('admin@oskaplay.dev');
    const auth = googleDriveService.getAuthConfig();
    expect(auth.isConnected).toBe(true);
    expect(auth.userEmail).toBe('admin@oskaplay.dev');

    googleDriveService.disconnectAccount();
    expect(googleDriveService.getAuthConfig().isConnected).toBe(false);
  });

  it('should list files organized across defined 5TB folder structure', async () => {
    const files = await googleDriveService.listFiles();
    expect(files.length).toBeGreaterThan(0);

    const categories = new Set(files.map((f) => f.folderCategory));
    expect(categories.has('02-APPROVED-BROWSER-BUILDS')).toBe(true);
    expect(categories.has('03-NATIVE-PC-DOWNLOADS')).toBe(true);
    expect(categories.has('01-GAME-SOURCE-LIBRARY')).toBe(true);
    expect(categories.has('06-LICENSE-DOCUMENTS')).toBe(true);
  });

  it('should stage an authorized file with SHA-256 integrity verification', async () => {
    const files = await googleDriveService.listFiles();
    const testFile = files[0];

    const job = await googleDriveService.stageFile(testFile.id);
    expect(job.status).toBe('READY');
    expect(job.progressPercent).toBe(100);
    expect(job.sha256).toBe(testFile.checksumSha256);
  });

  it('should detect duplicate files based on hash matching requirement 13', async () => {
    const files = await googleDriveService.listFiles('06-LICENSE-DOCUMENTS');
    const duplicate = files.find((f) => f.isDuplicate);
    expect(duplicate).toBeDefined();
    expect(duplicate?.duplicateOfId).toBeTruthy();
  });
});
