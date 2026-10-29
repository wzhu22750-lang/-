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

export function CategoryManageModal({
  onClose,
  categories,
  clubId,
  onSave,
  onDelete,
}: CategoryManageModalProps) {
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
        ? (categories.find((c) => c.id === editingId)?.sort_order ?? categories.length)
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 340 }}
        className="bg-[#f5f6f3] w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col max-h-[90vh] court-elevated-shadow border border-[#dde2dc]"
      >
        <div
          className="bg-[#0c261e] court-grid-pattern pt-6 pb-4 px-6 text-white flex items-center justify-between shrink-0 border-b border-emerald-500/20"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
        >
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 block">
              K-FACTOR MULTIPLIERS
            </span>
            <h2 className="text-lg font-extrabold flex items-center gap-2">
              <Tag size={18} className="text-emerald-300" />
              <span>比赛类别与积分倍率</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl p-4 border border-[#dde2dc] flex items-center justify-between court-card-shadow"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm text-[#111814]">{cat.name}</p>
                  <span className="text-[11px] font-mono font-bold bg-emerald-50 text-[#0b6e4f] px-2 py-0.5 rounded-md border border-emerald-200">
                    x{cat.k_multiplier}
                  </span>
                </div>
                {cat.require_elo_gap && (
                  <p className="text-[11px] text-amber-700 font-medium mt-1">
                    挑战机制：要求双方分差 ≥ 30 分
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startEdit(cat)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#5b665f] hover:text-sky-600 hover:bg-sky-50 transition-colors"
                  aria-label="编辑类别"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#5b665f] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  aria-label="删除类别"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="text-center py-10 text-[#5b665f]">
              <Tag size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm font-bold">暂无比赛类别，请点击下方新增</p>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="px-5 pb-4 pt-4 space-y-3.5 border-t border-[#dde2dc] bg-white">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111814] block">类别名称</label>
              <input
                type="text"
                placeholder="例如：月度擂台赛"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f8faf7] border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white outline-none text-sm font-bold text-[#111814]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#111814] block">K 系数倍率 (0.1 - 5.0)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={formMultiplier}
                onChange={(e) => setFormMultiplier(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#f8faf7] border border-[#dde2dc] focus:border-[#0b6e4f] focus:bg-white outline-none text-sm font-mono font-bold text-[#111814]"
              />
            </div>

            <label className="flex items-center gap-2.5 px-1 cursor-pointer">
              <input
                type="checkbox"
                checked={formRequireGap}
                onChange={(e) => setFormRequireGap(e.target.checked)}
                className="w-4 h-4 rounded accent-[#0b6e4f]"
              />
              <span className="text-xs font-bold text-[#111814]">
                启用挑战赛门槛（需双方 ELO 差距 ≥ 30 分）
              </span>
            </label>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={resetForm}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-[#5b665f] bg-[#f5f6f3] hover:bg-[#e5e9e4] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-[#0b6e4f] hover:bg-[#095a40] transition-colors"
              >
                {editingId ? '保存修改' : '确认添加'}
              </button>
            </div>
          </div>
        )}

        <div className="p-5 bg-white border-t border-[#dde2dc]">
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              setFormName('');
              setFormMultiplier('1.0');
            }}
            disabled={isEditing}
            className="w-full py-3.5 border border-dashed border-[#bfc8c0] rounded-xl text-[#5b665f] hover:text-[#0b6e4f] hover:border-[#0b6e4f] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Plus size={15} /> 新增比赛类别
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
