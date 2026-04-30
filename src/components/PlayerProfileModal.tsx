import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Target, Award, Users, Star, Activity, Zap, Flame, ChevronRight, Share2, Heart } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek, getPlayerTier } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
  onViewProfile?: (p: Player) => void; // 用于切换对手档案
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose, onViewProfile }: PlayerProfileModalProps) {
  const startOfThisWeek = getStartOfThisWeek();
  const tier = getPlayerTier(player.elo_rating);

  // --- 1. 数据统计逻辑 ---
  const playerMatches = matches.filter(m => (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id));
  const weeklyMatches = playerMatches.filter(m => m.date >= startOfThisWeek);
  
  const getStats = (matchList: Match[]) => {
    let sWins = 0; let sTotal = 0;
    let dWins = 0; let dTotal = 0;
    const opps: Record<string, number> = {};

    matchList.forEach(m => {
      const isT1 = (m.team1 || []).includes(player.id);
      const isSingles = m.type === 'Singles' || (m.team1 || []).length === 1;
      let t1G = 0; let t2G = 0;
      (m.scores || []).forEach(s => { if (s.team1 > s.team2) t1G++; else t2G++; });
      const won = isT1 ? t1G > t2G : t2G > t1G;
      if (isSingles) { sTotal++; if(won) sWins++; } else { dTotal++; if(won) dWins++; }
      const oppTeam = isT1 ? (m.team2 || []) : (m.team1 || []);
      oppTeam.forEach(oid => opps[oid] = (opps[oid] || 0) + 1);
    });
    return { sWins, sTotal, dWins, dTotal, opps };
  };

  const allStats = getStats(playerMatches);
  const weekStats = getStats(weeklyMatches);

  // --- 2. 排名逻辑 ---
  const getWeeklyRank = (type: 'Singles' | 'Doubles') => {
    const weeklyData = players.map(p => {
      const pMatches = matches.filter(m => m.date >= startOfThisWeek && ((m.team1 || []).includes(p.id) || (m.team2 || []).includes(p.id)));
      const filtered = type === 'Singles' ? pMatches.filter(m => m.type === 'Singles') : pMatches.filter(m => m.type === 'Doubles');
      let w = 0;
      filtered.forEach(m => {
        const isT1 = m.team1.includes(p.id);
        let g1=0; let g2=0;
        m.scores.forEach(s => { if(s.team1 > s.team2) g1++; else g2++; });
        if(isT1 ? g1 > g2 : g2 > g1) w++;
      });
      return { id: p.id, wins: w };
    }).sort((a, b) => b.wins - a.wins);
    
    const rankIndex = weeklyData.findIndex(x => x.id === player.id);
    const myWins = weeklyData[rankIndex]?.wins || 0;
    return { rank: myWins > 0 ? `#${rankIndex + 1}` : '--', isFirst: rankIndex === 0 && myWins > 0 };
  };

  const sRank = getWeeklyRank('Singles');
  const dRank = getWeeklyRank('Doubles');
  const topOpponents = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 5);

  const winRate = playerMatches.length > 0 ? Math.round((allStats.sWins + allStats.dWins) / playerMatches.length * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[150] flex items-center justify-center p-0 sm:p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-[#f0f2f5] w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-[40px] overflow-hidden relative shadow-2xl flex flex-col"
      >
        {/* 1. 顶部：球星海报区 */}
        <div className="bg-[#1a1a1a] pt-14 pb-12 px-8 relative overflow-hidden shrink-0">
          {/* 装饰性背景 */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-red-600/20 rounded-full blur-[80px]" />
          
          <button onClick={onClose} className="absolute left-6 top-6 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white/70 transition-all z-20 backdrop-blur-md">
            <X size={20} />
          </button>

          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-widest">精英球员</span>
                   {(sRank.isFirst || dRank.isFirst) && (
                     <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="px-2 py-0.5 bg-yellow-400 text-black text-[8px] font-black rounded uppercase">本周球王</motion.span>
                   )}
                </div>
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">{player.name}</h1>
              </div>
              
              <div className="flex gap-4">
                 <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <p className="text-white/30 text-[8px] font-black uppercase mb-1">战力指数</p>
                    <p className="text-xl font-black text-red-500 italic leading-none">{player.elo_rating || 1500}</p>
                 </div>
                 <div className="bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <p className="text-white/30 text-[8px] font-black uppercase mb-1">段位</p>
                    <p className={`text-xs font-black uppercase tracking-tighter ${tier.color}`}>{tier.label}</p>
                 </div>
              </div>
            </div>

            {/* 头像展示 */}
            <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="relative">
              <div className="w-28 h-28 rounded-[32px] p-1 bg-gradient-to-tr from-red-600 to-orange-400 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                <div className="w-full h-full rounded-[28px] border-4 border-[#1a1a1a] overflow-hidden bg-neutral-800">
                  {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                    <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white/20 italic">{player.initials}</div>}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* 2. 核心数据看板 */}
        <div className="px-6 -mt-8 relative z-20 flex-1 overflow-y-auto no-scrollbar pb-10">
          
          {/* 本周实时排行卡片 */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl mb-6 border border-white flex items-center justify-between">
             <div className="text-center flex-1 border-r border-neutral-100 group">
                <p className={`text-3xl font-black italic leading-none transition-transform group-hover:scale-110 ${sRank.isFirst ? 'text-yellow-500' : 'text-neutral-900'}`}>{sRank.rank}</p>
                <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">本周单打排名</p>
             </div>
             <div className="text-center flex-1 group">
                <p className={`text-3xl font-black italic leading-none transition-transform group-hover:scale-110 ${dRank.isFirst ? 'text-yellow-500' : 'text-neutral-900'}`}>{dRank.rank}</p>
                <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">本周双打排名</p>
             </div>
             <div className="pl-4">
                <button className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-sm">
                   <Heart size={20} />
                </button>
             </div>
          </div>

          <div className="space-y-6">
            {/* 四宫格：动态统计 */}
            <div className="grid grid-cols-2 gap-4">
               <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-5 rounded-[32px] shadow-sm border border-neutral-50 flex flex-col justify-between h-36">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><Activity size={20} /></div>
                  <div>
                    <p className="text-2xl font-black text-neutral-900 italic leading-none">{weekStats.sWins + weekStats.dWins}</p>
                    <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">本周胜场</p>
                  </div>
               </motion.div>
               <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-5 rounded-[32px] shadow-sm border border-neutral-50 flex flex-col justify-between h-36">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <div className="relative flex items-center justify-center">
                      <Star size={20} fill="currentColor"/>
                      <span className="absolute text-[8px] font-black text-white">{winRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-neutral-900 italic leading-none">{winRate}%</p>
                    <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">生涯总胜率</p>
                  </div>
               </motion.div>
            </div>

            {/* 详细记录：交互列表 */}
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-white overflow-hidden">
               {[
                 { label: '单打生涯记录', win: allStats.sWins, total: allStats.sTotal, icon: <Target className="text-blue-500"/>, bg: 'bg-blue-50' },
                 { label: '双打生涯记录', win: allStats.dWins, total: allStats.dTotal, icon: <Users className="text-purple-500"/>, bg: 'bg-purple-50' }
               ].map((item, i) => (
                 <div key={i} className="p-4 flex justify-between items-center hover:bg-neutral-50 transition-colors cursor-pointer group last:border-0 border-b border-neutral-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12`}>{item.icon}</div>
                      <div>
                        <p className="text-[10px] font-black text-neutral-400 uppercase leading-none mb-1">{item.label}</p>
                        <p className="text-sm font-black text-neutral-800">{item.win} 胜 - {item.total - item.win} 负</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-black text-neutral-800">{item.total > 0 ? Math.round((item.win/item.total)*100) : 0}%</p>
                       <div className="w-12 h-1 bg-neutral-100 rounded-full mt-1 overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.total > 0 ? (item.win/item.total)*100 : 0}%` }} className="h-full bg-red-500" />
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {/* 主要对手：头像联动切换 */}
            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black text-neutral-800 uppercase italic">主要对手宿敌</h3>
                  <span className="text-[9px] font-bold text-neutral-300 uppercase">点击头像查看对方档案</span>
               </div>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1">
                  {topOpponents.length > 0 ? topOpponents.map(([oid, count]) => {
                    const opp = players.find(p => p.id === oid);
                    if (!opp) return null;
                    return (
                      <motion.button
                        key={oid}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onViewProfile && onViewProfile(opp)}
                        className="flex flex-col items-center shrink-0 space-y-2"
                      >
                         <div className="w-16 h-16 rounded-[24px] p-1 bg-white shadow-md border border-neutral-100 relative group">
                            <div className="w-full h-full rounded-[20px] overflow-hidden bg-neutral-50">
                               {opp.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300 uppercase">{opp.initials}</div>}
                            </div>
                            <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/10 transition-colors rounded-[20px] flex items-center justify-center">
                               <ChevronRight size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-neutral-800 truncate w-16">{opp.name}</p>
                            <p className="text-[8px] font-bold text-red-500 uppercase">{count}次交手</p>
                         </div>
                      </motion.button>
                    );
                  }) : <p className="text-xs text-neutral-300 pl-2">暂无交手数据...</p>}
               </div>
            </div>
          </div>
        </div>

        {/* 底部功能栏 */}
        <div className="p-6 bg-white border-t border-neutral-100 flex gap-3 shrink-0">
           <button className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2">
             <Share2 size={16} /> 分享球员卡
           </button>
           <button onClick={onClose} className="w-16 py-4 bg-neutral-900 text-white rounded-2xl font-black flex items-center justify-center active:scale-90 transition-all">
             <X size={20} />
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
