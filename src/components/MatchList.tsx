import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Match, Player } from '../types';
import { PlayCircle, Trophy, Trash2, Share2 } from 'lucide-react';
import { ShareMatchModal } from './ShareMatchModal';

interface MatchListProps {
  matches: Match[];
  team1Ids: string[];
  players: Player[];
  onDeleteMatch: (id: string) => void;
  clubName: string;
  inviteCode: string;
}

export function MatchList({ matches, team1Ids, players, onDeleteMatch, clubName, inviteCode }: MatchListProps) {
  const [sharingMatch, setSharingMatch] = useState<Match | null>(null);
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '未知';

  return (
    <div className="space-y-8 pb-10">
      {matches.map((match, idx) => {
        const isTeam1Match = team1Ids.every(id => match.team1.includes(id)) && match.team1.length === team1Ids.length;
        const ourTeam = isTeam1Match ? match.team1 : match.team2;
        const oppTeam = isTeam1Match ? match.team2 : match.team1;

        let ourGames = 0; let oppGames = 0;
        match.scores.forEach(s => {
          const ourScore = isTeam1Match ? s.team1 : s.team2;
          const oppScore = isTeam1Match ? s.team2 : s.team1;
          if (ourScore > oppScore) ourGames++; else if (oppScore > ourScore) oppGames++;
        });
        const didWeWin = ourGames > oppGames;
        const dateStr = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(match.date);

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center">
                  <Trophy size={16} className="text-red-500" />
                </div>
                <span className="text-sm font-bold text-neutral-800">{match.tournament || '练习赛'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-neutral-400 mr-2">{dateStr}</span>
                
                {/* 分享按钮 */}
                <button 
                  onClick={() => setSharingMatch(match)}
                  className="p-2 text-neutral-400 hover:text-red-600 transition-colors"
                >
                  <Share2 size={16} />
                </button>

                {/* 删除按钮 */}
                <button 
                  onClick={() => onDeleteMatch(match.id)}
                  className="p-2 text-neutral-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center gap-1 w-10 shrink-0">
                <PlayCircle size={24} className={didWeWin ? "text-green-500" : "text-neutral-300"} />
              </div>

              <div className="flex-1 bg-white/50 rounded-xl p-1">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className={`text-sm font-bold ${didWeWin ? 'text-neutral-900' : 'text-neutral-400'}`}>
                      {ourTeam.map(getPlayerName).join(' / ')}
                    </div>
                    <div className={`text-sm font-bold ${!didWeWin ? 'text-green-600' : 'text-neutral-400'}`}>
                      {oppTeam.map(getPlayerName).join(' / ')}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pr-2">
                    {match.scores.map((score, sIdx) => {
                      const ourScore = isTeam1Match ? score.team1 : score.team2;
                      const oppScore = isTeam1Match ? score.team2 : score.team1;
                      return (
                        <div key={sIdx} className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${ourScore > oppScore ? 'bg-neutral-100 text-black' : 'text-neutral-400'}`}>
                            {ourScore}
                          </div>
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${oppScore > ourScore ? 'bg-neutral-100 text-black' : 'text-neutral-400'}`}>
                            {oppScore}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute left-5 top-12 bottom-0 w-px bg-neutral-100 -z-10" />
          </motion.div>
        );
      })}

      {/* 渲染战报分享模态框 */}
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
