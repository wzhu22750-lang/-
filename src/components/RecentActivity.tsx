import { motion } from 'motion/react';
import { Match, Player } from '../types';
import { Trophy, Calendar, ChevronRight } from 'lucide-react';

interface RecentActivityProps {
  matches: Match[];
  players: Player[];
}

export function RecentActivity({ matches, players }: RecentActivityProps) {
  const getPlayer = (id: string) => players.find(p => p.id === id);

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="font-black text-neutral-400 text-[10px] uppercase tracking-widest">最近发生的对局</h3>
        <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full">{matches.length} 场记录</span>
      </div>

      {matches.map((match, idx) => {
        let t1Games = 0; let t2Games = 0;
        match.scores.forEach(s => { if (s.team1 > s.team2) t1Games++; else if (s.team2 > s.team1) t2Games++; });
        const dateStr = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(match.date);

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-[24px] p-5 shadow-sm border border-neutral-100 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
               <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                 <Calendar size={12} /> {dateStr}
               </span>
               <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md italic">
                 {match.tournament || '日常对局'}
               </span>
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
              {/* Team 1 */}
              <div className="text-center">
                <div className="flex justify-center -space-x-2 mb-2">
                  {match.team1.map(id => (
                    <div key={id} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-sm">
                      {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : 
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">{getPlayer(id)?.initials}</div>}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-black truncate">{match.team1.map(id => getPlayer(id)?.name).join('/')}</p>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <div className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                   <span className={t1Games > t2Games ? 'text-red-600' : 'text-neutral-300'}>{t1Games}</span>
                   <span className="text-neutral-200">:</span>
                   <span className={t2Games > t1Games ? 'text-red-600' : 'text-neutral-300'}>{t2Games}</span>
                </div>
              </div>

              {/* Team 2 */}
              <div className="text-center">
                <div className="flex justify-center -space-x-2 mb-2">
                  {match.team2.map(id => (
                    <div key={id} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 overflow-hidden shadow-sm">
                      {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : 
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">{getPlayer(id)?.initials}</div>}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-black truncate">{match.team2.map(id => getPlayer(id)?.name).join('/')}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
