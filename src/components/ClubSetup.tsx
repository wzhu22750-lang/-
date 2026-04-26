import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ArrowRight, ShieldCheck, AlertCircle, ChevronRight, History } from 'lucide-react';
import { createClub, joinClub } from '../lib/storage';
import { Club } from '../types';

const ADMIN_CREATE_KEY = "888888"; 

export function ClubSetup({ onComplete }: { onComplete: (club: Club) => void }) {
  const [mode, setMode] = useState<'root' | 'create' | 'join'>('root');
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 历史记录
  const [clubHistory, setClubHistory] = useState<Club[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('h2h_club_history');
    if (saved) setClubHistory(JSON.parse(saved));
  }, []);

  const handleCreate = async () => {
    if (!name) return setError('请输入俱乐部名称');
    if (key !== ADMIN_CREATE_KEY) return setError('管理密钥错误');
    setIsLoading(true);
    const club = await createClub(name);
    if (club) onComplete(club);
    else setError('创建失败');
    setIsLoading(false);
  };

  const handleJoin = async () => {
    if (!inviteCode) return setError('请输入邀请码');
    setIsLoading(true);
    const club = await joinClub(inviteCode);
    if (club) onComplete(club);
    else setError('邀请码无效');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-6 text-white text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Trophy size={64} className="mx-auto mb-6 text-red-200" />
        <h1 className="text-3xl font-black mb-2 italic">世纪馆 H2H</h1>
        <p className="text-red-100 mb-8 opacity-80 font-bold uppercase tracking-tighter">Badminton Social Club</p>

        {error && <div className="mb-6 p-4 bg-black/20 rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-2"><AlertCircle size={14}/>{error}</div>}

        {mode === 'root' && (
          <div className="space-y-6">
            {/* 历史俱乐部记忆 */}
            {clubHistory.length > 0 && (
              <div className="bg-black/10 rounded-[32px] p-5 border border-white/5">
                <p className="text-[10px] font-black text-red-200 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                  <History size={12} /> 快速进入
                </p>
                <div className="space-y-2">
                  {clubHistory.map(club => (
                    <button 
                      key={club.id}
                      onClick={() => onComplete(club)}
                      className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-between transition-all group border border-transparent hover:border-white/20"
                    >
                      <div className="text-left">
                        <p className="font-black text-sm">{club.name}</p>
                        <p className="text-[10px] font-mono opacity-50">CODE: {club.invite_code}</p>
                      </div>
                      <ChevronRight size={18} className="text-red-300 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => setMode('join')} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
                加入俱乐部 <Users size={20} />
              </button>
              <button onClick={() => setMode('create')} className="w-full py-4 bg-red-500 text-white border-2 border-red-400 rounded-2xl font-black text-sm">
                创建新俱乐部
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[40px] border border-white/20">
            <div className="space-y-5">
              <input className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none font-black text-lg" placeholder="俱乐部名称" value={name} onChange={(e) => setName(e.target.value)} />
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={20} />
                <input type="password" className="w-full bg-white text-neutral-900 pl-12 pr-6 py-4 rounded-2xl outline-none font-black text-lg" placeholder="管理员密钥" value={key} onChange={(e) => setKey(e.target.value)} />
              </div>
              <button onClick={handleCreate} disabled={isLoading} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? '正在创建...' : '立即开启'} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => setMode('root')} className="mt-6 text-xs text-red-200 opacity-60">返回</button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[40px] border border-white/20">
            <div className="space-y-5">
              <input className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none text-center font-black text-2xl uppercase" placeholder="邀请码" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} maxLength={6} />
              <button onClick={handleJoin} disabled={isLoading} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                {isLoading ? '正在验证...' : '进入'} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => setMode('root')} className="mt-6 text-xs text-red-200 opacity-60">返回</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
