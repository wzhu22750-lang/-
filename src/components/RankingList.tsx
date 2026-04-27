import { motion } from 'motion/react';
import { Player, Match } from '../types';
import { Trophy, Medal, Star, ChevronRight, Flame } from 'lucide-react';
import { calculateStreak } from '../lib/elo';

interface RankingListProps {
  players: Player[];
  matches: Match[]; // 必须传入比赛记录以计算连胜
  onViewProfile: (p: Player) => void;
}

export function RankingList({ players, matches, onViewProfile }: RankingListProps) {
  // 按积分从高到低排序
  const sorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));

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
      <div className="flex items-center justify-between px-2 mb-4">
        <div>
          <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">
            俱乐部战力排行
          </h3>
          <p className="text-[10px] font-bold text-neutral-300">活跃人数: {players.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 rounded-lg">
             <Flame size={12} className="text-orange-500" fill="currentColor" />
             <span className="text-[9px] font-black text-orange-600 uppercase tracking-tighter">强者连胜中</span>
          </div>
        </div>
      </div>

      {sorted.map((player, index) => {
        const streak = calculateStreak(player.id, matches);
        
        return (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onViewProfile(player)}
            className="bg-white p-4 rounded-[28px] shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-transparent hover:border-red-100 group relative overflow-hidden"
          >
            {/* 背景装饰：前三名有特殊背景 */}
            {index < 3 && (
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-amber-600'
              }`} />
            )}

            <div className="flex items-center gap-4">
              {/* 排名显示 */}
              <div className="w-8 flex justify-center italic font-black text-xl shrink-0">
                {index === 0 ? <Trophy className="text-yellow-500 drop-shadow-sm" size={26} /> : 
                 index === 1 ? <Medal className="text-slate-400" size={26} /> :
                 index === 2 ? <Medal className="text-amber-600" size={26} /> : 
                 <span className="text-neutral-200">{index + 1}</span>}
              </div>
              
              {/* 球员头像 */}
              <div className="w-12 h-12 rounded-full bg-neutral-100 overflow-hidden border-2 border-neutral-50 shadow-inner shrink-0 group-hover:border-red-100 transition-colors">
                {player.avatar ? (
                  <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-400 italic">
                    {player.initials}
                  </div>
                )}
              </div>
              
              {/* 球员姓名与勋章 */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-neutral-800 text-lg leading-tight">
                    {player.name}
                  </span>
                  
                  {/* 连胜火苗显示逻辑 */}
                  {streak >= 3 && (
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full border border-orange-200"
                    >
                      <Flame size={10} fill="currentColor" />
                      <span className="text-[9px] italic font-black">{streak}连胜</span>
                    </motion.div>
                  )}
                </div>
                <span className="text-[8px] font-bold text-neutral-300 uppercase tracking-tighter">
                  {index === 0 ? 'Current Champion' : 'Club Member'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 text-red-600 font-black text-2xl italic leading-none">
                  <Star size={14} fill="currentColor" />
                  <span>{player.elo_rating || 1500}</span>
                </div>
                <p className="text-[9px] text-neutral-400 font-black uppercase tracking-tighter mt-1">
                  Rating Points
                </p>
              </div>
              
              <ChevronRight size={16} className="text-neutral-200 group-hover:text-red-300 transition-colors" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
