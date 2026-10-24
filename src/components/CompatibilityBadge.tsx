import React from 'react';
import { GameCompatibilityClass, GameStatus } from '../types/game';

interface Props {
  compatibilityClass: GameCompatibilityClass;
  status: GameStatus;
  showDetails?: boolean;
}

export const CompatibilityBadge: React.FC<Props> = ({ compatibilityClass, status, showDetails = false }) => {
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = 'Class A: Browser Ready';
  let desc = 'Executes locally in browser via WebAssembly/Canvas';

  if (compatibilityClass === 'CLASS_B') {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    label = 'Class B: Port Candidate';
    desc = 'Source-available PC game requiring WebAssembly porting';
  } else if (compatibilityClass === 'CLASS_C') {
    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    label = 'Class C: PC Download';
    desc = 'Windows Native PC executable (Direct download)';
  } else if (compatibilityClass === 'CLASS_D' || status === 'BLOCKED_LICENSE') {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    label = 'Class D: Restricted';
    desc = 'Proprietary or unverified license (Browser play prohibited)';
  }

  return (
    <div className="inline-flex flex-col">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {label}
      </span>
      {showDetails && <span className="text-[11px] text-slate-400 mt-1">{desc}</span>}
    </div>
  );
};
