import { useState, useEffect, useMemo } from 'react';
import { Player, Match, Club } from './types';
import { getPlayers, getMatches, savePlayerToCloud, saveMatchToCloud, deletePlayerFromCloud, deleteMatchFromCloud } from './lib/storage';
import { calculateEloChange } from './lib/elo';
import { Plus, Trophy, Users, LogOut, Award, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';
import { RankingList } from './components/RankingList';

export default function App() {
  const [club, setClub] = useState<Club | null>(() => {
    const saved = localStorage.getItem('h2h_club');
    return saved ? JSON.parse(saved) : null;
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'h2h' | 'ranking'>('h2h');
  
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
      m.scores.forEach(s => { if (s.team1 > s.team2) m1Games++; else m2Games++; });
      const isOurTeam1 = selectedTeam1.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam1.length;
      if (isOurTeam1) { if (m1Games > m2Games) t1Wins++; else t2Wins++; }
      else { if (m2Games > m1Games) t1Wins++; else t2Wins++; }
    });
    return { t1Wins, t2Wins, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };

    const team1Objs = players.filter(p => newMatch.team1.includes(p.id));
    const team2Objs = players.filter(p => newMatch.team2.includes(p.id));
    
    if (team1Objs.length > 0 && team2Objs.length > 0) {
      const t1Avg = team1Objs.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team1Objs.length;
      const t2Avg = team2Objs.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team2Objs.length;
      let t1Games = 0; let t2Games = 0;
      newMatch.scores.forEach(s => { if (s.team1 > s.team2) t1Games++; else t2Games++; });
      const change = calculateEloChange(t1Avg, t2Avg, t1Games > t2Games);

      const updatedPlayers = players.map(p => {
        if (newMatch.team1.includes(p.id)) {
          const newP = { ...p, elo_rating: (p.elo_rating || 1500) + change };
          savePlayerToCloud(newP);
          return newP;
        }
        if (newMatch.team2.includes(p.id)) {
          const newP = { ...p, elo_rating: (p.elo_rating || 1500) - change };
          savePlayerToCloud(newP);
          return newP;
        }
        return p;
      });
      setPlayers(updatedPlayers);
    }

    setMatches([matchWithClub, ...matches]);
    await saveMatchToCloud(matchWithClub);
    setIsAddMatchOpen(false);
  };

  const handleAddPlayer = async (p: Player) => {
    if (!club) return;
    const playerWithClub = { ...p, club_id: club.id, elo_rating: 1500 };
    setPlayers([...players, playerWithClub]);
    await savePlayerToCloud(playerWithClub);
  };

  const handleUpdatePlayer = async (p: Player) => {
    setPlayers(players.map(item => item.id === p.id ? p : item));
    await savePlayerToCloud(p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('确定删除？')) return;
    setPlayers(players.filter(p => p.id !== id));
    await deletePlayerFromCloud(id);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('确定删除比赛记录？')) return;
    setMatches(matches.filter(m => m.id !== id));
    await deleteMatchFromCloud(id);
  };

  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm('退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}} className="p-2 hover:bg-white/10 rounded-full"><LogOut size={20} /></button>
            <div>
              <h1 className="text-lg font-black leading-none">{club.name}</h1>
              <p className="text-[10px] opacity-70 font-mono">INVITE: {club.invite_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase">Live Sync</span>
          </div>
        </div>
        <div className="flex px-4 gap-8 text-sm font-bold border-t border-white/10">
          <button onClick={() => setActiveTab('h2h')} className={`flex items-center gap-2 py-3 border-b-2 transition-all ${activeTab === 'h2h' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><BarChart3 size={16} /> 对战分析</button>
          <button onClick={() => setActiveTab('ranking')} className={`flex items-center gap-2 py-3 border-b-2 transition-all ${activeTab === 'ranking' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Award size={16} /> 战力排行</button>
        </div>
      </div>

      {activeTab === 'h2h' ? (
        <>
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
                {h2hMatches.length > 0 ? <MatchList matches={h2hMatches} team1Ids={selectedTeam1} players={players} onDeleteMatch={handleDeleteMatch} /> : <div className="text-center py-20 text-neutral-400">暂无记录</div>}
              </AnimatePresence>
            ) : <div className="text-center py-20 text-neutral-400"><Users size={48} className="mx-auto mb-4 opacity-20" /><p>请选择球员</p></div>}
          </main>
        </>
      ) : (
        <main className="px-4 mt-6"><RankingList players={players} /></main>
      )}

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAddMatchOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40"><Plus size={28} /></motion.button>

      <AnimatePresence>
        {isAddMatchOpen && <AddMatchModal onClose={() => setIsAddMatchOpen(false)} players={players} onAdd={handleAddMatch} />}
        {isPlayerSelectOpen && (
          <PlayerSelectModal
            side={isPlayerSelectOpen.side} onClose={() => setIsPlayerSelectOpen(null)} players={players}
            onSelect={(ids) => { if (isPlayerSelectOpen.side === 'team1') setSelectedTeam1(ids); else setSelectedTeam2(ids); setIsPlayerSelectOpen(null); }}
            onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onViewProfile={setViewingPlayer} currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2}
          />
        )}
        {viewingPlayer && <PlayerProfileModal player={viewingPlayer} matches={matches} players={players} onClose={() => setViewingPlayer(null)} />}
      </AnimatePresence>
    </div>
  );
}
