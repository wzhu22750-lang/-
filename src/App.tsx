import { useState, useEffect, useMemo } from 'react';
import { Player, Match, Club, MatchCategory } from './types';
import {
  getPlayers,
  getMatches,
  savePlayerToCloud,
  saveMatchToCloud,
  deletePlayerFromCloud,
  deleteMatchFromCloud,
  getMatchCategories,
  saveMatchCategory,
  deleteMatchCategory,
} from './lib/storage';
import { calculateEloChange, recalculateAllElo } from './lib/elo';
import {
  Plus,
  Users,
  LogOut,
  Award,
  BarChart3,
  Zap,
  ShieldCheck,
  Download,
  Tag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// 组件导入
import { MatchList } from './components/MatchList';
import { H2HHero } from './components/H2HHero';
import { H2HTrend } from './components/H2HTrend';
import { AddMatchModal } from './components/AddMatchModal';
import { PlayerSelectModal } from './components/PlayerSelectModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ClubSetup } from './components/ClubSetup';
import { DataExportModal } from './components/DataExportModal';
import { RankingList } from './components/RankingList';
import { RecentActivity } from './components/RecentActivity';
import { RatingChangeModal } from './components/RatingChangeModal';
import { CategoryManageModal } from './components/CategoryManageModal';

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
  const [lastMatchResult, setLastMatchResult] = useState<{
    changes: Array<{ playerId: string; name: string; initials: string; avatar?: string; oldRating: number; newRating: number; change: number }>;
    winner: 'team1' | 'team2';
  } | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [prefillTeams, setPrefillTeams] = useState<{ team1: string[]; team2: string[] } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [categories, setCategories] = useState<MatchCategory[]>([]);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);

  // --- 2. 权限与跳转逻辑 ---
  const isAdmin = useMemo(() => {
    if (!club || !club.manager_token) return false;
    const savedTokens = localStorage.getItem('h2h_manager_tokens');
    if (!savedTokens) return false;
    const tokens = JSON.parse(savedTokens);
    return tokens[club.id] === club.manager_token;
  }, [club]);

  // 【新增】：点击档案对手头像后的跳转对比逻辑
  const handleCompareH2H = (p1Id: string, p2Id: string) => {
    setSelectedTeam1([p1Id]);
    setSelectedTeam2([p2Id]);
    setActiveTab('h2h'); // 自动切换标签
    setViewingPlayer(null); // 关闭档案模态框
  };

  // --- 3. 数据同步与加载 ---
  useEffect(() => {
    if (club) {
      localStorage.setItem('h2h_club', JSON.stringify(club));
      const cachedP = localStorage.getItem(`cache_players_${club.id}`);
      const cachedM = localStorage.getItem(`cache_matches_${club.id}`);
      if (cachedP) setPlayers(JSON.parse(cachedP));
      if (cachedM) setMatches(JSON.parse(cachedM));

      const initData = async () => {
        try {
          const [p, m, rawCats] = await Promise.all([
            getPlayers(club.id),
            getMatches(club.id),
            getMatchCategories(club.id),
          ]);

          // 老俱乐部自动补种默认类别
          let cats = rawCats;
          if (cats.length === 0) {
            const defaults: MatchCategory[] = [
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '常规赛', k_multiplier: 1.0, sort_order: 0 },
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '挑战赛', k_multiplier: 1.5, sort_order: 1 },
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '白羽惜别羽毛球赛', k_multiplier: 2.0, sort_order: 2 },
            ];
            await Promise.all(defaults.map(c => saveMatchCategory(c)));
            cats = defaults;
          }
          setCategories(cats);
          const finalizedPlayers = recalculateAllElo(p, m, club.mode, cats);
          setPlayers(finalizedPlayers);
          setMatches(m);
          localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(finalizedPlayers));
          localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(m));
        } catch (err) {
          console.error('同步失败');
        }
      };
      initData();

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

  // --- 5. 核心交互函数 ---
  const handleAddMatch = async (newMatch: Match) => {
    if (!club) return;
    const matchWithClub = { ...newMatch, club_id: club.id };
    const isEdit = matches.some(m => m.id === newMatch.id);
    const newMatches = isEdit
      ? matches.map(m => m.id === newMatch.id ? matchWithClub : m)
      : [matchWithClub, ...matches];
    const updatedPlayers = recalculateAllElo(players, newMatches, club.mode, categories);

    // 计算所有参赛球员的 ELO 变化
    const allIds = [...newMatch.team1, ...newMatch.team2];
    const changes = allIds.map(pid => {
      const old = players.find(p => p.id === pid);
      const updated = updatedPlayers.find(p => p.id === pid);
      return {
        playerId: pid,
        name: updated?.name || old?.name || 'Unknown',
        initials: updated?.initials || old?.initials || '?',
        avatar: updated?.avatar || old?.avatar,
        oldRating: old?.elo_rating || 1500,
        newRating: updated?.elo_rating || 1500,
        change: (updated?.elo_rating || 1500) - (old?.elo_rating || 1500),
      };
    });

    // 判定胜负（与 recalculateAllElo 一致：比局数）
    let t1Games = 0; let t2Games = 0;
    newMatch.scores.forEach(s => {
      if (s.team1 > s.team2) t1Games++;
      else if (s.team2 > s.team1) t2Games++;
    });

    setLastMatchResult({ changes, winner: t1Games > t2Games ? 'team1' : 'team2' });
    setMatches(newMatches);
    setPlayers(updatedPlayers);
    await saveMatchToCloud(matchWithClub);
    const affectedIds = [...newMatch.team1, ...newMatch.team2];
    for (const pid of affectedIds) {
      const pData = updatedPlayers.find(up => up.id === pid);
      if (pData) await savePlayerToCloud(pData);
    }
    setIsAddMatchOpen(false);
    setEditingMatch(null);
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('确定删除这场战绩吗？积分将全量重算。')) return;
    const newMatches = matches.filter(m => m.id !== id);
    const updatedPlayers = recalculateAllElo(players, newMatches, club.mode, categories);
    setMatches(newMatches);
    setPlayers(updatedPlayers);
    await deleteMatchFromCloud(id);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!isAdmin) return alert('权限不足：只有管理员可以移除球员！');
    if (!confirm('警告：移除球员会导致历史数据同步失效。确定吗？')) return;
    await deletePlayerFromCloud(id);
    const newPlayers = players.filter(p => p.id !== id);
    const updatedPlayers = recalculateAllElo(newPlayers, matches, club.mode, categories);
    setPlayers(updatedPlayers);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  const handleSaveCategory = async (category: MatchCategory) => {
    const updated = categories.some(c => c.id === category.id)
      ? categories.map(c => c.id === category.id ? category : c)
      : [...categories, category];
    setCategories(updated);
    await saveMatchCategory(category);
  };

  const handleDeleteCategory = async (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    await deleteMatchCategory(id);
    // 重算所有比赛（移除已删除类别的引用）
    const updatedPlayers = recalculateAllElo(players, matches, club!.mode, categories.filter(c => c.id !== id));
    setPlayers(updatedPlayers);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  if (!club) return <ClubSetup onComplete={setClub} />;

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 font-sans text-neutral-900 overflow-x-hidden">
      {/* Header */}
      <div className={`text-white sticky top-0 z-50 shadow-lg ${club.mode === 'tournament' ? 'bg-amber-600' : 'bg-red-600'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => { if(confirm(club.mode === 'tournament' ? '退出比赛？' : '退出俱乐部？')) { localStorage.removeItem('h2h_club'); setClub(null); }}} className="p-2 hover:bg-white/10 rounded-full transition-colors"><LogOut size={20} /></button>
            <div>
              <h1 className="text-lg font-black leading-none italic">
                {club.name}
                {club.mode === 'tournament' && <span className="ml-2 text-[10px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded align-middle">比赛</span>}
              </h1>
              <p className="text-[10px] opacity-70 font-mono tracking-widest leading-none mt-1">CODE: {club.invite_code}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsExportOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="数据导出">
              <Download size={16} className="text-white/60" />
            </button>
            <button onClick={() => setIsCategoryManageOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="比赛类别管理">
              <Tag size={16} className="text-white/60" />
            </button>
            {isAdmin && (
              <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full border border-white/20">
                 <ShieldCheck size={12} className="text-yellow-300" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Admin</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex px-4 gap-6 text-sm font-bold border-t border-white/10 overflow-x-auto no-scrollbar bg-black/5">
          <button onClick={() => setActiveTab('recent')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'recent' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Zap size={16} /> 最近动态</button>
          <button onClick={() => setActiveTab('h2h')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'h2h' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><BarChart3 size={16} /> 交手分析</button>
          <button onClick={() => setActiveTab('ranking')} className={`flex items-center gap-2 py-3 border-b-2 shrink-0 transition-all ${activeTab === 'ranking' ? 'border-white text-white' : 'border-transparent text-white/50'}`}><Award size={16} /> 战力排行</button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 mt-6">
        {activeTab === 'recent' && (
          <RecentActivity matches={matches} players={players} onViewProfile={setViewingPlayer} onQuickRematch={(m) => { setPrefillTeams({ team1: m.team1, team2: m.team2 }); setIsAddMatchOpen(true); }} categories={categories} />
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
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 && (
              <H2HTrend matches={h2hMatches} team1Ids={selectedTeam1} />
            )}
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 ? (
              <MatchList
                matches={h2hMatches} team1Ids={selectedTeam1} players={players}
                onDeleteMatch={handleDeleteMatch}
                onEditMatch={(m) => { setEditingMatch(m); setIsAddMatchOpen(true); }}
                clubName={club.name} inviteCode={club.invite_code}
                categories={categories}
              />
            ) : (
              <div className="text-center py-20 text-neutral-400 font-bold leading-relaxed"><Users size={48} className="mx-auto mb-4 opacity-10" /><p>选择球员开始深度对战分析</p></div>
            )}
          </div>
        )}
        {activeTab === 'ranking' && <RankingList players={players} matches={matches} onViewProfile={setViewingPlayer} />}
      </main>

      {/* FAB */}
      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setEditingMatch(null); setPrefillTeams(null); setIsAddMatchOpen(true); }} className={`fixed bottom-8 right-6 text-white rounded-full shadow-2xl flex items-center justify-center gap-2 z-40 border-[3px] border-white px-5 py-3.5 font-black text-sm tracking-wide ${club.mode === 'tournament' ? 'bg-amber-600' : 'bg-red-600'}`}><Plus size={22} /> 录比赛</motion.button>

      {/* Modals */}
      <AnimatePresence>
        {isAddMatchOpen && <AddMatchModal onClose={() => { setIsAddMatchOpen(false); setEditingMatch(null); setPrefillTeams(null); }} players={players} onAdd={handleAddMatch} editMatch={editingMatch || undefined} prefillTeams={prefillTeams || undefined} categories={categories} />}
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
          <PlayerProfileModal 
            player={viewingPlayer} matches={matches} players={players} 
            onClose={() => setViewingPlayer(null)} 
            onCompareH2H={handleCompareH2H} // 【关键传值】
          />
        )}
        {lastMatchResult && (
          <RatingChangeModal changes={lastMatchResult.changes} winner={lastMatchResult.winner} onClose={() => setLastMatchResult(null)} />
        )}
        {isExportOpen && (
          <DataExportModal players={players} matches={matches} onClose={() => setIsExportOpen(false)} />
        )}
        {isCategoryManageOpen && (
          <CategoryManageModal
            categories={categories}
            clubId={club.id}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            onClose={() => setIsCategoryManageOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
