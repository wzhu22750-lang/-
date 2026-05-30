import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, CheckCircle2, UserPlus, Edit2, Trash2 } from 'lucide-react';
import { Player } from '../types';
import { AddPlayerModal } from './AddPlayerModal';

interface PlayerSelectModalProps {
  side: 'team1' | 'team2';
  onClose: () => void;
  players: Player[];
  onSelect: (ids: string[]) => void;
  onAddPlayer: (p: Player) => void;
  onUpdatePlayer: (p: Player) => void;
  onDeletePlayer: (id: string) => void;
  onViewProfile: (p: Player) => void;
  currentSelected: string[];
}

export function PlayerSelectModal({ 
  side, onClose, players, onSelect, onAddPlayer, onUpdatePlayer, onDeletePlayer, onViewProfile, currentSelected 
}: PlayerSelectModalProps) {
  const [selected, setSelected] = useState<string[]>(currentSelected);
  const [search, setSearch] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState<{ edit: boolean; player?: Player } | null>(null);

  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, id]);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="bg-[#f5f5f5] w-full max-w-lg rounded-t-[32px] sm:rounded-2xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
      >
        <div className="bg-[#2d2d2e] pt-6 pb-4 px-6 text-white flex items-center justify-between shrink-0 border-b border-white/10" style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}>
          <button onClick={onClose} className="p-1 text-white/60 hover:text-white transition-colors"><X size={22} /></button>
          <span className="font-black uppercase tracking-[0.15em] text-sm">选择 {side === 'team1' ? 'A' : 'B'} 队</span>
          <button onClick={() => setIsAddingPlayer({ edit: false })} className="p-1 text-red-400 hover:text-red-300 transition-colors"><UserPlus size={20} /></button>
        </div>

        <div className="p-5 flex-1 flex flex-col overflow-hidden">

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text" placeholder="搜索球员..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none border border-neutral-200 focus:border-red-500 transition-all text-sm font-bold"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-6 min-h-[300px]">
          {filtered.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <div
                key={p.id}
                className={`group w-full flex items-center gap-4 p-4 rounded-xl transition-all border-l-[3px] ${isSelected ? 'bg-red-100 border-l-red-500' : 'bg-white border-l-transparent'}`}
              >
                <div className="flex-1 flex items-center gap-4 cursor-pointer">
                  <div
                    onClick={() => toggle(p.id)}
                    className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent hover:border-red-500 transition-all cursor-pointer"
                  >
                    {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : 
                      <span className="text-lg font-bold text-neutral-400">{p.initials}</span>
                    }
                  </div>
                  <div onClick={() => toggle(p.id)} className="flex-1 text-left">
                    <p className="font-bold">{p.name}</p>
                  </div>
                  {isSelected && <CheckCircle2 className="text-red-500" size={24} />}
                </div>

                <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); setIsAddingPlayer({ edit: true, player: p }); }} className="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); onDeletePlayer(p.id); }} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => onSelect(selected)}
          disabled={selected.length === 0}
          className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 disabled:bg-neutral-200 disabled:shadow-none transition-all"
        >
          确认选择 ({selected.length}/2)
        </button>

        <AnimatePresence>
          {isAddingPlayer && (
            <AddPlayerModal 
              initialData={isAddingPlayer.player}
              onClose={() => setIsAddingPlayer(null)}
              onAdd={(p) => {
                if (isAddingPlayer.edit) onUpdatePlayer(p);
                else onAddPlayer(p);
                setIsAddingPlayer(null);
              }}
            />
          )}
        </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
