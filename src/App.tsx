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
import { calculateEloChange, recalculateAllElo } from './lib/elo';
import { 
  Plus, 
  Users, 
  LogOut, 
  Award, 
  BarChart3, 
  Zap,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 组件导入
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';
import { RankingList } from './components/RankingList';
import { RecentActivity } from './components/RecentActivity';
import { RatingChangeModal } from './components/RatingChangeModal';

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

  // --- 2. 隐形权限识别逻辑 ---
  const isAdmin = useMemo(() => {
    if (!club || !club.manager_token) return false;
    const savedTokens = localStorage.getItem('h2h_manager_tokens');
    if (!savedTokens) return false;
    const tokens = JSON.parse(savedTokens);
    // 比对浏览器钥匙库里的 Token 和当前俱乐部的 Token 是否一致
    return tokens[club.id] === club.manager_token;
  }, [club]);

  // --- 3. 数据加载 (缓存优先 + 异步重算) ---
  useEffect(() => {
    if (club) {
      localStorage.setItem('h2h_club', JSON.stringify(club));
      
      // A. 读取本地缓存 (实现秒开)
      const cachedP = localStorage.getItem(`cache_players_${club.id}`);
      const cachedM = localStorage.getItem(`cache_matches_${club.id}`);
      if (cachedP) setPlayers(JSON.parse(cachedP));
      if (cachedM) setMatches(JSON.parse(cachedM));

      // B. 云端同步并全量重算积分 (确保数据自愈)
      const initData = async () => {
        try {
          const [p, m] = await Promise.all([
            getPlayers(club.id),
            getMatches(club.id)
          ]);
          
          // 根据最新战绩重跑一遍积分逻辑
          const finalizedPlayers = recalculateAllElo(p, m);
          
          setPlayers(finalizedPlayers);
          setMatches(m);

          localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(finalizedPlayers));
          localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(m));
        } catch (err) {
          console.error('同步失败');
        }
      };
      initData();

      // C. 更新历史俱乐部列表
      const historySaved = localStorage.getItem('h2h_club_history');
      let history: Club[] = historySaved ? JSON.parse(historySaved) : [];
      if (!history.find(c => c.id === club.id)) {
        history = [club, ...history].slice(0, 5);
        localStorage.setItem('h2h_club_history', JSON.stringify(history));
      }
    }
  }, [club]);

  // --- 4. H2H 计算逻辑 ---
  const h2hMatches = useMemo(() => {
    if (selectedTeam1.length === 0 || selectedTeam2.length === 0) return [];
    return matches.filter(m => {
      const isT1 = selectedTeam1.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam1.length;
      const isT2 = selectedTeam2.every(id => m.team2.includes(id)) && m.team2.length === selectedTeam2.length;
      const isR1 = selectedTeam1.every(id => m.team2.includes(id)) && m.team2.length === selectedTeam1.length;
      const isR2 = selectedTeam2.every(id => m.team1.includes(id)) && m.team1.length === selectedTeam2.length;
      return (isT1 && isT2) || (isR1 && isR2);
    }).sort((a, b) => b.date - a.date);
  }, [matches, selectedTeam1, selectedTeam2]);

  const stats = useMemo(() => {
    if (h2hMatches.length === 0) return { t1Wins: 0, t2Wins: 0, total: 0 };
    let t1W = 0; let t2W = 0;
    h2hMatches.forEach(m => {
      let m1G = 0; let m2G = 0;
      m.scores.forEach(s => { if (s.team1 > s.team2) m1G++; else if (s.team2 > s.team1) m2G++; });
      const isOurT1 = selectedTeam1.every(id => m.team1.includes(id));
      if (isOurT1) { (m1G > m2G) ? t1W++ : t2W++; }
      else { (m2G > m1G) ? t1W++ : t2W++; }
    });
    return { t1Wins: t1W, t2Wins: t2W, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  // --- 5. 交互处理 ---

  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };
    const newMatches = [matchWithClub, ...matches];

    // 全量重算积分
    const updatedPlayers = recalculateAllElo(players, newMatches);
    
    // 计算积分变动显示
    const oldScore = players.find(p => p.id === newMatch.team1[0])?.elo_rating || 1500;
    const newScore = updatedPlayers.find(p => p.id === newMatch.team1[0])?.elo_rating || 1500;
    setLastMatchResult({ change: newScore - oldScore, newRating: newScore });

    setMatches(newMatches);
    setPlayers(updatedPlayers);

    // 同步云端
    await saveMatchToCloud(matchWithClub);
    const affectedIds = [...newMatch.team1, ...newMatch.team2];
    for (const pid of affectedIds) {
      const pData = updatedPlayers.find(up => up.id === pid);
      if (pData) await savePlayerToCloud(pData);
    }
    setIsAddMatchOpen(false);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!isAdmin) return alert('权限不足：只有俱乐部创建者可以删除战绩！');
    if (!confirm('确定删除这场战绩吗？所有人积分将重算。')) return;

    const newMatches = matches.filter(m => m.id !== id);
    const updatedPlayers = recalculateAllElo(players, newMatches);
    
    setMatches(newMatches);
    setPlayers(updatedPlayers);
    
    await deleteMatchFromCloud(id);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!isAdmin) return alert('权限不足：只有俱乐部创建者可以移除球员！');
    if (!confirm('警告：移除球员将导致其历史数据清空。确定吗？')) return;
    
    await deletePlayerFromCloud(id);
    const newPlayers = players.filter(p => p.id !== id);
    const updatedPlayers = recalculateAllElo(newPlayers, matches);
    setPlayers(updatedPlayers);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 font-sans text-neutral-900">
      {/* Header */}
      <div className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm('退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}} className="p-2 hover:bg-white/10 rounded-full transition-colors"><LogOut size={20} /></button>
            <div>
              <h1 className="text-lg font-black leading-none">{club.name}</h1>
              <p className="text-[10px] opacity-70 font-mono tracking-widest">CODE: {club.invite_code}</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full border border-white/20">
               <ShieldCheck size={12} className="text-yellow-300" />
               <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
            </div>
          )}
        </div>

        <div className="flex px-4 gap-6 text-sm font-bold border-t border-white/10 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('recent')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'recent' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Zap size={16} /> 最近动态</button>
          <button onClick={() => setActiveTab('h2h')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'h2h' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><BarChart3 size={16} /> 对战分析</button>
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
              team1Players={players.filter(p => selectedTeam1.includes(p.id))}
              team2Players={players.filter(p => selectedTeam2.includes(p.id))}
            />
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 ? (
              <MatchList 
                matches={h2hMatches} team1Ids={selectedTeam1} players={players} 
                onDeleteMatch={handleDeleteMatch}
                clubName={club.name} inviteCode={club.invite_code} 
              />
            ) : (
              <div className="text-center py-20 text-neutral-400 font-bold leading-relaxed">
                <Users size={48} className="mx-auto mb-4 opacity-10" />
                <p>选择球员<br/>开始深度对战分析</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
          <RankingList players={players} matches={matches} onViewProfile={setViewingPlayer} />
        )}
      </main>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsAddMatchOpen(true)} className="fixed bottom-8 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white"><Plus size={28} /></motion.button>

      <AnimatePresence>
        {isAddMatchOpen && <AddMatchModal onClose={() => setIsAddMatchOpen(false)} players={players} onAdd={handleAddMatch} />}
        {isPlayerSelectOpen && (
          <PlayerSelectModal 
            side={isPlayerSelectOpen.side} onClose={() => setIsPlayerSelectOpen(null)} players={players} 
            onSelect={(ids) => { if (isPlayerSelectOpen.side === 'team1') setSelectedTeam1(ids); else setSelectedTeam2(ids); setIsPlayerSelectOpen(null); }} 
            onAddPlayer={async (p) => { if(!club) return; const up = {...p, club_id: club.id, elo_rating: 1500}; setPlayers([...players, up]); await savePlayerToCloud(up); }} 
            onUpdatePlayer={async (p) => { setPlayers(players.map(item => item.id === p.id ? p : item)); await savePlayerToCloud(p); }} 
            onDeletePlayer={handleDeletePlayer}
            onViewProfile={setViewingPlayer} currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2} 
          />
        )}
        {viewingPlayer && (
          <PlayerProfileModal player={viewingPlayer} matches={matches} players={players} onClose={() => setViewingPlayer(null)} />
        )}
        {lastMatchResult && (
          <RatingChangeModal change={lastMatchResult.change} newRating={lastMatchResult.newRating} onClose={() => setLastMatchResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
