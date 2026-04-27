import { useState, useEffect, useMemo } from 'react';
import { Player, Match, Club } from './types';
import { 
  getPlayers, 
  getMatches, 
  savePlayerToCloud, 
  saveMatchToCloud, 
  deletePlayerFromCloud, 
  deleteMatchFromCloud 
} from './lib/storage';
import { calculateEloChange } from './lib/elo';
import { 
  Plus, 
  Users, 
  LogOut, 
  Award, 
  BarChart3, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RatingChangeModal } from './components/RatingChangeModal';

// 组件导入
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';
import { RankingList } from './components/RankingList';
import { RecentActivity } from './components/RecentActivity';

export default function App() {
  // --- 1. 核心状态 ---
  const [club, setClub] = useState<Club | null>(() => {
    const saved = localStorage.getItem('h2h_club');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'h2h' | 'ranking'>('recent');
  
  const [selectedTeam1, setSelectedTeam1] = useState<string[]>([]);
  const [selectedTeam2, setSelectedTeam2] = useState<string[]>([]);
  const [isAddMatchOpen, setIsAddMatchOpen] = useState(false);
  const [isPlayerSelectOpen, setIsPlayerSelectOpen] = useState<{ side: 'team1' | 'team2' } | null>(null);
  const [viewingPlayer, setViewingPlayer] = useState<Player | null>(null);
  const [lastMatchResult, setLastMatchResult] = useState<{ change: number, newRating: number } | null>(null);

  // --- 2. 加载逻辑：本地缓存优先 + 云端静默同步 ---
  useEffect(() => {
    if (club) {
      localStorage.setItem('h2h_club', JSON.stringify(club));
      
      // A. 先从本地缓存加载 (实现秒开)
      const cachedPlayers = localStorage.getItem(`cache_players_${club.id}`);
      const cachedMatches = localStorage.getItem(`cache_matches_${club.id}`);
      if (cachedPlayers) setPlayers(JSON.parse(cachedPlayers));
      if (cachedMatches) setMatches(JSON.parse(cachedMatches));

      // B. 异步拉取云端最新数据
    const initData = async () => {
  try {
    // 【优化】两个请求同时发出，总时间缩短一半
    const [p, m] = await Promise.all([
      getPlayers(club.id),
      getMatches(club.id)
    ]);
    
    setPlayers(p);
    setMatches(m);
    
    // 更新缓存
    localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(p));
    localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(m));
  } catch (err) {
    console.error('加载失败');
  }
};

          // C. 更新缓存
          localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(p));
          localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(m));
        } catch (err) {
          console.error('云端同步失败，当前使用的是离线缓存数据');
        }
      };
      initData();

      // 更新俱乐部历史
      const historySaved = localStorage.getItem('h2h_club_history');
      let history: Club[] = historySaved ? JSON.parse(historySaved) : [];
      if (!history.find(c => c.id === club.id)) {
        history = [club, ...history].slice(0, 5);
        localStorage.setItem('h2h_club_history', JSON.stringify(history));
      }
    }
  }, [club]);

  // --- 3. 计算逻辑 ---
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
      if (isOurTeam1) { 
        if (m1Games > m2Games) t1Wins++; else t2Wins++; 
      } else { 
        if (m2Games > m1Games) t1Wins++; else t2Wins++; 
      }
    });
    return { t1Wins, t2Wins, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  // --- 4. 交互处理 ---
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
      
      // 计算变动分数
      const change = calculateEloChange(t1Avg, t2Avg, t1Games > t2Games);

      // --- 【新增代码】：触发结算弹窗 ---
      // 假设我们以 Team A 的第一个人为例展示积分变动（或者你可以逻辑更复杂点）
      setLastMatchResult({ 
        change: change, 
        newRating: (team1Objs[0].elo_rating || 1500) + change 
      });

      const updatedPlayers = players.map(p => {
        if (newMatch.team1.includes(p.id)) {
          const up = { ...p, elo_rating: (p.elo_rating || 1500) + change };
          savePlayerToCloud(up); return up;
        }
        if (newMatch.team2.includes(p.id)) {
          const up = { ...p, elo_rating: (p.elo_rating || 1500) - change };
          savePlayerToCloud(up); return up;
        }
        return p;
      });
      setPlayers(updatedPlayers);
    }
    setMatches([matchWithClub, ...matches]);
    await saveMatchToCloud(matchWithClub);
    setIsAddMatchOpen(false);
  };
  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 font-sans text-neutral-900">
      {/* Header */}
      <div className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { if(confirm('退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}} 
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black leading-none">{club.name}</h1>
              <p className="text-[10px] opacity-70 font-mono tracking-wider">CODE: {club.invite_code}</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase italic tracking-tighter">Live</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-4 gap-6 text-sm font-bold border-t border-white/10 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('recent')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'recent' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Zap size={16} /> 最近动态</button>
          <button onClick={() => setActiveTab('h2h')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'h2h' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><BarChart3 size={16} /> 交手分析</button>
          <button onClick={() => setActiveTab('ranking')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'ranking' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Award size={16} /> 战力排行</button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 mt-6">
        {activeTab === 'recent' && (
          <RecentActivity matches={matches} players={players} onViewProfile={setViewingPlayer} />
        )}

        {activeTab === 'h2h' && (
          <div className="space-y-6">
            <H2HHero 
              stats={stats} 
              team1Names={selectedTeam1.map(id => players.find(p => p.id === id)?.name || '').join('/')} 
              team2Names={selectedTeam2.map(id => players.find(p => p.id === id)?.name || '').join('/')} 
              onSelectTeam1={() => setIsPlayerSelectOpen({ side: 'team1' })} 
              onSelectTeam2={() => setIsPlayerSelectOpen({ side: 'team2' })} 
              onViewProfile={setViewingPlayer} 
              team1Empty={selectedTeam1.length === 0} 
              team2Empty={selectedTeam2.length === 0} 
              // 【关键修复】传递选中的球员对象数组给 H2HHero
              team1Players={players.filter(p => selectedTeam1.includes(p.id))}
              team2Players={players.filter(p => selectedTeam2.includes(p.id))}
            />
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 ? (
              <MatchList 
                matches={h2hMatches} team1Ids={selectedTeam1} players={players} 
                onDeleteMatch={(id) => { deleteMatchFromCloud(id); setMatches(matches.filter(m => m.id !== id)); }} 
                clubName={club.name} inviteCode={club.invite_code} 
              />
            ) : (
              <div className="text-center py-20 text-neutral-400 font-bold">
                <Users size={48} className="mx-auto mb-4 opacity-10" />
                <p>请选择球员开始对战分析</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
  <RankingList players={players} matches={matches} onViewProfile={setViewingPlayer} />
)}
      </main>

      {/* FAB */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
        onClick={() => setIsAddMatchOpen(true)} 
        className="fixed bottom-8 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white"
      >
        <Plus size={28} />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {isAddMatchOpen && <AddMatchModal onClose={() => setIsAddMatchOpen(false)} players={players} onAdd={handleAddMatch} />}
        {isPlayerSelectOpen && (
          <PlayerSelectModal 
            side={isPlayerSelectOpen.side} onClose={() => setIsPlayerSelectOpen(null)} players={players} 
            onSelect={(ids) => { if (isPlayerSelectOpen.side === 'team1') setSelectedTeam1(ids); else setSelectedTeam2(ids); setIsPlayerSelectOpen(null); }} 
            onAddPlayer={async (p) => { if(!club) return; const up = {...p, club_id: club.id, elo_rating: 1500}; setPlayers([...players, up]); savePlayerToCloud(up); }} 
            onUpdatePlayer={async (p) => { setPlayers(players.map(item => item.id === p.id ? p : item)); savePlayerToCloud(p); }} 
            onDeletePlayer={async (id) => { if(!confirm('删除？')) return; deletePlayerFromCloud(id); setPlayers(players.filter(p => p.id !== id)); }} 
            onViewProfile={setViewingPlayer} currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2} 
          />
        )}
        {viewingPlayer && (
          <PlayerProfileModal player={viewingPlayer} matches={matches} players={players} onClose={() => setViewingPlayer(null)} />
        )}
        {/* 【新增】：战力升降结算弹窗 */}
  {lastMatchResult && (
    <RatingChangeModal 
      change={lastMatchResult.change}
      newRating={lastMatchResult.newRating}
      onClose={() => setLastMatchResult(null)}
    />
  )}
      </AnimatePresence>
    </div>
  );
}
