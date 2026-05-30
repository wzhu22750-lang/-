import { motion } from 'motion/react';
import { Player, Match } from '../types';
import { Trophy, Medal, Star, ChevronRight, Flame, Clock } from 'lucide-react';
import { calculateStreak, getPlayerTier, getStartOfThisWeek, getLastMatchDate } from '../lib/elo';

interface RankingListProps {
  players: Player[];
  matches: Match[]; // 必须传入比赛记录以计算连胜
  onViewProfile: (p: Player) => void;
}

export function RankingList({ players, matches, onViewProfile }: RankingListProps) {
  // 按积分从高到低排序
  const sorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

  // 本周统计
  const weekStart = getStartOfThisWeek();
  const weeklyMatches = matches.filter(m => m.date >= weekStart);
  const playerParticipation: Record<string, number> = {};
  weeklyMatches.forEach(m => {
    [...m.team1, ...m.team2].forEach(pid => {
      playerParticipation[pid] = (playerParticipation[pid] || 0) + 1;
    });
  });
  const mostActiveEntry = Object.entries(playerParticipation).sort(([, a], [, b]) => b - a)[0];
  const mostActivePlayer = mostActiveEntry ? players.find(p => p.id === mostActiveEntry[0]) : null;

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <Trophy size={48} className="mx-auto mb-4 opacity-10" />
        <p className="font-bold">俱乐部虚位以待，快来加入吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      {/* 头部统计信息 */}
      <div className="mb-5 space-y-3">
        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-2">俱乐部战力排行</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-neutral-50">
            <p className="text-xl font-black text-red-500 italic leading-none">{weeklyMatches.length}</p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-1">本周比赛</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-neutral-50">
            <p className="text-xl font-black text-blue-500 italic leading-none truncate px-1">
              {mostActivePlayer ? mostActivePlayer.name : '—'}
            </p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-1">
              {mostActiveEntry ? `${mostActiveEntry[1]}场 · 最活跃` : '暂无数据'}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-neutral-50">
            <p className="text-xl font-black text-green-500 italic leading-none">{players.length}</p>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight mt-1">俱乐部人数</p>
          </div>
        </div>
      </div>

      {sorted.map((player, index) => {
        const streak = calculateStreak(player.id, matches);
        const tier = getPlayerTier(player.elo_rating || 1500);
        const lastMatch = getLastMatchDate(player.id, matches);
        const isInactive = lastMatch && (Date.now() - lastMatch > 30 * 24 * 60 * 60 * 1000);
        
        return (
          <motion.div
            key={player.id}
  layout // 关键：开启布局平滑动画
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ 
    type: "spring", 
    stiffness: 300, 
    damping: 30,
    opacity: { duration: 0.2 }
  }}
  onClick={() => onViewProfile(player)}
  className="bg-white p-4 rounded-[28px] shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-red-100 group relative overflow-hidden">
            {/* 背景装饰：前三名有特殊背景 */}
            {index < 3 && (
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-amber-600'
              }`} />
            )}

            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* 排名显示 */}
              <div className="w-8 flex justify-center italic font-black text-xl shrink-0">
                {index === 0 ? <Trophy className="text-yellow-500 drop-shadow-sm" size={26} /> : 
                 index === 1 ? <Medal className="text-slate-400" size={26} /> :
                 index === 2 ? <Medal className="text-amber-600" size={26} /> : 
                 <span className="text-neutral-200">{index + 1}</span>}
              </div>
              
              {/* 球员头像 */}
              <div className={`w-12 h-12 rounded-full bg-neutral-100 overflow-hidden border-2 border-neutral-50 shadow-inner shrink-0 group-hover:border-red-100 transition-colors ${isInactive ? 'opacity-40' : ''}`}>
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-400 italic">
                    {player.initials}
                  </div>
                )}
              </div>
              
              {/* 球员姓名与勋章 — 双行布局 */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-black text-neutral-800 text-base leading-tight truncate">
                  {player.name}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {/* 段位徽章 */}
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${tier.bg} ${tier.color}`}>
                    {tier.label}
                  </span>

                  {/* 连胜火苗 */}
                  {streak >= 3 && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-0.5 px-1 py-0.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200 shrink-0"
                    >
                      <Flame size={9} fill="currentColor" />
                      <span className="text-[10px] italic font-black">{streak}连胜</span>
                    </motion.div>
                  )}

                  {/* 不活跃提示 */}
                  {isInactive && (
                    <span className="inline-flex items-center text-amber-500 shrink-0" title="超过30天未参赛">
                      <Clock size={10} />
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="text-right">
                <div className="flex items-center gap-0.5 text-red-600 font-black text-xl italic leading-none">
                  <Star size={12} fill="currentColor" />
                  <span>{player.elo_rating || 1500}</span>
                </div>
                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter mt-0.5">
                  ELO
                </p>
              </div>

              <ChevronRight size={14} className="text-neutral-200 group-hover:text-red-300 transition-colors shrink-0" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
