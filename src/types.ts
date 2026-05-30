export type MatchType = 'Singles' | 'Doubles';

export interface MatchCategory {
  id: string;
  club_id: string;
  name: string;
  k_multiplier: number;
  sort_order: number;
}

export interface Club {
  id: string;
  name: string;
  invite_code: string;
  manager_token?: string;
  mode?: 'club' | 'tournament';
  categories?: MatchCategory[];
}

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
  club_id: string;
  elo_rating?: number;
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
  club_id: string;
  category_id?: string;
  video_url?: string; // 预留视频录像字段
}
