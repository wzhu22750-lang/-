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
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden p-6 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">选择 {side === 'team1' ? 'A' : 'B'} 队球员</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAddingPlayer({ edit: false })} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors">
              <UserPlus size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-neutral-400">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
          <input
            type="text" placeholder="搜索球员..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-6 min-h-[300px]">
          {filtered.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <div
                key={p.id}
                className={`group w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isSelected ? 'bg-red-50' : 'bg-neutral-50'}`}
              >
                <div className="flex-1 flex items-center gap-4 cursor-pointer">
                  <div 
                    onClick={(e) => { e.stopPropagation(); onViewProfile(p); }}
                    className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent hover:border-red-500 transition-all"
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

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </motion.div>
    </motion.div>
  );
}
