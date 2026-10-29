import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Users,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  History,
  Swords,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { createClub, joinClub } from '../lib/storage';
import { Club } from '../types';

// 管理员创建俱乐部的全局密钥
const ADMIN_CREATE_KEY = '856999';

export function ClubSetup({ onComplete }: { onComplete: (club: Club) => void }) {
  const [mode, setMode] = useState<'root' | 'create' | 'join'>('root');
  const [clubMode, setClubMode] = useState<'club' | 'tournament'>('club');
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 历史记录状态
  const [clubHistory, setClubHistory] = useState<Club[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('h2h_club_history');
    if (saved) {
      try {
        setClubHistory(JSON.parse(saved));
      } catch {
        setClubHistory([]);
      }
    }
  }, []);

  // 核心逻辑：保存管理令牌
  const saveManagerToken = (clubId: string, token: string) => {
    const savedTokens = localStorage.getItem('h2h_manager_tokens');
    const tokens = savedTokens ? JSON.parse(savedTokens) : {};
    tokens[clubId] = token;
    localStorage.setItem('h2h_manager_tokens', JSON.stringify(tokens));
  };

  const handleCreate = async () => {
    const label = clubMode === 'tournament' ? '赛事' : '俱乐部';
    if (!name.trim()) return setError(`请输入${label}名称`);
    if (key !== ADMIN_CREATE_KEY) return setError('管理密钥校验未通过，请确认创建权限');

    setIsLoading(true);
    setError('');
    const club = await createClub(name.trim(), clubMode);

    if (club) {
      if (club.manager_token) {
        saveManagerToken(club.id, club.manager_token);
      }
      onComplete(club);
    } else {
      setError('创建失败，请检查网络或配置后重试');
    }
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return setError('请输入 6 位俱乐部邀请码');
    setIsLoading(true);
    setError('');
    const club = await joinClub(inviteCode.trim());
    if (club) {
      onComplete(club);
    } else {
      setError('未找到对应邀请码，请核对后重试');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f3] court-light-grid flex flex-col justify-between p-4 sm:p-8 text-[#111814]">
      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Top Editorial Masthead Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[28px] bg-[#0c261e] text-white p-7 mb-5 court-elevated-shadow border border-emerald-900/40"
        >
          {/* Subtle Badminton Court Geometry SVG */}
          <svg
            className="absolute right-0 top-0 h-full w-48 text-emerald-400/[0.07] pointer-events-none"
            viewBox="0 0 200 260"
            fill="none"
          >
            <rect x="20" y="16" width="160" height="228" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="130" x2="180" y2="130" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="20" y1="86" x2="180" y2="86" stroke="currentColor" strokeWidth="1.5" />
            <line x1="20" y1="174" x2="180" y2="174" stroke="currentColor" strokeWidth="1.5" />
            <line x1="100" y1="16" x2="100" y2="86" stroke="currentColor" strokeWidth="1.5" />
            <line x1="100" y1="174" x2="100" y2="244" stroke="currentColor" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-[11px] font-bold tracking-wider uppercase mb-4">
              <Sparkles size={12} />
              <span>Badminton Matchday Ledger</span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                  世纪馆 H2H
                </h1>
                <p className="text-emerald-100/70 text-xs font-medium mt-2 leading-relaxed">
                  羽毛球俱乐部交手档案 · ELO 实时天梯 · 赛况战报
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                <Trophy size={24} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3.5 bg-rose-50 rounded-2xl text-xs font-bold text-rose-700 border border-rose-200 flex items-center gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Switcher */}
        <AnimatePresence mode="wait">
          {mode === 'root' && (
            <motion.div
              key="root"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Saved Club Passes */}
              {clubHistory.length > 0 && (
                <div className="bg-white rounded-[24px] p-5 border border-[#dde2dc] court-card-shadow">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-extrabold text-[#111814] flex items-center gap-2">
                      <History size={14} className="text-[#0b6e4f]" />
                      常驻球馆通行证
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-[#5b665f]">
                      {clubHistory.length} 个记录
                    </span>
                  </div>

                  <div className="space-y-2">
                    {clubHistory.map((club) => {
                      const isTourney = club.mode === 'tournament';
                      return (
                        <button
                          key={club.id}
                          onClick={() => onComplete(club)}
                          className="w-full bg-[#f8faf7] hover:bg-[#edf3ef] active:scale-[0.99] p-3.5 rounded-2xl flex items-center justify-between transition-[transform,background-color,border-color] duration-150 group border border-[#e3e8e2] hover:border-[#0b6e4f]/40 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isTourney
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-100/80 text-[#0b6e4f] border border-emerald-200'
                              }`}
                            >
                              {isTourney ? <Swords size={18} /> : <Users size={18} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-[#111814] truncate">{club.name}</p>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                    isTourney
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100/70 text-[#0b6e4f]'
                                  }`}
                                >
                                  {isTourney ? '锦标赛' : '俱乐部'}
                                </span>
                              </div>
                              <p className="text-[11px] font-mono text-[#5b665f] mt-0.5">
                                PASS CODE: <span className="font-semibold text-[#111814]">{club.invite_code}</span>
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white border border-[#dde2dc] flex items-center justify-center text-[#5b665f] group-hover:text-[#0b6e4f] group-hover:border-[#0b6e4f]/40 transition-[color,border-color] shrink-0">
                            <ChevronRight size={16} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary Join Action */}
              <div className="bg-white rounded-[24px] p-5 border border-[#dde2dc] court-card-shadow space-y-3">
                <button
                  onClick={() => {
                    setError('');
                    setMode('join');
                  }}
                  className="w-full py-4 px-5 bg-[#0b6e4f] hover:bg-[#095a40] text-white rounded-2xl font-bold text-sm shadow-sm flex items-center justify-between active:scale-[0.98] transition-[transform,background-color] duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <KeyRound size={18} />
                    <span>凭邀请码进入球馆</span>
                  </span>
                  <ArrowRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => {
                      setClubMode('club');
                      setError('');
                      setMode('create');
                    }}
                    className="p-3.5 bg-[#f5f6f3] hover:bg-[#ebeee9] text-[#111814] border border-[#dde2dc] rounded-2xl font-bold text-xs active:scale-[0.98] transition-[transform,background-color] duration-150 flex items-center gap-2.5 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#0b6e4f] flex items-center justify-center shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-[#111814]">创建俱乐部</p>
                      <p className="text-[10px] text-[#5b665f] font-medium mt-0.5">日常天梯积分</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setClubMode('tournament');
                      setError('');
                      setMode('create');
                    }}
                    className="p-3.5 bg-[#f5f6f3] hover:bg-[#ebeee9] text-[#111814] border border-[#dde2dc] rounded-2xl font-bold text-xs active:scale-[0.98] transition-[transform,background-color] duration-150 flex items-center gap-2.5 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Swords size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-[#111814]">创建锦标赛</p>
                      <p className="text-[10px] text-[#5b665f] font-medium mt-0.5">净胜分差加权</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-[24px] border border-[#dde2dc] court-card-shadow space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#edf0eb] pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      clubMode === 'tournament'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-[#0b6e4f]'
                    }`}
                  >
                    {clubMode === 'tournament' ? <Swords size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-[#111814]">
                      {clubMode === 'tournament' ? '新建羽毛球赛事' : '新建羽毛球俱乐部'}
                    </h2>
                    <p className="text-[11px] text-[#5b665f]">
                      {clubMode === 'tournament' ? '比赛模式：按小分净胜分差动态加权' : '俱乐部模式：支持多赛事分类与连胜追踪'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMode('root');
                    setError('');
                  }}
                  className="p-2 rounded-xl text-[#5b665f] hover:text-[#111814] hover:bg-[#f5f6f3] transition-colors"
                  aria-label="返回"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111814] block">
                    {clubMode === 'tournament' ? '赛事名称' : '俱乐部名称'}
                  </label>
                  <input
                    className="w-full bg-[#f8faf7] text-[#111814] px-4 py-3.5 rounded-xl border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white outline-none font-bold text-base transition-colors placeholder:text-[#5b665f]/50"
                    placeholder={clubMode === 'tournament' ? '例如：2026 春季羽球公开赛' : '例如：世纪馆羽球社'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111814] block">管理员创建密钥</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5b665f]" size={18} />
                    <input
                      type="password"
                      className="w-full bg-[#f8faf7] text-[#111814] pl-10 pr-4 py-3.5 rounded-xl border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white outline-none font-bold text-base transition-colors placeholder:text-[#5b665f]/50"
                      placeholder="输入管理授权码"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-bold text-sm text-white shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-[transform,background-color] duration-150 ${
                    clubMode === 'tournament'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#0b6e4f] hover:bg-[#095a40]'
                  }`}
                >
                  <span>{isLoading ? '正在初始化场馆...' : clubMode === 'tournament' ? '立即开启赛事' : '立即创建俱乐部'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-[24px] border border-[#dde2dc] court-card-shadow space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#edf0eb] pb-4">
                <div>
                  <h2 className="font-bold text-base text-[#111814]">输入通行邀请码</h2>
                  <p className="text-[11px] text-[#5b665f]">向球馆管理员获取 6 位字母或数字代码</p>
                </div>
                <button
                  onClick={() => {
                    setMode('root');
                    setError('');
                  }}
                  className="p-2 rounded-xl text-[#5b665f] hover:text-[#111814] hover:bg-[#f5f6f3] transition-colors"
                  aria-label="返回"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#111814] block">6 位球馆邀请码</label>
                  <input
                    autoFocus
                    className="w-full bg-[#f8faf7] text-[#111814] px-4 py-4 rounded-xl border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white outline-none text-center font-mono font-bold text-2xl uppercase tracking-[0.35em] transition-colors placeholder:text-[#5b665f]/35"
                    placeholder="X7Y2Z9"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="w-full py-4 bg-[#0b6e4f] hover:bg-[#095a40] text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-[transform,background-color] duration-150"
                >
                  <span>{isLoading ? '正在核验通行码...' : '确认进入球馆'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="text-center py-3 text-[11px] text-[#5b665f] font-medium">
        BWF Standard ELO Engine · 单双打战绩实时同步
      </footer>
    </div>
  );
}
