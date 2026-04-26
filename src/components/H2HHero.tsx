import { motion } from 'motion/react';
import { Plus, User } from 'lucide-react';
import { Player } from '../types';

interface H2HHeroProps {
  stats: { t1Wins: number; t2Wins: number; total: number };
  team1Names: string;
  team2Names: string;
  onSelectTeam1: () => void;
  onSelectTeam2: () => void;
  onViewProfile: (p: Player) => void; // 新增：点击头像查看档案
  team1Empty: boolean;
  team2Empty: boolean;
  player1?: Player;
  player2?: Player;
}

export function H2HHero({ 
  stats, 
  team1Names, 
  team2Names, 
  onSelectTeam1, 
  onSelectTeam2,
  onViewProfile,
  team1Empty,
  team2Empty,
  player1,
  player2
}: H2HHeroProps) {
  return (
    <div className="bg-red-600 pt-8 pb-12 rounded-b-[40px] text-white overflow-hidden relative">
      {/* 背景装饰图形 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[40px] border-white" />
        <div className="absolute -left-20 bottom-10 w-40 h-40 rounded-full border-[20px] border-white" />
      </div>

      <div className="relative z-10 px-6">
        {/* 核心比分显示区 */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <motion.div 
            key={`t1-${stats.t1Wins}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-black tracking-tighter italic"
          >
            {stats.t1Wins}
          </motion.div>
          
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-xs font-black border border-white/20 italic">
            VS
          </div>
          
          <motion.div 
            key={`t2-${stats.t2Wins}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-black tracking-tighter italic"
          >
            {stats.t2Wins}
          </motion.div>
        </div>

        {/* 球员卡片选择区 */}
        <div className="grid grid-cols-2 gap-4">
          {/* TEAM A 卡片 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-[28px] p-4 text-neutral-800 shadow-2xl flex flex-col h-36 justify-between relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              {/* 点击加号或空白处选择球员 */}
              <button 
                onClick={onSelectTeam1}
                className="text-neutral-300 hover:text-red-500 transition-colors p-1"
              >
                <Plus size={20} />
              </button>

              {/* 头像区域：点击头像查看球员档案 */}
              {player1 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onViewProfile(player1)}
                  className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-red-500 shadow-md transition-all"
                >
                  {player1.avatar ? (
                    <img src={player1.avatar} alt={player1.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-neutral-400 italic">{player1.initials}</span>
                  )}
                </motion.button>
              ) : (
                <button 
                  onClick={onSelectTeam1}
                  className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200"
                >
                  <User size={32} />
                </button>
              )}
            </div>

            <div 
              onClick={onSelectTeam1}
              className="mt-2 text-left cursor-pointer"
            >
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">
                TEAM A
              </p>
              <p className={`font-black truncate text-lg ${team1Empty ? 'text-neutral-300 italic' : 'text-neutral-900'}`}>
                {team1Empty ? '未选球员' : team1Names}
              </p>
            </div>
          </motion.div>

          {/* TEAM B 卡片 */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-[28px] p-4 text-neutral-800 shadow-2xl flex flex-col h-36 justify-between relative overflow-hidden text-right"
          >
            <div className="flex justify-between items-start flex-row-reverse">
              {/* 点击加号或空白处选择球员 */}
              <button 
                onClick={onSelectTeam2}
                className="text-neutral-300 hover:text-red-500 transition-colors p-1"
              >
                <Plus size={20} />
              </button>

              {/* 头像区域：点击头像查看球员档案 */}
              {player2 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onViewProfile(player2)}
                  className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-red-500 shadow-md transition-all"
                >
                  {player2.avatar ? (
                    <img src={player2.avatar} alt={player2.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-black text-neutral-400 italic">{player2.initials}</span>
                  )}
                </motion.button>
              ) : (
                <button 
                  onClick={onSelectTeam2}
                  className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200"
                >
                  <User size={32} />
                </button>
              )}
            </div>

            <div 
              onClick={onSelectTeam2}
              className="mt-2 text-right cursor-pointer"
            >
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">
                TEAM B
              </p>
              <p className={`font-black truncate text-lg ${team2Empty ? 'text-neutral-300 italic' : 'text-neutral-900'}`}>
                {team2Empty ? '未选球员' : team2Names}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
