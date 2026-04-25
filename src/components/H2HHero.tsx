
import { motion } from 'motion/react';
import { Plus, User } from 'lucide-react';
import { Player } from '../types';

interface H2HHeroProps {
  stats: { t1Wins: number; t2Wins: number; total: number };
  team1Names: string;
  team2Names: string;
  onSelectTeam1: () => void;
  onSelectTeam2: () => void;
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
  team1Empty,
  team2Empty,
  player1,
  player2
}: H2HHeroProps) {
  return (
    <div className="bg-red-600 pt-8 pb-12 rounded-b-[40px] text-white overflow-hidden relative">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full border-[40px] border-white" />
        <div className="absolute -left-20 bottom-10 w-40 h-40 rounded-full border-[20px] border-white" />
      </div>

      <div className="relative z-10 px-6">
        <div className="flex items-center justify-center gap-8 mb-10">
          <motion.div 
            key={`t1-${stats.t1Wins}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-bold tracking-tighter"
          >
            {stats.t1Wins}
          </motion.div>
          
          <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-sm font-bold border border-white/20">
            VS
          </div>
          
          <motion.div 
            key={`t2-${stats.t2Wins}`}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-bold tracking-tighter"
          >
            {stats.t2Wins}
          </motion.div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Player Slot 1 */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSelectTeam1}
            className="bg-white rounded-2xl p-4 text-neutral-800 shadow-xl flex flex-col h-32 justify-between group relative overflow-hidden"
          >
            <div className="flex justify-between items-start">
              <span className="text-neutral-300 group-hover:text-red-500 transition-colors">
                <Plus size={18} />
              </span>
              {player1 ? (
                <div className="flex flex-col items-center gap-1">
                   <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-50">
                      {player1.avatar ? (
                        <img src={player1.avatar} alt={player1.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-neutral-400">{player1.initials}</span>
                      )}
                   </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200">
                  <User size={32} />
                </div>
              )}
            </div>
            <div className="mt-2 text-left">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                TEAM A
              </p>
              <p className="font-bold truncate text-lg">
                {team1Empty ? '选择球员' : team1Names}
              </p>
            </div>
          </motion.button>

          {/* Player Slot 2 */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSelectTeam2}
            className="bg-white rounded-2xl p-4 text-neutral-800 shadow-xl flex flex-col h-32 justify-between group relative overflow-hidden text-right"
          >
            <div className="flex justify-between items-start flex-row-reverse">
              <span className="text-neutral-300 group-hover:text-red-500 transition-colors">
                <Plus size={18} />
              </span>
              {player2 ? (
                <div className="flex flex-col items-center gap-1">
                   <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-50">
                      {player2.avatar ? (
                        <img src={player2.avatar} alt={player2.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-neutral-400">{player2.initials}</span>
                      )}
                   </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-200">
                  <User size={32} />
                </div>
              )}
            </div>
            <div className="mt-2 text-right">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                TEAM B
              </p>
              <p className="font-bold truncate text-lg">
                {team2Empty ? '选择球员' : team2Names}
              </p>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
