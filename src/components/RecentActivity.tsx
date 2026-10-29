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
      <div className="bg-white rounded-[24px] border border-neutral-200/80 p-12 text-center court-card-shadow">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3 text-red-600">
          <Trophy size={26} />
        </div>
        <p className="font-bold text-base text-neutral-900">俱乐部暂无比赛记录</p>
        <p className="text-xs text-neutral-500 mt-1">点击右下角「录比赛」录入首场战绩</p>
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
      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-2xl border border-neutral-200/80 court-card-shadow">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {filterPills.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs font-bold px-3 py-2 rounded-xl transition-[background-color,color] duration-150 flex items-center gap-1.5 shrink-0 ${
                  active
                    ? 'bg-neutral-900 text-white'
                    : 'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md tabular-nums ${
                    active ? 'bg-red-500 text-white' : 'bg-neutral-100 text-neutral-500'
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
        <div className="bg-white rounded-[24px] border border-neutral-200/80 py-14 text-center court-card-shadow">
          <p className="text-sm font-bold text-neutral-500">该分项下暂无比赛记录</p>
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
              className="bg-white rounded-[24px] border border-neutral-200/80 court-card-shadow overflow-hidden"
            >
              {/* Top Matchday Header Bar */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-neutral-50/80 border-b border-neutral-100">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="text-xs font-extrabold text-neutral-900 truncate">
                    {match.tournament || '日常训练赛'}
                  </span>
                  {category && (
                    <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-md border border-red-100">
                      {category.name}
                    </span>
                  )}
                  {match.bo_format && match.bo_format !== 'BO1' && (
                    <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-md">
                      {match.bo_format}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1 tabular-nums">
                    <Calendar size={11} />
                    {formatDateWithTime(match.date)}
                  </span>
                  {onQuickRematch && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickRematch(match);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <RotateCcw size={11} />
                      <span>再来一局</span>
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
                              t1Won ? 'border-red-500 bg-red-50' : 'border-white bg-neutral-100'
                            }`}
                          >
                            {p?.avatar ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center text-xs font-display font-extrabold ${
                                  t1Won ? 'text-red-600' : 'text-neutral-500'
                                }`}
                              >
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
                            t1Won ? 'text-neutral-900' : 'text-neutral-500'
                          }`}
                        >
                          {p?.name || '未知球员'}
                        </p>
                      );
                    })}
                    {t1Won && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded-md">
                        <Crown size={10} /> 胜方
                      </span>
                    )}
                  </div>
                </div>

                {/* Center Scoreboard */}
                <div className="flex flex-col items-center justify-center px-2">
                  <div className="font-display text-3xl sm:text-4xl font-black tracking-tight tabular-nums flex items-center gap-2.5">
                    <span className={t1Won ? 'text-red-600' : 'text-neutral-300'}>{t1Games}</span>
                    <span className="text-neutral-200 text-2xl font-bold">:</span>
                    <span className={t2Won ? 'text-red-600' : 'text-neutral-300'}>{t2Games}</span>
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
                            className="bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200/80 font-mono text-[11px] font-bold tabular-nums flex items-center gap-0.5"
                          >
                            <span className={s1Win ? 'text-neutral-900 font-extrabold' : 'text-neutral-400'}>
                              {s.team1}
                            </span>
                            <span className="text-neutral-300">:</span>
                            <span className={s2Win ? 'text-neutral-900 font-extrabold' : 'text-neutral-400'}>
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
                              t2Won ? 'border-red-500 bg-red-50' : 'border-white bg-neutral-100'
                            }`}
                          >
                            {p?.avatar ? (
                              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div
                                className={`w-full h-full flex items-center justify-center text-xs font-display font-extrabold ${
                                  t2Won ? 'text-red-600' : 'text-neutral-500'
                                }`}
                              >
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
                            t2Won ? 'text-neutral-900' : 'text-neutral-500'
                          }`}
                        >
                          {p?.name || '未知球员'}
                        </p>
                      );
                    })}
                    {t2Won && (
                      <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded-md">
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
