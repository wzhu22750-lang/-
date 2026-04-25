import { useState, useEffect, useMemo } from 'react';
import { Player, Match } from './types';
import { getPlayers, getMatches, savePlayerToCloud, saveMatchToCloud } from './lib/storage';
import { Plus, Trophy, Users, ChevronLeft, Home, MoreHorizontal, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTeam1, setSelectedTeam1] = useState<string[]>([]);
  const [selectedTeam2, setSelectedTeam2] = useState<string[]>([]);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState<{ side: 'team1' | 'team2' } | null>(null);

  // 联网加载初始数据
  useEffect(() => {
    const initData = async () => {
      const cloudPlayers = await getPlayers();
      const cloudMatches = await getMatches();
      setPlayers(cloudPlayers);
      setMatches(cloudMatches);
    };
    initData();
  }, []);

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
        if (s.team1 > s.team2) m1Games++;
        else if (s.team2 > s.team1) m2Games++;
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
    setMatches([newMatch, ...matches]);
    await saveMatchToCloud(newMatch); // 同步到云端
    setIsAddMatchOpen(false);
  };

  const handleAddPlayer = async (p: Player) => {
    setPlayers([...players, p]);
    await savePlayerToCloud(p); // 同步到云端
  };

  const handleSelectPlayer = (side: 'team1' | 'team2', ids: string[]) => {
    if (side === 'team1') setSelectedTeam1(ids);
    else setSelectedTeam2(ids);
    setIsPlayerSelectOpen(null);
  };

  const getPlayerNames = (ids: string[]) => {
    return ids.map(id => players.find(p => p.id === id)?.name || '未知').join(' / ');
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900 pb-20">
      <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-red-500 rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <button className="p-2 hover:bg-red-500 rounded-full transition-colors"><Home size={20} /></button>
        </div>
        <h1 className="text-xl font-bold tracking-tight">交手记录 H2H</h1>
        <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <MoreHorizontal size={20} />
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Circle size={18} />
        </div>
      </div>

      <H2HHero 
        stats={stats} 
        team1Names={getPlayerNames(selectedTeam1)}
        team2Names={getPlayerNames(selectedTeam2)}
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
              <MatchList matches={h2hMatches} team1Ids={selectedTeam1} players={players} />
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-transform"
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
            onSelect={(ids) => handleSelectPlayer(isPlayerSelectOpen.side, ids)}
            onAddPlayer={handleAddPlayer}
            currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
