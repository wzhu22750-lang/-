
import { motion } from 'motion/react';
import { Match, Player } from '../types';
import { PlayCircle, Trophy } from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  team1Ids: string[];
  players: Player[];
}

export function MatchList({ matches, team1Ids, players }: MatchListProps) {
  const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || '未知';

  return (
    <div className="space-y-8 pb-10">
      {matches.map((match, idx) => {
        const isTeam1Match = team1Ids.every(id => match.team1.includes(id)) && match.team1.length === team1Ids.length;
        
        const ourTeam = isTeam1Match ? match.team1 : match.team2;
        const oppTeam = isTeam1Match ? match.team2 : match.team1;

        let ourGames = 0;
        let oppGames = 0;
        
        match.scores.forEach(s => {
          const ourScore = isTeam1Match ? s.team1 : s.team2;
          const oppScore = isTeam1Match ? s.team2 : s.team1;
          if (ourScore > oppScore) ourGames++;
          else if (oppScore > ourScore) oppGames++;
        });

        const didWeWin = ourGames > oppGames;

        const dateStr = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(match.date);
        const yearStr = new Intl.DateTimeFormat('zh-CN', { year: 'numeric' }).format(match.date);

        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="relative"
          >
            {/* Tournament Label */}
            {match.tournament && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-neutral-100 flex items-center justify-center">
                    <Trophy size={16} className="text-red-500" />
                  </div>
                  <span className="text-sm font-bold text-neutral-800">{match.tournament}</span>
                </div>
                <span className="text-xs font-medium text-neutral-400">{dateStr}</span>
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Sidebar Info */}
              <div className="flex flex-col items-center gap-1 w-10 shrink-0">
                <PlayCircle size={24} className="text-green-500" />
              </div>

              {/* Match Card */}
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
                      const wonGame = ourScore > oppScore;

                      return (
                        <div key={sIdx} className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${wonGame ? 'bg-neutral-100 text-black' : 'text-neutral-400'}`}>
                            {ourScore}
                          </div>
                          <div className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${!wonGame ? 'bg-neutral-100 text-black' : 'text-neutral-400'}`}>
                            {oppScore}
                          </div>
                        </div>
                      );
                    })}
                    

                  </div>
                </div>
              </div>
            </div>
            
            {/* Divider line */}
            <div className="absolute left-5 top-12 bottom-0 w-px bg-neutral-100 -z-10" />
          </motion.div>
        );
      })}
    </div>
  );
}
