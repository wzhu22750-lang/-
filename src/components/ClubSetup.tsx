import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ArrowRight, ShieldCheck, AlertCircle, ChevronRight, History, Swords } from 'lucide-react';
import { createClub, joinClub } from '../lib/storage';
import { Club } from '../types';

// 管理员创建俱乐部的全局密钥
const ADMIN_CREATE_KEY = "856999";

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
    if (saved) setClubHistory(JSON.parse(saved));
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
    if (!name) return setError(`请输入${label}名称`);
    if (key !== ADMIN_CREATE_KEY) return setError('管理密钥错误，你没有权限创建');

    setIsLoading(true);
    const club = await createClub(name, clubMode);

    if (club && club.manager_token) {
      // 【关键】：如果是创建者，立即把这把“钥匙”存入本地
      saveManagerToken(club.id, club.manager_token);
      onComplete(club);
    } else {
      setError('创建失败，请重试');
    }
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode) return setError('请输入邀请码');
    setIsLoading(true);
    const club = await joinClub(inviteCode);
    if (club) {
      onComplete(club);
    } else {
      setError('邀请码无效或网络异常');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-6 text-white text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Trophy size={64} className="mx-auto mb-6 text-red-200" />
        <h1 className="text-3xl font-black mb-2 italic">世纪馆 H2H</h1>
        <p className="text-red-100 mb-8 opacity-80 font-bold uppercase tracking-tighter">Badminton Social Hub</p>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-black/20 rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </motion.div>
        )}

        {mode === 'root' && (
          <div className="space-y-6">
            {/* 快速进入历史俱乐部 */}
            {clubHistory.length > 0 && (
              <div className="bg-black/10 rounded-[32px] p-5 border border-white/5 shadow-inner">
                <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                   <History size={12} /> 快速进入我的俱乐部
                </p>
                <div className="space-y-2">
                  {clubHistory.map(club => (
                    <button
                      key={club.id}
                      onClick={() => onComplete(club)}
                      className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group border border-transparent hover:border-white/20"
                    >
                      <div className="flex items-center gap-3">
                        {club.mode === 'tournament'
                          ? <Swords size={20} className="text-amber-300" />
                          : <Users size={20} className="text-red-200" />
                        }
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm">{club.name}</p>
                            {club.mode === 'tournament' && (
                              <span className="text-[9px] font-black bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded">比赛</span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono opacity-50">CODE: {club.invite_code}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setMode('join')}
              className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              加入现有俱乐部 <Users size={20} />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setClubMode('club'); setMode('create'); }}
                className="py-4 bg-red-500 text-white border-2 border-red-400 rounded-2xl font-black text-sm active:scale-95 transition-all flex flex-col items-center gap-1"
              >
                <Users size={20} />
                创建俱乐部
              </button>
              <button
                onClick={() => { setClubMode('tournament'); setMode('create'); }}
                className="py-4 bg-amber-500 text-white border-2 border-amber-400 rounded-2xl font-black text-sm active:scale-95 transition-all flex flex-col items-center gap-1"
              >
                <Swords size={20} />
                创建比赛
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`backdrop-blur-md p-8 rounded-[32px] border ${clubMode === 'tournament' ? 'bg-amber-500/20 border-amber-300/30' : 'bg-white/10 border-white/20'}`}>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-red-200 uppercase text-left block pl-2">{clubMode === 'tournament' ? '比赛名称' : '俱乐部名称'}</label>
                <input className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none font-black text-lg shadow-inner" placeholder={clubMode === 'tournament' ? '例如：2026春季选拔赛' : '例如：世纪馆羽球社'} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-red-200 uppercase text-left block pl-2">管理创建密钥</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={20} />
                  <input type="password" className="w-full bg-white text-neutral-900 pl-12 pr-6 py-4 rounded-2xl outline-none font-black text-lg shadow-inner" placeholder="输入创建权限码" value={key} onChange={(e) => setKey(e.target.value)} />
                </div>
              </div>
              <button onClick={handleCreate} disabled={isLoading} className={`w-full py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all ${clubMode === 'tournament' ? 'bg-amber-400 text-white' : 'bg-white text-red-600'}`}>
                {isLoading ? '正在建立连接...' : (clubMode === 'tournament' ? '立即创建比赛' : '立即开启俱乐部')} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => { setMode('root'); setError(''); }} className="mt-6 text-xs text-red-200 opacity-60 font-bold uppercase tracking-widest">返回主菜单</button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[32px] border border-white/20">
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-red-200 uppercase text-center block">输入6位邀请码</label>
                <input className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none text-center font-black text-2xl uppercase tracking-widest shadow-inner" placeholder="X7Y2Z9" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} />
              </div>
              <button onClick={handleJoin} disabled={isLoading} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                {isLoading ? '正在核对密钥...' : '立即进入'} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => { setMode('root'); setError(''); }} className="mt-6 text-xs text-red-200 opacity-60 font-bold uppercase tracking-widest">返回主菜单</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
