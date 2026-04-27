import { motion } from 'motion/react';
import { Trophy, TrendingUp, TrendingDown, Star, X } from 'lucide-react';

interface RatingChangeModalProps {
  change: number;
  newRating: number;
  onClose: () => void;
}

export function RatingChangeModal({ change, newRating, onClose }: RatingChangeModalProps) {
  const isWin = change > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[40px] w-full max-w-xs overflow-hidden shadow-2xl text-center"
      >
        <div className={`pt-10 pb-8 ${isWin ? 'bg-green-500' : 'bg-red-500'} text-white relative`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white"><X size={20}/></button>
          <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            {isWin ? <Trophy size={40} className="text-yellow-300" /> : <TrendingDown size={40} />}
          </div>
          <h2 className="text-2xl font-black italic tracking-widest">{isWin ? 'VICTORY' : 'DEFEAT'}</h2>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center gap-1 mb-8">
            <div className={`text-4xl font-black italic ${isWin ? 'text-green-600' : 'text-red-600'}`}>
              {isWin ? '+' : ''}{change}
            </div>
            <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">Rating Points</p>
          </div>

          <div className="bg-neutral-50 rounded-2xl p-4 flex items-center justify-between mb-6">
             <div className="text-left">
                <p className="text-[8px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">New Rating</p>
                <p className="text-xl font-black text-neutral-800 italic flex items-center gap-1">
                   <Star size={14} className="text-yellow-500" fill="currentColor" /> {newRating}
                </p>
             </div>
             <div className={`p-2 rounded-lg ${isWin ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {isWin ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all"
          >
            收下战果
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
