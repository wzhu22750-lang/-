import { motion } from 'motion/react';
import { Player } from '../types';
import { Trophy, Medal, Star } from 'lucide-react';

export function RankingList({ players }: { players: Player[] }) {
  const sorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

  return (
    <div className="space-y-3 pb-10">
      {sorted.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center italic font-black text-lg">
              {index === 0 ? <Trophy className="text-yellow-500" /> : 
               index === 1 ? <Medal className="text-slate-400" /> :
               index === 2 ? <Medal className="text-amber-600" /> : 
               <span className="text-neutral-300">{index + 1}</span>}
            </div>
            
            <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden border border-neutral-100">
              {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-400">{player.initials}</div>}
            </div>
            
            <span className="font-bold text-neutral-800">{player.name}</span>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-red-600 font-black">
              <Star size={14} fill="currentColor" />
              <span>{player.elo_rating || 1500}</span>
            </div>
            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tighter">ELO RATING</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
