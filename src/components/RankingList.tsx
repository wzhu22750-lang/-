import { motion } from 'motion/react';
import { Player, Match } from '../types';
import { Trophy, Medal, ChevronRight, Flame, Clock, Activity, Users } from 'lucide-react';
import { calculateStreak, getPlayerTier, getStartOfThisWeek, getLastMatchDate } from '../lib/elo';

interface RankingListProps {
  players: Player[];
  matches: Match[];
  onViewProfile: (p: Player) => void;
}

export function RankingList({ players, matches, onViewProfile }: RankingListProps) {
  const sorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

  // 本周统计
  const weekStart = getStartOfThisWeek();
  const weeklyMatches = matches.filter((m) => m.date >= weekStart);
  const playerParticipation: Record<string, number> = {};
  weeklyMatches.forEach((m) => {
    [...m.team1, ...m.team2].forEach((pid) => {
      playerParticipation[pid] = (playerParticipation[pid] || 0) + 1;
    });
  });
  const mostActiveEntry = Object.entries(playerParticipation).sort(([, a], [, b]) => b - a)[0];
  const mostActivePlayer = mostActiveEntry ? players.find((p) => p.id === mostActiveEntry[0]) : null;

  const getPlayerWinLoss = (playerId: string) => {
    let wins = 0;
    let total = 0;
    matches.forEach((m) => {
      const isT1 = m.team1.includes(playerId);
      const isT2 = m.team2.includes(playerId);
      if (!isT1 && !isT2) return;
      let g1 = 0;
      let g2 = 0;
      m.scores.forEach((s) => {
        if (s.team1 > s.team2) g1++;
        else if (s.team2 > s.team1) g2++;
      });
      if (g1 === g2) return;
      total++;
      if ((isT1 && g1 > g2) || (isT2 && g2 > g1)) wins++;
    });
    return { wins, total, winRate: total > 0 ? Math.round((wins / total) * 100) : 0 };
  };

  if (players.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#dde2dc] p-12 text-center court-card-shadow">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f6f3] border border-[#dde2dc] flex items-center justify-center mx-auto mb-3 text-[#0b6e4f]">
          <Trophy size={26} />
        </div>
        <p className="font-bold text-base text-[#111814]">天梯榜单虚位以待</p>
        <p className="text-xs text-[#5b665f] mt-1">添加球友并记录比赛后，系统将自动计算 ELO 战力排名</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Weekly Overview Bento Row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 border border-[#dde2dc] court-card-shadow">
          <div className="flex items-center justify-between text-[#5b665f] mb-1.5">
            <span className="text-[11px] font-bold">本周对局</span>
            <Activity size={13} className="text-[#0b6e4f]" />
          </div>
          <p className="font-display text-2xl font-black text-[#111814] tabular-nums leading-none">
            {weeklyMatches.length}
          </p>
          <p className="text-[10px] font-medium text-[#5b665f] mt-1">场有效记录</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#dde2dc] court-card-shadow">
          <div className="flex items-center justify-between text-[#5b665f] mb-1.5">
            <span className="text-[11px] font-bold">本周劳模</span>
            <Flame size={13} className="text-amber-500" />
          </div>
          <p className="font-bold text-base text-[#111814] truncate leading-tight">
            {mostActivePlayer ? mostActivePlayer.name : '暂无'}
          </p>
          <p className="text-[10px] font-medium text-[#5b665f] mt-1 tabular-nums">
            {mostActiveEntry ? `出战 ${mostActiveEntry[1]} 场` : '尚无本周记录'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-[#dde2dc] court-card-shadow">
          <div className="flex items-center justify-between text-[#5b665f] mb-1.5">
            <span className="text-[11px] font-bold">注册球员</span>
            <Users size={13} className="text-sky-600" />
          </div>
          <p className="font-display text-2xl font-black text-[#111814] tabular-nums leading-none">
            {players.length}
          </p>
          <p className="text-[10px] font-medium text-[#5b665f] mt-1">位在册球友</p>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2.5">
        {sorted.map((player, index) => {
          const streak = calculateStreak(player.id, matches);
          const tier = getPlayerTier(player.elo_rating || 1500);
          const lastMatch = getLastMatchDate(player.id, matches);
          const isInactive = Boolean(lastMatch && Date.now() - lastMatch > 30 * 24 * 60 * 60 * 1000);
          const record = getPlayerWinLoss(player.id);

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
                opacity: { duration: 0.2 },
              }}
              onClick={() => onViewProfile(player)}
              className="bg-white p-4 rounded-[22px] court-card-shadow flex items-center justify-between cursor-pointer active:scale-[0.99] transition-[transform,border-color] duration-150 border border-[#dde2dc] hover:border-[#0b6e4f]/50 group relative overflow-hidden"
            >
              {/* Top 3 Accent Edge */}
              {index < 3 && (
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    index === 0
                      ? 'bg-amber-400'
                      : index === 1
                        ? 'bg-slate-400'
                        : 'bg-amber-700'
                  }`}
                />
              )}

              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Rank Badge */}
                <div className="w-8 flex justify-center font-display font-black text-base shrink-0 tabular-nums">
                  {index === 0 ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                      <Trophy className="text-amber-500" size={16} />
                    </div>
                  ) : index === 1 ? (
                    <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <Medal className="text-slate-500" size={16} />
                    </div>
                  ) : index === 2 ? (
                    <div className="w-7 h-7 rounded-lg bg-amber-50/70 border border-amber-300/60 flex items-center justify-center">
                      <Medal className="text-amber-700" size={16} />
                    </div>
                  ) : (
                    <span className="font-mono text-xs font-bold text-[#5b665f]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                </div>

                {/* Player Avatar */}
                <div
                  className={`w-12 h-12 rounded-full bg-[#f5f6f3] overflow-hidden border-2 border-white shadow-xs shrink-0 group-hover:border-emerald-200 transition-colors ${
                    isInactive ? 'opacity-45' : ''
                  }`}
                >
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-display font-extrabold text-[#0b6e4f]">
                      {player.initials}
                    </div>
                  )}
                </div>

                {/* Name, Tier & Record */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#111814] text-base leading-tight truncate">
                      {player.name}
                    </span>
                    {isInactive && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0"
                        title="超过30天未参赛"
                      >
                        <Clock size={10} /> 休赛
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md shrink-0 ${tier.bg} ${tier.color}`}>
                      {tier.label}
                    </span>

                    {record.total > 0 && (
                      <span className="text-[11px] font-medium text-[#5b665f] tabular-nums">
                        {record.wins}胜 {record.total - record.wins}负 ({record.winRate}%)
                      </span>
                    )}

                    {streak >= 3 && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-orange-50 text-orange-600 rounded-md border border-orange-200 shrink-0">
                        <Flame size={10} fill="currentColor" />
                        <span className="text-[10px] font-bold tabular-nums">{streak}连胜</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ELO Score */}
              <div className="flex items-center gap-2 shrink-0 pl-2">
                <div className="text-right">
                  <div className="font-display font-black text-xl text-[#0b6e4f] tabular-nums leading-none">
                    {player.elo_rating || 1500}
                  </div>
                  <p className="text-[10px] font-mono font-semibold text-[#5b665f] uppercase tracking-wider mt-1">
                    ELO 积分
                  </p>
                </div>

                <ChevronRight
                  size={16}
                  className="text-[#5b665f]/50 group-hover:text-[#0b6e4f] transition-colors shrink-0"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
