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
    const label = clubMode === 'tournament' ? '比赛' : '俱乐部';
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
    <div className="min-h-screen bg-gradient-to-b from-red-600 via-red-600 to-red-700 flex flex-col justify-between p-4 sm:p-8 text-white">
      <div className="w-full max-w-md mx-auto my-auto py-4">
        {/* Top Brand Masthead Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[28px] bg-black/15 text-white p-7 mb-5 border border-white/15"
        >
          {/* Subtle Badminton Court Geometry SVG */}
          <svg
            className="absolute right-0 top-0 h-full w-48 text-white/[0.08] pointer-events-none"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-red-100 text-[11px] font-bold tracking-wider uppercase mb-4">
              <Sparkles size={12} />
              <span>Badminton Social Hub</span>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                  世纪馆 H2H
                </h1>
                <p className="text-red-100/85 text-xs font-medium mt-2 leading-relaxed">
                  羽毛球俱乐部交手档案 · ELO 实时天梯 · 赛况战报
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 text-white">
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
              className="mb-4 p-3.5 bg-black/25 rounded-2xl text-xs font-bold text-white border border-white/15 flex items-center gap-2.5"
            >
              <AlertCircle size={16} className="shrink-0 text-red-200" />
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
                <div className="bg-black/15 rounded-[26px] p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-xs font-extrabold text-red-100 flex items-center gap-2">
                      <History size={14} className="text-red-200" />
                      快速进入我的俱乐部
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-red-200/80">
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
                          className="w-full bg-white/10 hover:bg-white/20 active:scale-[0.99] p-3.5 rounded-2xl flex items-center justify-between transition-[transform,background-color,border-color] duration-150 group border border-white/10 hover:border-white/25 text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isTourney
                                  ? 'bg-amber-400/20 text-amber-300 border border-amber-300/30'
                                  : 'bg-white/15 text-white border border-white/20'
                              }`}
                            >
                              {isTourney ? <Swords size={18} /> : <Users size={18} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-sm text-white truncate">{club.name}</p>
                                {isTourney && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 bg-amber-400 text-amber-950">
                                    比赛
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-red-100/70 mt-0.5">
                                CODE: <span className="font-semibold text-white">{club.invite_code}</span>
                              </p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-red-100 group-hover:text-white group-hover:translate-x-0.5 transition-[color,transform] shrink-0">
                            <ChevronRight size={16} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Primary Join & Create Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setError('');
                    setMode('join');
                  }}
                  className="w-full py-4 px-5 bg-white hover:bg-red-50 text-red-600 rounded-2xl font-black text-sm shadow-xl flex items-center justify-between active:scale-[0.98] transition-[transform,background-color] duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <KeyRound size={18} />
                    <span>加入现有俱乐部</span>
                  </span>
                  <ArrowRight size={18} />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setClubMode('club');
                      setError('');
                      setMode('create');
                    }}
                    className="p-4 bg-red-500/80 hover:bg-red-500 text-white border border-red-400/60 rounded-2xl font-bold text-xs active:scale-[0.98] transition-[transform,background-color] duration-150 flex items-center gap-2.5 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">创建俱乐部</p>
                      <p className="text-[10px] text-red-100/80 font-medium mt-0.5">日常天梯积分</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setClubMode('tournament');
                      setError('');
                      setMode('create');
                    }}
                    className="p-4 bg-amber-500 hover:bg-amber-600 text-white border border-amber-400 rounded-2xl font-bold text-xs active:scale-[0.98] transition-[transform,background-color] duration-150 flex items-center gap-2.5 text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                      <Swords size={18} />
                    </div>
                    <div>
                      <p className="font-black text-white text-sm">创建比赛</p>
                      <p className="text-[10px] text-amber-100 font-medium mt-0.5">净胜分差加权</p>
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
              className="bg-white p-6 rounded-[28px] text-neutral-900 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      clubMode === 'tournament'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {clubMode === 'tournament' ? <Swords size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-neutral-900">
                      {clubMode === 'tournament' ? '新建羽毛球比赛' : '新建羽毛球俱乐部'}
                    </h2>
                    <p className="text-[11px] text-neutral-500">
                      {clubMode === 'tournament' ? '比赛模式：按小分净胜分差动态加权' : '俱乐部模式：支持多赛事分类与连胜追踪'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMode('root');
                    setError('');
                  }}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="返回"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">
                    {clubMode === 'tournament' ? '比赛名称' : '俱乐部名称'}
                  </label>
                  <input
                    className="w-full bg-neutral-50 text-neutral-900 px-4 py-3.5 rounded-xl border border-neutral-200 focus:border-red-500 focus:bg-white outline-none font-bold text-base transition-colors placeholder:text-neutral-400"
                    placeholder={clubMode === 'tournament' ? '例如：2026春季选拔赛' : '例如：世纪馆羽球社'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">管理创建密钥</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                      type="password"
                      className="w-full bg-neutral-50 text-neutral-900 pl-10 pr-4 py-3.5 rounded-xl border border-neutral-200 focus:border-red-500 focus:bg-white outline-none font-bold text-base transition-colors placeholder:text-neutral-400"
                      placeholder="输入创建权限码"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-[transform,background-color] duration-150 ${
                    clubMode === 'tournament'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                  }`}
                >
                  <span>{isLoading ? '正在建立连接...' : clubMode === 'tournament' ? '立即创建比赛' : '立即开启俱乐部'}</span>
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
              className="bg-white p-6 rounded-[28px] text-neutral-900 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                <div>
                  <h2 className="font-extrabold text-base text-neutral-900">输入 6 位邀请码</h2>
                  <p className="text-[11px] text-neutral-500">向俱乐部管理员获取 6 位邀请代码</p>
                </div>
                <button
                  onClick={() => {
                    setMode('root');
                    setError('');
                  }}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
                  aria-label="返回"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700 block">俱乐部邀请码</label>
                  <input
                    autoFocus
                    className="w-full bg-neutral-50 text-neutral-900 px-4 py-4 rounded-xl border border-neutral-200 focus:border-red-500 focus:bg-white outline-none text-center font-mono font-black text-2xl uppercase tracking-[0.35em] transition-colors placeholder:text-neutral-300"
                    placeholder="X7Y2Z9"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm shadow-lg shadow-red-100 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-[transform,background-color] duration-150"
                >
                  <span>{isLoading ? '正在核对密钥...' : '立即进入'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="text-center py-3 text-[11px] text-red-100/70 font-medium">
        世纪馆 H2H · 单双打战绩与 ELO 积分实时同步
      </footer>
    </div>
  );
}
