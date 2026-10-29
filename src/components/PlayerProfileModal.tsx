import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronRight, Activity, Clock, Percent } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek, getPlayerTier, getLastMatchDate } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onCompareH2H?: (p1Id: string, p2Id: string) => void;
}

export function PlayerProfileModal({
  player,
  matches = [],
  players = [],
  onClose,
  onCompareH2H,
}: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  const playerMatches = matches.filter(
    (m) => (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id)
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
  const winRate = playerMatches.length > 0 ? Math.round((totalWins / playerMatches.length) * 100) : 0;

  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex((p) => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const tier = getPlayerTier(player.elo_rating || 1500);
  const lastMatchDate = getLastMatchDate(player.id, matches);
  const isInactive = Boolean(lastMatchDate && Date.now() - lastMatchDate > 30 * 24 * 60 * 60 * 1000);
  const headerPaddingTop = 'max(env(safe-area-inset-top), 24px)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[150] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] max-h-[calc(100vh-2.5rem)] bg-[#f5f5f5] rounded-[28px] overflow-hidden court-elevated-shadow flex flex-col relative border border-neutral-200/80"
      >
        {/* Header */}
        <div
          className="bg-[#2d2d2e] px-6 pb-6 relative shrink-0 border-b border-white/10"
          style={{ paddingTop: headerPaddingTop }}
        >
          <button
            onClick={onClose}
            className="absolute right-5 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
            style={{ top: headerPaddingTop }}
            aria-label="关闭"
          >
            <X size={18} className="text-white/80" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            <div className="w-[72px] h-[72px] rounded-full border-3 border-white/20 overflow-hidden bg-neutral-700 shadow-lg shrink-0">
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl font-extrabold text-white/60">
                  {player.initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block mb-1">
                ATHLETE DOSSIER
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight truncate">
                {player.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tier.bg} ${tier.color}`}>
                  {tier.label}
                </span>
                <span className="text-white/50 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {tier.rank}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Rank & Rating Strip */}
        <div className="bg-white px-6 py-4 grid grid-cols-2 border-b border-neutral-200/80 shrink-0">
          <div className="text-center border-r border-neutral-100">
            <p className="font-display text-3xl font-black text-amber-500 tabular-nums leading-none">
              #{clubRank || 1}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 mt-1">馆内天梯排名</p>
          </div>
          <div className="text-center">
            <p className="font-display text-3xl font-black text-red-600 tabular-nums leading-none">
              {player.elo_rating || 1500}
            </p>
            <p className="text-[11px] font-bold text-neutral-500 mt-1">当前 ELO 战力</p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {isInactive && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2.5">
              <Clock size={16} className="text-amber-600 shrink-0" />
              <p className="text-xs font-bold text-amber-800">
                该球友已超过 30 天未出战，战力积分处于休眠状态
              </p>
            </div>
          )}

          {/* 2x2 Metric Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatCard
              label="综合胜率"
              value={`${winRate}%`}
              icon={<Percent size={16} className="text-red-500" />}
              accent="bg-red-50 border-red-100"
            />
            <StatCard
              label="本周胜场"
              value={weekStats.sW + weekStats.dW}
              icon={<Activity size={16} className="text-emerald-500" />}
              accent="bg-emerald-50 border-emerald-100"
            />
            <StatCard
              label="生涯总胜场"
              value={totalWins}
              icon={<Award size={16} className="text-blue-500" />}
              accent="bg-blue-50 border-blue-100"
            />
            <StatCard
              label="累计出战场次"
              value={playerMatches.length}
              icon={<Trophy size={16} className="text-amber-500" />}
              accent="bg-amber-50 border-amber-100"
            />
          </div>

          {/* Singles / Doubles Breakdown */}
          <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200/80 court-card-shadow">
            <RecordRow type="1v1" title="单打生涯战绩" win={allStats.sW} loss={allStats.sL} />
            <RecordRow type="2v2" title="双打生涯战绩" win={allStats.dW} loss={allStats.dL} />
          </div>

          {/* Frequent Opponents H2H */}
          <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 court-card-shadow space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-neutral-900">高频交锋对手</h3>
              <span className="text-[11px] font-medium text-red-600">点击头像查看 H2H</span>
            </div>

            {topOpponents.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2">暂无交手记录</p>
            ) : (
              <div className="flex gap-3.5 overflow-x-auto no-scrollbar py-1">
                {topOpponents.map(([oid, count]) => {
                  const opp = players.find((p) => p.id === oid);
                  if (!opp) return null;
                  return (
                    <motion.button
                      key={oid}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onCompareH2H && onCompareH2H(player.id, opp.id)}
                      className="flex flex-col items-center shrink-0 group"
                    >
                      <div className="w-13 h-13 rounded-full p-0.5 bg-neutral-100 border border-neutral-200 group-hover:border-red-500 transition-colors">
                        <div className="w-full h-full rounded-full overflow-hidden bg-white">
                          {opp.avatar ? (
                            <img src={opp.avatar} alt={opp.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-display font-bold text-neutral-600">
                              {opp.initials}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs font-bold text-neutral-900 mt-1.5 truncate w-14 text-center">
                        {opp.name}
                      </p>
                      <p className="text-[10px] font-mono font-semibold text-neutral-500 tabular-nums">
                        {count} 场
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-neutral-200/80 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-[transform,background-color]"
          >
            关闭球友档案
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent: string;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 court-card-shadow flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold text-neutral-500">{label}</p>
        <p className="font-display text-xl font-black text-neutral-900 tabular-nums mt-1 leading-none">
          {value}
        </p>
      </div>
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
    </div>
  );
}

interface RecordRowProps {
  type: '1v1' | '2v2';
  title: string;
  win: number;
  loss: number;
}

function RecordRow({ type, title, win, loss }: RecordRowProps) {
  const rate = win + loss > 0 ? Math.round((win / (win + loss)) * 100) : 0;
  return (
    <div className="px-4 py-3.5 flex items-center justify-between border-b border-neutral-100 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-7 flex items-center justify-center rounded-lg font-mono text-xs font-extrabold text-white ${
            type === '1v1' ? 'bg-red-500' : 'bg-blue-500'
          }`}
        >
          {type}
        </div>
        <div>
          <p className="text-xs font-bold text-neutral-900">{title}</p>
          <p className="text-xs font-semibold text-neutral-500 tabular-nums mt-0.5">
            {win} 胜 · {loss} 负
          </p>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className="font-display text-base font-black text-red-600 tabular-nums leading-none">
            {rate}%
          </p>
          <p className="text-[10px] font-semibold text-neutral-500 mt-0.5">胜率</p>
        </div>
        <ChevronRight size={14} className="text-neutral-300" />
      </div>
    </div>
  );
}
