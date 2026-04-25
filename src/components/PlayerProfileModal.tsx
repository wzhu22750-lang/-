import { motion } from 'motion/react';
import { X, Users, Zap, ShieldAlert } from 'lucide-react';
import { Player, Match } from '../types';

interface PlayerProfileModalProps {
  player: Player;
  matches: Match[];
  players: Player[];
  onClose: () => void;
}

export function PlayerProfileModal({ player, matches, players, onClose }: PlayerProfileModalProps) {
  // 1. 计算该球员参与的所有比赛
  const playerMatches = matches.filter(m => m.team1.includes(player.id) || m.team2.includes(player.id));

  let wins = 0;
  let losses = 0;
  const partnerCount: Record<string, number> = {};
  const opponentCount: Record<string, { wins: number, losses: number }> = {};

  playerMatches.forEach(m => {
    const isTeam1 = m.team1.includes(player.id);
    const ourTeam = isTeam1 ? m.team1 : m.team2;
    const oppTeam = isTeam1 ? m.team2 : m.team1;

    let ourGames = 0;
    let oppGames = 0;
    m.scores.forEach(s => {
      const ourScore = isTeam1 ? s.team1 : s.team2;
      const oppScore = isTeam1 ? s.team2 : s.team1;
      if (ourScore > oppScore) ourGames++; else if (oppScore > ourScore) oppGames++;
    });

    const isWin = ourGames > oppGames;
    if (isWin) wins++; else losses++;

    // 统计搭档 (仅双打)
    if (ourTeam.length > 1) {
      ourTeam.forEach(pid => {
        if (pid !== player.id) {
          partnerCount[pid] = (partnerCount[pid] || 0) + (isWin ? 1 : 0);
        }
      });
    }

    // 统计对手
    oppTeam.forEach(pid => {
      if (!opponentCount[pid]) opponentCount[pid] = { wins: 0, losses: 0 };
      if (isWin) opponentCount[pid].wins++; else opponentCount[pid].losses++;
    });
  });

  const bestPartnerId = Object.entries(partnerCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestPartner = players.find(p => p.id === bestPartnerId);

  const nemesisId = Object.entries(opponentCount).sort((a, b) => b[1].losses - a[1].losses)[0]?.[0];
  const nemesis = players.find(p => p.id === nemesisId);

  const winRate = playerMatches.length > 0 ? Math.round((wins / playerMatches.length) * 100) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-neutral-50 w-full max-w-md rounded-[32px] overflow-hidden relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute right-6 top-6 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md">
          <X size={20} />
        </button>

        <div className="bg-red-600 pt-12 pb-20 px-8 text-center text-white relative">
          <div className="w-24 h-24 rounded-full bg-white mx-auto mb-4 border-4 border-white/30 overflow-hidden shadow-xl">
            {player.avatar ? <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" /> : 
              <div className="w-full h-full flex items-center justify-center text-red-600 text-3xl font-black">{player.initials}</div>
            }
          </div>
          <h2 className="text-2xl font-black mb-1">{player.name}</h2>
          <p className="text-white/70 text-sm font-bold tracking-widest uppercase">球员档案</p>
        </div>

        <div className="px-6 -mt-10 relative z-10 pb-8">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">总场次</p>
              <p className="text-xl font-black text-neutral-800">{playerMatches.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center border-b-4 border-green-500">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">胜场</p>
              <p className="text-xl font-black text-green-600">{wins}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] font-bold text-neutral-400 uppercase mb-1">胜率</p>
              <p className="text-xl font-black text-red-600">{winRate}%</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><Users size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">最佳搭档</p>
                  <p className="font-bold text-neutral-800">{bestPartner?.name || '暂无数据'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"><ShieldAlert size={20} /></div>
                <div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase">一生苦主</p>
                  <p className="font-bold text-neutral-800">{nemesis?.name || '暂无对手'}</p>
                </div>
              </div>
            </div>
          </div>

          <button onClick={onClose} className="w-full mt-8 py-4 bg-neutral-900 text-white rounded-2xl font-bold shadow-lg">
            返回列表
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
