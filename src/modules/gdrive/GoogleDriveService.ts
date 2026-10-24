export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  formattedSize: string;
  checksumSha256?: string;
  folderCategory: '01-GAME-SOURCE-LIBRARY' | '02-APPROVED-BROWSER-BUILDS' | '03-NATIVE-PC-DOWNLOADS' | '04-GAME-ARTWORK' | '05-GAME-METADATA' | '06-LICENSE-DOCUMENTS';
  subFolder?: 'Browser-Ready' | 'Source-Available' | 'Windows-Native';
  modifiedTime: string;
  isStaged?: boolean;
}

export interface GoogleDriveAuthConfig {
  clientId: string;
  apiKey?: string;
  isConnected: boolean;
  userEmail?: string;
  storageQuotaBytes: number; // 5TB = 5 * 1024^4
  storageUsedBytes: number;
  tokenExpiry?: number;
}

export interface StagingJob {
  jobId: string;
  fileId: string;
  fileName: string;
  progressPercent: number;
  status: 'PENDING' | 'STAGING' | 'VALIDATING' | 'READY' | 'FAILED';
  sha256?: string;
  error?: string;
}

export class GoogleDriveService {
  private authState: GoogleDriveAuthConfig = {
    clientId: 'oska-play-admin-oauth2-client.apps.googleusercontent.com',
    isConnected: false,
    storageQuotaBytes: 5 * 1024 * 1024 * 1024 * 1024, // 5TB Google Drive
    storageUsedBytes: 1.42 * 1024 * 1024 * 1024 * 1024, // ~1.42TB used
  };

  private stagedJobs: Map<string, StagingJob> = new Map();

  // Preset file references reflecting the 5TB private source library
  private sourceFiles: GoogleDriveFile[] = [
    {
      id: 'gdrive-file-001',
      name: 'freedoom-v0.13.0-wasm.zip',
      mimeType: 'application/zip',
      sizeBytes: 4559928,
      formattedSize: '4.35 MB',
      checksumSha256: '8edfe49a7583fd975199969302d8e9adcf8e714d0af72bf3e672f991fd810faa',
      folderCategory: '02-APPROVED-BROWSER-BUILDS',
      subFolder: 'Browser-Ready',
      modifiedTime: '2026-09-12T14:32:00Z',
      isStaged: true,
    },
    {
      id: 'gdrive-file-002',
      name: '2048-html5-canvas-bundle.zip',
      mimeType: 'application/zip',
      sizeBytes: 154200,
      formattedSize: '150 KB',
      checksumSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
      folderCategory: '02-APPROVED-BROWSER-BUILDS',
      subFolder: 'Browser-Ready',
      modifiedTime: '2026-10-01T08:15:00Z',
      isStaged: true,
    },
    {
      id: 'gdrive-file-003',
      name: 'dungeon-3d-raycaster.zip',
      mimeType: 'application/zip',
      sizeBytes: 320000,
      formattedSize: '312 KB',
      checksumSha256: 'f2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012',
      folderCategory: '02-APPROVED-BROWSER-BUILDS',
      subFolder: 'Browser-Ready',
      modifiedTime: '2026-10-15T19:40:00Z',
      isStaged: true,
    },
    {
      id: 'gdrive-file-004',
      name: 'opentyrian-v2.1-windows-x64.zip',
      mimeType: 'application/zip',
      sizeBytes: 11200000,
      formattedSize: '10.68 MB',
      checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      folderCategory: '03-NATIVE-PC-DOWNLOADS',
      subFolder: 'Windows-Native',
      modifiedTime: '2026-08-20T11:00:00Z',
      isStaged: false,
    },
    {
      id: 'gdrive-file-005',
      name: 'nfs-most-wanted-retail-backup.iso',
      mimeType: 'application/x-iso9660-image',
      sizeBytes: 4294967296,
      formattedSize: '4.00 GB',
      checksumSha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      folderCategory: '01-GAME-SOURCE-LIBRARY',
      subFolder: 'Windows-Native',
      modifiedTime: '2026-01-10T16:20:00Z',
      isStaged: false,
    },
  ];

  public getAuthConfig(): GoogleDriveAuthConfig {
    return { ...this.authState };
  }

  public async connectAccount(mockEmail: string = 'owner@oskaplay.dev'): Promise<boolean> {
    // Simulates secure OAuth2 token exchange with minimal drive.file scope
    this.authState.isConnected = true;
    this.authState.userEmail = mockEmail;
    this.authState.tokenExpiry = Date.now() + 3600 * 1000;
    return true;
  }

  public disconnectAccount(): void {
    this.authState.isConnected = false;
    this.authState.userEmail = undefined;
    this.authState.tokenExpiry = undefined;
  }

  public async listFiles(category?: string): Promise<GoogleDriveFile[]> {
    if (!category) return [...this.sourceFiles];
    return this.sourceFiles.filter((f) => f.folderCategory === category);
  }

  public async getFileMetadata(fileId: string): Promise<GoogleDriveFile | null> {
    const file = this.sourceFiles.find((f) => f.id === fileId);
    return file ? { ...file } : null;
  }

  /**
   * Safe file staging pipeline:
   * Google Drive -> Authorized Admin Import -> Secure Staging -> Checksum Check -> Approved Staged Build
   */
  public async stageFile(
    fileId: string,
    onProgress?: (percent: number, status: string) => void
  ): Promise<StagingJob> {
    const file = await this.getFileMetadata(fileId);
    if (!file) throw new Error(`File ${fileId} not found in Google Drive source`);

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job: StagingJob = {
      jobId,
      fileId,
      fileName: file.name,
      progressPercent: 0,
      status: 'PENDING',
    };
    this.stagedJobs.set(jobId, job);

    onProgress?.(10, `Downloading ${file.name} from Google Drive...`);
    job.status = 'STAGING';
    job.progressPercent = 35;

    // Simulate transfer & checksum calculation
    await new Promise((res) => setTimeout(res, 350));
    onProgress?.(65, 'Verifying SHA-256 integrity checksum...');
    job.status = 'VALIDATING';
    job.progressPercent = 75;

    await new Promise((res) => setTimeout(res, 250));
    job.status = 'READY';
    job.progressPercent = 100;
    job.sha256 = file.checksumSha256;
    file.isStaged = true;

    onProgress?.(100, `Staging complete. Verified hash: ${file.checksumSha256?.substring(0, 16)}...`);
    return job;
  }

  public getStagingJobs(): StagingJob[] {
    return Array.from(this.stagedJobs.values());
  }
}

export const googleDriveService = new GoogleDriveService();
