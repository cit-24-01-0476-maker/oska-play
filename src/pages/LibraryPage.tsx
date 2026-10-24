import React, { useState, useMemo } from 'react';
import { Game } from '../types/game';
import { GameCard } from '../components/GameCard';
import { Search, SlidersHorizontal, Compass, Sparkles } from 'lucide-react';

interface LibraryPageProps {
  games: Game[];
  onPlay: (game: Game) => void;
  onDetails: (game: Game) => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ games, onPlay, onDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGenre, setSelectedGenre] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'year' | 'title'>('featured');

  const availableGenres = useMemo(() => {
    return ['ALL', ...Array.from(new Set(games.map((g) => g.genre)))];
  }, [games]);

  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesSearch =
          game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesClass =
          selectedClass === 'ALL' || game.compatibilityClass === selectedClass;

        const matchesGenre =
          selectedGenre === 'ALL' || game.genre === selectedGenre;

        return matchesSearch && matchesClass && matchesGenre;
      })
      .sort((a, b) => {
        if (sortBy === 'year') return b.releaseYear - a.releaseYear;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        // Featured
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [games, searchQuery, selectedClass, selectedGenre, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1c1f2e] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" /> Global Catalog
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Game Library</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Browse verified browser-playable games, native PC downloads, and compliance records.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <span className="font-bold text-violet-400">{filteredGames.length}</span> of {games.length} games
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#10121d] border border-[#1e2235] p-4 rounded-2xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, genre, developer, or WASM technology..."
            className="w-full pl-10 pr-4 py-2 bg-[#161827] border border-[#23283e] rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-400 focus:outline-hidden focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Class filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            aria-label="Filter by compatibility class"
            className="px-3 py-2 bg-[#161827] border border-[#23283e] rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-violet-500"
          >
            <option value="ALL">All Compatibility Classes</option>
            <option value="CLASS_A">Class A: Browser Ready</option>
            <option value="CLASS_B">Class B: Source Available</option>
            <option value="CLASS_C">Class C: PC Download Only</option>
            <option value="CLASS_D">Class D: License Restricted</option>
          </select>

          {/* Genre filter */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            aria-label="Filter by genre"
            className="px-3 py-2 bg-[#161827] border border-[#23283e] rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-violet-500"
          >
            {availableGenres.map((genre) => (
              <option key={genre} value={genre}>
                {genre === 'ALL' ? 'All Genres' : genre}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort library"
            className="px-3 py-2 bg-[#161827] border border-[#23283e] rounded-xl text-xs text-slate-300 focus:outline-hidden focus:border-violet-500"
          >
            <option value="featured">Sort: Featured First</option>
            <option value="year">Sort: Release Year</option>
            <option value="title">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Game Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onPlay={onPlay}
              onDetails={onDetails}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-[#10121d] border border-[#1e2235] rounded-2xl p-8">
          <p className="text-base font-semibold text-slate-300 mb-2">No games matched your query</p>
          <p className="text-xs text-slate-400 mb-4">
            Try adjusting your search terms or clearing your class filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedClass('ALL');
              setSelectedGenre('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
