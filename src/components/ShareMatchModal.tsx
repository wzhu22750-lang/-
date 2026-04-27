import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng } from 'html-to-image';
import { X, Loader2, Info } from 'lucide-react';
import { Match, Player } from '../types';

interface ShareMatchModalProps {
  match: Match;
  players: Player[];
  clubName: string;
  inviteCode: string;
  onClose: () => void;
}

export function ShareMatchModal({ match, players, clubName, inviteCode, onClose }: ShareMatchModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'rendering' | 'ready'>('rendering');

  const getPlayer = (id: string) => players.find(p => p.id === id);
  const t1Won = match.scores.filter(s => s.team1 > s.team2).length > match.scores.filter(s => s.team2 > s.team1).length;

  useEffect(() => {
    const generate = async () => {
      if (cardRef.current) {
        try {
          // 关键点 1：增加延时，确保远程头像图片加载完成
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // 关键点 2：优化生成参数，pixelRatio 2 在手机端最稳定
          const dataUrl = await toPng(cardRef.current, { 
            cacheBust: true, 
            pixelRatio: 2, 
            backgroundColor: '#dc2626',
            style: {
              opacity: '1',
              transform: 'scale(1)',
            }
          });
          setFinalImage(dataUrl);
          setStatus('ready');
        } catch (err) {
          console.error('生成战报失败:', err);
          setStatus('ready'); // 即使失败也停止加载动画
        }
      }
    };
    generate();
  }, [match]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[150] flex flex-col items-center overflow-y-auto pt-12 pb-12 px-6"
    >
      {/* 顶部控制栏 */}
      <div className="fixed top-6 right-6 z-[160]">
        <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white shadow-lg active:scale-90 transition-transform">
          <X size={24} />
        </button>
      </div>

      {/* 渲染提示 */}
      <AnimatePresence>
        {status === 'rendering' && (
          <motion.div exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-20">
            <Loader2 className="text-red-500 animate-spin" size={40} />
            <p className="text-white/60 font-bold text-sm">正在雕琢你的战报...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 关键点 3：隐藏的渲染源，使用 fixed + opacity-0 避免 iOS 渲染失效 */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none h-0 overflow-hidden">
       <div ref={cardRef} className="w-[360px] bg-[#dc2626] p-8 relative flex flex-col">
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full border-[20px] border-white/5" />
          <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-white/10 rounded-full border-[20px] border-white/5" />
          
          <div className="relative z-10 text-white">
            <div className="text-center mb-10">
              <div className="inline-block px-4 py-1 bg-black/20 rounded-full text-[10px] font-black tracking-[0.2em] mb-4">BATTLE REPORT</div>
              <h2 className="text-2xl font-black italic uppercase">{match.tournament || '练习赛'}</h2>
              <p className="text-white/60 text-xs mt-1 font-bold">{new Date(match.date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="space-y-8 mb-10">
              <div className={`flex items-center gap-4 ${t1Won ? '' : 'opacity-60'}`}>
                <div className="flex -space-x-3">
                  {match.team1.map(id => (
                    <div key={id} className="w-14 h-14 rounded-full border-2 border-red-600 bg-white overflow-hidden shadow-xl">
                      {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-red-600 font-black text-lg">{getPlayer(id)?.initials}</div>}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="font-black text-xl leading-tight mb-1">{match.team1.map(id => getPlayer(id)?.name).join(' / ')}</p>
                  {t1Won && <span className="text-[10px] bg-yellow-400 text-red-700 px-2 py-0.5 rounded-full font-black">WINNER</span>}
                </div>
                <div className="text-4xl font-black italic">{match.scores.filter(s => s.team1 > s.team2).length}</div>
              </div>

              <div className="flex items-center gap-4 justify-center opacity-30"><div className="h-px flex-1 bg-white" /><span className="text-xs font-black italic">VS</span><div className="h-px flex-1 bg-white" /></div>

              <div className={`flex items-center gap-4 ${!t1Won ? '' : 'opacity-60'}`}>
                <div className="flex -space-x-3">
                  {match.team2.map(id => (
                    <div key={id} className="w-14 h-14 rounded-full border-2 border-red-600 bg-white overflow-hidden shadow-xl">
                      {getPlayer(id)?.avatar ? <img src={getPlayer(id)?.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-red-600 font-black text-lg">{getPlayer(id)?.initials}</div>}
                    </div>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="font-black text-xl leading-tight mb-1">{match.team2.map(id => getPlayer(id)?.name).join(' / ')}</p>
                  {!t1Won && <span className="text-[10px] bg-yellow-400 text-red-700 px-2 py-0.5 rounded-full font-black">WINNER</span>}
                </div>
                <div className="text-4xl font-black italic">{match.scores.filter(s => s.team2 > s.team1).length}</div>
              </div>
            </div>

            <div className="bg-black/10 rounded-2xl p-4 mb-10 flex justify-center gap-8">
              {match.scores.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-[8px] font-black text-white/40 mb-1">SET {i+1}</div>
                  <div className="font-black text-xl">{s.team1}:{s.team2}</div>
                </div>
              ))}
            </div>

            <div className="flex items-end justify-between border-t border-white/20 pt-6">
              <div><p className="text-[10px] font-black text-white/50 uppercase">Club</p><p className="font-bold text-sm">{clubName}</p></div>
              <div className="text-right"><p className="text-[10px] font-black text-white/50 uppercase">Invite Code</p><p className="font-mono font-bold text-sm">{inviteCode}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* 最终显示的图片 */}
      {finalImage && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
          <img 
            src={finalImage} 
            className="w-full max-w-[360px] rounded-3xl shadow-2xl border-4 border-white/10" 
            alt="战报" 
          />
          <div className="mt-8 flex flex-col items-center gap-3">
             <div className="flex items-center gap-2 text-yellow-400 font-bold bg-yellow-400/10 px-4 py-2 rounded-full">
                <Info size={16} />
                <span>长按上方图片保存到相册</span>
             </div>
             <p className="text-white/40 text-xs">保存后即可分享到微信群</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
