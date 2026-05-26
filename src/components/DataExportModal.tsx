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
      players: players.map(p => ({
        id: p.id,
        name: p.name,
        initials: p.initials,
        elo_rating: p.elo_rating || 1500,
        club_id: p.club_id,
      })),
      matches: matches.map(m => ({
        id: m.id,
        date: new Date(m.date).toISOString(),
        type: m.type,
        team1: m.team1,
        team2: m.team2,
        scores: m.scores,
        tournament: m.tournament || '练习赛',
      })),
    };
    downloadFile(
      `h2h-backup-${new Date().toISOString().split('T')[0]}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const handleExportCSV = () => {
    const header = '日期,类型,A队球员,B队球员,A队胜局,B队胜局,赛事\n';
    const rows = matches.map(m => {
      const t1Names = m.team1.map(id => players.find(p => p.id === id)?.name || '未知').join('/');
      const t2Names = m.team2.map(id => players.find(p => p.id === id)?.name || '未知').join('/');
      let t1Games = 0; let t2Games = 0;
      m.scores.forEach(s => { if (s.team1 > s.team2) t1Games++; else if (s.team2 > s.team1) t2Games++; });
      const dateStr = new Date(m.date).toISOString().split('T')[0];
      return [dateStr, m.type, t1Names, t2Names, t1Games, t2Games, m.tournament || '练习赛'].join(',');
    });
    downloadFile(
      `h2h-matches-${new Date().toISOString().split('T')[0]}.csv`,
      header + rows.join('\n'),
      'text/csv;charset=utf-8'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-neutral-900 px-6 pt-6 pb-5 text-white text-center relative">
          <button onClick={onClose} className="absolute right-5 top-5 p-1 text-white/40 hover:text-white">
            <X size={20} />
          </button>
          <Download size={28} className="mx-auto mb-2 text-white/80" />
          <h2 className="text-lg font-black italic uppercase tracking-widest">数据导出</h2>
          <p className="text-[10px] text-white/40 mt-1">
            {matches.length} 场比赛 · {players.length} 名球员
          </p>
        </div>

        {/* Export options */}
        <div className="p-6 space-y-3">
          <button
            onClick={handleExportJSON}
            className="w-full flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FileJson size={22} className="text-blue-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-neutral-800">JSON 备份</p>
              <p className="text-[10px] text-neutral-400">导出全部球员和比赛数据，适合备份恢复</p>
            </div>
          </button>

          <button
            onClick={handleExportCSV}
            className="w-full flex items-center gap-4 p-5 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <FileText size={22} className="text-green-600" />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-black text-neutral-800">CSV 比赛记录</p>
              <p className="text-[10px] text-neutral-400">导出比赛列表为 CSV，适合 Excel 查看分析</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all mt-2"
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
