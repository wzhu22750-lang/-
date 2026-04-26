import { motion } from 'motion/react';
import { Player } from '../types';
import { Trophy, Medal, Star, ChevronRight } from 'lucide-react';

interface RankingListProps {
  players: Player[];
  onViewProfile: (p: Player) => void; // 新增：点击查看档案
}

export function RankingList({ players, onViewProfile }: RankingListProps) {
  // 按积分从高到低排序
  const sorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

  if (players.length === 0) {
    return (
      <div className="text-center py-20 text-neutral-400">
        <Trophy size={48} className="mx-auto mb-4 opacity-10" />
        <p className="font-bold">暂无球员数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-10">
      <div className="flex items-center justify-between px-2 mb-4">
        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
          俱乐部排行榜 (ELO)
        </h3>
        <span className="text-[10px] font-bold text-neutral-300">
          基于最近对局实时更新
        </span>
      </div>

      {sorted.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onViewProfile(player)} // 点击整行查看档案
          className="bg-white p-4 rounded-[28px] shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-red-100 group"
        >
          <div className="flex items-center gap-4">
            {/* 排名序号/奖牌 */}
            <div className="w-8 flex justify-center italic font-black text-xl shrink-0">
              {index === 0 ? <Trophy className="text-yellow-500" size={26} /> : 
               index === 1 ? <Medal className="text-slate-400" size={26} /> :
               index === 2 ? <Medal className="text-amber-600" size={26} /> : 
               <span className="text-neutral-200">{index + 1}</span>}
            </div>
            
            {/* 球员头像 */}
            <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden border-2 border-neutral-50 shadow-inner shrink-0 group-hover:border-red-200 transition-colors">
              {player.avatar ? (
                <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-400 uppercase italic">
                  {player.initials}
                </div>
              )}
            </div>
            
            {/* 球员姓名 */}
            <div className="flex flex-col">
              <span className="font-black text-neutral-800 text-lg leading-tight">
                {player.name}
              </span>
              <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-tighter">
                ACTIVE PLAYER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1 text-red-600 font-black text-2xl italic leading-none">
                <Star size={14} fill="currentColor" />
                <span>{player.elo_rating || 1500}</span>
              </div>
              <p className="text-[9px] text-neutral-400 font-black uppercase tracking-tighter mt-1">
                ELO RATING
              </p>
            </div>
            
            {/* 引导箭头 */}
            <ChevronRight size={16} className="text-neutral-200 group-hover:text-red-300 transition-colors" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
