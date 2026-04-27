export const INITIAL_ELO = 1500;
const K_FACTOR = 32;

export function calculateEloChange(team1Avg: number, team2Avg: number, team1Won: boolean) {
  const expectedScore1 = 1 / (1 + Math.pow(10, (team2Avg - team1Avg) / 400));
  const actualScore1 = team1Won ? 1 : 0;
  return Math.round(K_FACTOR * (actualScore1 - expectedScore1));
}

// 新增：根据分数获取段位信息
export function getPlayerTier(elo: number = 1500) {
  if (elo < 1300) return { label: '羽球萌新', color: 'text-neutral-400', bg: 'bg-neutral-100', rank: 'Bronze' };
  if (elo < 1500) return { label: '球场活跃者', color: 'text-blue-500', bg: 'bg-blue-50', rank: 'Silver' };
  if (elo < 1800) return { label: '竞技高手', color: 'text-yellow-600', bg: 'bg-yellow-50', rank: 'Gold' };
  if (elo < 2100) return { label: '俱乐部大腿', color: 'text-purple-600', bg: 'bg-purple-50', rank: 'Platinum' };
  return { label: '大魔王', color: 'text-red-600', bg: 'bg-red-50', rank: 'Diamond' };
}
