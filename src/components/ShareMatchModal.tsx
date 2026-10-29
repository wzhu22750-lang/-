import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { X, Loader2, Info, Trophy, Download } from 'lucide-react';
import { Match, Player } from '../types';

interface ShareMatchModalProps {
  match: Match;
  players: Player[];
  clubName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareMatchModal({
  match,
  players,
  clubName,
  inviteCode,
  onClose,
}: ShareMatchModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'rendering' | 'ready'>('rendering');

  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const t1Wins = match.scores.filter((s) => s.team1 > s.team2).length;
  const t2Wins = match.scores.filter((s) => s.team2 > s.team1).length;
  const t1Won = t1Wins > t2Wins;

  useEffect(() => {
    const generate = async () => {
      if (cardRef.current) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#c41230',
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
    <div
      className={`rounded-2xl p-4 ${
        won
          ? 'bg-white/20 border border-white/40'
          : 'bg-white/[0.08] border border-white/15'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 shrink-0">
          {ids.map((id) => {
            const p = getPlayer(id);
            return (
              <div
                key={id}
                className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
                  won ? 'border-yellow-400 shadow-md' : 'border-white/25'
                }`}
              >
                {p?.avatar ? (
                  <img src={p.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-white/15 flex items-center justify-center text-white/80 font-display font-black text-sm">
                    {p?.initials ?? '?'}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-sm font-extrabold truncate ${won ? 'text-white' : 'text-white/65'}`}>
            {ids.map((id) => getPlayer(id)?.name ?? '?').join(' / ')}
          </p>
          {won && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300">
              <Trophy size={10} />
              <span className="text-[9px] font-bold uppercase tracking-wider">MATCH WINNER</span>
            </div>
          )}
        </div>

        <div
          className={`font-display text-3xl font-black tabular-nums ${
            won ? 'text-yellow-300' : 'text-white/30'
          }`}
        >
          {wins}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-[150] flex flex-col items-center overflow-y-auto pt-12 pb-12 px-6"
    >
      <div className="fixed top-6 right-6 z-[160]">
        <button
          onClick={onClose}
          className="bg-white/15 hover:bg-white/25 p-3 rounded-xl text-white shadow-lg active:scale-95 transition-colors"
          aria-label="关闭"
        >
          <X size={22} />
        </button>
      </div>

      <AnimatePresence>
        {status === 'rendering' && (
          <motion.div exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="text-red-500 animate-spin" size={36} />
            <p className="text-white/75 font-bold text-sm">正在生成赛事战报海报...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Off-screen Poster Source */}
      <div className="fixed pointer-events-none" style={{ left: -9999, top: 0 }}>
        <div
          ref={cardRef}
          className="w-[360px] bg-gradient-to-b from-[#d91a38] via-[#c41230] to-[#8a0c22] p-6 flex flex-col gap-5 relative overflow-hidden"
        >
          <svg
            className="absolute inset-0 w-full h-full text-white/[0.06] pointer-events-none"
            viewBox="0 0 360 520"
            fill="none"
          >
            <rect x="20" y="20" width="320" height="480" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="260" x2="340" y2="260" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
            <line x1="180" y1="20" x2="180" y2="500" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10 flex flex-col gap-5">
            <div className="text-center">
              <span className="inline-block px-3.5 py-1 bg-white/15 border border-white/20 rounded-full text-[10px] font-mono font-bold text-white/90 tracking-[0.18em] mb-3">
                OFFICIAL MATCH REPORT
              </span>
              <h2 className="text-xl font-extrabold text-white leading-tight px-2">
                {match.tournament || '日常训练赛'}
              </h2>
              <p className="text-[11px] text-white/60 font-medium mt-1">
                {new Date(match.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <TeamCard ids={match.team1} won={t1Won} wins={t1Wins} />
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-white/40 tracking-[0.25em]">
                  VS
                </span>
              </div>
              <TeamCard ids={match.team2} won={!t1Won} wins={t2Wins} />
            </div>

            <div className="bg-black/20 rounded-2xl p-4 border border-white/15">
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.max(1, match.scores.length)}, 1fr)` }}
              >
                {match.scores.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[10px] font-mono font-bold text-white/50 mb-1">SET {i + 1}</p>
                    <p className="font-display text-xl font-black text-white tabular-nums">
                      <span className={s.team1 > s.team2 ? 'text-yellow-300' : ''}>{s.team1}</span>
                      <span className="text-white/30 mx-0.5">:</span>
                      <span className={s.team2 > s.team1 ? 'text-yellow-300' : ''}>{s.team2}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-end justify-between pt-3 border-t border-white/15">
              <div>
                <p className="text-[9px] font-mono font-bold text-white/40 uppercase mb-0.5">
                  CLUB ARENA
                </p>
                <p className="font-bold text-xs text-white/85">{clubName}</p>
              </div>
              {inviteCode ? (
                <div className="text-right">
                  <p className="text-[9px] font-mono font-bold text-white/40 uppercase mb-0.5">
                    PASS CODE
                  </p>
                  <p className="font-mono font-bold text-xs text-white/85 tracking-wider">
                    {inviteCode}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Rendered Poster */}
      {finalImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <img
            src={finalImage}
            className="w-full max-w-[360px] rounded-[24px] shadow-2xl border border-white/15"
            alt="比赛战报海报"
          />
          <div className="mt-6 flex flex-col items-center gap-3">
            <a
              href={finalImage}
              download={`h2h-report-${match.id}.png`}
              className="inline-flex items-center gap-2 text-white font-bold bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-xl text-xs transition-colors"
            >
              <Download size={15} />
              <span>下载高清战报图片</span>
            </a>
            <div className="flex items-center gap-1.5 text-yellow-400 font-semibold text-xs">
              <Info size={14} />
              <span>手机端也可长按上方海报直接保存到相册</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
