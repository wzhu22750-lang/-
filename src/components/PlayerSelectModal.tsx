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
  side,
  onClose,
  players,
  onSelect,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onViewProfile,
  currentSelected,
}: PlayerSelectModalProps) {
  const [selected, setSelected] = useState<string[]>(currentSelected);
  const [search, setSearch] = useState('');
  const [isAddingPlayer, setIsAddingPlayer] = useState<{ edit: boolean; player?: Player } | null>(null);

  const filtered = players.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else if (selected.length < 2) {
      setSelected([...selected, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        className="bg-[#f5f6f3] w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden max-h-[90vh] flex flex-col court-elevated-shadow border border-[#dde2dc]"
      >
        <div
          className="bg-[#0c261e] court-grid-pattern pt-6 pb-4 px-6 text-white flex items-center justify-between shrink-0 border-b border-emerald-500/20"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
        >
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
          <div className="text-center">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">
              ROSTER SELECTION
            </span>
            <span className="font-extrabold text-base">
              配置 {side === 'team1' ? 'A 队' : 'B 队'} 阵容
            </span>
          </div>
          <button
            onClick={() => setIsAddingPlayer({ edit: false })}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 text-xs font-bold transition-colors"
          >
            <UserPlus size={15} />
            <span>新球员</span>
          </button>
        </div>

        <div className="p-5 flex-1 flex flex-col overflow-hidden">
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b665f]" size={17} />
            <input
              type="text"
              placeholder="按姓名搜索在册球友..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl outline-none border border-[#dde2dc] focus:border-[#0b6e4f] transition-colors text-sm font-bold text-[#111814] placeholder:text-[#5b665f]/50"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-[280px]">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-[#5b665f]">
                <p className="text-sm font-bold">暂无匹配球友</p>
                <p className="text-xs mt-1">可点击右上角「新球员」录入球馆成员</p>
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = selected.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-colors border ${
                      isSelected
                        ? 'bg-emerald-50/90 border-[#0b6e4f]'
                        : 'bg-white border-[#dde2dc] hover:border-[#0b6e4f]/40'
                    }`}
                  >
                    <div className="flex-1 flex items-center gap-3.5 cursor-pointer min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewProfile(p);
                        }}
                        className="w-11 h-11 rounded-full bg-[#f5f6f3] flex items-center justify-center overflow-hidden shrink-0 border border-[#dde2dc] hover:border-[#0b6e4f] transition-colors"
                        title="查看个人档案"
                      >
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-display font-extrabold text-[#0b6e4f]">
                            {p.initials}
                          </span>
                        )}
                      </button>

                      <div onClick={() => toggle(p.id)} className="flex-1 text-left min-w-0">
                        <p className="font-bold text-sm text-[#111814] truncate">{p.name}</p>
                        <p className="text-[11px] font-mono text-[#5b665f] tabular-nums">
                          ELO {p.elo_rating || 1500}
                        </p>
                      </div>

                      {isSelected && <CheckCircle2 className="text-[#0b6e4f] shrink-0" size={22} />}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingPlayer({ edit: true, player: p });
                        }}
                        className="w-9 h-9 flex items-center justify-center text-[#5b665f] hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                        title="编辑资料"
                        aria-label="编辑球员"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlayer(p.id);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-[#5b665f] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="移除球员"
                        aria-label="删除球员"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <button
            onClick={() => onSelect(selected)}
            disabled={selected.length === 0}
            className="w-full py-4 bg-[#0b6e4f] hover:bg-[#095a40] text-white rounded-xl font-bold text-sm shadow-sm disabled:bg-[#dde2dc] disabled:text-[#5b665f] transition-colors"
          >
            确认阵容 ({selected.length}/2)
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
