import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Player, MatchCategory } from '../types';
import { Trophy, Trash2, Share2, Pencil } from 'lucide-react';
import { ShareMatchModal } from './ShareMatchModal';

interface MatchListProps {
  matches: Match[];
  team1Ids: string[];
  players: Player[];
  onDeleteMatch: (id: string) => void;
  onEditMatch?: (match: Match) => void;
  clubName: string;
  inviteCode: string;
  categories: MatchCategory[];
}

const formatDateWithTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const dateStr = new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');

  let period = '';
  if (hours >= 5 && hours < 12) period = '上午';
  else if (hours >= 12 && hours < 18) period = '下午';
  else period = '晚上';

  const displayHours = hours % 12 || 12;
  return `${dateStr} ${period}${displayHours}:${minutes}`;
};

export function MatchList({
  matches,
  team1Ids,
  players,
  onDeleteMatch,
  onEditMatch,
  clubName,
  inviteCode,
  categories,
}: MatchListProps) {
  const [sharingMatch, setSharingMatch] = useState<Match | null>(null);
  const getPlayerName = (id: string) => players.find((p) => p.id === id)?.name || '未知';
  const getCategoryName = (id?: string) => categories.find((c) => c.id === id)?.name;

  return (
    <div className="space-y-3.5 pb-10">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-extrabold text-[#111814]">交锋明细记录 ({matches.length})</h3>
        <span className="text-[11px] text-[#5b665f]">点击分享可生成战报海报</span>
      </div>

      {matches.map((match, idx) => {
        const isTeam1Match =
          team1Ids.every((id) => (match.team1 || []).includes(id)) &&
          (match.team1 || []).length === team1Ids.length;
        const ourTeam = isTeam1Match ? match.team1 : match.team2;
        const oppTeam = isTeam1Match ? match.team2 : match.team1;

        let ourGames = 0;
        let oppGames = 0;
        (match.scores || []).forEach((s) => {
          const ourScore = isTeam1Match ? s.team1 : s.team2;
          const oppScore = isTeam1Match ? s.team2 : s.team1;
          if (ourScore > oppScore) ourGames++;
          else if (oppScore > ourScore) oppGames++;
        });
        const didWeWin = ourGames > oppGames;
        const didOppWin = oppGames > ourGames;

        return (
          <motion.article
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.04, 0.25), duration: 0.2 }}
            className="bg-white rounded-[22px] border border-[#dde2dc] court-card-shadow overflow-hidden"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#f9faf8] border-b border-[#edf0eb]">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy size={14} className="text-[#0b6e4f] shrink-0" />
                <span className="text-xs font-extrabold text-[#111814] truncate">
                  {match.tournament || '日常训练赛'}
                </span>
                {match.category_id && getCategoryName(match.category_id) && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-[#0b6e4f] px-2 py-0.5 rounded-md border border-emerald-200/80 shrink-0">
                    {getCategoryName(match.category_id)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-medium text-[#5b665f] mr-1 tabular-nums">
                  {formatDateWithTime(match.date)}
                </span>
                <button
                  onClick={() => setSharingMatch(match)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5b665f] hover:text-[#0b6e4f] hover:bg-emerald-50 transition-colors"
                  title="生成战报海报"
                  aria-label="分享战报"
                >
                  <Share2 size={15} />
                </button>
                {onEditMatch && (
                  <button
                    onClick={() => onEditMatch(match)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5b665f] hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="编辑比赛"
                    aria-label="编辑比赛"
                  >
                    <Pencil size={14} />
                  </button>
                )}
                <button
                  onClick={() => onDeleteMatch(match.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5b665f] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="删除比赛"
                  aria-label="删除比赛"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* BWF Table-Style Scoreboard Rows */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2.5">
                {/* Team A Row */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      didWeWin ? 'bg-[#0b6e4f]' : 'bg-[#dde2dc]'
                    }`}
                  />
                  <span
                    className={`text-sm font-bold truncate ${
                      didWeWin ? 'text-[#111814]' : 'text-[#5b665f]'
                    }`}
                  >
                    {(ourTeam || []).map(getPlayerName).join(' / ')}
                  </span>
                  {didWeWin && (
                    <span className="text-[10px] font-bold text-[#0b6e4f] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                      胜
                    </span>
                  )}
                </div>

                {/* Team B Row */}
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      didOppWin ? 'bg-rose-500' : 'bg-[#dde2dc]'
                    }`}
                  />
                  <span
                    className={`text-sm font-bold truncate ${
                      didOppWin ? 'text-[#111814]' : 'text-[#5b665f]'
                    }`}
                  >
                    {(oppTeam || []).map(getPlayerName).join(' / ')}
                  </span>
                  {didOppWin && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                      胜
                    </span>
                  )}
                </div>
              </div>

              {/* Set Scores Columns */}
              <div className="flex items-center gap-2 shrink-0">
                {(match.scores || []).map((score, sIdx) => {
                  const ourScore = isTeam1Match ? score.team1 : score.team2;
                  const oppScore = isTeam1Match ? score.team2 : score.team1;
                  const weWonSet = ourScore > oppScore;
                  const oppWonSet = oppScore > ourScore;
                  return (
                    <div
                      key={sIdx}
                      className="flex flex-col items-center gap-1.5 bg-[#f5f6f3] p-1.5 rounded-xl border border-[#e3e8e2]"
                    >
                      <div
                        className={`w-8 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold tabular-nums ${
                          weWonSet ? 'bg-[#0c261e] text-white shadow-xs' : 'text-[#5b665f]'
                        }`}
                      >
                        {ourScore}
                      </div>
                      <div
                        className={`w-8 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-extrabold tabular-nums ${
                          oppWonSet ? 'bg-rose-600 text-white shadow-xs' : 'text-[#5b665f]'
                        }`}
                      >
                        {oppScore}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.article>
        );
      })}

      <AnimatePresence>
        {sharingMatch && (
          <ShareMatchModal
            match={sharingMatch}
            players={players}
            clubName={clubName}
            inviteCode={inviteCode}
            onClose={() => setSharingMatch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
