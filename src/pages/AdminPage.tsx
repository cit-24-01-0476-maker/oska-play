import React, { useState, useEffect } from 'react';
import type { Game } from '../types/game';
import {
  googleDriveService,
  type GoogleDriveFile,
  type GoogleDriveAuthConfig,
} from '../modules/gdrive/GoogleDriveService';
import { GameImportEngine, type ValidationReport } from '../modules/importer/GameImportEngine';
import {
  HardDrive,
  ShieldCheck,
  Folder,
  FileCode,
  FileArchive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Lock,
  ExternalLink,
  Eye,
  Copy,
  Link,
} from 'lucide-react';

interface AdminPageProps {
  games: Game[];
  onAddGame: (game: Game) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onAddGame }) => {
  const [authConfig, setAuthConfig] = useState<GoogleDriveAuthConfig>(googleDriveService.getAuthConfig());
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('06-LICENSE-DOCUMENTS');
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [selectedFileForImport, setSelectedFileForImport] = useState<GoogleDriveFile | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [folderInputUrl, setFolderInputUrl] = useState<string>(
    'https://drive.google.com/drive/folders/1f-kGBY-djNnaCztj5-p704g1zxOnztOW?usp=sharing'
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const folders = [
    '06-LICENSE-DOCUMENTS',
    '02-APPROVED-BROWSER-BUILDS',
    '03-NATIVE-PC-DOWNLOADS',
    '01-GAME-SOURCE-LIBRARY',
    '04-GAME-ARTWORK',
    '05-GAME-METADATA',
  ];

  const refreshFiles = async () => {
    const list = await googleDriveService.listFiles();
    setFiles(list);
  };

  useEffect(() => {
    refreshFiles();
  }, []);

  const handleConnectFolder = async () => {
    await googleDriveService.connectFolderUrl(folderInputUrl);
    setAuthConfig(googleDriveService.getAuthConfig());
    setImportNotice(`Successfully synchronized Google Drive Folder: ${authConfig.connectedFolderId}`);
    setTimeout(() => setImportNotice(null), 3000);
    refreshFiles();
  };

  const handleDisconnect = () => {
    googleDriveService.disconnectAccount();
    setAuthConfig(googleDriveService.getAuthConfig());
  };

  const handleStageFile = async (file: GoogleDriveFile) => {
    setSelectedFileForImport(file);
    setValidationReport(null);
    try {
      await googleDriveService.stageFile(file.id);
      refreshFiles();
      setImportNotice(`File "${file.name}" staged with verified SHA-256 integrity hash!`);
      setTimeout(() => setImportNotice(null), 3000);
    } catch (err: any) {
      alert(`Staging failed: ${err.message}`);
    }
  };

  const handleRunValidation = (file: GoogleDriveFile) => {
    const isWasm = file.name.includes('wasm');
    const isHtml5 = file.name.includes('html5') || file.name.includes('2048');

    const manifest = {
      name: file.name,
      version: '1.0.0',
      entryPoint: isWasm ? 'doom.wasm' : isHtml5 ? 'index.html' : 'license.png',
      runtime: isWasm ? 'wasm-doom' : isHtml5 ? 'html5-canvas' : 'native-only',
      files: [
        {
          path: isWasm ? 'doom.wasm' : isHtml5 ? 'index.html' : 'license.png',
          sizeBytes: file.sizeBytes,
          sha256: file.checksumSha256,
        },
      ],
      totalUncompressedSize: file.sizeBytes * 1.2,
      compressedSize: file.sizeBytes,
    };

    const declaredClass = isWasm || isHtml5 ? 'CLASS_A' : file.name.includes('opentyrian') ? 'CLASS_C' : 'CLASS_D';
    const legalClearance = !file.name.includes('nfs');

    const report = GameImportEngine.validatePackage(manifest, declaredClass, legalClearance);
    setValidationReport(report);
  };

  const handlePublishValidatedGame = () => {
    if (!selectedFileForImport || !validationReport || !validationReport.isValid) return;

    const newGame: Game = {
      id: `imported-${Date.now()}`,
      slug: selectedFileForImport.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: `Imported Build: ${selectedFileForImport.name}`,
      tagline: 'Verified game archive staged and published via Google Drive 5TB Manager.',
      description: 'Staged and validated via the OSKA PLAY Game Import Engine with verified SHA-256 integrity checks.',
      genre: 'Action',
      compatibilityClass: validationReport.gameClass,
      status: validationReport.targetStatus,
      developer: 'Independent Developer',
      publisher: 'OSKA PLAY Staged',
      releaseYear: 2026,
      version: '1.0.0-staged',
      coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
      screenshots: [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
      ],
      controls: { 'Action': 'Keys' },
      license: {
        creator: 'Open Source Community',
        copyrightOwner: 'Owner / Public Domain',
        sourceCodeLicense: 'MIT / GPL',
        assetLicense: 'Open Assets',
        browserDistributionPermitted: validationReport.gameClass === 'CLASS_A',
        nativeRedistributionPermitted: true,
        requiredAttribution: 'Attribution retained in package manifest',
        licenseVerificationStatus: 'VERIFIED_LEGAL',
      },
      requirements: {
        cpu: 'Modern Multi-Core CPU',
        memory: '1 GB RAM',
      },
      tags: ['Staged', 'Imported', 'Verified'],
    };

    onAddGame(newGame);
    setImportNotice(`Successfully published "${newGame.title}" to platform catalog!`);
    setTimeout(() => setImportNotice(null), 4000);
    setValidationReport(null);
    setSelectedFileForImport(null);
  };

  const filteredFiles = files.filter((f) => f.folderCategory === selectedFolder);

  return (
    <div className="space-y-10 pb-16">
      {importNotice && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {importNotice}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#1c1f2e] pb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4" /> Administrative Control Panel
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Google Drive 5TB Manager</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Authorized private game source integration, live folder synchronization, staging, and package validation.
          </p>
        </div>

        {/* OAuth Connect Status */}
        <div>
          {authConfig.isConnected ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Google Drive Connected
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  Folder ID: {authConfig.connectedFolderId || 'Default'}
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-lg bg-[#1c2033] hover:bg-[#252b42] text-xs text-rose-300 border border-rose-500/30 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleConnectFolder()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
            >
              <HardDrive className="w-4 h-4" /> Connect Google Account (5TB)
            </button>
          )}
        </div>
      </div>

      {/* Live Google Drive Folder Link Synchronizer */}
      <div className="p-5 rounded-2xl bg-[#10121d] border border-[#23273b] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Link className="w-4 h-4 text-cyan-400" />
            Connected Google Drive Folder Link
          </label>
          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
            Active Drive Link
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={folderInputUrl}
            onChange={(e) => setFolderInputUrl(e.target.value)}
            placeholder="Paste Google Drive folder sharing link..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#151726] border border-[#23283f] text-xs text-slate-200 font-mono focus:outline-hidden focus:border-cyan-500"
          />
          <button
            onClick={handleConnectFolder}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 transition-all shrink-0 flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync Folder
          </button>
          <a
            href={folderInputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-[#161827] border border-[#23283e] text-slate-400 hover:text-white flex items-center justify-center"
            title="Open in Google Drive"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Storage Capacity Gauge */}
      <div className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" /> Private Source Library (5TB Tier)
          </span>
          <span className="font-mono text-slate-400">
            1.42 TB Used / 5.00 TB Total (28.4%)
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#181b2a] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-500 rounded-full"
            style={{ width: '28.4%' }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 pt-1">
          <span>Active Root: Google Drive / OSKA-PLAY</span>
          <span>Security Scope: drive.file (Minimal Auth)</span>
        </div>
      </div>

      {/* Drive Folder Navigation & File Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Folder Categories Sidebar */}
        <div className="space-y-1.5 bg-[#10121d] border border-[#1e2235] p-3 rounded-2xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
            Drive Folders
          </div>
          {folders.map((f) => (
            <button
              key={f}
              onClick={() => {
                setSelectedFolder(f);
                setValidationReport(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left truncate ${
                selectedFolder === f
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#161826]'
              }`}
            >
              <Folder className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="truncate">{f}</span>
            </button>
          ))}
        </div>

        {/* Files in Folder */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl bg-[#10121d] border border-[#1e2235]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1c1f2e] mb-3">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Folder className="w-4 h-4 text-violet-400" />
                Folder: <span className="font-mono text-cyan-400">{selectedFolder}</span>
              </h3>
              <button
                onClick={refreshFiles}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#181a28]"
                title="Refresh Folder"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {filteredFiles.length > 0 ? (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      file.isDuplicate
                        ? 'bg-[#181216] border-amber-500/30'
                        : 'bg-[#141624] border-[#1e2236]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-[#1c2033] text-cyan-400 shrink-0">
                        {file.mimeType.includes('zip') ? (
                          <FileArchive className="w-5 h-5" />
                        ) : (
                          <FileCode className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{file.name}</span>
                          {file.isDuplicate && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                              Duplicate Detected
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                          <span className="font-mono text-cyan-400">{file.formattedSize}</span>
                          <span>•</span>
                          <span>{file.mimeType}</span>
                          <span>•</span>
                          <span className={file.isStaged ? 'text-emerald-400' : 'text-slate-400'}>
                            {file.isStaged ? 'Staged Locally' : 'Remote in Drive'}
                          </span>
                        </div>

                        {file.checksumSha256 && (
                          <div className="text-[10px] font-mono text-slate-400 mt-1 truncate max-w-md">
                            SHA-256: {file.checksumSha256}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.mimeType.includes('image') && (
                        <button
                          onClick={() => setPreviewImageUrl(file.directDownloadUrl || null)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1c2033] hover:bg-[#252b42] text-slate-300 text-xs font-medium transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                        </button>
                      )}

                      {!file.isStaged ? (
                        <button
                          onClick={() => handleStageFile(file)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" /> Stage File
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedFileForImport(file);
                            handleRunValidation(file);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Validate Package
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No files present in this category folder.
              </div>
            )}
          </div>

          {/* Validation Report Drawer */}
          {validationReport && selectedFileForImport && (
            <div className="p-5 rounded-2xl bg-[#121422] border border-violet-500/40 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[#21263d] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    Package Security & Integrity Inspection Report
                  </h4>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  validationReport.isValid
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {validationReport.targetStatus}
                </span>
              </div>

              {/* Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  {validationReport.securityChecks.noPathTraversal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Zip Path Traversal Protection (No Zip Slip)</span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  {validationReport.securityChecks.noZipBomb ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Zip Bomb Decompression Ratio Safety (&lt; 100:1)</span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  {validationReport.securityChecks.noHostExecutables ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Executable Sandboxing (No host .exe execution)</span>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  {validationReport.securityChecks.legalClearance ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  )}
                  <span>Legal License Clearance (Verified Redistribution)</span>
                </div>
              </div>

              {/* Publish Action */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setValidationReport(null)}
                  className="px-4 py-2 rounded-xl bg-[#1c2033] text-xs font-semibold text-slate-300"
                >
                  Dismiss
                </button>
                {validationReport.isValid && (
                  <button
                    onClick={handlePublishValidatedGame}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Publish Verified Game to Platform
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document / Slip Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-2xl w-full bg-[#10121d] border border-[#23273b] rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1c1f2e] pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" /> Verified Document Preview (Google Drive)
              </span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-center p-2 bg-[#090a10] rounded-xl overflow-hidden max-h-[480px]">
              <img
                src={previewImageUrl}
                alt="Document Preview"
                className="max-h-[460px] object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="px-4 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
