import { motion } from 'motion/react';
import { X, Trophy, Target, Award, Users, Star, Activity, Zap } from 'lucide-react';
import { Player, Match } from '../types';
import { getStartOfThisWeek } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
}

export function PlayerProfileModal({ player, matches = [], players = [], onClose }: PlayerProfileModalProps) {
  // 1. 安全获取本周开始时间
  const startOfThisWeek = typeof getStartOfThisWeek === 'function' ? getStartOfThisWeek() : new Date().setHours(0,0,0,0);
  
  // 2. 数据分类过滤 (增加空数组保护)
  const playerMatches = (matches || []).filter(m => 
    (m.team1 || []).includes(player.id) || (m.team2 || []).includes(player.id)
  );
  const weeklyMatches = playerMatches.filter(m => m.date >= startOfThisWeek);
  
  // 统计核心逻辑
  const getStats = (matchList: Match[]) => {
    let sWins = 0; let sTotal = 0;
    let dWins = 0; let dTotal = 0;
    const opps: Record<string, number> = {};

    matchList.forEach(m => {
      const isT1 = (m.team1 || []).includes(player.id);
      const isSingles = m.type === 'Singles' || (m.team1 || []).length === 1;
      
      let t1G = 0; let t2G = 0;
      (m.scores || []).forEach(s => { 
        if (s.team1 > s.team2) t1G++; 
        else if (s.team2 > s.team1) t2G++; 
      });
      
      const won = isT1 ? t1G > t2G : t2G > t1G;

      if (isSingles) { sTotal++; if(won) sWins++; } 
      else { dTotal++; if(won) dWins++; }

      const oppTeam = isT1 ? (m.team2 || []) : (m.team1 || []);
      oppTeam.forEach(oid => opps[oid] = (opps[oid] || 0) + 1);
    });
    return { sWins, sTotal, dWins, dTotal, opps };
  };

  const allStats = getStats(playerMatches);
  const weekStats = getStats(weeklyMatches);

  // 3. 排名逻辑 (增加容错)
  const getWeeklyRank = (type: 'Singles' | 'Doubles') => {
    if (players.length === 0) return { rank: '--', isFirst: false };

    const weeklyData = players.map(p => {
      const pMatches = matches.filter(m => 
        m.date >= startOfThisWeek && 
        ((m.team1 || []).includes(p.id) || (m.team2 || []).includes(p.id))
      );
      const filtered = type === 'Singles' 
        ? pMatches.filter(m => m.type === 'Singles' || (m.team1 || []).length === 1) 
        : pMatches.filter(m => m.type === 'Doubles' || (m.team1 || []).length > 1);
      
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
    
    if (myWins === 0) return { rank: '--', isFirst: false };
    return { rank: `#${rankIndex + 1}`, isFirst: rankIndex === 0 };
  };

  const sRank = getWeeklyRank('Singles');
  const dRank = getWeeklyRank('Doubles');
  const topOpponentIds = Object.entries(allStats.opps).sort(([, a], [, b]) => b - a).slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center overflow-y-auto p-4">
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#f8f9fa] w-full max-w-lg min-h-[80vh] sm:rounded-[48px] overflow-hidden relative shadow-2xl flex flex-col my-auto">
        
        {/* 1. 顶部：英雄面板 */}
        <div className="bg-gradient-to-b from-[#111] to-[#222] pt-14 pb-12 px-8 relative shrink-0">
          <button onClick={onClose} className="absolute left-6 top-6 w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white/70 backdrop-blur-md border border-white/10"><X size={20} /></button>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-white italic tracking-tighter">{player.name}</h1>
                {(sRank.isFirst || dRank.isFirst) && (
                  <div className="bg-yellow-400 text-black px-2 py-0.5 rounded text-[8px] font-black uppercase">Weekly Champ</div>
                )}
              </div>
              <div className="flex gap-3">
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-white/30 text-[8px] font-black uppercase mb-1">Club ELO</p>
                    <p className="text-xl font-black text-red-500 italic leading-none">{player.elo_rating || 1500}</p>
                 </div>
                 <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p className="text-white/30 text-[8px] font-black uppercase mb-1">Status</p>
                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-tighter flex items-center gap-1"><Zap size={10} fill="currentColor"/> Active</p>
                 </div>
              </div>
            </div>

            <div className="w-24 h-24 rounded-[32px] p-1 bg-gradient-to-tr from-red-600 to-red-400">
               <div className="w-full h-full rounded-[28px] border-4 border-[#222] overflow-hidden bg-neutral-800">
                  {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/20 italic">{player.initials}</div>}
               </div>
            </div>
          </div>
        </div>

        {/* 2. 核心战报区 */}
        <div className="px-6 -mt-8 relative z-20 flex-1 overflow-y-auto no-scrollbar pb-10">
          
          <div className="bg-white rounded-[32px] p-6 shadow-xl mb-6 border border-white flex items-center justify-between">
             <div className="text-center flex-1 border-r border-neutral-100">
                <p className={`text-3xl font-black italic leading-none ${sRank.isFirst ? 'text-yellow-500' : 'text-neutral-900'}`}>{sRank.rank}</p>
                <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">Weekly Singles</p>
             </div>
             <div className="text-center flex-1">
                <p className={`text-3xl font-black italic leading-none ${dRank.isFirst ? 'text-yellow-500' : 'text-neutral-900'}`}>{dRank.rank}</p>
                <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">Weekly Doubles</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-[32px] shadow-sm border border-neutral-50 flex flex-col justify-between h-32">
                  <Activity size={20} className="text-red-500" />
                  <div>
                    <p className="text-2xl font-black text-neutral-900 italic leading-none">{weekStats.sWins + weekStats.dWins}</p>
                    <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">Weekly Wins</p>
                  </div>
               </div>
               <div className="bg-white p-5 rounded-[32px] shadow-sm border border-neutral-50 flex flex-col justify-between h-32">
                  <Star size={20} className="text-blue-500" fill="currentColor"/>
                  <div>
                    <p className="text-2xl font-black text-neutral-900 italic leading-none">
                      {playerMatches.length > 0 ? Math.round((allStats.sWins + allStats.dWins) / playerMatches.length * 100) : 0}%
                    </p>
                    <p className="text-[9px] font-black text-neutral-400 uppercase mt-2">Win Rate</p>
                  </div>
               </div>
            </div>

            {/* 单双打详情 */}
            <div className="bg-white rounded-[32px] p-2 shadow-sm border border-white overflow-hidden">
               <div className="p-4 border-b border-neutral-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500"><Target size={20}/></div>
                    <div><p className="text-[10px] font-black text-neutral-400 uppercase">Singles Record</p><p className="text-sm font-black">{allStats.sWins}W - {allStats.sTotal - allStats.sWins}L</p></div>
                  </div>
                  <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{allStats.sTotal > 0 ? Math.round((allStats.sWins/allStats.sTotal)*100) : 0}%</span>
               </div>
               <div className="p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500"><Users size={20}/></div>
                    <div><p className="text-[10px] font-black text-neutral-400 uppercase">Doubles Record</p><p className="text-sm font-black">{allStats.dWins}W - {allStats.dTotal - allStats.dWins}L</p></div>
                  </div>
                  <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{allStats.dTotal > 0 ? Math.round((allStats.dWins/allStats.dTotal)*100) : 0}%</span>
               </div>
            </div>

            {/* 主要对手 */}
            <div className="space-y-4">
               <h3 className="text-sm font-black text-neutral-800 uppercase italic px-2">Major Opponents</h3>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {topOpponentIds.length > 0 ? topOpponentIds.map(([oid, count]) => {
                    const opp = players.find(p => p.id === oid);
                    return (
                      <div key={oid} className="flex flex-col items-center shrink-0">
                         <div className="w-16 h-16 rounded-full p-1 bg-white shadow-md border border-neutral-100">
                            <div className="w-full h-full rounded-full overflow-hidden bg-neutral-50">
                               {opp?.avatar ? <img src={opp.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-300">{opp?.initials || '??'}</div>}
                            </div>
                         </div>
                         <p className="text-[10px] font-black text-neutral-800 mt-2 truncate w-16 text-center">{opp?.name || '未知'}</p>
                         <p className="text-[8px] font-bold text-neutral-300 uppercase">{count} Matches</p>
                      </div>
                    );
                  }) : <p className="text-xs text-neutral-300 pl-2">暂无对手数据</p>}
               </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-neutral-50">
           <button onClick={onClose} className="w-full py-4 bg-[#111] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">Dismiss Dossier</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
