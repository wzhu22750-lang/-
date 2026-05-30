import { useState } from 'react';
import { motion } from 'motion/react';
import { Match, MatchType, Player, MatchCategory } from '../types';
import { Calendar, Trophy, Zap, Flame, RotateCcw } from 'lucide-react';
import { calculateStreak } from '../lib/elo';

interface RecentActivityProps {
  matches: Match[];
  players: Player[];
  onViewProfile: (p: Player) => void;
  onQuickRematch?: (match: Match) => void;
  categories: MatchCategory[];
}

// 智能时间格式化工具
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

export function RecentActivity({ matches, players, onViewProfile, onQuickRematch, categories }: RecentActivityProps) {
  const [filter, setFilter] = useState<'all' | MatchType>('all');
  const getPlayer = (id: string) => players.find(p => p.id === id);
  const getCategoryName = (id?: string) => categories.find(c => c.id === id)?.name;
  const filteredMatches = filter === 'all' ? matches : matches.filter(m => m.type === filter);

  if (matches.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <Trophy size={48} className="mx-auto mb-4 opacity-10" />
        <p className="font-bold">俱乐部暂无比赛记录</p>
      </div>
    );
  }

  const filterPills = (['all', 'Singles', 'Doubles'] as const).map(f => ({
    key: f,
    label: f === 'all' ? '全部' : f === 'Singles' ? '单打' : '双打',
  }));

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="font-bold text-neutral-400 text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
          <Zap size={12} className="fill-current text-yellow-500" /> Live Feed
        </h3>
        <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded italic uppercase tracking-widest shadow-sm shadow-red-200">
          {filteredMatches.length} 场
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-1 px-2">
        {filterPills.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tight transition-all ${
              filter === f.key ? 'bg-neutral-800 text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p className="text-sm font-bold">该类型暂无比赛</p>
        </div>
      ) : (
        filteredMatches.map((match, idx) => {
        let t1Games = 0; let t2Games = 0;
        (match.scores || []).forEach(s => { 
          if (s.team1 > s.team2) t1Games++; 
          else if (s.team2 > s.team1) t2Games++; 
        });

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[32px] p-5 shadow-sm border border-neutral-100 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5 px-1">
               <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1 uppercase tracking-tighter">
                 <Calendar size={12} /> {formatDateWithTime(match.date)}
               </span>
               <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                 {match.tournament || 'Daily Session'}
               </span>
               {match.category_id && getCategoryName(match.category_id) && (
                 <span className="text-[10px] font-black bg-red-50 text-red-500 px-2 py-1 rounded-lg border border-red-100">
                   {getCategoryName(match.category_id)}
                 </span>
               )}
            </div>

            {onQuickRematch && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onQuickRematch(match); }}
                  className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-red-600 bg-neutral-50 hover:bg-red-50 px-2.5 py-1.5 rounded-xl transition-colors"
                >
                  <RotateCcw size={12} /> 再来一局
                </button>
              </div>
            )}

            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
              {/* Team 1 */}
              <div className="flex flex-col items-center">
                <div className="flex justify-center -space-x-3 mb-3">
                  {(match.team1 || []).map(id => {
                    const p = getPlayer(id);
                    const streak = calculateStreak(id, matches);
                    return (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => p && onViewProfile(p)}
                        className="w-12 h-12 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-md relative"
                      >
                        {p?.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-neutral-400 italic">{p?.initials}</div>}
                        {streak >= 3 && <div className="absolute top-0 right-0 bg-orange-500 text-white p-0.5 rounded-full border border-white"><Flame size={8} fill="currentColor" /></div>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {(match.team1 || []).map(id => {
                    const p = getPlayer(id);
                    return <p key={id} className="text-[10px] font-black truncate max-w-[65px] text-neutral-800">{p?.name}</p>;
                  })}
                </div>
              </div>

              {/* 比分展示 */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
                   <span className={t1Games > t2Games ? 'text-red-600' : 'text-neutral-400'}>{t1Games}</span>
                   <span className="text-neutral-100 opacity-50">:</span>
                   <span className={t2Games > t1Games ? 'text-red-600' : 'text-neutral-400'}>{t2Games}</span>
                </div>
                <div className="flex gap-1.5 mt-2 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-100">
                   {(match.scores || []).map((s, i) => <span key={i} className="text-[11px] font-bold text-neutral-400">{s.team1}:{s.team2}</span>)}
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center">
                <div className="flex justify-center -space-x-3 mb-3">
                  {(match.team2 || []).map(id => {
                    const p = getPlayer(id);
                    const streak = calculateStreak(id, matches);
                    return (
                      <motion.button
                        key={id}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => p && onViewProfile(p)}
                        className="w-12 h-12 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-md relative"
                      >
                        {p?.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-neutral-400 italic">{p?.initials}</div>}
                        {streak >= 3 && <div className="absolute top-0 right-0 bg-orange-500 text-white p-0.5 rounded-full border border-white"><Flame size={8} fill="currentColor" /></div>}
                      </motion.button>
                    );
                  })}
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {(match.team2 || []).map(id => {
                    const p = getPlayer(id);
                    return <p key={id} className="text-[10px] font-black truncate max-w-[65px] text-neutral-800">{p?.name}</p>;
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        );
      }))}
    </div>
  );
}
