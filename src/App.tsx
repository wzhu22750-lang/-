import { useState, useEffect, useMemo } from 'react';
import { Player, Match, Club } from './types';
import { getPlayers, getMatches, savePlayerToCloud, saveMatchToCloud, deletePlayerFromCloud, deleteMatchFromCloud } from './lib/storage';
import { calculateEloChange } from './lib/elo';
import { Plus, Trophy, Users, ChevronLeft, Home, MoreHorizontal, Circle, LogOut, Award, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';
import { RankingList } from './components/RankingList';

export default function App() {
  // 1. 状态管理
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

  // 2. 数据初始化
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

  // 3. 计算 H2H 交手逻辑
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

  // 4. 核心功能：添加比赛 + ELO 计算
  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };

    // --- ELO 计算逻辑 ---
    const team1Objs = players.filter(p => newMatch.team1.includes(p.id));
    const team2Objs = players.filter(p => newMatch.team2.includes(p.id));
    
    if (team1Objs.length > 0 && team2Objs.length > 0) {
      const t1Avg = team1Objs.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team1Objs.length;
      const t2Avg = team2Objs.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / team2Objs.length;
      
      let t1Games = 0; let t2Games = 0;
      newMatch.scores.forEach(s => { if (s.team1 > s.team2) t1Games++; else t2Games++; });
      const t1Won = t1Games > t2Games;

      const change = calculateEloChange(t1Avg, t2Avg, t1Won);

      // 更新本地状态和云端球员分数
      const updatedPlayers = players.map(p => {
        if (newMatch.team1.includes(p.id)) {
          const newPlayer = { ...p, elo_rating: (p.elo_rating || 1500) + change };
          savePlayerToCloud(newPlayer); // 异步更新
          return newPlayer;
        }
        if (newMatch.team2.includes(p.id)) {
          const newPlayer = { ...p, elo_rating: (p.elo_rating || 1500) - change };
          savePlayerToCloud(newPlayer); // 异步更新
          return newPlayer;
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
    if (!club) return;
    setPlayers(players.map(item => item.id === p.id ? p : item));
    await savePlayerToCloud(p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!confirm('确定要删除这位球员吗？')) return;
    setPlayers(players.filter(p => p.id !== id));
    await deletePlayerFromCloud(id);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('确定要删除这场比赛记录吗？(注意：已产生的积分不会回滚)')) return;
    setMatches(matches.filter(m => m.id !== id));
    await deleteMatchFromCloud(id);
  };

  // 未登录俱乐部显示设置页面
  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="m
