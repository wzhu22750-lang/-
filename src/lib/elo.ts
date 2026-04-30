import { Player, Match } from '../types';

export const INITIAL_ELO = 1500;
const K_FACTOR = 32; // 单场比赛最大积分变动

/**
 * 1. 计算单场 ELO 变动
 */
export function calculateEloChange(team1Avg: number, team2Avg: number, team1Won: boolean) {
  const expectedScore1 = 1 / (1 + Math.pow(10, (team2Avg - team1Avg) / 400));
  const actualScore1 = team1Won ? 1 : 0;
  return Math.round(K_FACTOR * (actualScore1 - expectedScore1));
}

/**
 * 2. 全量重算所有球员积分 (核心：解决删除记录积分不退回的问题)
 */
export function recalculateAllElo(allPlayers: Player[], allMatches: Match[]): Player[] {
  // 初始化：所有人回到 1500 分
  const updatedPlayers = allPlayers.map(p => ({ ...p, elo_rating: 1500 }));

  // 排序：必须按时间从旧到新计算，模拟历史演进
  const sortedMatches = [...allMatches].sort((a, b) => a.date - b.date);

  sortedMatches.forEach(match => {
    const team1Ids = match.team1;
    const team2Ids = match.team2;

    const t1Players = updatedPlayers.filter(p => team1Ids.includes(p.id));
    const t2Players = updatedPlayers.filter(p => team2Ids.includes(p.id));

    if (t1Players.length > 0 && t2Players.length > 0) {
      // 计算两队当时的平均分
      const t1Avg = t1Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / t1Players.length;
      const t2Avg = t2Players.reduce((sum, p) => sum + (p.elo_rating || 1500), 0) / t2Players.length;

      // 计算胜负
      let t1Games = 0; let t2Games = 0;
      match.scores.forEach(s => { 
        if (s.team1 > s.team2) t1Games++; 
        else if (s.team2 > s.team1) t2Games++; 
      });
      
      const change = calculateEloChange(t1Avg, t2Avg, t1Games > t2Games);

      // 将变动应用到 updatedPlayers 数组中
      updatedPlayers.forEach(p => {
        if (team1Ids.includes(p.id)) p.elo_rating = (p.elo_rating || 1500) + change;
        if (team2Ids.includes(p.id)) p.elo_rating = (p.elo_rating || 1500) - change;
      });
    }
  });

  return updatedPlayers;
}

/**
 * 3. 计算球员当前的连胜数 (用于显示火苗勋章)
 */
export function calculateStreak(playerId: string, matches: Match[]) {
  const playerMatches = matches
    .filter(m => m.team1.includes(playerId) || m.team2.includes(playerId))
    .sort((a, b) => b.date - a.date); // 倒序：从最近的看起

  let streak = 0;
  for (const m of playerMatches) {
    const isT1 = m.team1.includes(playerId);
    let t1G = 0; let t2G = 0;
    m.scores.forEach(s => { 
      if (s.team1 > s.team2) t1G++; 
      else if (s.team2 > s.team1) t2G++; 
    });
    
    const won = isT1 ? t1G > t2G : t2G > t1G;
    if (won) {
      streak++;
    } else {
      break; // 只要输一场，连胜立刻终止
    }
  }
  return streak;
}

/**
 * 4. 段位识别系统 (用于个人档案展示)
 */
export function getPlayerTier(elo: number = 1500) {
  if (elo < 1300) return { label: '羽球萌新', color: 'text-neutral-400', bg: 'bg-neutral-100', rank: 'Bronze' };
  if (elo < 1500) return { label: '活跃球友', color: 'text-blue-500', bg: 'bg-blue-50', rank: 'Silver' };
  if (elo < 1800) return { label: '竞技高手', color: 'text-yellow-600', bg: 'bg-yellow-50', rank: 'Gold' };
  if (elo < 2100) return { label: '俱乐部大腿', color: 'text-purple-600', bg: 'bg-purple-50', rank: 'Platinum' };
  return { label: '一代宗师', color: 'text-red-600', bg: 'bg-red-50', rank: 'Diamond' };
}
