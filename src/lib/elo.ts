// src/lib/elo.ts

export const INITIAL_ELO = 1500;
const K_FACTOR = 32; // 每次比赛积分变动的最大幅度

/**
 * 计算 ELO 变动
 * @param team1Avg 队伍1的平均分
 * @param team2Avg 队伍2的平均分
 * @param team1Won 队伍1是否获胜
 */
export function calculateEloChange(team1Avg: number, team2Avg: number, team1Won: boolean) {
  const expectedScore1 = 1 / (1 + Math.pow(10, (team2Avg - team1Avg) / 400));
  const actualScore1 = team1Won ? 1 : 0;
  
  return Math.round(K_FACTOR * (actualScore1 - expectedScore1));
}
