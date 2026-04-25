import { useState, useEffect, useMemo } from 'react';
import { Player, Match, Club } from './types';
import { getPlayers, getMatches, savePlayerToCloud, saveMatchToCloud, deletePlayerFromCloud, deleteMatchFromCloud } from './lib/storage';
import { Plus, Trophy, Users, ChevronLeft, Home, MoreHorizontal, Circle, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';

export default function App() {
  const [club, setClub] = useState<Club | null>(() => {
    const saved = localStorage.getItem('h2h_club');
    return saved ? JSON.parse(saved) : null;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  // ... (保留原有的 selectedTeam1 等状态)
  const [selectedTeam1, setSelectedTeam1] = useState<string[]>([]);
  const [selectedTeam2, setSelectedTeam2] = useState<string[]>([]);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState<{ side: 'team1' | 'team2' } | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (club) {
      localStorage.setItem('h2h_club', JSON.stringify(club));
      const initData = async () => {
        const p = await getPlayers(club.id);
        const m = await getMatches(club.id);
        setPlayers(p);
        setMatches(m);
      };
      initData();
    }
  }, [club]);

  // 计算统计和逻辑 (保留，但注意 player 增加 club_id)
  const h2hMatches = useMemo(() => {
    if (selectedTeam1.length === 0 || selectedTeam2.length === 0) return [];
    return matches.filter(m => {
      const isTeam1Match = selectedTeam1.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam1.length;
      const isTeam2Match = selectedTeam2.every(id => m.team2.includes(id)) && m.team2.length === selectedTeam2.length;
      const isReversed1 = selectedTeam1.every(id => m.team2.includes(id)) && m.team2.length === selectedTeam1.length;
      const isReversed2 = selectedTeam2.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam2.length;
      return (isTeam1Match && isTeam2Match) || (isReversed1 && isReversed2);
    }).sort((a, b) => b.date - a.date);
  }, [matches, selectedTeam1, selectedTeam2]);

  const stats = useMemo(() => {
    if (h2hMatches.length === 0) return { t1Wins: 0, t2Wins: 0, total: 0 };
    let t1Wins = 0; let t2Wins = 0;
    h2hMatches.forEach(m => {
      let m1Games = 0; let m2Games = 0;
      m.scores.forEach(s => {
        if (s.team1 > s.team2) m1Games++; else m2Games++;
      });
      const isOurTeam1 = selectedTeam1.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam1.length;
      if (isOurTeam1) {
        if (m1Games > m2Games) t1Wins++; else t2Wins++;
      } else {
        if (m2Games > m1Games) t1Wins++; else t2Wins++;
      }
    });
    return { t1Wins, t2Wins, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };
    setMatches([matchWithClub, ...matches]);
    await saveMatchToCloud(matchWithClub);
    setIsAddMatchOpen(false);
  };

  const handleAddPlayer = async (p: Player) => {
    if (!club) return;
    const playerWithClub = { ...p, club_id: club.id };
    setPlayers([...players, playerWithClub]);
    await savePlayerToCloud(playerWithClub);
  };

  // ... (更新 updatePlayer 也要确保 club_id 存在)
  const handleUpdatePlayer = async (p: Player) => {
    if (!club) return;
    const playerWithClub = { ...p, club_id: club.id };
    setPlayers(players.map(item => item.id === p.id ? playerWithClub : item));
    await savePlayerToCloud(playerWithClub);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('确定要删除这位球员吗？')) return;
    setPlayers(players.filter(p => p.id !== id));
    await deletePlayerFromCloud(id);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('确定要删除这场比赛记录吗？')) return;
    setMatches(matches.filter(m => m.id !== id));
    await deleteMatchFromCloud(id);
  };

  if (!club) {
    return <ClubSetup onComplete={setClub} />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { if(confirm('退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}}
            className="p-2 hover:bg-red-500 rounded-full transition-colors"
          >
            <LogOut size={20} />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">{club.name}</h1>
            <p className="text-[10px] opacity-70 font-mono">邀请码: {club.invite_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1 text-sm font-bold">
           H2H 模式
        </div>
      </div>

      <H2HHero 
        stats={stats} 
        team1Names={selectedTeam1.map(id => players.find(p => p.id === id)?.name || '').join(' / ')}
        team2Names={selectedTeam2.map(id => players.find(p => p.id === id)?.name || '').join(' / ')}
        onSelectTeam1={() => setIsPlayerSelectOpen({ side: 'team1' })}
        onSelectTeam2={() => setIsPlayerSelectOpen({ side: 'team2' })}
        team1Empty={selectedTeam1.length === 0}
        team2Empty={selectedTeam2.length === 0}
        player1={players.find(p => p.id === selectedTeam1[0])}
        player2={players.find(p => p.id === selectedTeam2[0])}
      />

      <main className="px-4 mt-6">
        {selectedTeam1.length > 0 && selectedTeam2.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {h2hMatches.length > 0 ? (
              <MatchList 
                matches={h2hMatches} 
                team1Ids={selectedTeam1} 
                players={players} 
                onDeleteMatch={handleDeleteMatch}
              />
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 text-neutral-400">
                <Trophy size={48} className="mx-auto mb-4 opacity-20" />
                <p>暂无此组合的交手记录</p>
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 text-neutral-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p>请选择球员以查看对战记录</p>
          </div>
        )}
      </main>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAddMatchOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
      >
        <Plus size={28} />
      </motion.button>

      <AnimatePresence>
        {isAddMatchOpen && (
          <AddMatchModal onClose={() => setIsAddMatchOpen(false)} players={players} onAdd={handleAddMatch} />
        )}
        {isPlayerSelectOpen && (
          <PlayerSelectModal
            side={isPlayerSelectOpen.side}
            onClose={() => setIsPlayerSelectOpen(null)}
            players={players}
            onSelect={(ids) => {
               if (isPlayerSelectOpen.side === 'team1') setSelectedTeam1(ids);
               else setSelectedTeam2(ids);
               setIsPlayerSelectOpen(null);
            }}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onViewProfile={(p) => setViewingPlayer(p)}
            currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2}
          />
        )}
        {viewingPlayer && (
          <PlayerProfileModal 
            player={viewingPlayer}
            matches={matches}
            players={players}
            onClose={() => setViewingPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
