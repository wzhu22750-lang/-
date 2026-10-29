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
import { recalculateAllElo } from './lib/elo';
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
  Copy,
  Check,
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
    changes: Array<{
      playerId: string;
      name: string;
      initials: string;
      avatar?: string;
      oldRating: number;
      newRating: number;
      change: number;
    }>;
    winner: 'team1' | 'team2' | 'tie';
  } | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [prefillTeams, setPrefillTeams] = useState<{ team1: string[]; team2: string[] } | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [categories, setCategories] = useState<MatchCategory[]>([]);
  const [isCategoryManageOpen, setIsCategoryManageOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // --- 2. 权限与跳转逻辑 ---
  const isAdmin = useMemo(() => {
    if (!club) return false;
    const savedTokens = localStorage.getItem('h2h_manager_tokens');
    if (!savedTokens) return false;
    try {
      const tokens = JSON.parse(savedTokens);
      if (!tokens[club.id]) return false;
      return !club.manager_token || tokens[club.id] === club.manager_token;
    } catch {
      return false;
    }
  }, [club]);

  // 点击档案对手头像后的跳转对比逻辑
  const handleCompareH2H = (p1Id: string, p2Id: string) => {
    setSelectedTeam1([p1Id]);
    setSelectedTeam2([p2Id]);
    setActiveTab('h2h');
    setViewingPlayer(null);
  };

  const handleCopyCode = () => {
    if (!club) return;
    navigator.clipboard?.writeText(club.invite_code).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1800);
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

          let cats = rawCats;
          if (cats.length === 0) {
            const defaults: MatchCategory[] = [
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '常规赛', k_multiplier: 1.0, sort_order: 0 },
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '挑战赛', k_multiplier: 1.5, sort_order: 1, require_elo_gap: true },
              { id: Math.random().toString(36).substr(2, 9), club_id: club.id, name: '白羽惜别羽毛球赛', k_multiplier: 2.0, sort_order: 2 },
            ];
            await Promise.all(defaults.map((c) => saveMatchCategory(c)));
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
      if (!history.find((c) => c.id === club.id)) {
        history = [club, ...history].slice(0, 5);
        localStorage.setItem('h2h_club_history', JSON.stringify(history));
      }
    }
  }, [club]);

  // --- 4. H2H 计算逻辑 ---
  const h2hMatches = useMemo(() => {
    if (selectedTeam1.length === 0 || selectedTeam2.length === 0) return [];
    return matches
      .filter((m) => {
        const isT1 = selectedTeam1.every((id) => m.team1.includes(id)) && m.team1.length === selectedTeam1.length;
        const isT2 = selectedTeam2.every((id) => m.team2.includes(id)) && m.team2.length === selectedTeam2.length;
        const isR1 = selectedTeam1.every((id) => m.team2.includes(id)) && m.team2.length === selectedTeam1.length;
        const isR2 = selectedTeam2.every((id) => m.team1.includes(id)) && m.team1.length === selectedTeam2.length;
        return (isT1 && isT2) || (isR1 && isR2);
      })
      .sort((a, b) => b.date - a.date);
  }, [matches, selectedTeam1, selectedTeam2]);

  const stats = useMemo(() => {
    if (h2hMatches.length === 0) return { t1Wins: 0, t2Wins: 0, total: 0 };
    let t1W = 0;
    let t2W = 0;
    h2hMatches.forEach((m) => {
      let m1G = 0;
      let m2G = 0;
      m.scores.forEach((s) => {
        if (s.team1 > s.team2) m1G++;
        else if (s.team2 > s.team1) m2G++;
      });
      const isOurT1 = selectedTeam1.every((id) => m.team1.includes(id));
      if (isOurT1) {
        m1G > m2G ? t1W++ : t2W++;
      } else {
        m2G > m1G ? t1W++ : t2W++;
      }
    });
    return { t1Wins: t1W, t2Wins: t2W, total: h2hMatches.length };
  }, [h2hMatches, selectedTeam1]);

  // --- 5. 核心交互函数 ---
  const handleAddMatch = async (newMatch: Match) => {
    if (!club || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const matchWithClub = { ...newMatch, club_id: club.id };
      const isEdit = matches.some((m) => m.id === newMatch.id);
      const newMatches = isEdit
        ? matches.map((m) => (m.id === newMatch.id ? matchWithClub : m))
        : [matchWithClub, ...matches];
      const updatedPlayers = recalculateAllElo(players, newMatches, club.mode, categories);

      const allIds = [...newMatch.team1, ...newMatch.team2];
      const changes = allIds.map((pid) => {
        const old = players.find((p) => p.id === pid);
        const updated = updatedPlayers.find((p) => p.id === pid);
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

      let t1Games = 0;
      let t2Games = 0;
      newMatch.scores.forEach((s) => {
        if (s.team1 > s.team2) t1Games++;
        else if (s.team2 > s.team1) t2Games++;
      });

      const isTie = t1Games === t2Games;
      setLastMatchResult({ changes, winner: isTie ? 'tie' : t1Games > t2Games ? 'team1' : 'team2' });
      setMatches(newMatches);
      setPlayers(updatedPlayers);
      await saveMatchToCloud(matchWithClub);
      const affectedIds = [...newMatch.team1, ...newMatch.team2];
      for (const pid of affectedIds) {
        const pData = updatedPlayers.find((up) => up.id === pid);
        if (pData) await savePlayerToCloud(pData);
      }
      setIsAddMatchOpen(false);
      setEditingMatch(null);
      localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(updatedPlayers));
      localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(newMatches));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!club) return;
    if (!confirm('确定删除这场战绩吗？积分将全量重算。')) return;
    const newMatches = matches.filter((m) => m.id !== id);
    const updatedPlayers = recalculateAllElo(players, newMatches, club.mode, categories);
    setMatches(newMatches);
    setPlayers(updatedPlayers);
    localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(updatedPlayers));
    localStorage.setItem(`cache_matches_${club.id}`, JSON.stringify(newMatches));
    await deleteMatchFromCloud(id);
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!club) return;
    if (!isAdmin) return alert('权限不足：只有管理员可以移除球员！');
    if (!confirm('警告：移除球员会导致历史数据同步失效。确定吗？')) return;
    await deletePlayerFromCloud(id);
    const newPlayers = players.filter((p) => p.id !== id);
    const updatedPlayers = recalculateAllElo(newPlayers, matches, club.mode, categories);
    setPlayers(updatedPlayers);
    localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(updatedPlayers));
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  const handleSaveCategory = async (category: MatchCategory) => {
    const updated = categories.some((c) => c.id === category.id)
      ? categories.map((c) => (c.id === category.id ? category : c))
      : [...categories, category];
    setCategories(updated);
    await saveMatchCategory(category);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!club) return;
    const nextCats = categories.filter((c) => c.id !== id);
    setCategories(nextCats);
    await deleteMatchCategory(id);
    const updatedPlayers = recalculateAllElo(players, matches, club.mode, nextCats);
    setPlayers(updatedPlayers);
    localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(updatedPlayers));
    for (const p of updatedPlayers) await savePlayerToCloud(p);
  };

  if (!club) return <ClubSetup onComplete={setClub} />;

  const isTournament = club.mode === 'tournament';

  return (
    <div className="min-h-screen bg-[#f5f6f3] court-light-grid pb-28 font-sans text-[#111814] overflow-x-hidden">
      {/* Top Broadcast Masthead */}
      <header
        className={`text-white sticky top-0 z-50 border-b ${
          isTournament
            ? 'bg-[#26190a] border-amber-500/20'
            : 'bg-[#0c261e] border-emerald-500/15'
        } court-grid-pattern shadow-md`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left: Club Identity & Exit */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => {
                  if (confirm(isTournament ? '切换或退出当前赛事？' : '切换或退出当前俱乐部？')) {
                    localStorage.removeItem('h2h_club');
                    setClub(null);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors shrink-0"
                title="切换球馆"
                aria-label="切换球馆"
              >
                <LogOut size={17} className="text-white/80" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-base sm:text-lg font-extrabold tracking-tight leading-none truncate">
                    {club.name}
                  </h1>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      isTournament
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {isTournament ? '锦标赛' : '俱乐部'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/70 hover:text-white transition-colors"
                    title="点击复制邀请码"
                  >
                    <span>CODE: {club.invite_code}</span>
                    {codeCopied ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-300 text-[10px] font-sans font-bold">
                        <Check size={11} /> 已复制
                      </span>
                    ) : (
                      <Copy size={11} className="opacity-60" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Tools & Admin Badge */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsCategoryManageOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors"
                title="比赛类别与倍率"
                aria-label="比赛类别管理"
              >
                <Tag size={16} className="text-white/80" />
              </button>
              <button
                onClick={() => setIsExportOpen(true)}
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors"
                title="导出备份数据"
                aria-label="数据导出"
              >
                <Download size={16} className="text-white/80" />
              </button>
              {isAdmin && (
                <div className="hidden sm:flex items-center gap-1 bg-amber-400/15 px-2.5 py-1.5 rounded-xl border border-amber-400/30 text-amber-300">
                  <ShieldCheck size={13} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Admin</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-4 pb-2.5 pt-1">
            <nav className="grid grid-cols-3 gap-1.5 bg-black/25 p-1 rounded-2xl border border-white/10">
              {[
                { key: 'recent' as const, label: '赛况动态', icon: Zap, badge: matches.length },
                {
                  key: 'h2h' as const,
                  label: '交手分析',
                  icon: BarChart3,
                  badge: selectedTeam1.length && selectedTeam2.length ? h2hMatches.length : null,
                },
                { key: 'ranking' as const, label: '战力天梯', icon: Award, badge: players.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors duration-150 ${
                      isActive ? 'text-[#111814]' : 'text-white/65 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavTab"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon
                        size={15}
                        className={
                          isActive
                            ? isTournament
                              ? 'text-amber-600'
                              : 'text-[#0b6e4f]'
                            : 'opacity-75'
                        }
                      />
                      <span>{tab.label}</span>
                      {tab.badge !== null && tab.badge > 0 && (
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md tabular-nums ${
                            isActive
                              ? 'bg-[#edf0eb] text-[#5b665f]'
                              : 'bg-white/10 text-white/70'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-2xl mx-auto px-4 pt-5">
        {activeTab === 'recent' && (
          <RecentActivity
            matches={matches}
            players={players}
            onViewProfile={setViewingPlayer}
            onQuickRematch={(m) => {
              setPrefillTeams({ team1: m.team1, team2: m.team2 });
              setIsAddMatchOpen(true);
            }}
            categories={categories}
          />
        )}

        {activeTab === 'h2h' && (
          <div className="space-y-5">
            <H2HHero
              stats={stats}
              team1Names={selectedTeam1.map((id) => players.find((p) => p.id === id)?.name || '').join(' / ')}
              team2Names={selectedTeam2.map((id) => players.find((p) => p.id === id)?.name || '').join(' / ')}
              onSelectTeam1={() => setIsPlayerSelectOpen({ side: 'team1' })}
              onSelectTeam2={() => setIsPlayerSelectOpen({ side: 'team2' })}
              onSwapTeams={() => {
                if (selectedTeam1.length === 0 && selectedTeam2.length === 0) return;
                setSelectedTeam1(selectedTeam2);
                setSelectedTeam2(selectedTeam1);
              }}
              onClearTeams={() => {
                setSelectedTeam1([]);
                setSelectedTeam2([]);
              }}
              onViewProfile={setViewingPlayer}
              team1Empty={selectedTeam1.length === 0}
              team2Empty={selectedTeam2.length === 0}
              team1Players={players.filter((p) => selectedTeam1.includes(p.id))}
              team2Players={players.filter((p) => selectedTeam2.includes(p.id))}
              mode={club.mode}
            />
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 && (
              <H2HTrend matches={h2hMatches} team1Ids={selectedTeam1} />
            )}
            {selectedTeam1.length > 0 && selectedTeam2.length > 0 ? (
              <MatchList
                matches={h2hMatches}
                team1Ids={selectedTeam1}
                players={players}
                onDeleteMatch={handleDeleteMatch}
                onEditMatch={(m) => {
                  setEditingMatch(m);
                  setIsAddMatchOpen(true);
                }}
                clubName={club.name}
                inviteCode={club.invite_code}
                categories={categories}
              />
            ) : (
              <div className="bg-white rounded-[24px] border border-[#dde2dc] p-10 text-center court-card-shadow">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f6f3] border border-[#dde2dc] flex items-center justify-center mx-auto mb-3 text-[#0b6e4f]">
                  <Users size={26} />
                </div>
                <p className="font-bold text-base text-[#111814]">选择双方阵容开启交手分析</p>
                <p className="text-xs text-[#5b665f] mt-1">
                  点击上方 A 队与 B 队卡片，支持单打 1v1 或双打 2v2 历史战绩对比
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
          <RankingList players={players} matches={matches} onViewProfile={setViewingPlayer} />
        )}
      </main>

      {/* Floating Record Match CTA */}
      <div className="fixed bottom-6 right-5 z-40">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            setEditingMatch(null);
            setPrefillTeams(null);
            setIsAddMatchOpen(true);
          }}
          className={`text-white rounded-2xl court-elevated-shadow flex items-center justify-center gap-2 px-5 py-3.5 font-bold text-sm tracking-wide border ${
            isTournament
              ? 'bg-amber-600 hover:bg-amber-700 border-amber-400/40'
              : 'bg-[#0b6e4f] hover:bg-[#095a40] border-emerald-400/30'
          } transition-colors`}
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>记一局</span>
        </motion.button>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddMatchOpen && (
          <AddMatchModal
            onClose={() => {
              setIsAddMatchOpen(false);
              setEditingMatch(null);
              setPrefillTeams(null);
            }}
            players={players}
            onAdd={handleAddMatch}
            editMatch={editingMatch || undefined}
            prefillTeams={prefillTeams || undefined}
            categories={categories}
          />
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
            onAddPlayer={async (p) => {
              if (!club) return;
              const up = { ...p, club_id: club.id, elo_rating: 1500 };
              const nextPlayers = [...players, up];
              setPlayers(nextPlayers);
              localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(nextPlayers));
              await savePlayerToCloud(up);
            }}
            onUpdatePlayer={async (p) => {
              const nextPlayers = players.map((item) => (item.id === p.id ? p : item));
              setPlayers(nextPlayers);
              localStorage.setItem(`cache_players_${club.id}`, JSON.stringify(nextPlayers));
              await savePlayerToCloud(p);
            }}
            onDeletePlayer={handleDeletePlayer}
            onViewProfile={setViewingPlayer}
            currentSelected={isPlayerSelectOpen.side === 'team1' ? selectedTeam1 : selectedTeam2}
          />
        )}
        {viewingPlayer && (
          <PlayerProfileModal
            player={viewingPlayer}
            matches={matches}
            players={players}
            onClose={() => setViewingPlayer(null)}
            onCompareH2H={handleCompareH2H}
          />
        )}
        {lastMatchResult && (
          <RatingChangeModal
            changes={lastMatchResult.changes}
            winner={lastMatchResult.winner}
            onClose={() => setLastMatchResult(null)}
          />
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
