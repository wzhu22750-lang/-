import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronRight, Activity, Target, TrendingUp, Zap } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek, calculateEloChange } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onViewProfile?: (p: Player) => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onViewProfile }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  // --- 1. 计算当前战绩与主要对手 ---
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

  // --- 2. 核心算法：模拟历史重演以获取“最高战力” ---
  const calculatePeakRating = () => {
    let currentSimElo: Record<string, number> = {};
    players.forEach(p => currentSimElo[p.id] = 1500);
    
    let myMaxElo = 1500;
    const sortedMatches = [...matches].sort((a, b) => a.date - b.date);

    sortedMatches.forEach(m => {
      const t1 = m.team1; const t2 = m.team2;
      const t1Avg = t1.reduce((sum, id) => sum + (currentSimElo[id] || 1500), 0) / t1.length;
      const t2Avg = t2.reduce((sum, id) => sum + (currentSimElo[id] || 1500), 0) / t2.length;
      let g1 = 0; let g2 = 0;
      m.scores.forEach(s => { if (s.team1 > s.team2) g1++; else g2++; });
      const change = calculateEloChange(t1Avg, t2Avg, g1 > g2);

      t1.forEach(id => currentSimElo[id] = (currentSimElo[id] || 1500) + change);
      t2.forEach(id => currentSimElo[id] = (currentSimElo[id] || 1500) - change);

      if (t1.includes(player.id) || t2.includes(player.id)) {
        myMaxElo = Math.max(myMaxElo, currentSimElo[player.id]);
      }
    });
    return myMaxElo;
  };

  const peakRating = calculatePeakRating();
  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex(p => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center overflow-y-auto">
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 30 }} className="bg-[#f5f5f5] w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[48px] overflow-hidden relative shadow-2xl flex flex-col">
        
        {/* 1. 顶部 Header */}
        <div className="bg-[#2d2d2e] pt-12 pb-10 px-8 relative shrink-0">
          <button onClick={onClose} className="absolute left-6 top-6 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
          <div className="flex justify-between items-start mt-4">
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-white tracking-tight italic uppercase">{player.name} <span className="text-white/20 text-xs font-normal not-italic ml-1">Member</span></h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-base">🇨🇳</span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest border-l border-white/10 pl-2">China | 俱乐部主力</span>
              </div>
              <div className="flex gap-8">
                 <div><p className="text-white/20 text-[9px] font-black uppercase mb-1">Status</p><p className="text-xs font-bold text-green-400 uppercase tracking-tighter">● Active</p></div>
                 <div><p className="text-white/20 text-[9px] font-black uppercase mb-1">Joined</p><p className="text-xs font-bold text-white/90">2024</p></div>
              </div>
            </div>
            <div className="w-24 h-24 rounded-full border-[6px] border-white/5 overflow-hidden bg-[#3d3d3f] shadow-2xl">
               {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">{player.initials}</div>}
            </div>
          </div>
        </div>

        {/* 2. 核心数据栏 (White Bar) */}
        <div className="bg-white px-6 py-5 flex items-center border-b border-neutral-100 shrink-0 shadow-sm relative z-10">
           <div className="flex-1 grid grid-cols-2 gap-2 border-r border-neutral-100 px-2">
              <div className="text-center">
                 <p className="text-2xl font-black text-orange-500 italic leading-none">{clubRank}</p>
                 <p className="text-[8px] font-bold text-neutral-400 uppercase mt-1">本周排名</p>
              </div>
              <div className="text-center border-l border-neutral-50">
                 <p className="text-lg font-black text-neutral-300 italic leading-none">#1</p>
                 <p className="text-[8px] font-bold text-neutral-300 uppercase mt-1">最高排名</p>
              </div>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-2 px-2">
              <div className="text-center">
                 <p className="text-2xl font-black text-neutral-800 italic leading-none">{player.elo_rating || 1500}</p>
                 <p className="text-[8px] font-bold text-neutral-400 uppercase mt-1">当前战力</p>
              </div>
              <div className="text-center border-l border-neutral-50">
                 <p className="text-lg font-black text-neutral-300 italic leading-none">{peakRating}</p>
                 <p className="text-[8px] font-bold text-neutral-300 uppercase mt-1">最高战力</p>
              </div>
           </div>
           <button className="ml-2 bg-[#e11d48] text-white px-5 py-2.5 rounded-xl font-black text-[11px] shadow-lg shadow-red-100 active:scale-95 transition-all">支持 Ta</button>
        </div>

        {/* 3. 统计区 */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          <div className="grid grid-cols-4 gap-2.5">
             <StatCard label="总胜率" value={`${winRate}%`} icon={<div className="w-9 h-9 rounded-full border-[3px] border-red-500 flex items-center justify-center text-[9px] font-black">{winRate}%</div>} />
             <StatCard label="本周胜场" value={weekStats.sW + weekStats.dW} icon={<Activity size={18} className="text-blue-500" />} />
             <StatCard label="生涯胜场" value={allStats.sW + allStats.dW} icon={<Award size={18} className="text-yellow-500" />} />
             <StatCard label="总场次" value={playerMatches.length} icon={<Trophy size={18} className="text-green-500" />} />
          </div>

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
             <RecordRow type="BWF" title="单打生涯记录" win={allStats.sW} loss={allStats.sL} />
             <RecordRow type="TOUR" title="双打生涯记录" win={allStats.dW} loss={allStats.dL} />
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-neutral-800 italic uppercase">主要对手 H2H</h3>
                <span className="text-[9px] font-bold text-neutral-300 uppercase">Competitive history</span>
             </div>
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1">
                {topOpponents.map(([oid, count]) => {
                  const opp = players.find(p => p.id === oid);
                  if (!opp) return null;
                  return (
                    <motion.button key={oid} onClick={() => onViewProfile && onViewProfile(opp)} className="flex flex-col items-center shrink-0">
                       <div className="w-16 h-16 rounded-full p-1 bg-white shadow-sm border border-neutral-100">
                          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-50">
                             {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300">{opp.initials}</div>}
                          </div>
                       </div>
                       <p className="text-[10px] font-black text-neutral-800 mt-2 truncate w-16 text-center">{opp.name}</p>
                       <p className="text-[8px] font-bold text-red-500">{count}次交手</p>
                    </motion.button>
                  );
                })}
             </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-neutral-100 shrink-0 text-center">
           <button onClick={onClose} className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] hover:text-neutral-900 transition-colors">关闭球员档案</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-3 rounded-[24px] shadow-sm border border-neutral-50 flex flex-col items-center justify-between h-28">
       <div className="flex-1 flex items-center justify-center">{icon}</div>
       <p className="text-xs font-black text-neutral-800 italic">{value}</p>
       <p className="text-[7px] font-black text-neutral-400 uppercase tracking-tighter mt-1">{label}</p>
    </div>
  );
}

function RecordRow({ type, title, win, loss }: any) {
  const rate = win + loss > 0 ? Math.round(win/(win+loss)*100) : 0;
  return (
    <div className="p-5 flex items-center justify-between border-b border-neutral-50 last:border-0">
       <div className="flex items-center gap-4">
          <div className={`w-9 h-5 flex items-center justify-center rounded text-[9px] font-black text-white ${type === 'BWF' ? 'bg-[#e11d48]' : 'bg-[#1a1a1b]'}`}>{type}</div>
          <div>
            <p className="text-[9px] font-black text-neutral-400 uppercase mb-0.5">{title}</p>
            <p className="text-sm font-black text-neutral-800">{win} 胜 <span className="text-neutral-200 mx-1">/</span> {loss} 负</p>
          </div>
       </div>
       <div className="text-right">
          <p className="text-lg font-black text-neutral-800 italic leading-none">{rate}%</p>
          <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1">Win Rate</p>
       </div>
    </div>
  );
}
