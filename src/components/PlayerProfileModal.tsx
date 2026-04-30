import { motion } from 'motion/react';
import { X, Trophy, Target, TrendingUp, Award, ChevronRight, Users, Flame, Star } from 'lucide-react';
import { Player, Match } from '../types';
import { getPlayerTier } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
}

export function PlayerProfileModal({ player, matches, players, onClose }: PlayerProfileModalProps) {
  // --- 1. 数据深度挖掘 ---
  const playerMatches = matches.filter(m => m.team1.includes(player.id) || m.team2.includes(player.id));
  
  let wins = 0;
  const opponentCounts: Record<string, number> = {};

  playerMatches.forEach(m => {
    const isT1 = m.team1.includes(player.id);
    const oppTeam = isT1 ? m.team2 : m.team1;
    let t1G = 0; let t2G = 0;
    m.scores.forEach(s => { if (s.team1 > s.team2) t1G++; else if (s.team2 > s.team1) t2G++; });
    const won = isT1 ? t1G > t2G : t2G > t1G;
    if (won) wins++;

    // 统计对手出现次数
    oppTeam.forEach(oid => {
      opponentCounts[oid] = (opponentCounts[oid] || 0) + 1;
    });
  });

  const winRate = playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0;
  
  // 计算俱乐部排名
  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex(p => p.id === player.id) + 1;

  // 获取前4名主要对手
  const topOpponentIds = Object.entries(opponentCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center overflow-y-auto"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }}
        className="bg-[#f6f6f6] w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[40px] overflow-hidden relative shadow-2xl"
      >
        {/* 1. 顶部深色英雄区 */}
        <div className="bg-[#2d2d2e] pt-14 pb-8 px-8 relative text-white">
          <button onClick={onClose} className="absolute left-6 top-6 text-white/70 hover:text-white">
            <X size={24} />
          </button>
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-black tracking-tight">{player.name} <span className="text-white/40 text-sm font-normal ml-1">Member</span></h1>
              <div className="flex items-center gap-3 text-xs text-white/50 font-bold uppercase tracking-wider">
                 <span>🇨🇳 中国</span>
                 <span className="w-px h-3 bg-white/20" />
                 <span>俱乐部成员</span>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1 pt-4">
                 <div><p className="text-white/30 text-[10px]">角色</p><p className="text-sm font-bold">主力球员</p></div>
                 <div><p className="text-white/30 text-[10px]">生日</p><p className="text-sm font-bold">12月15日</p></div>
              </div>
            </div>
            <div className="relative">
               <div className="w-24 h-24 rounded-full border-4 border-[#3d3d3f] overflow-hidden bg-[#3d3d3f]">
                 {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                   <div className="w-full h-full flex items-center justify-center text-2xl font-black">{player.initials}</div>}
               </div>
            </div>
          </div>
        </div>

        {/* 2. 人气数据栏 */}
        <div className="bg-white px-8 py-4 flex items-center border-b border-neutral-100">
           <div className="flex-1 text-center border-r border-neutral-100">
              <p className="text-[20px] font-black text-orange-500 italic leading-none">{clubRank}</p>
              <p className="text-[10px] font-bold text-neutral-400 mt-1">俱乐部排名</p>
           </div>
           <div className="flex-1 text-center">
              <p className="text-[20px] font-black text-neutral-800 italic leading-none">{player.elo_rating}</p>
              <p className="text-[10px] font-bold text-neutral-400 mt-1">战力指数</p>
           </div>
           <button className="ml-4 bg-[#e11d48] text-white px-6 py-2.5 rounded-xl font-black text-sm shadow-lg shadow-red-200 active:scale-95 transition-all">
              支持 Ta
           </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 3. 四宫格核心数据 */}
          <div className="grid grid-cols-4 gap-3">
             <StatCard label="总胜率" value={`${winRate}%`} icon={<div className="w-10 h-10 rounded-full border-4 border-red-500 flex items-center justify-center text-[10px] font-black">{winRate}%</div>} />
             <StatCard label="能力值" value="99" icon={<div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Target size={20} /></div>} />
             <StatCard label="获胜数" value={wins} icon={<div className="bg-yellow-50 p-2 rounded-xl text-yellow-500"><Award size={20} /></div>} />
             <StatCard label="最高分" value={player.elo_rating} icon={<div className="bg-green-50 p-2 rounded-xl text-green-500"><TrendingUp size={20} /></div>} />
          </div>

          {/* 4. 排名详情 */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
             <RankItem icon={<Trophy size={16} className="text-red-500" />} title="俱乐部排名 - 个人" value={clubRank} date="2024年第18周" />
             <RankItem icon={<Users size={16} className="text-blue-500" />} title="巡回赛排名 - 双打" value="--" date="未入榜" />
          </div>

          {/* 5. 主要对手 H2H */}
          <div className="space-y-4">
             <div className="flex items-end justify-between px-2">
                <h3 className="text-lg font-black text-neutral-800 italic">主要对手 H2H</h3>
                <span className="text-[10px] font-bold text-neutral-300 uppercase">Data since Joined</span>
             </div>
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                {topOpponentIds.length > 0 ? topOpponentIds.map(([oid, count]) => {
                  const opp = players.find(p => p.id === oid);
                  return (
                    <div key={oid} className="flex flex-col items-center shrink-0 space-y-2">
                       <div className="w-16 h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                          {opp?.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : 
                            <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400 font-bold">{opp?.initials}</div>}
                       </div>
                       <div className="text-center">
                          <p className="text-[11px] font-black text-neutral-800 truncate w-16">{opp?.name}</p>
                          <p className="text-[10px] font-bold text-neutral-400">{count}次</p>
                       </div>
                    </div>
                  );
                }) : <p className="text-xs text-neutral-300 pl-2">暂无足够交手记录</p>}
             </div>
          </div>
        </div>

        <div className="p-6">
           <button onClick={onClose} className="w-full py-4 bg-neutral-900 text-white rounded-[20px] font-black uppercase tracking-widest shadow-xl">
             Close Profile
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 辅助组件：四宫格卡片
function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-3 rounded-[24px] flex flex-col items-center justify-between shadow-sm border border-neutral-50 h-32">
       <div className="flex-1 flex items-center justify-center">{icon}</div>
       <div className="text-center">
          <p className="text-sm font-black text-neutral-800 italic">{value}</p>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{label}</p>
       </div>
    </div>
  );
}

// 辅助组件：排名列表项
function RankItem({ icon, title, value, date }: any) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
       <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neutral-50 rounded-lg flex items-center justify-center">{icon}</div>
          <span className="text-xs font-black text-neutral-700">{title} <span className="text-lg ml-1 italic">{value}</span></span>
       </div>
       <div className="flex items-center gap-2 text-neutral-300">
          <span className="text-[10px] font-bold">{date}</span>
          <ChevronRight size={14} />
       </div>
    </div>
  );
}
