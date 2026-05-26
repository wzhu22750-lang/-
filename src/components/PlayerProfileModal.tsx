import { motion } from 'motion/react';
import { Trophy, ChevronLeft, Target } from 'lucide-react';
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
        {/* 1. 顶部 Header */}
        <div className="bg-[#2d2d2e] pt-12 pb-8 px-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute left-6 top-12 -translate-y-1/2 flex items-center gap-1 text-white/40 hover:text-white transition-colors z-30 font-black text-[10px] uppercase tracking-[0.2em]"
          >
            <ChevronLeft size={18} /> 返回
          </button>

          <div className="flex items-center gap-5 relative z-10 mt-4">
            <div className="w-20 h-20 rounded-full border-[4px] border-white/10 overflow-hidden bg-[#3d3d3f] shadow-xl shrink-0">
              {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> :
               <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">{player.initials}</div>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white tracking-tight leading-tight truncate">
                {player.name}
              </h1>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.15em] mt-1">
                {player.elo_rating || 1500} ELO
              </p>
            </div>
          </div>
        </div>

        {/* 2. 排名与段位 */}
        <div className="bg-white px-6 py-5 flex items-center gap-4 border-b border-neutral-100 shrink-0">
           <div className="flex-1 bg-neutral-50 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Trophy size={22} className="text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-800 leading-none">{clubRank}</p>
                <p className="text-[10px] font-bold text-neutral-400 mt-1 tracking-widest">俱乐部排名</p>
              </div>
           </div>
           <div className="flex-1 bg-neutral-50 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Target size={22} className="text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-black text-neutral-800 leading-none">{player.elo_rating || 1500}</p>
                <p className="text-[10px] font-bold text-neutral-400 mt-1 tracking-widest">当前战力</p>
              </div>
           </div>
        </div>

        {/* 3. 统计区 */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-5">
          <div className="grid grid-cols-4 gap-2">
             <StatCard label="总胜率" value={`${winRate}%`} color="text-red-500" bg="bg-red-50" />
             <StatCard label="本周胜场" value={weekStats.sW + weekStats.dW} color="text-blue-500" bg="bg-blue-50" />
             <StatCard label="生涯胜场" value={allStats.sW + allStats.dW} color="text-yellow-500" bg="bg-yellow-50" />
             <StatCard label="总场次" value={playerMatches.length} color="text-green-500" bg="bg-green-50" />
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100">
             <RecordRow type="Single" title="单打记录" win={allStats.sW} loss={allStats.sL} />
             <RecordRow type="Double" title="双打记录" win={allStats.dW} loss={allStats.dL} />
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
function StatCard({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 flex flex-col items-center justify-center gap-1`}>
       <p className={`text-xl font-black italic leading-none ${color}`}>{value}</p>
       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter text-center">{label}</p>
    </div>
  );
}

function RecordRow({ type, title, win, loss }: { type: string; title: string; win: number; loss: number }) {
  const total = win + loss;
  const rate = total > 0 ? Math.round(win / total * 100) : 0;
  const barWidth = total > 0 ? Math.round(win / total * 100) : 0;
  return (
    <div className="p-4 border-b border-neutral-50 last:border-0">
       <div className="flex items-center justify-between mb-2">
          <span className={`text-[9px] font-black text-white px-2 py-0.5 rounded ${type === 'Single' ? 'bg-rose-500' : 'bg-neutral-800'}`}>{type}</span>
          <span className="text-[10px] font-bold text-neutral-400">{title}</span>
          <span className="text-sm font-black text-neutral-800">{win}<span className="text-neutral-300 font-normal">胜</span> {loss}<span className="text-neutral-300 font-normal">负</span></span>
       </div>
       <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
             <div className={`h-full rounded-full transition-all ${type === 'Single' ? 'bg-rose-400' : 'bg-neutral-700'}`} style={{ width: `${barWidth}%` }} />
          </div>
          <span className="text-[10px] font-black text-neutral-500 w-8 text-right">{rate}%</span>
       </div>
    </div>
  );
}
