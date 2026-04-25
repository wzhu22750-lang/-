
export type MatchType = 'Singles' | 'Doubles';

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  initials: string;
}

export interface GameScore {
  team1: number;
  team2: number;
}

export interface Match {
  id: string;
  date: number; // timestamp
  type: MatchType;
  team1: string[]; // array of player IDs
  team2: string[]; // array of player IDs
  scores: GameScore[];
  tournament?: string;
  location?: string;
}
