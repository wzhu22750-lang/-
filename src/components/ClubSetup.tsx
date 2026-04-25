import { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, ArrowRight } from 'lucide-react';
import { createClub, joinClub } from '../lib/storage';
import { Club } from '../types';

export function ClubSetup({ onComplete }: { onComplete: (club: Club) => void }) {
  const [mode, setMode] = useState<'root' | 'create' | 'join'>('root');
  const [inputValue, setInputValue] = useState('');

  const handleCreate = async () => {
    if (!inputValue) return;
    const club = await createClub(inputValue);
    if (club) onComplete(club);
  };

  const handleJoin = async () => {
    if (!inputValue) return;
    const club = await joinClub(inputValue);
    if (club) onComplete(club);
  };

  return (
    <div className="min-h-screen bg-red-600 flex items-center justify-center p-6 text-white text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Trophy size={64} className="mx-auto mb-6 text-red-200" />
        <h1 className="text-3xl font-black mb-2">羽球 H2H 俱乐部</h1>
        <p className="text-red-100 mb-10 opacity-80">记录每一次交手，见证强者诞生</p>

        {mode === 'root' && (
          <div className="space-y-4">
            <button onClick={() => setMode('join')} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
              加入现有俱乐部 <Users size={20} />
            </button>
            <button onClick={() => setMode('create')} className="w-full py-4 bg-red-500 text-white border-2 border-red-400 rounded-2xl font-black">
              创建新俱乐部
            </button>
          </div>
        )}

        {mode !== 'root' && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white/10 backdrop-blur-md p-8 rounded-[32px] border border-white/20">
            <h2 className="text-xl font-bold mb-6">{mode === 'create' ? '给俱乐部起个名字' : '输入邀请码'}</h2>
            <input
              autoFocus
              className="w-full bg-white text-neutral-900 px-6 py-4 rounded-2xl outline-none text-center font-bold text-xl mb-4 placeholder:text-neutral-300"
              placeholder={mode === 'create' ? "例如：世纪馆羽球社" : "6位邀请码"}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button onClick={mode === 'create' ? handleCreate : handleJoin} className="w-full py-4 bg-white text-red-600 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2">
              确定并进入 <ArrowRight size={20} />
            </button>
            <button onClick={() => setMode('root')} className="mt-4 text-sm text-red-200 opacity-60">返回</button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
