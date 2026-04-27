import { motion } from 'motion/react';
import { X, Users, ShieldAlert, Star, Target, TrendingUp, Trophy, ChevronRight, Activity } from 'lucide-react';
import { Player, Match } from '../types';
import { getPlayerTier } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
}

export function PlayerProfileModal({ player, matches, players, onClose }: PlayerProfileModalProps) {
  // --- 1. 数据深度计算 ---
  const playerMatches = matches.filter(m => m.team1.includes(player.id) || m.team2.includes(player.id));
  const last5Matches = playerMatches.slice(0, 5);

  let wins = 0;
  let singlesWins = 0; let singlesTotal = 0;
  let doublesWins = 0; let doublesTotal = 0;
  const partnerCount: Record<string, number> = {};
  const opponentCount: Record<string, { wins: number, losses: number }> = {};

  playerMatches.forEach(m => {
    const isTeam1 = m.team1.includes(player.id);
    const ourTeam = isTeam1 ? m.team1 : m.team2;
    const oppTeam = isTeam1 ? m.team2 : m.team1;

    let ourGames = 0; let oppGames = 0;
    m.scores.forEach(s => {
      const ourScore = isTeam1 ? s.team1 : s.team2;
      const oppScore = isTeam1 ? s.team2 : s.team1;
      if (ourScore > oppScore) ourGames++; else if (oppScore > ourScore) oppGames++;
    });

    const isWin = ourGames > oppGames;
    if (isWin) wins++;

    if (m.type === 'Singles' || ourTeam.length === 1) {
      singlesTotal++; if (isWin) singlesWins++;
    } else {
      doublesTotal++; if (isWin) doublesWins++;
      ourTeam.forEach(pid => {
        if (pid !== player.id) partnerCount[pid] = (partnerCount[pid] || 0) + (isWin ? 1 : 0);
      });
    }

    oppTeam.forEach(pid => {
      if (!opponentCount[pid]) opponentCount[pid] = { wins: 0, losses: 0 };
      if (isWin) opponentCount[pid].wins++; else opponentCount[pid].losses++;
    });
  });

  const tier = getPlayerTier(player.elo_rating);
  const bestPartner = players.find(p => p.id === Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0]?.[0]);
  const nemesis = players.find(p => p.id === Object.entries(opponentCount).sort((a, b) => b[1].losses - a[1].losses)[0]?.[0]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-[150] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
        className="bg-neutral-100 w-full max-w-md rounded-[48px] overflow-hidden relative shadow-2xl my-auto"
      >
        {/* 顶部：个人英雄展示区 */}
        <div className="bg-gradient-to-br from-red-500 via-red-600 to-red-700 pt-12 pb-20 px-8 text-center text-white relative">
          <button onClick={onClose} className="absolute right-8 top-8 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
          
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-white p-1 shadow-2xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-neutral-200">
                {player.avatar ? <img src={player.avatar} className="w-full h-full object-cover" /> : 
                  <div className="w-full h-full flex items-center justify-center text-red-600 text-4xl font-black italic">{player.initials}</div>
                }
              </div>
            </div>
            {/* 段位小标 */}
            <div className={`absolute -bottom-2 -right-2 ${tier.bg} ${tier.color} px-3 py-1 rounded-full text-[10px] font-black shadow-lg border-2 border-white`}>
               {tier.rank}
            </div>
          </div>

          <h2 className="text-3xl font-black mt-4 italic">{player.name}</h2>
          <p className="text-white/60 text-[10px] font-black tracking-[0.3em] uppercase mt-1">{tier.label}</p>
        </div>

        {/* 内容区 */}
        <div className="px-6 -mt-12 relative z-10 pb-10 space-y-4">
          
          {/* 第一排：核心战力卡 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-red-900/5">
              <div className="flex items-center gap-2 text-neutral-400 mb-2">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">ELO Rating</span>
              </div>
              <p className="text-3xl font-black text-neutral-800 italic">{player.elo_rating || 1500}</p>
            </div>
            <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-red-900/5">
              <div className="flex items-center gap-2 text-neutral-400 mb-2">
                <Activity size={14} className="text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Total Win Rate</span>
              </div>
              <p className="text-3xl font-black text-neutral-800 italic">
                {playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* 最近走势：发光的点 */}
          <div className="bg-white rounded-[32px] p-5 shadow-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-neutral-300" />
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Recent Form</span>
            </div>
            <div className="flex gap-2">
              {last5Matches.length > 0 ? last5Matches.map((m, i) => {
                const isT1 = m.team1.includes(player.id);
                let t1G = 0; let t2G = 0;
                m.scores.forEach(s => { if(s.team1 > s.team2) t1G++; else t2G++; });
                const won = isT1 ? t1G > t2G : t2G > t1G;
                return (
                  <motion.div 
                    key={i} 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                    className={`w-3.5 h-3.5 rounded-full ${won ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'} border-2 border-white`} 
                  />
                );
              }) : <span className="text-[10px] text-neutral-300">New Player</span>}
            </div>
          </div>

          {/* 专项能力：进度条化 */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-4">
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 font-black text-[10px] text-neutral-500 uppercase"><Target size={12}/> Singles</div>
                <span className="text-xs font-black">{singlesTotal > 0 ? Math.round((singlesWins/singlesTotal)*100) : 0}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${singlesTotal > 0 ? (singlesWins/singlesTotal)*100 : 0}%` }} className="h-full bg-blue-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 font-black text-[10px] text-neutral-500 uppercase"><Users size={12}/> Doubles</div>
                <span className="text-xs font-black">{doublesTotal > 0 ? Math.round((doublesWins/doublesTotal)*100) : 0}%</span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${doublesTotal > 0 ? (doublesWins/doublesTotal)*100 : 0}%` }} className="h-full bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* 社交网络：带头像展示 */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Best Partner', data: bestPartner, icon: <Trophy className="text-green-500" size={18} />, bg: 'bg-green-50' },
              { label: 'Nemesis', data: nemesis, icon: <ShieldAlert className="text-orange-500" size={18} />, bg: 'bg-orange-50' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-4 rounded-[28px] shadow-sm flex items-center justify-between group cursor-pointer hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>{item.icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                    <p className="font-black text-neutral-800">{item.data?.name || 'No Data Yet'}</p>
                  </div>
                </div>
                {item.data && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-neutral-100">
                    {item.data.avatar ? <img src={item.data.avatar} className="w-full h-full object-cover" /> : 
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-neutral-400">{item.data.initials}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-neutral-900 text-white rounded-[24px] font-black text-sm tracking-widest uppercase shadow-xl active:scale-[0.98] transition-all"
          >
            Close Profile
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
