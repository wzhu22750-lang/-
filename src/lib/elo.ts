// src/lib/elo.ts

import { Player, Match } from '../types';

export const INITIAL_ELO = 1500;
const K_FACTOR = 32;

/**
 * 核心逻辑：基于当前所有比赛战绩全量重算球员积分
 * 修复了球员数据丢失可能导致的 NaN 风险
 */
export function recalculateAllElo(players: Player[], matches: Match[]): Player[] {
  // 1. 初始化所有人的积分为初始值
  const ratings: Record<string, number> = {};
  players.forEach(p => {
    ratings[p.id] = INITIAL_ELO;
  });

  // 2. 将比赛按日期从远到近（升序）排列，模拟历史进程
  const sortedMatches = [...matches].sort((a, b) => a.date - b.date);

  // 3. 逐场计算积分变动
  sortedMatches.forEach(match => {
    // 过滤出当前仍存在于球员列表中的 ID，防止引用不存在的球员导致 NaN
    const validT1 = match.team1.filter(id => ratings[id] !== undefined);
    const validT2 = match.team2.filter(id => ratings[id] !== undefined);

    // 如果某一边没有有效球员（比如都被删了），跳过此场比赛计算
    if (validT1.length === 0 || validT2.length === 0) return;

    // 计算两队当前的平均 Elo
    const t1Avg = validT1.reduce((sum, id) => sum + ratings[id], 0) / validT1.length;
    const t2Avg = validT2.reduce((sum, id) => sum + ratings[id], 0) / validT2.length;

    // 判定胜负 (根据小局比分)
    let t1WinGames = 0;
    let t2WinGames = 0;
    match.scores.forEach(s => {
      if (s.team1 > s.team2) t1WinGames++;
      else if (s.team2 > s.team1) t2WinGames++;
    });

    // 如果平局（比如记录不完整或确实战平），不计分
    if (t1WinGames === t2WinGames) return;

    const t1Won = t1WinGames > t2WinGames;

    // 计算分差变动
    // 预期胜率计算公式: E = 1 / (1 + 10^((oppRating - selfRating) / 400))
    const expectedScore1 = 1 / (1 + Math.pow(10, (t2Avg - t1Avg) / 400));
    const actualScore1 = t1Won ? 1 : 0;
    const change = Math.round(K_FACTOR * (actualScore1 - expectedScore1));

    // 更新参与者的积分 (只更新仍存在的球员)
    validT1.forEach(id => {
      ratings[id] += change;
    });
    validT2.forEach(id => {
      ratings[id] -= change;
    });
  });

  // 4. 将最终结果映射回球员对象
  return players.map(p => ({
    ...p,
    elo_rating: ratings[p.id] || INITIAL_ELO
  }));
}

/**
 * 根据积分获取段位及样式信息
 */
export function getPlayerTier(elo: number = 1500) {
  if (elo < 1300) return { label: '羽球萌新', color: 'text-neutral-400', bg: 'bg-neutral-100', rank: 'Bronze' };
  if (elo < 1500) return { label: '球场活跃者', color: 'text-blue-500', bg: 'bg-blue-50', rank: 'Silver' };
  if (elo < 1800) return { label: '竞技高手', color: 'text-yellow-600', bg: 'bg-yellow-50', rank: 'Gold' };
  if (elo < 2100) return { label: '俱乐部大腿', color: 'text-purple-600', bg: 'bg-purple-50', rank: 'Platinum' };
  return { label: '大魔王', color: 'text-red-600', bg: 'bg-red-50', rank: 'Diamond' };
}

/**
 * 计算球员当前的连胜数
 */
export function calculateStreak(playerId: string, matches: Match[]) {
  // 只看包含该球员的比赛，并按时间从新到旧排序
  const playerMatches = matches
    .filter(m => m.team1.includes(playerId) || m.team2.includes(playerId))
    .sort((a, b) => b.date - a.date);

  let streak = 0;
  for (const m of playerMatches) {
    const isT1 = m.team1.includes(playerId);
    let t1G = 0; 
    let t2G = 0;
    m.scores.forEach(s => { 
      if (s.team1 > s.team2) t1G++; 
      else if (s.team2 > s.team1) t2G++; 
    });
    
    const won = isT1 ? t1G > t2G : t2G > t1G;
    if (won) {
      streak++;
    } else {
      break; // 一旦输球或平局，连胜中断
    }
  }
  return streak;
}
