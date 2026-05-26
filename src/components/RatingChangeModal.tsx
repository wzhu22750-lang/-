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
  winner: 'team1' | 'team2';
  onClose: () => void;
}

// 随机生成粒子位置
const particles = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  duration: 0.8 + Math.random() * 0.6,
  emoji: ['🏸', '🎉', '✨', '🔥', '💪'][i % 5],
}));

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
    }, 40);
    return () => clearInterval(timer);
  }, [from, to]);
  return <span>{count}</span>;
}

export function RatingChangeModal({ changes, winner, onClose }: RatingChangeModalProps) {
  const team1Changes = changes.filter((_, i) => i < changes.length / 2);
  const team2Changes = changes.filter((_, i) => i >= changes.length / 2);
  const team1Won = winner === 'team1';
  const t1Won = team1Changes.some(c => c.change > 0) || team1Won;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl text-center relative"
      >
        {/* Confetti particles */}
        {t1Won && particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: [0, 1, 0], y: -120 - Math.random() * 80, x: (Math.random() - 0.5) * 80 }}
            transition={{ delay: p.delay, duration: p.duration, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 text-lg pointer-events-none z-10"
            style={{ left: `${p.x}%` }}
          >
            {p.emoji}
          </motion.div>
        ))}

        {/* Header */}
        <div className={`pt-8 pb-6 ${t1Won ? 'bg-green-500' : 'bg-red-500'} text-white relative overflow-hidden`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-20"><X size={20} /></button>

          <motion.div
            animate={t1Won ? { rotate: [0, -8, 8, 0] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md"
          >
            <Trophy size={32} className="text-yellow-300" />
          </motion.div>

          <h2 className="text-xl font-black italic tracking-widest">
            {t1Won ? 'VICTORY' : 'DEFEAT'}
          </h2>
          {!t1Won && (
            <p className="text-[10px] text-white/60 mt-1 font-bold">再接再厉，下次必胜</p>
          )}
        </div>

        {/* Team sections */}
        <div className="p-6 space-y-4">
          {/* Team 1 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left pl-1">
              {team1Won ? '胜方' : '负方'} · A 队
            </p>
            {team1Changes.map(pc => (
              <PlayerRatingRow key={pc.playerId} data={pc} />
            ))}
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Team 2 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left pl-1">
              {!team1Won ? '胜方' : '负方'} · B 队
            </p>
            {team2Changes.map(pc => (
              <PlayerRatingRow key={pc.playerId} data={pc} />
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all mt-2"
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
    <div className="flex items-center gap-3 bg-neutral-50 rounded-2xl p-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-white border border-neutral-100 shrink-0">
        {data.avatar ? (
          <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-black text-neutral-300">{data.initials}</div>
        )}
      </div>

      {/* Name + rating change */}
      <div className="text-left flex-1 min-w-0">
        <p className="text-sm font-black text-neutral-800 truncate">{data.name}</p>
        <p className="text-[9px] font-bold text-neutral-400">
          {data.oldRating} → <CountUp from={data.oldRating} to={data.newRating} />
        </p>
      </div>

      {/* Change badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-sm ${
          isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}
      >
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? '+' : ''}{data.change}
      </motion.div>
    </div>
  );
}
