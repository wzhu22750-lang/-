import { Player, Match, MatchCategory } from '../types';

export const INITIAL_ELO = 1500;
const K_FACTOR = 32;
const PROVISIONAL_MATCHES = 15;
const PROVISIONAL_K = 48;

function getScoreMarginFactor(scores: { team1: number; team2: number }[]): number {
  if (scores.length === 0) return 1.0;
  const avgMargin = scores.reduce((sum, s) => sum + Math.abs(s.team1 - s.team2), 0) / scores.length;
  // Continuous linear interpolation: 0.6 at margin=0, 1.4 at margin=15+
  const min = 0.6;
  const max = 1.4;
  const factor = min + ((max - min) * Math.min(avgMargin, 15)) / 15;
  return Math.round(factor * 100) / 100;
}

export function getProvisionalK(matchCount: number, mode: 'club' | 'tournament' = 'club'): number {
  if (mode === 'tournament') return K_FACTOR;
  if (matchCount >= PROVISIONAL_MATCHES) return K_FACTOR;
  const ratio = matchCount / PROVISIONAL_MATCHES;
  return Math.round(PROVISIONAL_K - ratio * (PROVISIONAL_K - K_FACTOR));
}

/**
 * BO赛制统治力系数：赢得越干脆/越激烈，加成越多
 */
export function getBOFactor(boFormat: string | undefined, winnerGames: number, loserGames: number): number {
  if (!boFormat || boFormat === 'BO1') return 1.0;

  if (boFormat === 'BO3') {
    if (winnerGames === 2 && loserGames === 0) return 1.3;  // 横扫
    if (winnerGames === 2 && loserGames === 1) return 1.2;  // 激战三局
  }

  if (boFormat === 'BO5') {
    if (winnerGames === 3 && loserGames === 0) return 1.4;  // 碾压
    if (winnerGames === 3 && loserGames === 1) return 1.3;  // 强势
    if (winnerGames === 3 && loserGames === 2) return 1.2;  // 五局史诗大战
  }

  return 1.0;
}

/**
 * 1. 计算单场 ELO 变动
 */
export function calculateEloChange(team1Avg: number, team2Avg: number, team1Won: boolean, k: number = K_FACTOR) {
  const expectedScore1 = 1 / (1 + Math.pow(10, (team2Avg - team1Avg) / 400));
  const actualScore1 = team1Won ? 1 : 0;
  return Math.round(k * (actualScore1 - expectedScore1));
}

/**
 * 2. 全量重算所有球员积分 (按时间顺序重放比赛，支持临时 K 因子)
 */
export function recalculateAllElo(allPlayers: Player[], allMatches: Match[], mode: 'club' | 'tournament' = 'club', categories: MatchCategory[] = []): Player[] {
  const updatedPlayers = allPlayers.map(p => ({ ...p, elo_rating: 1500 }));
  const playerMatchCounts = new Map<string, number>();

  const categoryMultipliers = new Map<string, number>();
  categories.forEach(c => categoryMultipliers.set(c.id, c.k_multiplier));

  const sortedMatches = [...allMatches].sort((a, b) => a.date - b.date);

  sortedMatches.forEach(match => {
    const team1Ids = match.team1;
    const team2Ids = match.team2;

    const t1Players = updatedPlayers.filter(p => team1Ids.includes(p.id));
    const t2Players = updatedPlayers.filter(p => team2Ids.includes(p.id));

    if (t1Players.length > 0 && t2Players.length > 0) {
      const t1Avg = t1Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / t1Players.length;
      const t2Avg = t2Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / t2Players.length;

      let t1Games = 0; let t2Games = 0;
      match.scores.forEach(s => {
        if (s.team1 > s.team2) t1Games++;
        else if (s.team2 > s.team1) t2Games++;
      });

      // 平局跳过，不产生 ELO 变化
      if (t1Games === t2Games) {
        [...team1Ids, ...team2Ids].forEach(pid => {
          playerMatchCounts.set(pid, (playerMatchCounts.get(pid) || 0) + 1);
        });
        return;
      }

      let k = K_FACTOR;
      if (mode === 'tournament') {
        k = Math.round(K_FACTOR * getScoreMarginFactor(match.scores));
      } else {
        // 俱乐部模式：根据球员平均参赛场次使用临时 K 因子
        const t1Counts = t1Players.map(p => playerMatchCounts.get(p.id) || 0);
        const t2Counts = t2Players.map(p => playerMatchCounts.get(p.id) || 0);
        const allCounts = [...t1Counts, ...t2Counts];
        const avgCount = allCounts.reduce((s, c) => s + c, 0) / allCounts.length;
        k = getProvisionalK(Math.floor(avgCount), mode);
      }

      // 叠加比赛类别系数
      const catMultiplier = match.category_id ? (categoryMultipliers.get(match.category_id) ?? 1.0) : 1.0;
      k = Math.round(k * catMultiplier);

      // 叠加BO赛制系数
      const winnerGames = t1Games > t2Games ? t1Games : t2Games;
      const loserGames = t1Games > t2Games ? t2Games : t1Games;
      k = Math.round(k * getBOFactor(match.bo_format, winnerGames, loserGames));

      const change = calculateEloChange(t1Avg, t2Avg, t1Games > t2Games, k);

      updatedPlayers.forEach(p => {
        if (team1Ids.includes(p.id)) p.elo_rating = (p.elo_rating || 1500) + change;
        if (team2Ids.includes(p.id)) p.elo_rating = (p.elo_rating || 1500) - change;
      });
    }

    // 增加所有参赛球员的场次计数（每场比赛之后）
    [...team1Ids, ...team2Ids].forEach(pid => {
      playerMatchCounts.set(pid, (playerMatchCounts.get(pid) || 0) + 1);
    });
  });

  return updatedPlayers;
}

/**
 * 3. 计算球员当前的连胜数
 */
export function calculateStreak(playerId: string, matches: Match[]) {
  const playerMatches = matches
    .filter(m => m.team1.includes(playerId) || m.team2.includes(playerId))
    .sort((a, b) => b.date - a.date);

  let streak = 0;
  for (const m of playerMatches) {
    const isT1 = m.team1.includes(playerId);
    let t1G = 0; let t2G = 0;
    m.scores.forEach(s => {
      if (s.team1 > s.team2) t1G++;
      else if (s.team2 > s.team1) t2G++;
    });

    // 平局终止连胜
    if (t1G === t2G) break;
    const won = isT1 ? t1G > t2G : t2G > t1G;
    if (won) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * 4. 段位识别系统
 */
export function getPlayerTier(elo: number = 1500) {
  if (elo < 1300) return { label: '羽球萌新', color: 'text-neutral-400', bg: 'bg-neutral-100', rank: 'Bronze' };
  if (elo < 1500) return { label: '活跃球友', color: 'text-blue-500', bg: 'bg-blue-50', rank: 'Silver' };
  if (elo < 1800) return { label: '竞技高手', color: 'text-yellow-600', bg: 'bg-yellow-50', rank: 'Gold' };
  if (elo < 2100) return { label: '俱乐部大腿', color: 'text-purple-600', bg: 'bg-purple-50', rank: 'Platinum' };
  return { label: '一代宗师', color: 'text-red-600', bg: 'bg-red-50', rank: 'Diamond' };
}

export function getStartOfThisWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

export function getLastMatchDate(playerId: string, matches: Match[]): number | null {
  const playerMatches = matches.filter(m => m.team1.includes(playerId) || m.team2.includes(playerId));
  if (playerMatches.length === 0) return null;
  return Math.max(...playerMatches.map(m => m.date));
}
