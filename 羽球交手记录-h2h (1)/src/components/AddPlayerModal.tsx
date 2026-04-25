
import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import { motion } from 'motion/react';
import { X, Camera, User, Upload } from 'lucide-react';
import { Player } from '../types';

interface AddPlayerModalProps {
  onClose: () => void;
  onAdd: (player: Player) => void;
}

export function AddPlayerModal({ onClose, onAdd }: AddPlayerModalProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('图片太大了，请选择 2MB 以下的图片');
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
      id: Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      avatar: avatar,
      initials: name.trim().slice(0, 2).toUpperCase(),
    };

    onAdd(newPlayer);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="bg-red-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-xl font-bold">新增球员</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-4 border-neutral-50 cursor-pointer group shadow-inner"
            >
              {avatar ? (
                <img src={avatar} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-neutral-300" />
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-bold text-red-600 flex items-center gap-2"
            >
              <Upload size={16} /> 上传头像
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-xs font-black text-neutral-400 uppercase tracking-widest pl-1">球员姓名</label>
            <input
              autoFocus
              type="text"
              placeholder="输入球员姓名..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-4 bg-neutral-50 border border-neutral-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all font-bold text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-100 disabled:bg-neutral-200 disabled:shadow-none transition-all active:scale-[0.98]"
          >
            完成创建
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
