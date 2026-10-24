import React, { useEffect, useState } from 'react';
import { Game, SaveMetadata } from '../types/game';
import { saveManager } from '../modules/storage/SaveManager';
import { GameCard } from '../components/GameCard';
import { Bookmark, HardDrive, Trash2, Download, Upload, Clock, CheckCircle } from 'lucide-react';

interface MyLibraryPageProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onDetails: (game: Game) => void;
}

export const MyLibraryPage: React.FC<MyLibraryPageProps> = ({ games, onPlay, onDetails }) => {
  const [saves, setSaves] = useState<SaveMetadata[]>([]);
  const [loadingSaves, setLoadingSaves] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playable games as user's primary collection
  const myCollection = games.filter((g) => g.status === 'PLAY_READY');

  const refreshSaves = async () => {
    setLoadingSaves(true);
    try {
      const allSaves: SaveMetadata[] = [];
      for (const g of games) {
        const gameSaves = await saveManager.listSavesForGame(g.id);
        allSaves.push(...gameSaves);
      }
      setSaves(allSaves);
    } finally {
      setLoadingSaves(false);
    }
  };

  useEffect(() => {
    refreshSaves();
  }, [games]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteSave = async (gameId: string, slotId: string) => {
    if (confirm(`Delete save "${slotId}"? This action cannot be undone.`)) {
      await saveManager.deleteSave(gameId, slotId);
      showToast('Save deleted successfully');
      refreshSaves();
    }
  };

  const handleExportSave = async (gameId: string, slotId: string) => {
    try {
      const jsonStr = await saveManager.exportSaveJson(gameId, slotId);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oska_save_${gameId}_${slotId}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Save exported to file');
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleImportSaveFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        await saveManager.importSaveJson(text);
        showToast('Save imported successfully into IndexedDB!');
        refreshSaves();
      } catch (err: any) {
        alert(`Failed to import save: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 pb-16">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-[#1c1f2e] pb-6">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">
          <Bookmark className="w-4 h-4" /> Player Library & Persistence
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">My Library & Saves</h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Manage your browser games, IndexedDB progress checkpoints, and exportable saves.
        </p>
      </div>

      {/* Active Games */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          Ready to Continue Playing
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myCollection.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlay} onDetails={onDetails} />
          ))}
        </div>
      </section>

      {/* IndexedDB Game Saves Section */}
      <section className="p-6 rounded-2xl bg-[#10121d] border border-[#1e2235] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c1f2e] pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              IndexedDB Persistent Game Saves
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Saves are kept isolated in your browser's private local storage database
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161827] hover:bg-[#1f2235] text-slate-300 border border-[#23283e] text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import Save File (.json)
            <input type="file" accept=".json" onChange={handleImportSaveFile} className="hidden" />
          </label>
        </div>

        {loadingSaves ? (
          <div className="text-xs text-slate-500 py-6 text-center">Reading storage quota & save slots...</div>
        ) : saves.length > 0 ? (
          <div className="space-y-3">
            {saves.map((s) => (
              <div
                key={`${s.gameId}-${s.slotId}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#141724] border border-[#1e2338] gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{s.saveName}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="font-mono text-cyan-400">Game: {s.gameId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(s.timestamp).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span>{(s.dataSizeBytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportSave(s.gameId, s.slotId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1c2033] hover:bg-[#252a42] text-xs text-slate-300 font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> Export
                  </button>
                  <button
                    onClick={() => handleDeleteSave(s.gameId, s.slotId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Save Slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-xs">
            No save games recorded in IndexedDB yet. Save progress within Freedoom or 2048 to see checkpoints here.
          </div>
        )}
      </section>
    </div>
  );
};
