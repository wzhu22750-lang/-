import { motion } from 'motion/react';
import { Trophy, Target, X, Swords } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onCompareH2H?: (p1Id: string, p2Id: string) => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onCompareH2H }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  const playerMatches = matches.filter(
    (m) => (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id),
  );
  const weeklyMatches = playerMatches.filter((m) => m.date >= startOfThisWeek);

  const getStats = (matchList: Match[]) => {
    let sW = 0;
    let sL = 0;
    let dW = 0;
    let dL = 0;
    const opps: Record<string, number> = {};
    matchList.forEach((m) => {
      const isT1 = (m.team1 || []).includes(player.id);
      const isSingles = m.type === 'Singles' || (m.team1 || []).length === 1;
      let g1 = 0;
      let g2 = 0;
      (m.scores || []).forEach((s) => {
        if (s.team1 > s.team2) g1++;
        else g2++;
      });
      const won = isT1 ? g1 > g2 : g2 > g1;
      if (isSingles) {
        won ? sW++ : sL++;
      } else {
        won ? dW++ : dL++;
      }
      const oppTeam = isT1 ? m.team2 || [] : m.team1 || [];
      oppTeam.forEach((oid) => (opps[oid] = (opps[oid] || 0) + 1));
    });
    return { sW, sL, dW, dL, opps };
  };

  const allStats = getStats(playerMatches);
  const weekStats = getStats(weeklyMatches);
  const totalWins = allStats.sW + allStats.dW;
  const totalMatches = playerMatches.length;
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  const allPlayersSorted = [...players].sort(
    (a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500),
  );
  const clubRank = allPlayersSorted.findIndex((p) => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const eloRating = player.elo_rating || 1500;
  const hasOpponents = topOpponents.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center sm:px-4"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative flex w-full max-w-lg flex-col overflow-hidden bg-neutral-50 shadow-2xl sm:max-h-[92vh] sm:rounded-[36px]"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        {/* ================================================================
            HEADER — dark gradient with decorative circles, avatar, name, ELO
            ================================================================ */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-900 px-6 pb-9 pt-14">
          {/* Decorative concentric circles (echoing H2HHero's design language) */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[32px] border-white" />
            <div className="absolute -left-14 bottom-6 h-36 w-36 rounded-full border-[14px] border-white" />
          </div>

          {/* Close button — top right, respecting safe area */}
          <button
            onClick={onClose}
            className="absolute right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/60 transition-all active:scale-90 hover:bg-white/20 hover:text-white"
            style={{ top: 'max(env(safe-area-inset-top), 16px)' }}
            aria-label="关闭"
          >
            <X size={17} />
          </button>

          {/* Avatar, name, ELO badge — centered */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Avatar */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-[3px] border-white/10 bg-neutral-700 shadow-2xl">
              {player.avatar ? (
                <img
                  src={player.avatar}
                  className="h-full w-full object-cover"
                  alt={player.name}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[26px] font-black text-white/20">
                  {player.initials}
                </div>
              )}
            </div>

            {/* Name */}
            <h1 className="mt-4 text-center text-2xl font-black leading-tight tracking-tight text-white">
              {player.name}
            </h1>

            {/* ELO badge */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-600/15 px-3.5 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
                ELO
              </span>
              <span className="text-base font-black leading-none text-white">
                {eloRating}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================
            SCROLLABLE BODY — stats, records, opponents
            ================================================================ */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          <div className="space-y-4 px-5 py-5">
            {/* ---- Rank + ELO detail cards ---- */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Trophy size={20} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-none text-neutral-800">
                    {clubRank}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    俱乐部排名
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                  <Target size={20} className="text-red-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black leading-none text-neutral-800">
                    {eloRating}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    ELO 战力
                  </p>
                </div>
              </div>
            </div>

            {/* ---- 4-up mini stat grid ---- */}
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="总胜率" value={`${winRate}%`} highlight />
              <MiniStat label="本周胜场" value={weekStats.sW + weekStats.dW} />
              <MiniStat label="生涯胜场" value={totalWins} />
              <MiniStat label="总场次" value={totalMatches} />
            </div>

            {/* ---- Singles / Doubles record card ---- */}
            <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
              <RecordRow
                label="单打"
                win={allStats.sW}
                loss={allStats.sL}
                variant="singles"
              />
              <RecordRow
                label="双打"
                win={allStats.dW}
                loss={allStats.dL}
                variant="doubles"
              />
            </div>

            {/* ---- Empty state when no records exist ---- */}
            {totalMatches === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-white py-10">
                <Target size={28} className="text-neutral-300" />
                <p className="mt-2 text-sm font-bold text-neutral-400">暂无比赛记录</p>
                <p className="mt-0.5 text-xs text-neutral-300">参加比赛后将在此显示数据</p>
              </div>
            )}

            {/* ---- Top opponents ---- */}
            {hasOpponents && (
              <div className="pb-1">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-neutral-800">
                    <Swords size={13} className="text-neutral-400" />
                    主要对手
                  </h3>
                  <span className="text-[10px] font-medium text-neutral-400">
                    点击查看 H2H 对比
                  </span>
                </div>

                <div className="flex gap-4 overflow-x-auto px-1 pb-2 no-scrollbar">
                  {topOpponents.map(([oid, count]) => {
                    const opp = players.find((p) => p.id === oid);
                    if (!opp) return null;
                    return (
                      <motion.button
                        key={oid}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => onCompareH2H?.(player.id, opp.id)}
                        className="group flex shrink-0 flex-col items-center"
                      >
                        <div className="h-16 w-16 overflow-hidden rounded-full bg-white shadow-sm ring-2 ring-neutral-100 transition-all group-hover:ring-red-400 group-active:ring-red-500">
                          {opp.avatar ? (
                            <img
                              src={opp.avatar}
                              className="h-full w-full object-cover"
                              alt={opp.name}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-sm font-black text-neutral-400">
                              {opp.initials}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 max-w-[72px] truncate text-center text-[11px] font-bold leading-tight text-neutral-700">
                          {opp.name}
                        </p>
                        <p className="mt-0.5 text-[10px] font-medium text-neutral-400">
                          {count} 场
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom breathing room so content doesn't sit against the close button */}
            <div className="h-2" />
          </div>
        </div>

        {/* ================================================================
            FOOTER — close button
            ================================================================ */}
        <div className="shrink-0 bg-neutral-50 px-5 pb-7 pt-1">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-red-600 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-red-600/15 transition-colors active:bg-red-800 hover:bg-red-700"
          >
            关闭
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  MiniStat — compact stat cell                                       */
/* ------------------------------------------------------------------ */
function MiniStat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3 shadow-sm ${
        highlight
          ? 'border-red-100 bg-red-50/60'
          : 'border-neutral-100 bg-white'
      }`}
    >
      <p
        className={`text-lg font-black italic leading-none ${
          highlight ? 'text-red-500' : 'text-neutral-800'
        }`}
      >
        {value}
      </p>
      <p className="text-center text-[9px] font-bold uppercase leading-tight tracking-tighter text-neutral-400">
        {label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  RecordRow — singles / doubles breakdown with animated progress bar */
/* ------------------------------------------------------------------ */
function RecordRow({
  label,
  win,
  loss,
  variant,
}: {
  label: string;
  win: number;
  loss: number;
  variant: 'singles' | 'doubles';
}) {
  const total = win + loss;
  const rate = total > 0 ? Math.round((win / total) * 100) : 0;
  const barPct = total > 0 ? (win / total) * 100 : 0;

  return (
    <div className="border-b border-neutral-50 px-4 py-3.5 last:border-0">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Type badge */}
          <span
            className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white ${
              variant === 'singles' ? 'bg-red-500' : 'bg-neutral-700'
            }`}
          >
            {label}
          </span>

          {/* Win / Loss text */}
          <span className="text-xs font-bold text-neutral-500">
            <span className="text-neutral-700">{win}</span>
            <span className="mx-0.5 font-medium text-neutral-300">胜</span>
            <span className="text-neutral-700">{loss}</span>
            <span className="font-medium text-neutral-300">负</span>
          </span>
        </div>

        {/* Win rate percentage */}
        <span className="text-sm font-black tabular-nums text-neutral-700">
          {rate}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
          className={`h-full rounded-full ${
            variant === 'singles' ? 'bg-red-400' : 'bg-neutral-600'
          }`}
        />
      </div>
    </div>
  );
}
