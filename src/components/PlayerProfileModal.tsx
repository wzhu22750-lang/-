import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronRight, Activity, Target, Star } from 'lucide-react';
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

  // --- 1. 基础战绩统计 ---
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

  // --- 2. 模拟历史重算获取“最高战力” ---
  const calculatePeakRating = () => {
    let simElo: Record<string, number> = {};
    players.forEach(p => simElo[p.id] = 1500);
    let myMaxElo = 1500;
    const sortedMatches = [...matches].sort((a, b) => a.date - b.date);

    sortedMatches.forEach(m => {
      const t1 = m.team1; const t2 = m.team2;
      const t1Avg = t1.reduce((sum, id) => sum + (simElo[id] || 1500), 0) / t1.length;
      const t2Avg = t2.reduce((sum, id) => sum + (simElo[id] || 1500), 0) / t2.length;
      let g1 = 0; let g2 = 0;
      m.scores.forEach(s => { if (s.team1 > s.team2) g1++; else g2++; });
      const change = calculateEloChange(t1Avg, t2Avg, g1 > g2);
      t1.forEach(id => simElo[id] = (simElo[id] || 1500) + change);
      t2.forEach(id => simElo[id] = (simElo[id] || 1500) - change);
      if (t1.includes(player.id) || t2.includes(player.id)) {
        myMaxElo = Math.max(myMaxElo, simElo[player.id]);
      }
    });
    return myMaxElo;
  };

  const peakRating = calculatePeakRating();
  const allPlayersSorted = [...players].sort((a, b) => (b.elo_rating || 1500) - (a.elo_rating || 1500));
  const clubRank = allPlayersSorted.findIndex(p => p.id === player.id) + 1;
  const topOpponents = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center overflow-y-auto"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-[#f5f5f5] w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* 1. 顶部深色区域 (Header) */}
        <div className="bg-[#2d2d2e] pt-16 pb-10 px-8 relative shrink-0">
          <button onClick={onClose} className="absolute left-6 top-8 text-white/50 hover:text-white transition-colors z-20">
            <X size={24} />
          </button>
          <div className="flex justify-between items-start mt-4">
            <div className="flex-1 pr-4">
              <h1 className="text-3xl font-black text-white tracking-tight leading-none italic">
                {player.name} <span className="text-white/30 text-xs font-normal not-italic ml-1">Member</span>
              </h1>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-lg">🇨🇳</span>
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest border-l border-white/20 pl-2">中国 | 俱乐部主力球员</span>
              </div>
              <div className="flex gap-8 mt-6">
                 <div>
                    <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xs font-bold text-green-400 uppercase tracking-tighter">● Active</p>
                 </div>
                 <div>
                    <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-xs font-bold text-white/90">2024</p>
                 </div>
              </div>
            </div>

            <div className="shrink-0">
              <div className="w-24 h-24 rounded-full border-[6px] border-white/5 overflow-hidden shadow-2xl bg-[#3d3d3f]">
                {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                 <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">{player.initials}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* 2. 核心排名战力栏 (四合一) */}
        <div className="bg-white px-5 py-5 flex items-center border-b border-neutral-100 shrink-0 relative z-10 shadow-sm">
           <div className="flex-1 grid grid-cols-2 gap-1 border-r border-neutral-100 px-1">
              <div className="text-center">
                 <p className="text-2xl font-black text-orange-500 italic leading-none">{clubRank}</p>
                 <p className="text-[8px] font-bold text-neutral-400 uppercase mt-1.5 tracking-tighter">本周排名</p>
              </div>
              <div className="text-center border-l border-neutral-50">
                 <p className="text-lg font-black text-neutral-300 italic leading-none">#1</p>
                 <p className="text-[8px] font-bold text-neutral-300 uppercase mt-1.5 tracking-tighter">最高排名</p>
              </div>
           </div>
           <div className="flex-1 grid grid-cols-2 gap-1 px-1">
              <div className="text-center">
                 <p className="text-2xl font-black text-neutral-800 italic leading-none">{player.elo_rating || 1500}</p>
                 <p className="text-[8px] font-bold text-neutral-400 uppercase mt-1.5 tracking-tighter">当前战力</p>
              </div>
              <div className="text-center border-l border-neutral-50">
                 <p className="text-lg font-black text-neutral-300 italic leading-none">{peakRating}</p>
                 <p className="text-[8px] font-bold text-neutral-300 uppercase mt-1.5 tracking-tighter">最高战力</p>
              </div>
           </div>
           <div className="pl-2">
              <button className="bg-[#e11d48] text-white px-5 py-2.5 rounded-xl font-black text-[11px] shadow-lg shadow-red-100 active:scale-95 transition-all shrink-0">
                支持 Ta
              </button>
           </div>
        </div>

        {/* 3. 滚动内容区 */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          {/* 四宫格核心数据 */}
          <div className="grid grid-cols-4 gap-2.5">
             <StatCard label="总胜率" value={`${winRate}%`} icon={<div className="w-9 h-9 rounded-full border-[3px] border-red-500 flex items-center justify-center text-[9px] font-black">{winRate}%</div>} />
             <StatCard label="本周胜场" value={weekStats.sW + weekStats.dW} icon={<Activity size={18} className="text-blue-500" />} />
             <StatCard label="总胜场" value={totalWins} icon={<Award size={18} className="text-yellow-500" />} />
             <StatCard label="总场次" value={playerMatches.length} icon={<Trophy size={18} className="text-green-500" />} />
          </div>

          {/* 生涯记录列表 (BWF样式) */}
          <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-neutral-100">
             <RecordRow 
                type="Single" 
                title="单打生涯记录" 
                win={allStats.sW} 
                loss={allStats.sL} 
             />
             <RecordRow 
                type="Double" 
                title="双打生涯记录" 
                win={allStats.dW} 
                loss={allStats.dL} 
             />
          </div>

          {/* 主要对手 H2H */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-black text-neutral-800 italic uppercase">主要对手 H2H</h3>
                <span className="text-[9px] font-bold text-neutral-300 uppercase tracking-widest">Since Joined</span>
             </div>
             <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 px-1">
                {topOpponents.map(([oid, count]) => {
                  const opp = players.find(p => p.id === oid);
                  if (!opp) return null;
                  return (
                    <motion.button
                      key={oid}
                      onClick={() => onViewProfile && onViewProfile(opp)}
                      className="flex flex-col items-center shrink-0 group"
                    >
                       <div className="w-16 h-16 rounded-full p-1 bg-white shadow-sm group-hover:shadow-md transition-all border border-neutral-100">
                          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-50">
                             {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : 
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300">{opp.initials}</div>}
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

        {/* 底部按钮 */}
        <div className="p-6 bg-white border-t border-neutral-100 shrink-0 text-center">
           <button onClick={onClose} className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] hover:text-neutral-900 transition-colors">
             关闭球员档案
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- 辅助组件 ---

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-3 rounded-[24px] shadow-sm border border-neutral-50 flex flex-col items-center justify-between h-28">
       <div className="flex-1 flex items-center justify-center">{icon}</div>
       <p className="text-xs font-black text-neutral-800 italic leading-none">{value}</p>
       <p className="text-[7px] font-black text-neutral-400 uppercase tracking-tighter mt-1">{label}</p>
    </div>
  );
}

function RecordRow({ type, title, win, loss }: any) {
  const rate = win + loss > 0 ? Math.round(win/(win+loss)*100) : 0;
  return (
    <div className="p-5 flex items-center justify-between border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-6 flex items-center justify-center rounded-[4px] text-[10px] font-black text-white italic tracking-tighter shadow-sm ${
            type === 'Single' ? 'bg-[#e11d48]' : 'bg-[#1a1a1b]'
          }`}>
            {type}
          </div>
          <div>
            <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1.5">{title}</p>
            <p className="text-sm font-black text-neutral-800">{win} <span className="text-[10px] text-neutral-300 font-normal not-italic">胜</span> / {loss} <span className="text-[10px] text-neutral-300 font-normal not-italic">负</span></p>
          </div>
       </div>
       <div className="text
