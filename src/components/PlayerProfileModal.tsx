import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronRight, Activity, Clock } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek, getPlayerTier, getLastMatchDate } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onCompareH2H?: (p1Id: string, p2Id: string) => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onCompareH2H }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  // --- Data calculations (unchanged) ---
  const playerMatches = matches.filter(m => (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id));
  const weeklyMatches = playerMatches.filter(m => m.date >= startOfThisWeek);

  const getStats = (matchList: Match[]) => {
    let sW = 0; let sL = 0; let dW = 0; let dL = 0;
    const opps: Record<string, number> = {};
    matchList.forEach(m => {
      const isT1 = (m.team1 || []).includes(player.id);
      const isSingles = m.type === 'Singles' || (m.team1 || []).length === 1;
      let g1 = 0; let g2 = 0;
      (m.scores || []).forEach(s => { if (s.team1 > s.team2) g1++; else g2++; });
      const won = isT1 ? g1 > g2 : g2 > g1;

      if (isSingles) { won ? sW++ : sL++; } else { won ? dW++ : dL++; }
      const oppTeam = isT1 ? (m.team2 || []) : (m.team1 || []);
      oppTeam.forEach(oid => opps[oid] = (opps[oid] || 0) + 1);
    });
    return { sW, sL, dW, dL, opps };
  };

  const allStats = getStats(playerMatches);
  const weekStats = getStats(weeklyMatches);
  const totalWins = allStats.sW + allStats.dW;
  const winRate = playerMatches.length > 0 ? Math.round((totalWins / playerMatches.length) * 100) : 0;

  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex(p => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 5);

  const tier = getPlayerTier(player.elo_rating || 1500);
  const lastMatchDate = getLastMatchDate(player.id, matches);
  const isInactive = lastMatchDate && (Date.now() - lastMatchDate > 30 * 24 * 60 * 60 * 1000);
  const headerPaddingTop = 'max(env(safe-area-inset-top), 28px)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-[calc(100%-0.5rem)] max-w-[440px] max-h-[calc(100vh-3rem)] bg-[#f5f5f5] rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
      >
        {/* ── Header ── */}
        <div
          className="bg-[#2d2d2e] px-6 pb-7 relative shrink-0"
          style={{ paddingTop: headerPaddingTop }}
        >
          {/* X close button */}
          <button
            onClick={onClose}
            className="absolute right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            style={{ top: `calc(${headerPaddingTop} + 0px)` }}
            aria-label="关闭"
          >
            <X size={16} className="text-white/70" />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-[72px] h-[72px] rounded-full border-[4px] border-white/10 overflow-hidden bg-[#3d3d3f] shadow-lg shrink-0">
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">
                  {player.initials}
                </div>
              )}
            </div>

            {/* Name + Badge */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight truncate">
                {player.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${tier.bg} ${tier.color}`}>
                  {tier.label}
                </span>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] border-l border-white/15 pl-1.5">
                  {tier.rank}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Bar ── */}
        <div className="bg-white px-6 py-5 flex items-center border-b border-neutral-100 shrink-0">
          <div className="flex-1 text-center border-r border-neutral-100">
            <p className="text-[32px] font-black text-orange-500 italic leading-none">{clubRank}</p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase mt-1.5 tracking-widest">本周排名</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-[32px] font-black text-neutral-800 italic leading-none">{player.elo_rating || 1500}</p>
            <p className={`text-[10px] font-black mt-1.5 tracking-widest ${tier.color}`}>{tier.label}</p>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Inactivity warning */}
          {isInactive && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <p className="text-xs font-bold text-amber-700">该球员已超过 30 天未参赛，战力评分可能已失效</p>
            </div>
          )}

          {/* Stat cards — 2x2 grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              label="总胜率"
              value={`${winRate}%`}
              color="red"
              icon={
                <div className="w-9 h-9 rounded-full border-[3px] border-red-500 flex items-center justify-center">
                  <span className="text-[8px] font-black text-red-500">{winRate}%</span>
                </div>
              }
            />
            <StatCard
              label="本周胜场"
              value={weekStats.sW + weekStats.dW}
              color="blue"
              icon={<Activity size={18} className="text-blue-500" />}
            />
            <StatCard
              label="生涯胜场"
              value={allStats.sW + allStats.dW}
              color="yellow"
              icon={<Award size={18} className="text-yellow-500" />}
            />
            <StatCard
              label="总场次"
              value={playerMatches.length}
              color="green"
              icon={<Trophy size={18} className="text-green-500" />}
            />
          </div>

          {/* Match records */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
            <RecordRow type="Single" title="单打生涯记录" win={allStats.sW} loss={allStats.sL} />
            <RecordRow type="Double" title="双打生涯记录" win={allStats.dW} loss={allStats.dL} />
          </div>

          {/* Opponent H2H */}
          <div className="space-y-3 pb-1">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-neutral-800 italic uppercase">主要对手 H2H</h3>
              <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">点击头像对比</span>
            </div>

            {topOpponents.length === 0 ? (
              <p className="text-xs text-neutral-400 px-1 py-2">暂无对战记录</p>
            ) : (
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1">
                {topOpponents.map(([oid, count]) => {
                  const opp = players.find(p => p.id === oid);
                  if (!opp) return null;
                  return (
                    <motion.button
                      key={oid}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onCompareH2H && onCompareH2H(player.id, opp.id)}
                      className="flex flex-col items-center shrink-0 group"
                    >
                      <div className="w-14 h-14 rounded-full p-[3px] bg-white shadow-sm border border-neutral-100 group-hover:border-red-500 transition-colors">
                        <div className="w-full h-full rounded-full overflow-hidden bg-neutral-50">
                          {opp.avatar ? (
                            <img src={opp.avatar} alt={opp.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-300">
                              {opp.initials}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-neutral-800 mt-1.5 truncate w-14 text-center leading-tight">
                        {opp.name}
                      </p>
                      <p className="text-[8px] font-bold text-neutral-400 mt-0.5 uppercase tracking-tighter">
                        {count}次交手
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Close Button ── */}
        <div className="p-5 bg-white border-t border-neutral-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-[#1a1a1b] text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-transform hover:bg-[#2d2d2e]"
          >
            关闭球员档案
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Helper Components ──

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: 'red' | 'blue' | 'yellow' | 'green';
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-neutral-50 flex flex-col items-center justify-between h-24">
      <div className="flex items-center justify-center">{icon}</div>
      <p className="text-lg font-black text-neutral-800 italic leading-none">{value}</p>
      <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{label}</p>
    </div>
  );
}

interface RecordRowProps {
  type: 'Single' | 'Double';
  title: string;
  win: number;
  loss: number;
}

function RecordRow({ type, title, win, loss }: RecordRowProps) {
  const rate = win + loss > 0 ? Math.round((win / (win + loss)) * 100) : 0;
  return (
    <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-6 flex items-center justify-center rounded-[4px] text-[9px] font-black text-white italic tracking-tighter shadow-sm ${
            type === 'Single' ? 'bg-[#e11d48]' : 'bg-[#1a1a1b]'
          }`}
        >
          {type}
        </div>
        <div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest leading-none mb-1">{title}</p>
          <p className="text-sm font-black text-neutral-800">
            {win}{' '}
            <span className="text-[10px] text-neutral-300 font-normal">胜</span>
            {' / '}
            {loss}{' '}
            <span className="text-[10px] text-neutral-300 font-normal">负</span>
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-3.5">
        <div>
          <p className="text-base font-black text-neutral-800 italic leading-none">{rate}%</p>
          <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-0.5">胜率</p>
        </div>
        <ChevronRight size={14} className="text-neutral-200" />
      </div>
    </div>
  );
}
