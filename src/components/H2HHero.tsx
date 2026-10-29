import { motion } from 'motion/react';
import { Plus, User, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { Player } from '../types';

interface H2HHeroProps {
  stats: { t1Wins: number; t2Wins: number; total: number };
  team1Names: string;
  team2Names: string;
  onSelectTeam1: () => void;
  onSelectTeam2: () => void;
  onSwapTeams?: () => void;
  onClearTeams?: () => void;
  onViewProfile: (p: Player) => void;
  team1Empty: boolean;
  team2Empty: boolean;
  team1Players: Player[];
  team2Players: Player[];
  mode?: 'club' | 'tournament';
}

export function H2HHero({
  stats,
  team1Names,
  team2Names,
  onSelectTeam1,
  onSelectTeam2,
  onSwapTeams,
  onClearTeams,
  onViewProfile,
  team1Empty,
  team2Empty,
  team1Players,
  team2Players,
  mode,
}: H2HHeroProps) {
  const isTournament = mode === 'tournament';
  const hasSelection = !team1Empty || !team2Empty;

  const t1AvgElo =
    team1Players.length > 0
      ? Math.round(team1Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team1Players.length)
      : null;
  const t2AvgElo =
    team2Players.length > 0
      ? Math.round(team2Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team2Players.length)
      : null;

  const t1WinPct = stats.total > 0 ? Math.round((stats.t1Wins / stats.total) * 100) : 50;
  const t2WinPct = stats.total > 0 ? 100 - t1WinPct : 50;

  const renderAvatars = (players: Player[], side: 'left' | 'right') => {
    if (players.length === 0) {
      return (
        <div className="w-12 h-12 rounded-full bg-neutral-100 border border-dashed border-neutral-200 flex items-center justify-center text-neutral-400">
          <User size={20} />
        </div>
      );
    }

    return (
      <div className={`flex ${side === 'left' ? 'flex-row' : 'flex-row-reverse'} -space-x-3`}>
        {players.map((p, i) => (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.08, zIndex: 10 }}
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.stopPropagation();
              onViewProfile(p);
            }}
            className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden border-2 border-white shadow-md relative"
            style={{ zIndex: players.length - i }}
          >
            {p.avatar ? (
              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-600 font-display font-extrabold text-sm">
                {p.initials}
              </div>
            )}
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`rounded-[28px] p-5 sm:p-6 text-white overflow-hidden relative shadow-xl ${
        isTournament
          ? 'bg-gradient-to-br from-[#f59e0b] to-[#b45309] shadow-amber-600/20'
          : 'bg-gradient-to-br from-[#e11d48] to-[#be123c] shadow-red-600/20'
      }`}
    >
      {/* Background decoration */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Control Strip */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-white/90 bg-white/15 px-2.5 py-1 rounded-lg border border-white/15 backdrop-blur-xs">
            H2H 交锋档案
          </span>
          {stats.total > 0 && (
            <span className="text-xs font-bold text-white/85 tabular-nums">
              共交手 {stats.total} 场
            </span>
          )}
        </div>

        {hasSelection && (
          <div className="flex items-center gap-1.5">
            {onSwapTeams && (
              <button
                onClick={onSwapTeams}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg border border-white/15 transition-colors"
                title="互换 1/2 队"
              >
                <ArrowLeftRight size={12} />
                <span>互换</span>
              </button>
            )}
            {onClearTeams && (
              <button
                onClick={onClearTeams}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white/85 hover:text-white bg-white/15 hover:bg-white/25 px-2.5 py-1.5 rounded-lg border border-white/15 transition-colors"
                title="清空已选球员"
              >
                <RotateCcw size={12} />
                <span>重置</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Win Score Readout */}
      <div className="relative z-10 flex items-center justify-center gap-6 sm:gap-10 my-4">
        <div className="text-center">
          <motion.div
            key={`t1-${stats.t1Wins}`}
            initial={{ scale: 0.88, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-6xl sm:text-7xl font-black tracking-tight tabular-nums leading-none drop-shadow-sm"
          >
            {stats.t1Wins}
          </motion.div>
          <p className="text-[11px] font-bold text-white/80 mt-1.5">队伍 1 胜场</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-display text-xs font-black border border-white/30 tracking-wider shadow-inner">
            VS
          </div>
        </div>

        <div className="text-center">
          <motion.div
            key={`t2-${stats.t2Wins}`}
            initial={{ scale: 0.88, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            className="font-display text-6xl sm:text-7xl font-black tracking-tight tabular-nums leading-none drop-shadow-sm"
          >
            {stats.t2Wins}
          </motion.div>
          <p className="text-[11px] font-bold text-white/80 mt-1.5">队伍 2 胜场</p>
        </div>
      </div>

      {/* Win Rate Tug-of-War Bar */}
      {stats.total > 0 && (
        <div className="relative z-10 mb-5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono font-bold tabular-nums text-white/90">
            <span>{t1WinPct}% 胜率</span>
            <span>{t2WinPct}% 胜率</span>
          </div>
          <div className="h-2 rounded-full bg-black/20 overflow-hidden flex gap-0.5 p-0.5">
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${t1WinPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full bg-white rounded-l-full"
            />
            <motion.div
              initial={{ width: '50%' }}
              animate={{ width: `${t2WinPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="h-full bg-blue-400 rounded-r-full"
            />
          </div>
        </div>
      )}

      {/* Team Selector Cards */}
      <div className="relative z-10 grid grid-cols-2 gap-3">
        {/* Team 1 */}
        <motion.div
          role="button"
          tabIndex={0}
          onClick={onSelectTeam1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectTeam1();
          }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-[20px] p-4 text-neutral-900 shadow-lg flex flex-col justify-between min-h-[136px] cursor-pointer border-t-4 border-t-red-500 text-left group"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono font-bold text-red-600 uppercase tracking-wider">
                队伍 1
              </span>
              {t1AvgElo && (
                <span className="text-[11px] font-mono font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md tabular-nums">
                  ELO {t1AvgElo}
                </span>
              )}
            </div>
            {renderAvatars(team1Players, 'left')}
          </div>

          <div className="mt-3 flex items-center justify-between gap-1">
            <p
              className={`font-bold truncate text-sm sm:text-base leading-tight ${
                team1Empty ? 'text-neutral-400' : 'text-neutral-900'
              }`}
            >
              {team1Empty ? '选择球员' : team1Names}
            </p>
            <div className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-red-50 flex items-center justify-center text-neutral-400 group-hover:text-red-600 shrink-0 transition-colors">
              <Plus size={14} />
            </div>
          </div>
        </motion.div>

        {/* Team 2 */}
        <motion.div
          role="button"
          tabIndex={0}
          onClick={onSelectTeam2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectTeam2();
          }}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-[20px] p-4 text-neutral-900 shadow-lg flex flex-col justify-between min-h-[136px] cursor-pointer border-t-4 border-t-blue-500 text-right group"
        >
          <div className="flex justify-between items-start flex-row-reverse gap-2">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                队伍 2
              </span>
              {t2AvgElo && (
                <span className="text-[11px] font-mono font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md tabular-nums">
                  ELO {t2AvgElo}
                </span>
              )}
            </div>
            {renderAvatars(team2Players, 'right')}
          </div>

          <div className="mt-3 flex items-center justify-between flex-row-reverse gap-1">
            <p
              className={`font-bold truncate text-sm sm:text-base leading-tight ${
                team2Empty ? 'text-neutral-400' : 'text-neutral-900'
              }`}
            >
              {team2Empty ? '选择球员' : team2Names}
            </p>
            <div className="w-6 h-6 rounded-full bg-neutral-100 group-hover:bg-blue-50 flex items-center justify-center text-neutral-400 group-hover:text-blue-600 shrink-0 transition-colors">
              <Plus size={14} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
