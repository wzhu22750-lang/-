import { motion } from 'motion/react';
import { X, Users, ShieldAlert, Zap, Target, TrendingUp, Award, BarChart2 } from 'lucide-react';
import { Player, Match } from '../types';
import { getPlayerTier } from '../lib/elo';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
}

export function PlayerProfileModal({ player, matches, players, onClose }: PlayerProfileModalProps) {
  // 1. 数据深度计算
  const playerMatches = matches.filter(m => m.team1.includes(player.id) || m.team2.includes(player.id));
  const last5Matches = playerMatches.slice(0, 5);

  let wins = 0; let losses = 0;
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
    if (isWin) wins++; else losses++;

    // 单双打细分
    if (m.type === 'Singles' || ourTeam.length === 1) {
      singlesTotal++; if (isWin) singlesWins++;
    } else {
      doublesTotal++; if (isWin) doublesWins++;
      // 统计搭档
      ourTeam.forEach(pid => {
        if (pid !== player.id) partnerCount[pid] = (partnerCount[pid] || 0) + (isWin ? 1 : 0);
      });
    }

    // 统计对手
    oppTeam.forEach(pid => {
      if (!opponentCount[pid]) opponentCount[pid] = { wins: 0, losses: 0 };
      if (isWin) opponentCount[pid].wins++; else opponentCount[pid].losses++;
    });
  });

  const winRate = playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0;
  const tier = getPlayerTier(player.elo_rating);

  const bestPartnerId = Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestPartner = players.find(p => p.id === bestPartnerId);

  const nemesisId = Object.entries(opponentCount).sort((a, b) => b[1].losses - a[1].losses)[0]?.[0];
  const nemesis = players.find(p => p.id === nemesisId);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-neutral-50 w-full max-w-md rounded-[40px] overflow-hidden relative shadow-2xl my-auto"
      >
        {/* 顶部个人名片 */}
        <div className="bg-red-600 pt-12 pb-16 px-8 text-center text-white relative">
          <button onClick={onClose} className="absolute right-6 top-6 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white">
            <X size={20} />
          </button>
          
          <div className="w-24 h-24 rounded-full bg-white mx-auto mb-4 border-4 border-white/30 overflow-hidden shadow-xl">
            {player.avatar ? <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" /> : 
              <div className="w-full h-full flex items-center justify-center text-red-600 text-3xl font-black italic">{player.initials}</div>
            }
          </div>
          <h2 className="text-3xl font-black mb-1 italic">{player.name}</h2>
          <div className={`inline-block px-3 py-1 ${tier.bg} ${tier.color} rounded-full text-[10px] font-black uppercase tracking-widest`}>
            {tier.label} • {tier.rank}
          </div>
        </div>

        <div className="px-6 -mt-8 relative z-10 pb-8 space-y-4">
          {/* 战力概览卡片 */}
          <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-black/5 flex items-center justify-between">
            <div className="text-center flex-1 border-r border-neutral-100">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">当前积分</p>
              <div className="flex items-center justify-center gap-1 text-red-600">
                <Star size={16} fill="currentColor" />
                <span className="text-2xl font-black italic">{player.elo_rating || 1500}</span>
              </div>
            </div>
            <div className="text-center flex-1">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">胜率</p>
              <p className="text-2xl font-black text-neutral-800 italic">{winRate}%</p>
            </div>
          </div>

          {/* 最近状态走势 */}
          <div className="bg-white rounded-[32px] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-[10px] font-black text-neutral-400 uppercase flex items-center gap-2">
                <TrendingUp size={12} /> 最近走势
              </p>
              <div className="flex gap-1.5">
                {last5Matches.length > 0 ? last5Matches.map((m, i) => {
                  const isT1 = m.team1.includes(player.id);
                  let t1G = 0; let t2G = 0;
                  m.scores.forEach(s => { if(s.team1 > s.team2) t1G++; else t2G++; });
                  const won = isT1 ? t1G > t2G : t2G > t1G;
                  return (
                    <div key={i} className={`w-3 h-3 rounded-full ${won ? 'bg-green-500' : 'bg-red-500'} shadow-sm`} />
                  );
                }) : <span className="text-[10px] text-neutral-300">暂无数据</span>}
              </div>
            </div>
          </div>

          {/* 专项数据细分 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-3xl shadow-sm border-l-4 border-blue-400">
              <div className="flex items-center gap-2 mb-1 text-neutral-400"><Target size={12}/> <span className="text-[10px] font-bold uppercase">单打胜率</span></div>
              <p className="text-lg font-black text-neutral-800">{singlesTotal > 0 ? Math.round((singlesWins/singlesTotal)*100) : 0}%</p>
              <p className="text-[8px] text-neutral-300 font-bold">{singlesWins}胜 / {singlesTotal}场</p>
            </div>
            <div className="bg-white p-4 rounded-3xl shadow-sm border-l-4 border-purple-400">
              <div className="flex items-center gap-2 mb-1 text-neutral-400"><Users size={12}/> <span className="text-[10px] font-bold uppercase">双打胜率</span></div>
              <p className="text-lg font-black text-neutral-800">{doublesTotal > 0 ? Math.round((doublesWins/doublesTotal)*100) : 0}%</p>
              <p className="text-[8px] text-neutral-300 font-bold">{doublesWins}胜 / {doublesTotal}场</p>
            </div>
          </div>

          {/* 关系网络统计 */}
          <div className="space-y-2">
            <div className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-500"><Award size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase leading-none mb-1">最佳搭档</p>
                  <p className="font-black text-neutral-800">{bestPartner?.name || '寻找中...'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500"><ShieldAlert size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase leading-none mb-1">一生苦主</p>
                  <p className="font-black text-neutral-800">{nemesis?.name || '暂无对手'}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="w-full mt-4 py-4 bg-neutral-900 text-white rounded-[20px] font-black shadow-lg active:scale-95 transition-transform">
            返回列表
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// 辅助组件：Star 图标
function Star({ size, fill, className }: any) {
  return <Award size={size} className={className} />;
}
