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

export function RatingChangeModal({ changes, winner, onClose }: RatingChangeModalProps) {
  const team1Changes = changes.filter((_, i) => i < changes.length / 2);
  const team2Changes = changes.filter((_, i) => i >= changes.length / 2);
  const team1Won = winner === 'team1';

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl text-center"
      >
        {/* Header */}
        <div className={`pt-8 pb-6 ${team1Won ? 'bg-green-500' : 'bg-red-500'} text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20} /></button>
          <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <Trophy size={32} className="text-yellow-300" />
          </div>
          <h2 className="text-xl font-black italic tracking-widest">
            {team1Won ? 'A 队 获胜' : 'B 队 获胜'}
          </h2>
        </div>

        {/* Team sections */}
        <div className="p-6 space-y-4">
          {/* Team 1 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left pl-1">
              {team1Won ? '胜方' : '负方'} · A 队
            </p>
            {team1Changes.map(pc => (
              <PlayerRatingRow key={pc.playerId} data={pc} won={team1Won} />
            ))}
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Team 2 */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest text-left pl-1">
              {!team1Won ? '胜方' : '负方'} · B 队
            </p>
            {team2Changes.map(pc => (
              <PlayerRatingRow key={pc.playerId} data={pc} won={!team1Won} />
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

function PlayerRatingRow({ data, won }: { data: PlayerChange; won: boolean; key?: string }) {
  const isPositive = won;
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
          {data.oldRating} → {data.newRating}
        </p>
      </div>

      {/* Change badge */}
      <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-sm ${
        isPositive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {isPositive ? '+' : ''}{data.change}
      </div>
    </div>
  );
}
