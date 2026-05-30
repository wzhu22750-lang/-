import { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { MatchCategory } from '../types';

interface CategoryManageModalProps {
  onClose: () => void;
  categories: MatchCategory[];
  clubId: string;
  onSave: (category: MatchCategory) => void;
  onDelete: (id: string) => void;
}

export function CategoryManageModal({ onClose, categories, clubId, onSave, onDelete }: CategoryManageModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMultiplier, setFormMultiplier] = useState('1.0');
  const [formRequireGap, setFormRequireGap] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormName('');
    setFormMultiplier('1.0');
    setFormRequireGap(false);
  };

  const handleSave = () => {
    const name = formName.trim();
    const mult = parseFloat(formMultiplier);
    if (!name || isNaN(mult) || mult <= 0) return;

    const category: MatchCategory = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      club_id: clubId,
      name,
      k_multiplier: mult,
      require_elo_gap: formRequireGap,
      sort_order: editingId
        ? (categories.find(c => c.id === editingId)?.sort_order ?? categories.length)
        : categories.length,
    };
    onSave(category);
    resetForm();
  };

  const startEdit = (cat: MatchCategory) => {
    setEditingId(cat.id);
    setIsAdding(false);
    setFormName(cat.name);
    setFormMultiplier(String(cat.k_multiplier));
    setFormRequireGap(cat.require_elo_gap === true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除此比赛类别？已有比赛不受影响。')) return;
    onDelete(id);
  };

  const isEditing = editingId !== null || isAdding;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-[#f5f5f5] w-full max-w-lg rounded-t-[40px] sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
      >
        <div className="bg-[#2d2d2e] pt-8 pb-5 px-6 text-white text-center relative shrink-0" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
          <h2 className="text-xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2">
            <Tag size={20} /> 比赛类别管理
          </h2>
          <button onClick={onClose} className="absolute right-6 top-6 p-2 text-white/30 hover:text-white transition-colors" style={{ top: 'max(env(safe-area-inset-top), 24px)' }}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white rounded-2xl p-4 border border-neutral-100 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-black text-neutral-800">{cat.name}</p>
                <p className="text-xs font-bold text-neutral-400">
                  K 系数: <span className="text-red-500">×{cat.k_multiplier}</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(cat)} className="p-2 text-neutral-400 hover:text-blue-600 transition-colors">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-2 text-neutral-300 hover:text-red-600 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-10 text-neutral-400">
              <Tag size={32} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">暂无比赛类别，请添加</p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="px-6 pb-3 space-y-3 border-t border-neutral-100 pt-4 bg-white">
            <input
              type="text"
              placeholder="类别名称，如：部门交流赛"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-neutral-200 outline-none text-sm font-black"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs font-black text-neutral-500 shrink-0">K 系数:</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={formMultiplier}
                onChange={e => setFormMultiplier(e.target.value)}
                className="flex-1 px-4 py-3 rounded-2xl border border-neutral-200 outline-none text-sm font-black"
              />
            </div>
            <label className="flex items-center gap-3 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={formRequireGap}
                onChange={e => setFormRequireGap(e.target.checked)}
                className="w-5 h-5 rounded-md accent-red-600"
              />
              <span className="text-xs font-bold text-neutral-600">
                需要实力差距验证（弱者挑战强者，≥30分）
              </span>
            </label>
            <div className="flex gap-3">
              <button onClick={resetForm} className="flex-1 py-3 rounded-2xl font-black text-sm text-neutral-500 bg-neutral-100">
                取消
              </button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-2xl font-black text-sm text-white bg-red-600 shadow-lg shadow-red-200">
                {editingId ? '更新' : '添加'}
              </button>
            </div>
          </div>
        )}

        <div className="px-6 pb-8 pt-2 bg-white border-t border-neutral-100">
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); setFormName(''); setFormMultiplier('1.0'); }}
            disabled={isEditing}
            className="w-full py-4 border-2 border-neutral-200 rounded-2xl text-neutral-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-neutral-100 transition-colors disabled:opacity-30"
          >
            <Plus size={16} /> 新增类别
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
