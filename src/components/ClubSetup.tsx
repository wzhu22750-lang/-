import { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClub, joinClub } from '../lib/storage';
import { Club } from '../types';

// 你可以在这里修改你的专属创建密钥
const ADMIN_CREATE_KEY = "856999"; 

export function ClubSetup({ onComplete }: { onComplete: (club: Club) => void }) {
  const [mode, setMode] = useState<'root' | 'create' | 'join'>('root');
  const [name, setName] = useState('');
  const [key, setKey] = useState(''); // 管理员密钥
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name) return setError('请输入俱乐部名称');
    if (key !== ADMIN_CREATE_KEY) return setError('管理密钥错误，无权创建');
    
    setIsLoading(true);
    setError('');
    try {
      const club = await createClub(name);
      if (club) {
        onComplete(club);
      } else {
        setError('创建失败，请检查数据库配置');
      }
    } catch (err) {
      setError('网络错误或数据库异常');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) return setError('请输入邀请码');
    setIsLoading(true);
    setError('');
    try {
      const club = await joinClub(inviteCode);
      if (club) {
        onComplete(club);
      } else {
        setError('邀请码不存在或已过期');
      }
    } catch (err) {
      setError('加入失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-6 text-white text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Trophy size={64} className="mx-auto mb-6 text-red-200" />
        <h1 className="text-3xl font-black mb-2">羽球 H2H 俱乐部</h1>
        <p className="text-red-100 mb-10 opacity-80">记录每一次交手，见证强者诞生</p>

        {error && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 p-4 bg-black/20 backdrop-blur-md rounded-2xl flex items-center gap-3 text-sm border border-white/10">
            <AlertCircle size={18} className="shrink-0 text-yellow-400" />
            <p className="text-left font-bold">{error}</p>
          </motion.div>
        )}

        {mode === 'root' && (
          <div className="space-y-4">
            <button onClick={() => setMode('join')} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
              加入现有俱乐部 <Users size={20} />
            </button>
            <button onClick={() => setMode('create')} className="w-full py-4 bg-red-500 text-white border-2 border-red-400 rounded-2xl font-black active:scale-95 transition-transform">
              创建新俱乐部 (需权限)
            </button>
          </div>
        )}

        {mode === 'create' && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[32px] border border-white/20">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-red-200 uppercase tracking-widest block mb-2 text-left pl-1">俱乐部名称</label>
                <input
                  autoFocus
                  className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none font-bold text-lg placeholder:text-neutral-300"
                  placeholder="例如：世纪馆羽球社"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-red-200 uppercase tracking-widest block mb-2 text-left pl-1">管理密钥 (只有你能创建)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" size={20} />
                  <input
                    type="password"
                    className="w-full bg-white text-neutral-900 pl-12 pr-6 py-4 rounded-2xl outline-none font-bold text-lg placeholder:text-neutral-300"
                    placeholder="输入 6 位密钥"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>
              </div>
              <button 
                disabled={isLoading}
                onClick={handleCreate} 
                className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? '正在创建...' : '完成并进入'} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => {setMode('root'); setError('');}} className="mt-6 text-sm text-red-200 opacity-60">返回主菜单</button>
          </motion.div>
        )}

        {mode === 'join' && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[32px] border border-white/20">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-red-200 uppercase tracking-widest block mb-2 text-left pl-1">输入邀请码</label>
                <input
                  autoFocus
                  className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none text-center font-black text-2xl tracking-widest placeholder:text-neutral-300 uppercase"
                  placeholder="例如：X7Y2Z9"
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
              </div>
              <button 
                disabled={isLoading}
                onClick={handleJoin} 
                className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                {isLoading ? '正在验证...' : '进入俱乐部'} <ArrowRight size={20} />
              </button>
            </div>
            <button onClick={() => {setMode('root'); setError('');}} className="mt-6 text-sm text-red-200 opacity-60">返回主菜单</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
