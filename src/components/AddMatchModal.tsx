import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Calendar, Plus, Minus, Clock } from 'lucide-react';
import { Player, Match, GameScore } from '../types';

interface AddMatchModalProps {
  onClose: () => void;
  players: Player[];
  onAdd: (match: Match) => void;
  editMatch?: Match;
  prefillTeams?: { team1: string[]; team2: string[] };
}

function tsToDateStr(ts: number): string {
  return new Date(ts).toISOString().split('T')[0];
}

export function AddMatchModal({ onClose, players, onAdd, editMatch, prefillTeams }: AddMatchModalProps) {
  const isEditing = !!editMatch;
  const initTeam1 = editMatch?.team1 || prefillTeams?.team1 || [];
  const initTeam2 = editMatch?.team2 || prefillTeams?.team2 || [];

  const [team1, setTeam1] = useState<string[]>(initTeam1);
  const [team2, setTeam2] = useState<string[]>(initTeam2);
  const [scores, setScores] = useState<GameScore[]>(editMatch?.scores?.length ? editMatch.scores : [{ team1: 0, team2: 0 }]);
  const [tournament, setTournament] = useState(editMatch?.tournament || '');
  const [date, setDate] = useState(() => editMatch?.date ? tsToDateStr(editMatch.date) : new Date().toISOString().split('T')[0]);
  const [isChoosingPlayers, setIsChoosingPlayers] = useState<'team1' | 'team2' | null>(null);

  // 实时时钟
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  const timeLabel = useMemo(() => {
    const h = now.getHours();
    const m = now.getMinutes().toString().padStart(2, '0');
    const period = h >= 5 && h < 12 ? '上午' : h >= 12 && h < 18 ? '下午' : '晚上';
    const displayH = h % 12 || 12;
    return `${period}${displayH}:${m}`;
  }, [now]);

  const handleSubmit = () => {
    if (team1.length === 0 || team2.length === 0) return;

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(now.getHours());
    selectedDate.setMinutes(now.getMinutes());
    selectedDate.setSeconds(now.getSeconds());

    const newMatch: Match = {
      id: editMatch?.id || Math.random().toString(36).substr(2, 9),
      date: selectedDate.getTime(),
      type: team1.length > 1 ? 'Doubles' : 'Singles',
      team1,
      team2,
      scores: scores.filter(s => s.team1 > 0 || s.team2 > 0),
      tournament: tournament || '练习赛',
      club_id: editMatch?.club_id || '',
    };
    onAdd(newMatch);
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  const updateScore = (idx: number, side: 'team1' | 'team2', value: number) => {
    const newScores = [...scores];
    newScores[idx][side] = Math.max(0, value);
    setScores(newScores);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[170] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        className="bg-[#f5f5f5] w-full max-w-lg rounded-t-[40px] sm:rounded-2xl overflow-hidden flex flex-col max-h-[95vh] text-neutral-900 shadow-2xl"
      >
        <div className="bg-[#2d2d2e] pt-8 pb-5 px-6 text-white text-center relative shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
          <h2 className="text-xl font-black italic uppercase tracking-widest">
            {isEditing ? 'Edit Battle' : 'Record Battle'}
          </h2>
          <button onClick={onClose} className="absolute right-6 top-6 p-2 text-white/30 hover:text-white transition-colors" style={{ top: 'max(env(safe-area-inset-top), 24px)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 no-scrollbar">
          <div className="grid grid-cols-[1fr,40px,1fr] gap-4 items-center">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Team A</label>
              <button onClick={() => setIsChoosingPlayers('team1')} className="w-full min-h-[70px] bg-white rounded-2xl border border-neutral-100 flex flex-col items-center justify-center p-3 text-sm font-black shadow-sm active:scale-95 transition-all">
                {team1.length > 0 ? team1.map(getPlayerName).join(' / ') : <Plus className="text-neutral-200" />}
              </button>
            </div>
            <div className="flex justify-center pt-6"><div className="text-xs font-black text-neutral-200 italic">VS</div></div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Team B</label>
              <button onClick={() => setIsChoosingPlayers('team2')} className="w-full min-h-[70px] bg-white rounded-2xl border border-neutral-100 flex flex-col items-center justify-center p-3 text-sm font-black shadow-sm active:scale-95 transition-all">
                {team2.length > 0 ? team2.map(getPlayerName).join(' / ') : <Plus className="text-neutral-200" />}
              </button>
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Match Scores</label>
             <div className="space-y-3">
               {scores.map((score, idx) => (
                 <div key={idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm relative group">
                   <div className="text-xs font-black text-neutral-200 w-4 shrink-0">#{idx+1}</div>
                   <div className="flex items-center gap-2 flex-1 justify-center">
                      <input type="number" value={score.team1 === 0 ? '' : score.team1} placeholder="0" onChange={(e) => updateScore(idx, 'team1', parseInt(e.target.value) || 0)} className="w-14 text-center text-2xl font-black outline-none italic" />
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => updateScore(idx, 'team1', score.team1+1)} className="w-[36px] h-[36px] flex items-center justify-center text-neutral-300 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors"><Plus size={18}/></button>
                        <button onClick={() => updateScore(idx, 'team1', score.team1-1)} className="w-[36px] h-[36px] flex items-center justify-center text-neutral-300 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors"><Minus size={18}/></button>
                      </div>
                   </div>
                   <div className="h-10 w-px bg-neutral-100 shrink-0" />
                   <div className="flex items-center gap-2 flex-1 justify-center">
                      <input type="number" value={score.team2 === 0 ? '' : score.team2} placeholder="0" onChange={(e) => updateScore(idx, 'team2', parseInt(e.target.value) || 0)} className="w-14 text-center text-2xl font-black outline-none italic" />
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => updateScore(idx, 'team2', score.team2+1)} className="w-[36px] h-[36px] flex items-center justify-center text-neutral-300 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors"><Plus size={18}/></button>
                        <button onClick={() => updateScore(idx, 'team2', score.team2-1)} className="w-[36px] h-[36px] flex items-center justify-center text-neutral-300 hover:text-red-500 active:bg-red-50 rounded-lg transition-colors"><Minus size={18}/></button>
                      </div>
                   </div>
                   {scores.length > 1 && (
                     <button onClick={() => setScores(scores.filter((_, sIdx) => sIdx !== idx))} className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                   )}
                 </div>
               ))}
               <button onClick={() => setScores([...scores, { team1: 0, team2: 0 }])} className="w-full py-4 border-2 border-dashed border-neutral-200 rounded-2xl text-neutral-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors">
                 <Plus size={16} /> Add Next Set
               </button>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                <Trophy size={18} className="text-red-500" />
                <input type="text" placeholder="赛事/场地 (例: 世纪馆-5号场)" value={tournament} onChange={(e) => setTournament(e.target.value)} className="flex-1 outline-none text-sm font-black" />
             </div>
             <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm">
                <Calendar size={18} className="text-blue-500 shrink-0" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 outline-none text-sm font-black min-w-0" />
                <div className="flex items-center gap-1.5 text-xs font-black text-neutral-400 bg-neutral-50 px-2.5 py-1.5 rounded-xl shrink-0">
                  <Clock size={12} />
                  <span>{timeLabel}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-white border-t border-neutral-100 shrink-0">
          <button onClick={handleSubmit} disabled={team1.length === 0 || team2.length === 0} className="w-full py-5 bg-[#e11d48] text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100 transition-all active:scale-[0.98] disabled:opacity-50">
            {isEditing ? 'Update Match' : 'Publish Match'}
          </button>
        </div>

        {isChoosingPlayers && (
          <div className="absolute inset-0 bg-white z-[180] flex flex-col">
             <div className="bg-[#2d2d2e] pt-8 pb-5 px-6 text-white flex items-center justify-between shadow-lg" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
                <button onClick={() => setIsChoosingPlayers(null)}><X size={24}/></button>
                <span className="font-black italic uppercase tracking-widest">Select Players</span>
                <button onClick={() => setIsChoosingPlayers(null)} className="font-black text-red-500 uppercase">Done</button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {players.map((p) => {
                  const isSelected = (isChoosingPlayers === 'team1' ? team1 : team2).includes(p.id);
                  return (
                    <button key={p.id} onClick={() => {
                        const current = isChoosingPlayers === 'team1' ? team1 : team2;
                        const next = isSelected ? current.filter(id => id !== p.id) : [...current, p.id].slice(0, 2);
                        if (isChoosingPlayers === 'team1') setTeam1(next); else setTeam2(next);
                      }}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${isSelected ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-transparent'}`}
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-red-600 italic border border-neutral-100 overflow-hidden">
                            {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.initials}
                         </div>
                         <span className="font-black text-neutral-800">{p.name}</span>
                      </div>
                      {isSelected && <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white"><X size={14} className="rotate-45" /></div>}
                    </button>
                  );
                })}
             </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
