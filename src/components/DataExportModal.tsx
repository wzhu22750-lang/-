import { motion } from 'motion/react';
import { X, Download, FileJson, FileText } from 'lucide-react';
import { Player, Match } from '../types';

interface DataExportModalProps {
  players: Player[];
  matches: Match[];
  onClose: () => void;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DataExportModal({ players, matches, onClose }: DataExportModalProps) {
  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      playerCount: players.length,
      matchCount: matches.length,
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        elo_rating: p.elo_rating || 1500,
        club_id: p.club_id,
      })),
      matches: matches.map((m) => ({
        id: m.id,
        date: new Date(m.date).toISOString(),
        type: m.type,
        team1: m.team1,
        team2: m.team2,
        scores: m.scores,
        tournament: m.tournament || '日常训练赛',
      })),
    };
    downloadFile(
      `h2h-backup-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const handleExportCSV = () => {
    const header = '日期,类型,队伍1球员,队伍2球员,队伍1胜局,队伍2胜局,赛事\n';
    const rows = matches.map((m) => {
      const t1Names = m.team1.map((id) => players.find((p) => p.id === id)?.name || '未知').join('/');
      const t2Names = m.team2.map((id) => players.find((p) => p.id === id)?.name || '未知').join('/');
      let t1Games = 0;
      let t2Games = 0;
      m.scores.forEach((s) => {
        if (s.team1 > s.team2) t1Games++;
        else if (s.team2 > s.team1) t2Games++;
      });
      const dateStr = new Date(m.date).toISOString().split('T')[0];
      return [dateStr, m.type, t1Names, t2Names, t1Games, t2Games, m.tournament || '日常训练赛'].join(',');
    });
    downloadFile(
      `h2h-matches-${new Date().toISOString().split('T')[0]}.csv`,
      header + rows.join('\n'),
      'text/csv;charset=utf-8'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden court-elevated-shadow border border-neutral-200/80"
      >
        <div className="bg-[#2d2d2e] px-6 pt-6 pb-5 text-white text-center relative border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-400/30 flex items-center justify-center mx-auto mb-2.5 text-red-400">
            <Download size={22} />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">导出球馆数据</h2>
          <p className="text-xs text-white/60 mt-1 tabular-nums">
            共 {matches.length} 场对局 · {players.length} 位在册球友
          </p>
        </div>

        <div className="p-5 space-y-2.5 bg-[#f5f5f5]">
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-neutral-200/80 hover:border-red-500 transition-colors group text-left court-card-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
              <FileJson size={20} className="text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-900">JSON 全量备份包</p>
              <p className="text-xs text-neutral-500 mt-0.5">包含球友档案、ELO 积分与全部对局</p>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-neutral-200/80 hover:border-blue-500 transition-colors group text-left court-card-shadow"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <FileText size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-neutral-900">CSV 对局明细表</p>
              <p className="text-xs text-neutral-500 mt-0.5">适配 Excel 与表格软件打开分析</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm active:scale-[0.98] transition-[transform,background-color] mt-1"
          >
            完成并关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
