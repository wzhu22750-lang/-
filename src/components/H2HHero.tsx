import { motion } from 'motion/react';
import { Plus, User } from 'lucide-react';
import { Player } from '../types';

interface H2HHeroProps {
  stats: { t1Wins: number; t2Wins: number; total: number };
  team1Names: string;
  team2Names: string;
  onSelectTeam1: () => void;
  onSelectTeam2: () => void;
  onViewProfile: (p: Player) => void;
  team1Empty: boolean;
  team2Empty: boolean;
  team1Players: Player[]; // 改为数组
  team2Players: Player[]; // 改为数组
}

export function H2HHero({ 
  stats, team1Names, team2Names, onSelectTeam1, onSelectTeam2, onViewProfile, team1Empty, team2Empty, team1Players, team2Players 
}: H2HHeroProps) {
  
  const renderAvatars = (players: Player[], side: 'left' | 'right') => {
    if (players.length === 0) return <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200"><User size={32} /></div>;
    
    return (
      <div className={`flex ${side === 'left' ? 'flex-row' : 'flex-row-reverse'} -space-x-4`}>
        {players.map((p, i) => (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onViewProfile(p); }}
            className="w-16 h-16 rounded-full bg-neutral-100 overflow-hidden border-4 border-white shadow-lg relative"
            style={{ zIndex: players.length - i }}
          >
            {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : 
              <div className="w-full h-full flex items-center justify-center text-red-600 font-black italic text-xl">{p.initials}</div>}
          </motion.button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-red-600 pt-8 pb-12 rounded-b-[40px] text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[40px] border-white" />
        <div className="absolute -left-20 bottom-10 w-40 h-40 rounded-full border-[20px] border-white" />
      </div>

      <div className="relative z-10 px-6">
        <div className="flex items-center justify-center gap-8 mb-10">
          <motion.div key={`t1-${stats.t1Wins}`} animate={{ scale: [0.8, 1] }} className="text-8xl font-black tracking-tighter italic">{stats.t1Wins}</motion.div>
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-xs font-black border border-white/20 italic">VS</div>
          <motion.div key={`t2-${stats.t2Wins}`} animate={{ scale: [0.8, 1] }} className="text-8xl font-black tracking-tighter italic">{stats.t2Wins}</motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Team A */}
          <motion.div onClick={onSelectTeam1} whileTap={{ scale: 0.98 }} className="bg-white rounded-[28px] p-4 text-neutral-800 shadow-2xl flex flex-col h-40 justify-between cursor-pointer">
            <div className="flex justify-between items-start">
              <Plus size={18} className="text-neutral-200" />
              {renderAvatars(team1Players, 'left')}
            </div>
            <div className="mt-2 text-left">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">TEAM A</p>
              <p className="font-black truncate text-lg leading-tight">{team1Empty ? '选择球员' : team1Names}</p>
            </div>
          </motion.div>

          {/* Team B */}
          <motion.div onClick={onSelectTeam2} whileTap={{ scale: 0.98 }} className="bg-white rounded-[28px] p-4 text-neutral-800 shadow-2xl flex flex-col h-40 justify-between cursor-pointer">
            <div className="flex justify-between items-start flex-row-reverse">
              <Plus size={18} className="text-neutral-200" />
              {renderAvatars(team2Players, 'right')}
            </div>
            <div className="mt-2 text-right">
              <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest leading-none mb-1">TEAM B</p>
              <p className="font-black truncate text-lg leading-tight">{team2Empty ? '选择球员' : team2Names}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
