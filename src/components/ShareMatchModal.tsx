import { useRef } from 'react';
import { motion } from 'motion/react';
import { toPng } from 'html-to-image';
import { X, Download, Share2, Trophy, Star } from 'lucide-react';
import { Match, Player } from '../types';

interface ShareMatchModalProps {
  match: Match;
  players: Player[];
  clubName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareMatchModal({ match, players, clubName, inviteCode, onClose }: ShareMatchModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getPlayer = (id: string) => players.find(p => p.id === id);

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 3 });
    const link = document.createElement('a');
    link.download = `战报-${new Date().getTime()}.png`;
    link.href = dataUrl;
    link.click();
  };

  const t1Won = match.scores.filter(s => s.team1 > s.team2).length > match.scores.filter(s => s.team2 > s.team1).length;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex flex-col items-center justify-center p-6"
    >
      <div className="absolute top-6 right-6 flex gap-4">
        <button onClick={handleDownload} className="bg-white/20 p-3 rounded-full text-white"><Download size={24} /></button>
        <button onClick={onClose} className="bg-white/20 p-3 rounded-full text-white"><X size={24} /></button>
      </div>

      {/* 战报卡片主体 */}
      <div ref={cardRef} className="w-full max-w-[360px] bg-red-600 rounded-[32px] overflow-hidden shadow-2xl text-white font-sans p-8 relative">
        {/* 背景装饰 */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full border-[20px] border-white/5" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white/10 rounded-full border-[20px] border-white/5" />

        <div className="relative z-10">
          <div className="text-center mb-10">
            <div className="inline-block px-4 py-1 bg-black/20 rounded-full text-[10px] font-black tracking-[0.2em] mb-4">
              BATTLE REPORT
            </div>
            <h2 className="text-2xl font-black italic uppercase">{match.tournament || '练习赛'}</h2>
            <p className="text-white/60 text-xs mt-1 font-bold">
              {new Date(match.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* 球员与比分 */}
          <div className="space-y-8 mb-12">
            {/* Team 1 */}
            <div className={`flex items-center gap-4 ${t1Won ? 'scale-105' : 'opacity-60'}`}>
              <div className="flex -space-x-3">
                {match.team1.map(id => (
                  <div key={id} className="w-12 h-12 rounded-full border-2 border-red-600 bg-white overflow-hidden shrink-0 shadow-lg">
                    {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : 
                      <div className="w-full h-full flex items-center justify-center text-red-600 font-black">{getPlayer(id)?.initials}</div>}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="font-black text-lg truncate leading-none mb-1">{match.team1.map(id => getPlayer(id)?.name).join(' / ')}</p>
                {t1Won && <span className="text-[10px] bg-yellow-400 text-red-700 px-2 py-0.5 rounded-full font-black">WINNER</span>}
              </div>
              <div className="text-3xl font-black italic">{match.scores.filter(s => s.team1 > s.team2).length}</div>
            </div>

            <div className="flex items-center gap-4 justify-center py-2 opacity-30">
                <div className="h-px flex-1 bg-white" />
                <span className="text-xs font-black italic">VS</span>
                <div className="h-px flex-1 bg-white" />
            </div>

            {/* Team 2 */}
            <div className={`flex items-center gap-4 ${!t1Won ? 'scale-105' : 'opacity-60'}`}>
              <div className="flex -space-x-3">
                {match.team2.map(id => (
                  <div key={id} className="w-12 h-12 rounded-full border-2 border-red-600 bg-white overflow-hidden shrink-0 shadow-lg">
                    {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : 
                      <div className="w-full h-full flex items-center justify-center text-red-600 font-black">{getPlayer(id)?.initials}</div>}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <p className="font-black text-lg truncate leading-none mb-1">{match.team2.map(id => getPlayer(id)?.name).join(' / ')}</p>
                {!t1Won && <span className="text-[10px] bg-yellow-400 text-red-700 px-2 py-0.5 rounded-full font-black">WINNER</span>}
              </div>
              <div className="text-3xl font-black italic">{match.scores.filter(s => s.team2 > s.team1).length}</div>
            </div>
          </div>

          {/* 小局比分详情 */}
          <div className="bg-black/10 rounded-2xl p-4 mb-10 flex justify-center gap-6">
            {match.scores.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-[8px] font-black text-white/40 mb-1">SET {i+1}</div>
                <div className="font-black text-lg">{s.team1} : {s.team2}</div>
              </div>
            ))}
          </div>

          {/* 底部信息 */}
          <div className="flex items-end justify-between border-t border-white/20 pt-6">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Club</p>
              <p className="font-bold text-sm">{clubName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Invite Code</p>
              <p className="font-mono font-bold text-sm">{inviteCode}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-6 text-white/40 text-sm animate-pulse flex items-center gap-2">
        <Share2 size={16} /> 保存图片并分享到微信群
      </p>
    </motion.div>
  );
}
