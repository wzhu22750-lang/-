import { useState } from 'react';
import { motion } from 'motion/react';
import { Match, MatchType, Player, MatchCategory } from '../types';
import { Calendar, Trophy, Flame, RotateCcw, Crown } from 'lucide-react';
import { calculateStreak } from '../lib/elo';

interface RecentActivityProps {
  matches: Match[];
  players: Player[];
  onViewProfile: (p: Player) => void;
  onQuickRematch?: (match: Match) => void;
  categories: MatchCategory[];
}

const formatDateWithTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const dateStr = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  let period = '';
  if (hours >= 5 && hours < 12) period = '上午';
  else if (hours >= 12 && hours < 18) period = '下午';
  else period = '晚上';

  const displayHours = hours % 12 || 12;
  return `${dateStr} ${period}${displayHours}:${minutes}`;
};

export function RecentActivity({
  matches,
  players,
  onViewProfile,
  onQuickRematch,
  categories,
}: RecentActivityProps) {
  const [filter, setFilter] = useState<'all' | MatchType>('all');
  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const getCategory = (id?: string) => categories.find((c) => c.id === id);

  const singlesCount = matches.filter((m) => m.type === 'Singles').length;
  const doublesCount = matches.filter((m) => m.type === 'Doubles').length;
  const filteredMatches = filter === 'all' ? matches : matches.filter((m) => m.type === filter);

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-[24px] border border-[#dde2dc] p-12 text-center court-card-shadow">
        <div className="w-14 h-14 rounded-2xl bg-[#f5f6f3] border border-[#dde2dc] flex items-center justify-center mx-auto mb-3 text-[#0b6e4f]">
          <Trophy size={26} />
        </div>
        <p className="font-bold text-base text-[#111814]">球馆暂无对局记录</p>
        <p className="text-xs text-[#5b665f] mt-1">点击右下角「记一局」录入首场比赛</p>
      </div>
    );
  }

  const filterPills = [
    { key: 'all' as const, label: '全部赛况', count: matches.length },
    { key: 'Singles' as const, label: '单打 1v1', count: singlesCount },
    { key: 'Doubles' as const, label: '双打 2v2', count: doublesCount },
  ];

  return (
    <div className="space-y-3.5 pb-10">
      {/* Filter & Summary Control Bar */}
      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-[#dde2dc] court-card-shadow">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filterPills.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-[background-color,color] duration-150 flex items-center gap-1.5 shrink-0 ${
                  active
                    ? 'bg-[#0c261e] text-white'
                    : 'bg-transparent text-[#5b665f] hover:bg-[#f5f6f3] hover:text-[#111814]'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md tabular-nums ${
                    active ? 'bg-white/15 text-emerald-300' : 'bg-[#edf0eb] text-[#5b665f]'
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="bg-white rounded-[24px] border border-[#dde2dc] py-14 text-center court-card-shadow">
          <p className="text-sm font-bold text-[#5b665f]">该分项下暂无比赛记录</p>
        </div>
      ) : (
        filteredMatches.map((match, idx) => {
          let t1Games = 0;
          let t2Games = 0;
          (match.scores || []).forEach((s) => {
            if (s.team1 > s.team2) t1Games++;
            else if (s.team2 > s.team1) t2Games++;
          });
          const t1Won = t1Games > t2Games;
          const t2Won = t2Games > t1Games;
          const category = getCategory(match.category_id);

          return (
            <motion.article
              key={match.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.04, 0.25), duration: 0.2 }}
              className="bg-white rounded-[24px] border border-[#dde2dc] court-card-shadow overflow-hidden"
            >
              {/* Top Matchday Header Bar */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-[#f9faf8] border-b border-[#edf0eb]">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-xs font-extrabold text-[#111814] truncate">
                    {match.tournament || '日常训练赛'}
                  </span>
                  {category && (
                    <span className="text-[10px] font-bold bg-emerald-50 text-[#0b6e4f] px-2 py-0.5 rounded-md border border-emerald-200/80">
                      {category.name}
                    </span>
                  )}
                  {match.bo_format && match.bo_format !== 'BO1' && (
                    <span className="text-[10px] font-mono font-bold bg-[#edf0eb] text-[#5b665f] px-1.5 py-0.5 rounded-md">
                      {match.bo_format}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-[#5b665f] flex items-center gap-1 tabular-nums">
                    <Calendar size={11} />
                    {formatDateWithTime(match.date)}
                  </span>
                  {onQuickRematch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickRematch(match);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0b6e4f] hover:text-white bg-emerald-50 hover:bg-[#0b6e4f] border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <RotateCcw size={11} />
                      <span>再战</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Matchup Body */}
              <div className="p-4 sm:p-5 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                {/* Team 1 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex justify-center -space-x-2.5 mb-2.5">
                    {(match.team1 || []).map((id) => {
                      const p = getPlayer(id);
                      const streak = calculateStreak(id, matches);
                      return (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.06, zIndex: 10 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => p && onViewProfile(p)}
                          className="w-12 h-12 rounded-full relative"
                        >
                          <div
                            className={`w-full h-full rounded-full overflow-hidden shadow-sm border-2 ${
                              t1Won ? 'border-[#0b6e4f] bg-emerald-50' : 'border-white bg-[#f5f6f3]'
                            }`}
                          >
                            {p?.avatar ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-display font-extrabold text-[#0b6e4f]">
                                {p?.initials || '?'}
                              </div>
                            )}
                          </div>
                          {streak >= 3 && (
                            <div className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white p-0.5 rounded-full border-2 border-white shadow-xs">
                              <Flame size={9} fill="currentColor" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center gap-0.5 w-full">
                    {(match.team1 || []).map((id) => {
                      const p = getPlayer(id);
                      return (
                        <p
                          key={id}
                          className={`text-xs font-bold truncate max-w-[96px] ${
                            t1Won ? 'text-[#111814]' : 'text-[#5b665f]'
                          }`}
                        >
                          {p?.name || '未知球员'}
                        </p>
                      );
                    })}
                    {t1Won && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0b6e4f] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        <Crown size={10} /> 胜方
                      </span>
                    )}
                  </div>
                </div>

                {/* Center Scoreboard */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="font-display text-3xl sm:text-4xl font-black tracking-tight tabular-nums flex items-center gap-2.5">
                    <span className={t1Won ? 'text-[#0b6e4f]' : 'text-[#5b665f]/50'}>{t1Games}</span>
                    <span className="text-[#dde2dc] text-2xl font-bold">:</span>
                    <span className={t2Won ? 'text-[#0b6e4f]' : 'text-[#5b665f]/50'}>{t2Games}</span>
                  </div>

                  {/* Individual Set Scores */}
                  {(match.scores || []).length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-2.5">
                      {(match.scores || []).map((s, i) => {
                        const s1Win = s.team1 > s.team2;
                        const s2Win = s.team2 > s.team1;
                        return (
                          <div
                            key={i}
                            className="bg-[#f5f6f3] px-2.5 py-1 rounded-lg border border-[#e3e8e2] font-mono text-[11px] font-bold tabular-nums flex items-center gap-0.5"
                          >
                            <span className={s1Win ? 'text-[#111814] font-extrabold' : 'text-[#5b665f]'}>
                              {s.team1}
                            </span>
                            <span className="text-[#5b665f]/40">:</span>
                            <span className={s2Win ? 'text-[#111814] font-extrabold' : 'text-[#5b665f]'}>
                              {s.team2}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center min-w-0">
                  <div className="flex justify-center -space-x-2.5 mb-2.5">
                    {(match.team2 || []).map((id) => {
                      const p = getPlayer(id);
                      const streak = calculateStreak(id, matches);
                      return (
                        <motion.button
                          key={id}
                          whileHover={{ scale: 1.06, zIndex: 10 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => p && onViewProfile(p)}
                          className="w-12 h-12 rounded-full relative"
                        >
                          <div
                            className={`w-full h-full rounded-full overflow-hidden shadow-sm border-2 ${
                              t2Won ? 'border-[#0b6e4f] bg-emerald-50' : 'border-white bg-[#f5f6f3]'
                            }`}
                          >
                            {p?.avatar ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-display font-extrabold text-[#5b665f]">
                                {p?.initials || '?'}
                              </div>
                            )}
                          </div>
                          {streak >= 3 && (
                            <div className="absolute -top-0.5 -right-0.5 bg-orange-500 text-white p-0.5 rounded-full border-2 border-white shadow-xs">
                              <Flame size={9} fill="currentColor" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col items-center gap-0.5 w-full">
                    {(match.team2 || []).map((id) => {
                      const p = getPlayer(id);
                      return (
                        <p
                          key={id}
                          className={`text-xs font-bold truncate max-w-[96px] ${
                            t2Won ? 'text-[#111814]' : 'text-[#5b665f]'
                          }`}
                        >
                          {p?.name || '未知球员'}
                        </p>
                      );
                    })}
                    {t2Won && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-[#0b6e4f] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        <Crown size={10} /> 胜方
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })
      )}
    </div>
  );
}
