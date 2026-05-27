import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { X, Loader2, Info } from 'lucide-react';
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
          // Wait for remote avatar images to finish loading
          await new Promise(resolve => setTimeout(resolve, 800));

          const dataUrl = await toPng(cardRef.current, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#0b0b10',
            style: {
              opacity: '1',
              transform: 'scale(1)',
            },
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

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center overflow-y-auto pt-12 pb-12 px-6"
    >
      {/* Close button */}
      <div className="fixed top-6 right-6 z-[160]">
        <button
          onClick={onClose}
          className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg active:scale-90 transition-transform"
        >
          <X size={24} />
        </button>
      </div>

      {/* Loading state */}
      <AnimatePresence>
        {status === 'rendering' && (
          <motion.div exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="text-amber-500 animate-spin" size={40} />
            <p className="text-white/60 font-bold text-sm">正在生成战报...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden render source */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none h-0 overflow-hidden">
        <div
          ref={cardRef}
          className="w-[360px] bg-[#0b0b10] relative flex flex-col overflow-hidden"
          style={{ fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif' }}
        >
          {/* Subtle diagonal glow in top-right corner */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/[0.06] blur-3xl" />
          {/* Subtle glow in bottom-left corner */}
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-amber-500/[0.04] blur-3xl" />

          {/* Geometric lines for depth */}
          <div className="absolute top-0 right-0 w-20 h-[1px] bg-gradient-to-l from-amber-500/50 to-transparent rotate-45 origin-top-right translate-x-2 translate-y-6" />
          <div className="absolute top-0 right-0 w-14 h-[1px] bg-gradient-to-l from-amber-500/30 to-transparent rotate-45 origin-top-right translate-x-2 translate-y-11" />
          <div className="absolute bottom-0 left-0 w-16 h-[1px] bg-gradient-to-r from-amber-500/30 to-transparent -rotate-45 origin-bottom-left -translate-x-2 -translate-y-6" />

          {/* Content wrapper */}
          <div className="relative z-10 px-6 pt-6 pb-5 flex flex-col gap-5">
            {/* ── Header ── */}
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2.5 mb-3">
                <div className="h-px w-7 bg-gradient-to-r from-transparent to-amber-500/50" />
                <span className="text-[10px] font-black tracking-[0.3em] text-amber-500 uppercase">
                  战报
                </span>
                <div className="h-px w-7 bg-gradient-to-l from-transparent to-amber-500/50" />
              </div>

              {/* Tournament name */}
              <h2 className="text-lg font-black text-white tracking-wider leading-snug px-2">
                {match.tournament || '练习赛'}
              </h2>

              {/* Date */}
              <p className="text-[11px] text-white/35 font-semibold mt-1.5 tracking-wide">
                {new Date(match.date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* ── Player Matchup ── */}
            <div className="flex flex-col gap-2.5">
              {/* Team 1 */}
              <div
                className={`relative rounded-xl overflow-hidden ${
                  t1Won
                    ? 'bg-gradient-to-r from-amber-500/[0.10] via-amber-500/[0.06] to-transparent border border-amber-500/20'
                    : 'bg-white/[0.03] border border-white/[0.05] opacity-45'
                }`}
              >
                {/* Winner left accent stripe */}
                {t1Won && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 rounded-r-sm" />
                )}
                {/* Winner badge */}
                {t1Won && (
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0b0b10] text-[9px] font-black px-3 py-[3px] rounded-full tracking-widest shadow-lg shadow-amber-500/30">
                    胜者
                  </div>
                )}

                <div className="flex items-center gap-3 py-3 px-3.5">
                  {/* Avatars */}
                  <div className="flex -space-x-2.5 shrink-0">
                    {match.team1.map(id => {
                      const player = getPlayer(id);
                      return (
                        <div
                          key={id}
                          className={`w-11 h-11 rounded-full border-2 bg-[#1a1a24] overflow-hidden ${
                            t1Won
                              ? 'border-amber-500/60 shadow-lg shadow-amber-500/20'
                              : 'border-white/15'
                          }`}
                        >
                          {player?.avatar ? (
                            <img
                              src={player.avatar}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500 font-black text-sm">
                              {player?.initials ?? '?'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Names */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[15px] font-black truncate leading-tight ${
                        t1Won ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {match.team1.map(id => getPlayer(id)?.name ?? '?').join(' / ')}
                    </p>
                  </div>

                  {/* Set-win count */}
                  <div
                    className={`text-3xl font-black italic tracking-tighter tabular-nums shrink-0 ${
                      t1Won ? 'text-amber-500' : 'text-white/25'
                    }`}
                  >
                    {t1Wins}
                  </div>
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
                <span className="text-[10px] font-black text-white/15 italic tracking-[0.3em]">
                  VS
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
              </div>

              {/* Team 2 */}
              <div
                className={`relative rounded-xl overflow-hidden ${
                  !t1Won
                    ? 'bg-gradient-to-r from-amber-500/[0.10] via-amber-500/[0.06] to-transparent border border-amber-500/20'
                    : 'bg-white/[0.03] border border-white/[0.05] opacity-45'
                }`}
              >
                {/* Winner left accent stripe */}
                {!t1Won && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 rounded-r-sm" />
                )}
                {/* Winner badge */}
                {!t1Won && (
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-[#0b0b10] text-[9px] font-black px-3 py-[3px] rounded-full tracking-widest shadow-lg shadow-amber-500/30">
                    胜者
                  </div>
                )}

                <div className="flex items-center gap-3 py-3 px-3.5">
                  {/* Avatars */}
                  <div className="flex -space-x-2.5 shrink-0">
                    {match.team2.map(id => {
                      const player = getPlayer(id);
                      return (
                        <div
                          key={id}
                          className={`w-11 h-11 rounded-full border-2 bg-[#1a1a24] overflow-hidden ${
                            !t1Won
                              ? 'border-amber-500/60 shadow-lg shadow-amber-500/20'
                              : 'border-white/15'
                          }`}
                        >
                          {player?.avatar ? (
                            <img
                              src={player.avatar}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                              alt=""
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-500 font-black text-sm">
                              {player?.initials ?? '?'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Names */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[15px] font-black truncate leading-tight ${
                        !t1Won ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {match.team2.map(id => getPlayer(id)?.name ?? '?').join(' / ')}
                    </p>
                  </div>

                  {/* Set-win count */}
                  <div
                    className={`text-3xl font-black italic tracking-tighter tabular-nums shrink-0 ${
                      !t1Won ? 'text-amber-500' : 'text-white/25'
                    }`}
                  >
                    {t2Wins}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Score Detail ── */}
            <div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${match.scores.length}, 1fr)` }}>
                {match.scores.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.04] rounded-lg py-2.5 px-1 border border-white/[0.05]"
                  >
                    <div className="text-center">
                      {/* Score numbers */}
                      <div className="text-[22px] font-black tracking-tight leading-none tabular-nums">
                        <span className={s.team1 > s.team2 ? 'text-amber-500' : 'text-white/55'}>
                          {s.team1}
                        </span>
                        <span className="text-white/15 mx-[2px]">:</span>
                        <span className={s.team2 > s.team1 ? 'text-amber-500' : 'text-white/55'}>
                          {s.team2}
                        </span>
                      </div>
                      {/* Set label */}
                      <div className="text-[10px] font-bold text-white/20 mt-1 tracking-widest">
                        第{i + 1}局
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex items-end justify-between pt-4 border-t border-white/[0.07]">
              <div>
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-0.5">
                  俱乐部
                </p>
                <p className="font-bold text-xs text-white/60">{clubName}</p>
              </div>
              {inviteCode && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] mb-0.5">
                    邀请码
                  </p>
                  <p className="font-mono font-bold text-xs text-amber-500/70 tracking-wider">
                    {inviteCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final rendered image */}
      {finalImage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <img
            src={finalImage}
            className="w-full max-w-[360px] rounded-3xl shadow-2xl ring-1 ring-white/10"
            alt="战报"
          />
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-400/10 px-4 py-2 rounded-full">
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
