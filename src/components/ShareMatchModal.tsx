import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { X, Loader2, Info, Trophy } from 'lucide-react';
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
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'rendering' | 'ready'>('rendering');

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const t1Wins = match.scores.filter(s => s.team1 > s.team2).length;
  const t2Wins = match.scores.filter(s => s.team2 > s.team1).length;
  const t1Won = t1Wins > t2Wins;

  useEffect(() => {
    const generate = async () => {
      if (cardRef.current) {
        try {
          await new Promise(resolve => setTimeout(resolve, 600));
          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#dc2626',
          });
          setFinalImage(dataUrl);
          setStatus('ready');
        } catch (err) {
          console.error('生成战报失败:', err);
          setStatus('ready');
        }
      }
    };
    generate();
  }, [match]);

  const TeamCard = ({ ids, won, wins }: { ids: string[]; won: boolean; wins: number }) => (
    <div className={`rounded-2xl p-4 ${won ? 'bg-white/15 backdrop-blur-sm border border-white/20' : 'bg-black/10 border border-white/5'}`}>
      <div className="flex items-center gap-3">
        {/* Avatars */}
        <div className="flex -space-x-2 shrink-0">
          {ids.map(id => {
            const p = getPlayer(id);
            return (
              <div key={id} className={`w-12 h-12 rounded-full border-2 overflow-hidden ${won ? 'border-yellow-400 shadow-lg shadow-yellow-400/30' : 'border-white/20'}`}>
                {p?.avatar
                  ? <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/60 font-black text-sm">{p?.initials ?? '?'}</div>}
              </div>
            );
          })}
        </div>

        {/* Names */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-black truncate ${won ? 'text-white' : 'text-white/40'}`}>
            {ids.map(id => getPlayer(id)?.name ?? '?').join(' / ')}
          </p>
        </div>

        {/* Set wins */}
        <div className={`text-3xl font-black italic ${won ? 'text-yellow-400' : 'text-white/20'}`}>
          {wins}
        </div>
      </div>

      {won && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10">
          <Trophy size={12} className="text-yellow-400" />
          <span className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.2em]">胜者</span>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center overflow-y-auto pt-12 pb-12 px-6"
    >
      {/* Close */}
      <div className="fixed top-6 right-6 z-[160]">
        <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg active:scale-90">
          <X size={24} />
        </button>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {status === 'rendering' && (
          <motion.div exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="text-red-400 animate-spin" size={40} />
            <p className="text-white/60 font-bold text-sm">正在生成战报...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden render card — use opacity-0, NO h-0 so html-to-image works */}
      <div className="fixed top-0 left-0 opacity-0 pointer-events-none" style={{ zIndex: -999 }}>
        <div ref={cardRef} className="w-[360px] bg-[#dc2626] p-6 flex flex-col gap-5">
          {/* Subtle ring decoration */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border-[20px] border-white/5 pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 rounded-full border-[14px] border-white/5 pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Header */}
            <div className="text-center">
              <span className="inline-block px-4 py-1 bg-white/10 rounded-full text-[10px] font-black text-white/80 tracking-[0.2em] mb-3">
                战报 · BATTLE REPORT
              </span>
              <h2 className="text-xl font-black text-white leading-tight px-2">
                {match.tournament || '练习赛'}
              </h2>
              <p className="text-[11px] text-white/50 font-bold mt-1">
                {new Date(match.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Teams */}
            <div className="flex flex-col gap-2">
              <TeamCard ids={match.team1} won={t1Won} wins={t1Wins} />
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-black text-white/15 tracking-[0.3em]">VS</span>
              </div>
              <TeamCard ids={match.team2} won={!t1Won} wins={t2Wins} />
            </div>

            {/* Scores grid */}
            <div className="bg-white/10 rounded-2xl p-4">
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${match.scores.length}, 1fr)` }}>
                {match.scores.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] font-black text-white/40 mb-1">第{i + 1}局</p>
                    <p className="text-xl font-black text-white tabular-nums">
                      <span className={s.team1 > s.team2 ? 'text-yellow-400' : ''}>{s.team1}</span>
                      <span className="text-white/20 mx-0.5">:</span>
                      <span className={s.team2 > s.team1 ? 'text-yellow-400' : ''}>{s.team2}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between pt-3 border-t border-white/10">
              <div>
                <p className="text-[9px] font-bold text-white/30 uppercase mb-0.5">俱乐部</p>
                <p className="font-bold text-xs text-white/70">{clubName}</p>
              </div>
              {inviteCode ? (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-white/30 uppercase mb-0.5">邀请码</p>
                  <p className="font-mono font-bold text-xs text-white/50 tracking-wider">{inviteCode}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Final image */}
      {finalImage && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
          <img src={finalImage} className="w-full max-w-[360px] rounded-3xl shadow-2xl ring-1 ring-white/10" alt="战报" />
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-yellow-400 font-bold bg-yellow-400/10 px-4 py-2 rounded-full">
              <Info size={16} />
              <span>长按上方图片保存到相册</span>
            </div>
            <p className="text-white/40 text-xs">保存后即可分享到微信群</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
