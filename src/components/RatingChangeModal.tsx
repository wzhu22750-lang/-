import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, X } from 'lucide-react';

interface PlayerChange {
  playerId: string;
  name: string;
  initials: string;
  avatar?: string;
  oldRating: number;
  newRating: number;
  change: number;
}

interface RatingChangeModalProps {
  changes: PlayerChange[];
  winner: 'team1' | 'team2' | 'tie';
  onClose: () => void;
}

function CountUp({ from, to }: { from: number; to: number }) {
  const [count, setCount] = useState(from);
  useEffect(() => {
    if (from === to) return;
    const steps = 15;
    const diff = to - from;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round(from + (diff * step) / steps));
      if (step >= steps) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [from, to]);
  return <span className="tabular-nums">{count}</span>;
}

export function RatingChangeModal({ changes, winner, onClose }: RatingChangeModalProps) {
  const team1Changes = changes.filter((_, i) => i < changes.length / 2);
  const team2Changes = changes.filter((_, i) => i >= changes.length / 2);
  const isTie = winner === 'tie';
  const team1Won = winner === 'team1';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-5"
    >
      <motion.div
        initial={{ scale: 0.9, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 24 }}
        className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden court-elevated-shadow text-center relative border border-neutral-200/80"
      >
        {/* Header */}
        <div
          className={`pt-7 pb-5 px-6 bg-gradient-to-br ${
            isTie
              ? 'from-neutral-600 to-neutral-800'
              : 'from-[#e11d48] to-[#be123c]'
          } text-white relative overflow-hidden`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 z-20"
            aria-label="关闭"
          >
            <X size={18} />
          </button>

          <div className="bg-white/20 border border-white/30 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Trophy size={28} className="text-white" />
          </div>

          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/80 block">
            ELO RATING SETTLEMENT
          </span>
          <h2 className="text-xl font-extrabold tracking-tight mt-0.5">
            {isTie ? '双方握手言和' : team1Won ? '队伍 1 赢得胜利' : '队伍 2 赢得胜利'}
          </h2>
        </div>

        {/* Team Rating Changes */}
        <div className="p-5 space-y-4 bg-[#f5f5f5]">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-neutral-500 text-left pl-1">
              {isTie ? '平局 · 队伍 1' : team1Won ? '胜方 · 队伍 1' : '负方 · 队伍 1'}
            </p>
            {team1Changes.map((pc) => (
              <PlayerRatingRow key={pc.playerId} data={pc} />
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-neutral-500 text-left pl-1">
              {isTie ? '平局 · 队伍 2' : !team1Won ? '胜方 · 队伍 2' : '负方 · 队伍 2'}
            </p>
            {team2Changes.map((pc) => (
              <PlayerRatingRow key={pc.playerId} data={pc} />
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-[transform,background-color] mt-1"
          >
            收下战果
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function PlayerRatingRow({ data }: { data: PlayerChange; key?: string }) {
  const isPositive = data.change > 0;
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl p-3 border border-neutral-200/80 court-card-shadow">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
        {data.avatar ? (
          <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-display font-extrabold text-neutral-600">
            {data.initials}
          </div>
        )}
      </div>

      <div className="text-left flex-1 min-w-0">
        <p className="text-sm font-bold text-neutral-900 truncate">{data.name}</p>
        <p className="text-[11px] font-mono font-semibold text-neutral-500 tabular-nums">
          {data.oldRating} → <CountUp from={data.oldRating} to={data.newRating} />
        </p>
      </div>

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22, delay: 0.15 }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono font-extrabold text-xs tabular-nums ${
          isPositive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : data.change < 0
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
        }`}
      >
        {isPositive ? <TrendingUp size={13} /> : data.change < 0 ? <TrendingDown size={13} /> : null}
        {isPositive ? '+' : ''}
        {data.change}
      </motion.div>
    </div>
  );
}
