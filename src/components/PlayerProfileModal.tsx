import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronLeft, ChevronRight, Activity, Target } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onCompareH2H?: (p1Id: string, p2Id: string) => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onCompareH2H }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  // --- 1. 数据统计逻辑 ---
  const playerMatches = matches.filter(m => (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id));
  const weeklyMatches = playerMatches.filter(m => m.date >= startOfThisWeek);
  
  const getStats = (matchList: Match[]) => {
    let sW = 0; let sL = 0; let dW = 0; let dL = 0;
    const opps: Record<string, number> = {};
    matchList.forEach(m => {
      const isT1 = (m.team1 || []).includes(player.id);
      const isSingles = m.type === 'Singles' || (m.team1 || []).length === 1;
      let g1 = 0; let g2 = 0;
      (m.scores || []).forEach(s => { if (s.team1 > s.team2) g1++; else g2++; });
      const won = isT1 ? g1 > g2 : g2 > g1;

      if (isSingles) { won ? sW++ : sL++; } else { won ? dW++ : dL++; }
      const oppTeam = isT1 ? (m.team2 || []) : (m.team1 || []);
      oppTeam.forEach(oid => opps[oid] = (opps[oid] || 0) + 1);
    });
    return { sW, sL, dW, dL, opps };
  };

  const allStats = getStats(playerMatches);
  const weekStats = getStats(weeklyMatches);
  const totalWins = allStats.sW + allStats.dW;
  const winRate = playerMatches.length > 0 ? Math.round((totalWins / playerMatches.length) * 100) : 0;

  // 俱乐部排名
  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex(p => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center overflow-y-auto"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-[#f5f5f5] w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* 1. 顶部 Header - pt 从 20 修改为 50 */}
        <div className="bg-[#2d2d2e] pt-50 pb-14 px-8 relative shrink-0">
          
          <button 
            onClick={onClose} 
            className="absolute left-6 top-14 flex items-center gap-1 text-white/40 hover:text-white transition-colors z-30 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <ChevronLeft size={18} /> Exit
          </button>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex-1 pr-4">
              <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
                {player.name}
              </h1>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-xl leading-none">🇨🇳</span>
                <span className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em] border-l border-white/10 pl-2">Elite Member</span>
              </div>
            </div>

            <div className="shrink-0">
               <div className="w-24 h-24 rounded-full border-[6px] border-white/5 overflow-hidden bg-[#3d3d3f] shadow-2xl">
                 {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/10">{player.initials}</div>}
               </div>
            </div>
          </div>
        </div>

        {/* 2. 核心战力展示条 */}
        <div className="bg-white px-8 py-7 flex items-center border-b border-neutral-100 shrink-0 relative z-20 shadow-sm">
           <div className="flex-1 text-center border-r border-neutral-100">
              <p className="text-4xl font-black text-orange-500 italic leading-none">{clubRank}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase mt-2 tracking-widest">本周排名</p>
           </div>
           <div className="flex-1 text-center">
              <p className="text-4xl font-black text-neutral-800 italic leading-none">{player.elo_rating || 1500}</p>
              <p className="text-[10px] font-bold text-neutral-400 uppercase mt-2 tracking-widest">当前战力</p>
           </div>
        </div>

        {/* 3. 统计区 */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          <div className="grid grid-cols-4 gap-2.5">
             {/* 字体在这里的 StatCard 组件内部放大了 */}
             <StatCard label="总胜率" value={`${winRate}%`} icon={<div className="w-10 h-10 rounded-full border-[3px] border-red-500 flex items-center justify-center text-[10px] font-black">{winRate}%</div>} />
             <StatCard label="本周胜场" value={weekStats.sW + weekStats.dW} icon={<Activity size={20} className="text-blue-500" />} />
             <StatCard label="生涯胜场" value={allStats.sW + allStats.dW} icon={<Award size={20} className="text-yellow-500" />} />
             <StatCard label="总场次" value={playerMatches.length} icon={<Trophy size={20} className="text-green-500" />} />
          </div>

          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-neutral-100">
             <RecordRow type="Single" title="单打生涯记录" win={allStats.sW} loss={allStats.sL} />
             <RecordRow type="Double" title="双打生涯记录" win={allStats.dW} loss={allStats.dL} />
          </div>

          <div className="space-y-4 pb-8">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-neutral-800 italic uppercase">主要对手 H2H</h3>
                <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">点击头像对比</span>
             </div>
             <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-1">
                {topOpponents.map(([oid, count]) => {
                  const opp = players.find(p => p.id === oid);
                  if (!opp) return null;
                  return (
                    <motion.button 
                      key={oid} 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onCompareH2H && onCompareH2H(player.id, opp.id)}
                      className="flex flex-col items-center shrink-0 group"
                    >
                       <div className="w-16 h-16 rounded-full p-1 bg-white shadow-sm border border-neutral-100 group-hover:border-red-500 transition-colors">
                          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-50">
                             {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300">{opp.initials}</div>}
                          </div>
                       </div>
                       <p className="text-[10px] font-black text-neutral-800 mt-2 truncate w-16 text-center">{opp.name}</p>
                       <p className="text-[8px] font-bold text-neutral-400 mt-0.5 uppercase tracking-tighter">{count}次交手</p>
                    </motion.button>
                  );
                })}
             </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-neutral-100 shrink-0">
           <button 
             onClick={onClose} 
             className="w-full py-4 bg-[#1a1a1b] text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all"
           >
             关闭球员档案
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 辅助组件：放大了字体和图标
function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-3 rounded-[24px] shadow-sm border border-neutral-50 flex flex-col items-center justify-between h-32">
       <div className="flex-1 flex items-center justify-center scale-110">{icon}</div>
       <p className="text-lg font-black text-neutral-800 italic leading-none">{value}</p>
       <p className="text-[9px] font-black text-neutral-400 uppercase tracking-tighter mt-1">{label}</p>
    </div>
  );
}

function RecordRow({ type, title, win, loss }: any) {
  const rate = win + loss > 0 ? Math.round(win/(win+loss)*100) : 0;
  return (
    <div className="p-5 flex items-center justify-between border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors">
       <div className="flex items-center gap-4">
          <div className={`w-12 h-6 flex items-center justify-center rounded-[4px] text-[10px] font-black text-white italic tracking-tighter shadow-sm ${
            type === 'Single' ? 'bg-[#e11d48]' : 'bg-[#1a1a1b]'
          }`}>{type}</div>
          <div>
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
            <p className="text-sm font-black text-neutral-800">{win} <span className="text-[10px] text-neutral-200 font-normal">胜</span> / {loss} <span className="text-[10px] text-neutral-200 font-normal">负</span></p>
          </div>
       </div>
       <div className="text-right flex items-center gap-4">
          <div>
            <p className="text-lg font-black text-neutral-800 italic leading-none">{rate}%</p>
            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1">胜率</p>
          </div>
          <ChevronRight size={16} className="text-neutral-200" />
       </div>
    </div>
  );
}
