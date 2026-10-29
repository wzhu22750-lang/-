import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Calendar, Plus, Minus, Clock, Tag, AlertCircle, Zap, Check } from 'lucide-react';
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

export function AddMatchModal({
  onClose,
  players,
  onAdd,
  editMatch,
  prefillTeams,
  categories,
}: AddMatchModalProps) {
  const isEditing = !!editMatch;
  const initTeam1 = editMatch?.team1 || prefillTeams?.team1 || [];
  const initTeam2 = editMatch?.team2 || prefillTeams?.team2 || [];

  const [team1, setTeam1] = useState<string[]>(initTeam1);
  const [team2, setTeam2] = useState<string[]>(initTeam2);
  const [scores, setScores] = useState<GameScore[]>(
    editMatch?.scores?.length ? editMatch.scores : [{ team1: 21, team2: 18 }]
  );
  const [tournament, setTournament] = useState(editMatch?.tournament || '');
  const [date, setDate] = useState(() =>
    editMatch?.date ? tsToDateStr(editMatch.date) : new Date().toISOString().split('T')[0]
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    editMatch?.category_id || categories[0]?.id
  );
  const [boFormat, setBoFormat] = useState<'BO1' | 'BO3' | 'BO5'>(editMatch?.bo_format || 'BO1');
  const [isChoosingPlayers, setIsChoosingPlayers] = useState<'team1' | 'team2' | null>(null);
  const [submitError, setSubmitError] = useState('');

  const isDuplicate = useMemo(() => team1.some((id) => team2.includes(id)), [team1, team2]);
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );
  const requireEloGap = selectedCategory?.require_elo_gap === true;

  const teamElo = useMemo(() => {
    const avg = (ids: string[]) => {
      const rated = ids.map((id) => players.find((p) => p.id === id)?.elo_rating ?? 1500);
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
    if (team1.length === 0 || team2.length === 0) {
      setSubmitError('请先选择队伍 1 与队伍 2 参赛球友');
      return;
    }
    if (isDuplicate) {
      setSubmitError('同一位球友不能同时出现在队伍 1 和队伍 2');
      return;
    }
    if (requireEloGap && eloGap < ELO_GAP_MIN) {
      setSubmitError(
        `「${selectedCategory?.name}」要求双方 ELO 差距至少 ${ELO_GAP_MIN} 分，当前仅差 ${eloGap} 分`
      );
      return;
    }

    const validScores = scores.filter((s) => s.team1 > 0 || s.team2 > 0);
    if (validScores.length === 0) {
      setSubmitError('请至少填写一局有效比分');
      return;
    }

    const currentNow = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(currentNow.getHours());
    selectedDate.setMinutes(currentNow.getMinutes());
    selectedDate.setSeconds(currentNow.getSeconds());

    const newMatch: Match = {
      id: editMatch?.id || Math.random().toString(36).substr(2, 9),
      date: selectedDate.getTime(),
      type: team1.length > 1 || team2.length > 1 ? 'Doubles' : 'Singles',
      team1,
      team2,
      scores: validScores,
      tournament: tournament.trim() || '日常训练赛',
      club_id: editMatch?.club_id || '',
      category_id: selectedCategoryId,
      bo_format: boFormat,
    };
    onAdd(newMatch);
  };

  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || id;

  useEffect(() => {
    setSubmitError('');
  }, [team1, team2, selectedCategoryId, scores]);

  const updateScore = (idx: number, side: 'team1' | 'team2', value: number) => {
    const newScores = [...scores];
    newScores[idx] = { ...newScores[idx], [side]: Math.max(0, value) };
    setScores(newScores);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[170] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        className="bg-[#f5f5f5] w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col max-h-[94vh] text-neutral-900 court-elevated-shadow border border-neutral-200/80"
      >
        {/* Header */}
        <div
          className="bg-[#2d2d2e] pt-6 pb-4 px-6 text-white flex items-center justify-between relative shrink-0 border-b border-white/10"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block">
              MATCH SCORECARD
            </span>
            <h2 className="text-lg font-extrabold tracking-tight">
              {isEditing ? '编辑比赛记录' : '录入比赛战绩'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Team Selection */}
          <div className="grid grid-cols-[1fr_36px_1fr] gap-2.5 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-red-600 pl-1 block">队伍 1 阵容</label>
              <button
                type="button"
                onClick={() => setIsChoosingPlayers('team1')}
                className="w-full min-h-[68px] bg-white rounded-2xl border border-neutral-200/80 hover:border-red-500 flex flex-col items-center justify-center p-3 text-sm font-bold court-card-shadow active:scale-[0.98] transition-[transform,border-color] border-t-4 border-t-red-500"
              >
                {team1.length > 0 ? (
                  <span className="text-neutral-900 text-center leading-snug">
                    {team1.map(getPlayerName).join(' / ')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <Plus size={16} /> 选择球友
                  </span>
                )}
              </button>
            </div>

            <div className="flex justify-center pt-5">
              <div className="w-9 h-9 rounded-xl bg-neutral-200 text-neutral-700 flex items-center justify-center font-display text-xs font-black">
                VS
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-600 pl-1 block text-right pr-1">队伍 2 阵容</label>
              <button
                type="button"
                onClick={() => setIsChoosingPlayers('team2')}
                className="w-full min-h-[68px] bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-500 flex flex-col items-center justify-center p-3 text-sm font-bold court-card-shadow active:scale-[0.98] transition-[transform,border-color] border-t-4 border-t-blue-500"
              >
                {team2.length > 0 ? (
                  <span className="text-neutral-900 text-center leading-snug">
                    {team2.map(getPlayerName).join(' / ')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
                    <Plus size={16} /> 选择球友
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Scores Input */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-neutral-900">各局小分</label>
              <span className="text-[11px] text-neutral-500">点击 21 可快速填入标准局分</span>
            </div>

            <div className="space-y-2.5">
              {scores.map((score, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 court-card-shadow relative"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                      第 {idx + 1} 局
                    </span>
                    {scores.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setScores(scores.filter((_, sIdx) => sIdx !== idx))}
                        className="text-[11px] font-bold text-red-600 hover:bg-red-50 px-2 py-0.5 rounded-md transition-colors"
                      >
                        移除此局
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    {/* Team 1 Score Control */}
                    <div className="flex items-center justify-between bg-neutral-50 p-1.5 rounded-xl border border-neutral-200/70">
                      <button
                        type="button"
                        onClick={() => updateScore(idx, 'team1', score.team1 - 1)}
                        className="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-900 bg-white rounded-lg border border-neutral-200 active:scale-95 transition-transform"
                        aria-label="1队减1分"
                      >
                        <Minus size={15} />
                      </button>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={score.team1 === 0 ? '' : score.team1}
                          placeholder="0"
                          onChange={(e) => updateScore(idx, 'team1', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-display text-xl font-black text-neutral-900 outline-none bg-transparent tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => updateScore(idx, 'team1', 21)}
                          className="text-[10px] font-mono font-bold text-red-600 hover:underline"
                        >
                          设为21
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateScore(idx, 'team1', score.team1 + 1)}
                        className="w-9 h-9 flex items-center justify-center text-red-600 bg-white rounded-lg border border-neutral-200 active:scale-95 transition-transform"
                        aria-label="1队加1分"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <span className="font-display font-black text-neutral-400">:</span>

                    {/* Team 2 Score Control */}
                    <div className="flex items-center justify-between bg-neutral-50 p-1.5 rounded-xl border border-neutral-200/70">
                      <button
                        type="button"
                        onClick={() => updateScore(idx, 'team2', score.team2 - 1)}
                        className="w-9 h-9 flex items-center justify-center text-neutral-500 hover:text-neutral-900 bg-white rounded-lg border border-neutral-200 active:scale-95 transition-transform"
                        aria-label="2队减1分"
                      >
                        <Minus size={15} />
                      </button>
                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          value={score.team2 === 0 ? '' : score.team2}
                          placeholder="0"
                          onChange={(e) => updateScore(idx, 'team2', parseInt(e.target.value) || 0)}
                          className="w-12 text-center font-display text-xl font-black text-neutral-900 outline-none bg-transparent tabular-nums"
                        />
                        <button
                          type="button"
                          onClick={() => updateScore(idx, 'team2', 21)}
                          className="text-[10px] font-mono font-bold text-blue-600 hover:underline"
                        >
                          设为21
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateScore(idx, 'team2', score.team2 + 1)}
                        className="w-9 h-9 flex items-center justify-center text-blue-600 bg-white rounded-lg border border-neutral-200 active:scale-95 transition-transform"
                        aria-label="2队加1分"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setScores([...scores, { team1: 21, team2: 18 }])}
                className="w-full py-3 bg-white border border-dashed border-neutral-300 rounded-2xl text-neutral-500 hover:text-red-600 hover:border-red-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus size={15} /> 添加下一局比分
              </button>
            </div>
          </div>

          {/* BO Format + Category Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 space-y-4 court-card-shadow">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-900 block">赛制规格 (影响统治力加成)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['BO1', 'BO3', 'BO5'] as const).map((fmt) => (
                  <button
                    type="button"
                    key={fmt}
                    onClick={() => setBoFormat(fmt)}
                    className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-colors ${
                      boFormat === fmt
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-neutral-900'
                    }`}
                  >
                    {fmt === 'BO1' ? 'BO1 一局定胜负' : fmt === 'BO3' ? 'BO3 三局两胜' : 'BO5 五局三胜'}
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Tag size={13} className="text-red-600" /> 比赛类别与 K 值倍率
                </label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                  {categories.map((cat) => {
                    const active = selectedCategoryId === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`shrink-0 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                          active
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200 hover:text-neutral-900'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                            active ? 'bg-white/20 text-white' : 'bg-white text-neutral-500'
                          }`}
                        >
                          x{cat.k_multiplier}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ELO Gap Verification Notice */}
          {requireEloGap && team1.length > 0 && team2.length > 0 && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                eloGap >= ELO_GAP_MIN
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              <Zap size={15} className="shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-black/5">
                  {teamElo.team1}
                </span>
                <span className="text-[10px] opacity-60">VS</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-black/5">
                  {teamElo.team2}
                </span>
                <span className="ml-1">
                  {eloGap >= ELO_GAP_MIN
                    ? `分差 ${eloGap} 分，满足挑战赛条件`
                    : `当前分差 ${eloGap} 分，挑战赛要求至少相差 ${ELO_GAP_MIN} 分`}
                </span>
              </div>
            </div>
          )}

          {/* Venue & Date */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 space-y-3 court-card-shadow">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-900 block">赛事或场馆备注</label>
              <div className="flex items-center gap-2.5 bg-neutral-50 rounded-xl border border-neutral-200 px-3.5 focus-within:border-red-600 focus-within:bg-white transition-colors">
                <Trophy size={16} className="text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder="例如：周末固定局 / 3号场地"
                  value={tournament}
                  onChange={(e) => setTournament(e.target.value)}
                  className="flex-1 py-3 outline-none text-sm font-bold text-neutral-900 placeholder:text-neutral-400 bg-transparent"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-900 block">比赛日期</label>
              <div className="flex items-center gap-2.5 bg-neutral-50 rounded-xl border border-neutral-200 px-3.5">
                <Calendar size={16} className="text-neutral-400 shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 py-3 outline-none text-sm font-bold text-neutral-900 min-w-0 bg-transparent"
                />
                <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-neutral-500 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shrink-0">
                  <Clock size={12} />
                  <span>{timeLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-white border-t border-neutral-200/80 shrink-0 space-y-2.5">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold">
              <AlertCircle size={15} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={team1.length === 0 || team2.length === 0 || isDuplicate}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-sm transition-[transform,background-color] active:scale-[0.98] disabled:opacity-45"
          >
            {isDuplicate
              ? '同一球友不可兼任双方队员'
              : isEditing
                ? '保存修改并重算 ELO'
                : '确认发布战绩'}
          </button>
        </div>

        {/* Player Selection Sub-Overlay */}
        {isChoosingPlayers && (
          <div className="absolute inset-0 bg-[#f5f5f5] z-[180] flex flex-col">
            <div
              className="bg-[#2d2d2e] pt-6 pb-4 px-6 text-white flex items-center justify-between shrink-0"
              style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
            >
              <button
                type="button"
                onClick={() => setIsChoosingPlayers(null)}
                className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <span className="font-bold text-sm">
                选择 {isChoosingPlayers === 'team1' ? '队伍 1' : '队伍 2'} 参赛球友 (最多2人)
              </span>
              <button
                type="button"
                onClick={() => setIsChoosingPlayers(null)}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs"
              >
                完成
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {players.map((p) => {
                const currentSideList = isChoosingPlayers === 'team1' ? team1 : team2;
                const otherSideList = isChoosingPlayers === 'team1' ? team2 : team1;
                const isSelected = currentSideList.includes(p.id);
                const isInOtherTeam = otherSideList.includes(p.id);

                return (
                  <button
                    type="button"
                    key={p.id}
                    disabled={isInOtherTeam}
                    onClick={() => {
                      const next = isSelected
                        ? currentSideList.filter((id) => id !== p.id)
                        : [...currentSideList, p.id].slice(0, 2);
                      if (isChoosingPlayers === 'team1') setTeam1(next);
                      else setTeam2(next);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                      isSelected
                        ? 'bg-red-50 border-red-500'
                        : isInOtherTeam
                          ? 'bg-neutral-100 border-transparent opacity-45 cursor-not-allowed'
                          : 'bg-white border-neutral-200/80 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center font-display font-bold text-sm text-neutral-600 border border-neutral-200 overflow-hidden">
                        {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : p.initials}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-neutral-900">{p.name}</p>
                        <p className="text-[11px] font-mono text-neutral-500">
                          ELO {p.elo_rating || 1500}
                          {isInOtherTeam ? ' · 已在对方阵容' : ''}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                        <Check size={14} />
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
