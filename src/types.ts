export type MatchType = 'Singles' | 'Doubles';

export interface Club {
  id: string;
  name: string;
  invite_code: string;
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  club_id: string; // 必须关联俱乐部
  elo_rating?: number; // 预留给积分系统
}

export interface GameScore {
  team1: number;
  team2: number;
}

export interface Match {
  id: string;
  date: number;
  type: MatchType;
  team1: string[];
  team2: string[];
  scores: GameScore[];
  tournament?: string;
  club_id: string; // 必须关联俱乐部
}
