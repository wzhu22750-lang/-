import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, Camera, User, Upload } from 'lucide-react';
import { Player } from '../types';

interface AddPlayerModalProps {
  onClose: () => void;
  onAdd: (player: Player) => void;
  initialData?: Player;
}

export function AddPlayerModal({ onClose, onAdd, initialData }: AddPlayerModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [avatar, setAvatar] = useState<string | undefined>(initialData?.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片大小请控制在 2MB 以内');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: initialData?.id || Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      avatar: avatar,
      initials: name.trim().slice(0, 2).toUpperCase(),
      club_id: initialData?.club_id || '',
      elo_rating: initialData?.elo_rating,
    };

    onAdd(newPlayer);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[80] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-[28px] overflow-hidden court-elevated-shadow border border-[#dde2dc]"
      >
        <div className="bg-[#0c261e] court-grid-pattern px-6 py-5 text-white flex items-center justify-between border-b border-emerald-500/20">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">
              PLAYER PROFILE
            </span>
            <h2 className="text-lg font-extrabold">{initialData ? '编辑球友资料' : '注册新球友'}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full bg-[#f5f6f3] flex items-center justify-center overflow-hidden border-2 border-[#dde2dc] cursor-pointer group"
            >
              {avatar ? (
                <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="text-[#5b665f]" />
              )}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={22} className="text-white" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-[#0b6e4f] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <Upload size={14} /> {avatar ? '更换头像照片' : '上传头像照片'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#111814] block">球友姓名或昵称</label>
            <input
              autoFocus
              type="text"
              placeholder="输入球友称呼..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#f8faf7] border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white rounded-xl outline-none transition-colors font-bold text-base text-[#111814] placeholder:text-[#5b665f]/50"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-[#0b6e4f] hover:bg-[#095a40] text-white rounded-xl font-bold text-sm shadow-sm disabled:bg-[#dde2dc] disabled:text-[#5b665f] transition-[transform,background-color] active:scale-[0.98]"
          >
            {initialData ? '保存资料修改' : '确认加入球馆'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
