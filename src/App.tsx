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
import { calculateEloChange, recalculateAllElo } from './lib/elo'; // 确保 elo.ts 有这两个函数
import { 
  Plus, 
  Users, 
  LogOut, 
  Award, 
  BarChart3, 
  Zap,
  Trophy
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

  // --- 2. 核心加载逻辑 (秒开策略) ---
  useEffect(() => {
    if (!club) return;

    // A. 立即执行：保存当前俱乐部并加载本地缓存
    localStorage.setItem('h2h_club', JSON.stringify(club));
    const cachedP = localStorage.getItem(`cache_players_${club.id}`);
    const cachedM = localStorage.getItem(`cache_matches_${club.id}`);
    if (cachedP) setPlayers(JSON.parse(cachedP));
    if (cachedM) setMatches(JSON.parse(cachedM));

    // B. 后台异步执行：从云端刷新数据
    const refreshData = async () => {
      try {
        const [cloudPlayers, cloudMatches] = await Promise.all([
          getPlayers(club.id),
          getMatches(club.id)
        ]);
        
        // 使用全量重算确保积分绝对准确（解决删除记录积分不退回的问题）
        const finalizedPlayers = recalculateAllElo(cloudPlayers, cloudMatches);
        
        setPlayers(finalizedPlayers);
        setMatches(cloudMatches);
        
        // 更新缓存
        localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(finalizedPlayers));
        localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(cloudMatches));
      } catch (err) {
        console.error('同步失败，已切换至离线模式');
      }
    };
    refreshData();

    // C. 维护历史记录
    const historySaved = localStorage.getItem('h2h_club_history');
    let history: Club[] = historySaved ? JSON.parse(historySaved) : [];
    if (!history.find(c => c.id === club.id)) {
      history = [club, ...history].slice(0, 5);
      localStorage.setItem('h2h_club_history', JSON.stringify(history));
    }
  }, [club]);

  // --- 3. H2H 计算逻辑 ---
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
    let t1Wins = 0; let t2Wins = 0;
    h2hMatches.forEach(m => {
      let m1G = 0; let m2G = 0;
      m.scores.forEach(s => { if (s.team1 > s.team2) m1G++; else if (s.team2 > s.team1) m2G++; });
      const isOurT1 = selectedTeam1.every(id => m.team1.includes(id));
      if (isOurT1) { (m1G > m2G) ? t1Wins++ : t2Wins++; }
      else { (m2G > m1G) ? t1Wins++ : t2Wins++; }
    });
    return { t1Wins, t2Wins, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  // --- 4. 交互处理 ---

  // 发布比赛逻辑：采用重算模式
  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };
    const newMatches = [matchWithClub, ...matches];

    // 全量重算获取新积分
    const updatedPlayers = recalculateAllElo(players, newMatches);
    
    // 找出积分变动用于弹窗显示 (取 Team1 第一人为例)
    const oldScore = players.find(p => p.id === newMatch.team1[0])?.elo_rating || 1500;
    const newScore = updatedPlayers.find(p => p.id === newMatch.team1[0])?.elo_rating || 1500;
    
    setLastMatchResult({ change: newScore - oldScore, newRating: newScore });
    setMatches(newMatches);
    setPlayers(updatedPlayers);

    // 云端同步
    await saveMatchToCloud(matchWithClub);
    const affectedIds = [...newMatch.team1, ...newMatch.team2];
    for (const pid of affectedIds) {
      const pData = updatedPlayers.find(up => up.id === pid);
      if (pData) await savePlayerToCloud(pData);
    }
    setIsAddMatchOpen(false);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('确定删除？积分将重新计算。')) return;
    const newMatches = matches.filter(m => m.id !== id);
    const updatedPlayers = recalculateAllElo(players, newMatches);
    
    setMatches(newMatches);
    setPlayers(updatedPlayers);
    
    await deleteMatchFromCloud(id);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 font-sans text-neutral-900">
      {/* 顶部导航 */}
      <div className="bg-red-600 text-white sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm('退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <LogOut size={20} />
            </button>
            <div>
              <h1 className="text-lg font-black leading-none">{club.name}</h1>
              <p className="text-[10px] opacity-70 font-mono">CODE: {club.invite_code}</p>
            </div>
          </div>
          <div className="bg-black/20 rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase italic">Live Sync</span>
          </div>
        </div>

        <div className="flex px-4 gap-6 text-sm font-bold border-t border-white/10 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('recent')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'recent' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Zap size={16} /> 最近动态</button>
          <button onClick={() => setActiveTab('h2h')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'h2h' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><BarChart3 size={16} /> 交手分析</button>
          <button onClick={() => setActiveTab('ranking')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'ranking' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Award size={16} /> 战力排行</button>
        </div>
      </div>

      {/* 主内容 */}
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

      {/* 悬浮按钮 */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} 
        onClick={() => setIsAddMatchOpen(true)} 
        className="fixed bottom-8 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 border-4 border-white"
      >
        <Plus size={28} />
      </motion.button>

      {/* 所有的模态框 */}
      <AnimatePresence>
        {isAddMatchOpen && <AddMatchModal onClose={() => setIsAddMatchOpen(false)} players={players} onAdd={handleAddMatch} />}
        
        {isPlayerSelectOpen && (
          <PlayerSelectModal 
            side={isPlayerSelectOpen.side} onClose={() => setIsPlayerSelectOpen(null)} players={players} 
            onSelect={(ids) => { if (isPlayerSelectOpen.side === 'team1') setSelectedTeam1(ids); else setSelectedTeam2(ids); setIsPlayerSelectOpen(null); }} 
            onAddPlayer={async (p) => { if(!club) return; const up = {...p, club_id: club.id, elo_rating: 1500}; setPlayers([...players, up]); await savePlayerToCloud(up); }} 
            onUpdatePlayer={async (p) => { setPlayers(players.map(item => item.id === p.id ? p : item)); await savePlayerToCloud(p); }} 
            onDeletePlayer={async (id) => { if(!confirm('删除球员？')) return; await deletePlayerFromCloud(id); setPlayers(players.filter(p => p.id !== id)); }} 
            onViewProfile={setViewingPlayer} currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2} 
          />
        )}

        {viewingPlayer && (
          <PlayerProfileModal player={viewingPlayer} matches={matches} players={players} onClose={() => setViewingPlayer(null)} />
        )}

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
