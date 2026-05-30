import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Calendar, Plus, Minus, Clock, Tag, AlertCircle, Zap } from 'lucide-react';
import { Player, Match, GameScore, MatchCategory } from '../types';

interface AddMatchModalProps {
  onClose: () => void;
  players: Player[];
  onAdd: (match: Match) => void;
  editMatch?: Match;
  prefillTeams?: { team1: string[]; team2: string[] };
  categories: MatchCategory[];
}

function tsToDateStr(ts: number): string {
  return new Date(ts).toISOString().split('T')[0];
}

export function AddMatchModal({ onClose, players, onAdd, editMatch, prefillTeams, categories }: AddMatchModalProps) {
  const isEditing = !!editMatch;
  const initTeam1 = editMatch?.team1 || prefillTeams?.team1 || [];
  const initTeam2 = editMatch?.team2 || prefillTeams?.team2 || [];

  const [team1, setTeam1] = useState<string[]>(initTeam1);
  const [team2, setTeam2] = useState<string[]>(initTeam2);
  const [scores, setScores] = useState<GameScore[]>(editMatch?.scores?.length ? editMatch.scores : [{ team1: 0, team2: 0 }]);
  const [tournament, setTournament] = useState(editMatch?.tournament || '');
  const [date, setDate] = useState(() => editMatch?.date ? tsToDateStr(editMatch.date) : new Date().toISOString().split('T')[0]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(editMatch?.category_id || categories[0]?.id);
  const [boFormat, setBoFormat] = useState<'BO1' | 'BO3' | 'BO5'>(editMatch?.bo_format || 'BO1');
  const [isChoosingPlayers, setIsChoosingPlayers] = useState<'team1' | 'team2' | null>(null);
  const [submitError, setSubmitError] = useState('');

  const selectedCategory = useMemo(() => categories.find(c => c.id === selectedCategoryId), [categories, selectedCategoryId]);
  const requireEloGap = selectedCategory?.require_elo_gap === true;

  const teamElo = useMemo(() => {
    const avg = (ids: string[]) => {
      const rated = ids.map(id => players.find(p => p.id === id)?.elo_rating ?? 1500);
      return rated.length ? Math.round(rated.reduce((s, r) => s + r, 0) / rated.length) : 1500;
    };
    return { team1: avg(team1), team2: avg(team2) };
  }, [players, team1, team2]);

  const eloGap = Math.abs(teamElo.team1 - teamElo.team2);
  const ELO_GAP_MIN = 30;

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

    if (requireEloGap && eloGap < ELO_GAP_MIN) {
      setSubmitError(`「${selectedCategory?.name}」需要双方存在实力差距（至少 ${ELO_GAP_MIN} 分），当前差距仅 ${eloGap} 分`);
      return;
    }

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
      category_id: selectedCategoryId,
      bo_format: boFormat,
    };
    onAdd(newMatch);
  };

  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

  useEffect(() => { setSubmitError(''); }, [team1, team2, selectedCategoryId]);

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
        className="bg-[#f5f5f5] w-full max-w-lg rounded-t-[32px] sm:rounded-2xl overflow-hidden flex flex-col max-h-[95vh] text-neutral-900 shadow-2xl"
      >
        {/* Header */}
        <div
          className="bg-[#2d2d2e] pt-6 pb-4 px-6 text-white text-center relative shrink-0 border-b border-white/10"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}
        >
          <h2 className="text-lg font-black uppercase tracking-[0.15em]">
            {isEditing ? 'Edit Battle' : 'Record Battle'}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 p-2 text-white/60 hover:text-white transition-colors"
            style={{ top: 'max(env(safe-area-inset-top), 20px)' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 no-scrollbar">

          {/* ---- 队伍选择 ---- */}
          <div className="grid grid-cols-[1fr,36px,1fr] gap-3 items-center">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1">Team A</label>
              <button
                onClick={() => setIsChoosingPlayers('team1')}
                className="w-full min-h-[64px] bg-white rounded-2xl border border-neutral-200 flex flex-col items-center justify-center p-3 text-sm font-black shadow-sm active:scale-[0.97] transition-all border-l-[3px] border-l-red-500"
              >
                {team1.length > 0 ? team1.map(getPlayerName).join(' / ') : <Plus size={20} className="text-neutral-300" />}
              </button>
            </div>
            <div className="flex justify-center pt-5">
              <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-500 flex items-center justify-center text-[11px] font-black">VS</div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1">Team B</label>
              <button
                onClick={() => setIsChoosingPlayers('team2')}
                className="w-full min-h-[64px] bg-white rounded-2xl border border-neutral-200 flex flex-col items-center justify-center p-3 text-sm font-black shadow-sm active:scale-[0.97] transition-all border-l-[3px] border-l-blue-500"
              >
                {team2.length > 0 ? team2.map(getPlayerName).join(' / ') : <Plus size={20} className="text-neutral-300" />}
              </button>
            </div>
          </div>

          {/* ---- 比分 ---- */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1">Match Scores</label>
            <div className="space-y-2.5">
              {scores.map((score, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm relative group">
                  <div className="text-[11px] font-bold text-neutral-400 w-5 shrink-0 text-center">#{idx + 1}</div>
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <input
                      type="number"
                      value={score.team1 === 0 ? '' : score.team1}
                      placeholder="0"
                      onChange={(e) => updateScore(idx, 'team1', parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-xl font-black outline-none bg-neutral-50 rounded-xl py-1"
                    />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => updateScore(idx, 'team1', score.team1 + 1)} className="w-[44px] h-[44px] flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 active:scale-90 rounded-xl transition-all"><Plus size={20} /></button>
                      <button onClick={() => updateScore(idx, 'team1', score.team1 - 1)} className="w-[44px] h-[44px] flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 active:scale-90 rounded-xl transition-all"><Minus size={20} /></button>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-neutral-200 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <input
                      type="number"
                      value={score.team2 === 0 ? '' : score.team2}
                      placeholder="0"
                      onChange={(e) => updateScore(idx, 'team2', parseInt(e.target.value) || 0)}
                      className="w-12 text-center text-xl font-black outline-none bg-neutral-50 rounded-xl py-1"
                    />
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => updateScore(idx, 'team2', score.team2 + 1)} className="w-[44px] h-[44px] flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 active:scale-90 rounded-xl transition-all"><Plus size={20} /></button>
                      <button onClick={() => updateScore(idx, 'team2', score.team2 - 1)} className="w-[44px] h-[44px] flex items-center justify-center text-neutral-500 hover:text-red-500 hover:bg-red-50 active:scale-90 rounded-xl transition-all"><Minus size={20} /></button>
                    </div>
                  </div>
                  {scores.length > 1 && (
                    <button
                      onClick={() => setScores(scores.filter((_, sIdx) => sIdx !== idx))}
                      className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setScores([...scores, { team1: 0, team2: 0 }])}
                className="w-full py-3.5 border-2 border-neutral-200 rounded-2xl text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-100 hover:border-neutral-400 transition-colors"
              >
                <Plus size={16} /> Add Next Set
              </button>
            </div>
          </div>

          {/* ---- 赛制 + 类别（合并卡片）---- */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4 shadow-sm">
            <div className="space-y-2.5">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1">BO Format</label>
              <div className="flex gap-0">
                {(['BO1', 'BO3', 'BO5'] as const).map((fmt, i) => (
                  <button
                    key={fmt}
                    onClick={() => setBoFormat(fmt)}
                    className={`flex-1 py-3 text-xs font-black transition-all border ${
                      i > 0 ? 'border-l-0' : ''
                    } ${
                      boFormat === fmt
                        ? 'bg-[#e11d48] text-white border-[#e11d48] shadow-md'
                        : 'bg-white text-neutral-500 border-neutral-200 hover:bg-neutral-50'
                    } ${i === 0 ? 'rounded-l-xl' : ''} ${i === 2 ? 'rounded-r-xl' : ''}`}
                  >
                    {fmt === 'BO1' ? '一局胜负' : fmt === 'BO3' ? '三局两胜' : '五局三胜'}
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1 flex items-center gap-1.5">
                  <Tag size={13} /> 比赛类别
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`shrink-0 px-3.5 py-3 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                        selectedCategoryId === cat.id
                          ? 'bg-[#e11d48] text-white shadow-md shadow-red-200'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
                      }`}
                    >
                      {cat.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        selectedCategoryId === cat.id ? 'bg-white/20 text-white' : 'bg-white text-neutral-400'
                      }`}>
                        ×{cat.k_multiplier}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---- ELO 差距提示 ---- */}
          {requireEloGap && team1.length > 0 && team2.length > 0 && (
            <div className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-3 ${
              eloGap >= ELO_GAP_MIN ? 'bg-green-100 border-green-200 text-green-700' : 'bg-amber-100 border-amber-200 text-amber-700'
            }`}>
              <Zap size={14} className="shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/60 px-2 py-0.5 rounded-lg font-black">{teamElo.team1}</span>
                <span className="text-[10px] opacity-60">vs</span>
                <span className="bg-white/60 px-2 py-0.5 rounded-lg font-black">{teamElo.team2}</span>
                <span className="ml-1">
                  {eloGap >= ELO_GAP_MIN ? `差距 ${eloGap} 分 ✓` : `仅差 ${eloGap} 分，需 ≥ ${ELO_GAP_MIN}`}
                </span>
              </div>
            </div>
          )}

          {/* ---- 赛事/场地 + 日期 ---- */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.08em] pl-1">When & Where</label>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 px-4 shadow-sm">
              <Trophy size={18} className="text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="赛事/场地"
                value={tournament}
                onChange={(e) => setTournament(e.target.value)}
                className="flex-1 py-4 outline-none text-sm font-black placeholder:text-neutral-300"
              />
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200 px-4 shadow-sm">
              <Calendar size={18} className="text-neutral-400 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 py-4 outline-none text-sm font-black min-w-0"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 bg-neutral-100 px-2.5 py-1.5 rounded-xl shrink-0">
                <Clock size={12} />
                <span>{timeLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-white border-t border-neutral-100 shrink-0 space-y-3">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
              <AlertCircle size={14} className="shrink-0" />
              {submitError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={team1.length === 0 || team2.length === 0}
            className="w-full py-4 bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white rounded-2xl font-black uppercase tracking-[0.1em] shadow-xl shadow-red-100 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isEditing ? 'Update Match' : 'Publish Match'}
          </button>
        </div>

        {/* Player Selection Overlay */}
        {isChoosingPlayers && (
          <div className="absolute inset-0 bg-white z-[180] flex flex-col">
            <div
              className="bg-[#2d2d2e] pt-6 pb-4 px-6 text-white flex items-center justify-between shadow-lg"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 28px)' }}
            >
              <button onClick={() => setIsChoosingPlayers(null)}><X size={22} /></button>
              <span className="font-black uppercase tracking-[0.15em]">Select Players</span>
              <button onClick={() => setIsChoosingPlayers(null)} className="font-black text-red-500 uppercase">Done</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
              {players.map((p) => {
                const isSelected = (isChoosingPlayers === 'team1' ? team1 : team2).includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const current = isChoosingPlayers === 'team1' ? team1 : team2;
                      const next = isSelected ? current.filter(id => id !== p.id) : [...current, p.id].slice(0, 2);
                      if (isChoosingPlayers === 'team1') setTeam1(next); else setTeam2(next);
                    }}
                    className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isSelected ? 'bg-red-50 border-red-200' : 'bg-neutral-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center font-black text-red-600 italic border border-neutral-100 overflow-hidden">
                        {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : p.initials}
                      </div>
                      <span className="font-black text-neutral-800">{p.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                        <X size={14} className="rotate-45" />
                      </div>
                    )}
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
