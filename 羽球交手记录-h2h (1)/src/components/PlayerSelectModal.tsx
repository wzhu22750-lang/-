
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, CheckCircle2, UserPlus, Plus } from 'lucide-react';
import { Player } from '../types';
import { AddPlayerModal } from './AddPlayerModal';

interface PlayerSelectModalProps {
  side: 'team1' | 'team2';
  onClose: () => void;
  players: Player[];
  onSelect: (ids: string[]) => void;
  onAddPlayer: (p: Player) => void;
  currentSelected: string[];
}

export function PlayerSelectModal({ side, onClose, players, onSelect, onAddPlayer, currentSelected }: PlayerSelectModalProps) {
  const [selected, setSelected] = useState<string[]>(currentSelected);
  const [search, setSearch] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden p-6 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">选择 {side === 'team1' ? 'A' : 'B'} 队球员</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddingPlayer(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1 text-sm font-bold"
            >
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
            type="text"
            placeholder="搜索或添加球员..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-neutral-100 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-6 min-h-[300px]">
          {filtered.length === 0 && search.trim().length > 0 && (
            <button
              onClick={() => {
                const newPlayer: Player = {
                  id: Math.random().toString(36).substr(2, 9),
                  name: search,
                  initials: search.slice(0, 2).toUpperCase()
                };
                onAddPlayer(newPlayer);
                setSelected([...selected, newPlayer.id].slice(0, 2));
              }}
              className="w-full p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-3 border border-red-100 mb-2"
            >
              <Plus size={20} /> 添加新球员 "{search}"
            </button>
          )}
          {filtered.map(p => {
            const isSelected = selected.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${isSelected ? 'bg-red-50 border border-red-100' : 'bg-neutral-50 border border-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden shrink-0 border border-neutral-100">
                  {p.avatar ? (
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-neutral-400">{p.initials}</span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold">{p.name}</p>
                </div>
                {isSelected && <CheckCircle2 className="text-red-500" size={24} />}
              </button>
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
              onClose={() => setIsAddingPlayer(false)}
              onAdd={(p) => {
                onAddPlayer(p);
                setSelected(prev => [...prev, p.id].slice(0, 2));
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
