import React, { useState, useEffect } from 'react';
import { Game, PerformanceDiagnostics } from './types/game';
import { INITIAL_GAMES } from './modules/games/gameCatalog';
import { DeviceCapabilityDetector } from './modules/performance/DeviceBenchmark';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DeviceModal } from './components/DeviceModal';
import { HomePage } from './pages/HomePage';
import { LibraryPage } from './pages/LibraryPage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { PlayerPage } from './pages/PlayerPage';
import { MyLibraryPage } from './pages/MyLibraryPage';
import { DownloadsPage } from './pages/DownloadsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

export function App() {
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGame, setSelectedGame] = useState<Game>(INITIAL_GAMES[0]);
  const [diagnostics, setDiagnostics] = useState<PerformanceDiagnostics | null>(null);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);

  useEffect(() => {
    // Detect local device capability on startup
    DeviceCapabilityDetector.detect().then((diag) => {
      setDiagnostics(diag);
    });
  }, []);

  const handlePlayGame = (game: Game) => {
    setSelectedGame(game);
    setActiveTab('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDetails = (game: Game) => {
    setSelectedGame(game);
    setActiveTab('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddGame = (newGame: Game) => {
    setGames((prev) => [newGame, ...prev]);
  };

  const gpuDisplayText = diagnostics
    ? diagnostics.webGpuSupported
      ? 'WebGPU Active'
      : diagnostics.webGlVersion !== 'None'
      ? `${diagnostics.webGlVersion}`
      : 'Canvas Software'
    : 'Detecting GPU...';

  return (
    <div className="min-h-screen bg-[#08090d] text-slate-100 flex flex-col font-sans selection:bg-violet-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        deviceGpuText={gpuDisplayText}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'home' && (
          <HomePage
            games={games}
            onPlay={handlePlayGame}
            onDetails={handleViewDetails}
            onExploreLibrary={() => setActiveTab('library')}
            onOpenBenchmark={() => setIsBenchmarkOpen(true)}
          />
        )}

        {activeTab === 'library' && (
          <LibraryPage
            games={games}
            onPlay={handlePlayGame}
            onDetails={handleViewDetails}
          />
        )}

        {activeTab === 'details' && (
          <GameDetailsPage
            game={selectedGame}
            onPlay={handlePlayGame}
            onBack={() => setActiveTab('library')}
            onDownload={() => setActiveTab('downloads')}
          />
        )}

        {activeTab === 'player' && (
          <PlayerPage
            game={selectedGame}
            onExit={() => setActiveTab('details')}
          />
        )}

        {activeTab === 'my-library' && (
          <MyLibraryPage
            games={games}
            onPlay={handlePlayGame}
            onDetails={handleViewDetails}
          />
        )}

        {activeTab === 'downloads' && (
          <DownloadsPage
            games={games}
            onSelectGame={handleViewDetails}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            diagnostics={diagnostics}
            onOpenBenchmark={() => setIsBenchmarkOpen(true)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            games={games}
            onAddGame={handleAddGame}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Browser Hardware Diagnostic & Benchmark Modal */}
      <DeviceModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
        diagnostics={diagnostics}
        onUpdateDiagnostics={(updated) => setDiagnostics(updated)}
      />
    </div>
  );
}

export default App;
