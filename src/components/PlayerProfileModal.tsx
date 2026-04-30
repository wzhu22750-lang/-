import { motion } from 'motion/react';
import { X, Trophy, Award, ChevronRight, Users, Star, Activity, Target } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onViewProfile?: (p: Player) => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onViewProfile }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();

  // --- 1. 数据深度逻辑 ---
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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[150] flex items-center justify-center overflow-y-auto"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-[#f5f5f5] w-full max-w-lg min-h-screen sm:min-h-0 sm:h-[90vh] sm:rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* 1. 顶部深色区域 (还原中羽 Header) */}
        <div className="bg-[#2d2d2e] pt-12 pb-10 px-8 relative shrink-0">
          <button onClick={onClose} className="absolute left-6 top-6 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
          <div className="flex justify-between items-start mt-4">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                  {player.name} <span className="text-white/30 text-xs font-normal italic ml-1">Member</span>
                </h1>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-lg">🇨🇳</span>
                  <span className="text-white/50 text-xs font-bold uppercase tracking-widest border-l border-white/20 pl-2">中国 | 俱乐部主力</span>
                </div>
              </div>
              <div className="flex gap-10">
                 <div>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                    <p className="text-sm font-bold text-white">Active</p>
                 </div>
                 <div>
                    <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-sm font-bold text-white">2026年04月</p>
                 </div>
              </div>
            </div>

            {/* 头像 - 确保右侧显示且不被覆盖 */}
            <div className="w-24 h-24 rounded-full border-4 border-white/5 overflow-hidden shadow-2xl bg-[#3d3d3f]">
               {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20">{player.initials}</div>}
            </div>
          </div>
        </div>

        {/* 2. 本月人气栏 (白底悬浮条) */}
        <div className="bg-white px-8 py-5 flex items-center border-b border-neutral-100 shrink-0">
           <div className="flex-1 text-center border-r border-neutral-100">
              <p className="text-3xl font-black text-orange-500 italic leading-none">{clubRank}</p>
              <p className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-tighter">本周俱乐部排名</p>
           </div>
           <div className="flex-1 text-center">
              <p className="text-3xl font-black text-neutral-800 italic leading-none">{player.elo_rating || 1500}</p>
              <p className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-tighter">当前战力指数</p>
           </div>
           <div className="pl-6">
              <button className="bg-[#e11d48] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-xl shadow-red-100 active:scale-95 transition-all">
                支持 Ta
              </button>
           </div>
        </div>

        {/* 3. 滚动内容区 */}
        <div className="p-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
          
          {/* 四宫格核心数据 */}
          <div className="grid grid-cols-4 gap-3">
             <StatCard label="总胜率" value={`${winRate}%`} icon={<div className="w-10 h-10 rounded-full border-[3px] border-red-500 flex items-center justify-center text-[10px] font-black">{winRate}%</div>} />
             <StatCard label="本周胜场" value={weekStats.sW + weekStats.dW} icon={<div className="bg-blue-50 p-2.5 rounded-xl text-blue-500"><Activity size={20} /></div>} />
             <StatCard label="总胜场" value={totalWins} icon={<div className="bg-yellow-50 p-2.5 rounded-xl text-yellow-500"><Award size={20} /></div>} />
             <StatCard label="总场次" value={playerMatches.length} icon={<div className="bg-green-50 p-2.5 rounded-xl text-green-500"><Trophy size={20} /></div>} />
          </div>

          {/* 生涯记录列表 (模仿 BWF 样式) */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-neutral-100">
             <RecordItem 
                type="Single" 
                title="单打生涯记录" 
                win={allStats.sW} 
                loss={allStats.sL} 
                rate={allStats.sW + allStats.sL > 0 ? Math.round(allStats.sW/(allStats.sW+allStats.sL)*100) : 0} 
             />
             <RecordItem 
                type="Double" 
                title="双打生涯记录" 
                win={allStats.dW} 
                loss={allStats.dL} 
                rate={allStats.dW + allStats.dL > 0 ? Math.round(allStats.dW/(allStats.dW+allStats.dL)*100) : 0} 
             />
          </div>

          {/* 主要对手 H2H */}
          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-neutral-800 italic uppercase">主要对手 H2H</h3>
                <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">Since Joined</span>
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
                       <div className="w-18 h-18 rounded-full p-1 bg-white shadow-md group-hover:shadow-xl transition-all border border-neutral-100">
                          <div className="w-full h-full rounded-full overflow-hidden bg-neutral-100">
                             {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : 
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-neutral-300">{opp.initials}</div>}
                          </div>
                       </div>
                       <p className="text-[11px] font-black text-neutral-800 mt-2 truncate w-20 text-center">{opp.name}</p>
                       <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">{count}次交手</p>
                    </motion.button>
                  );
                })}
             </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-8 bg-white border-t border-neutral-50 shrink-0">
           <button onClick={onClose} className="w-full py-4 bg-[#1a1a1b] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
             关闭球员档案
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- 辅助小组件 ---

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-white p-3 rounded-[24px] shadow-sm border border-neutral-50 flex flex-col items-center justify-between h-32 hover:border-red-100 transition-colors">
       <div className="flex-1 flex items-center justify-center">{icon}</div>
       <div className="text-center">
          <p className="text-sm font-black text-neutral-800 italic">{value}</p>
          <p className="text-[8px] font-black text-neutral-400 uppercase tracking-tighter leading-none mt-1">{label}</p>
       </div>
    </div>
  );
}

function RecordItem({ title, win, loss, rate, type }: any) {
  return (
    <div className="p-5 flex items-center justify-between border-b border-neutral-50 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer group">
       <div className="flex items-center gap-4">
          <div className={`w-10 h-6 flex items-center justify-center rounded text-[10px] font-black text-white ${type === 'BWF' ? 'bg-[#e11d48]' : 'bg-[#1a1a1b]'}`}>
            {type}
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">{title}</p>
            <p className="text-sm font-black text-neutral-800">{win} 胜 <span className="text-neutral-300 mx-1">/</span> {loss} 负</p>
          </div>
       </div>
       <div className="text-right flex items-center gap-4">
          <div>
            <p className="text-lg font-black text-neutral-800 italic leading-none">{rate}%</p>
            <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-widest mt-1">胜率</p>
          </div>
          <ChevronRight size={16} className="text-neutral-200 group-hover:text-red-500 transition-colors" />
       </div>
    </div>
  );
}
