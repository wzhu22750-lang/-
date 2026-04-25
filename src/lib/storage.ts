
import { Player, Match } from '../types';

const PLAYERS_KEY = 'h2h_players';
const MATCHES_KEY = 'h2h_matches';

export const initialPlayers: Player[] = [
  { id: '1', name: '王昶', initials: 'WC' },
  { id: '2', name: '梁伟铿', initials: 'LWK' },
  { id: '3', name: '阿尔菲安', initials: 'AF' },
  { id: '4', name: '菲克里', initials: 'FK' },
];

export const initialMatches: Match[] = [
  {
    id: 'm1',
    date: new Date('2025-12-19').getTime(),
    type: 'Doubles',
    team1: ['1', '2'],
    team2: ['3', '4'],
    scores: [{ team1: 21, team2: 17 }, { team1: 21, team2: 14 }],
    tournament: '2025年BWF世界巡回赛总决赛',
  },
  {
    id: 'm2',
    date: new Date('2025-10-18').getTime(),
    type: 'Doubles',
    team1: ['1', '2'],
    team2: ['3', '4'],
    scores: [{ team1: 15, team2: 21 }, { team1: 18, team2: 21 }],
    tournament: '2025年丹麦羽毛球公开赛',
  },
  {
    id: 'm3',
    date: new Date('2025-09-18').getTime(),
    type: 'Doubles',
    team1: ['1', '2'],
    team2: ['3', '4'],
    scores: [{ team1: 21, team2: 16 }, { team1: 15, team2: 21 }, { team1: 18, team2: 21 }],
    tournament: '2025年中国羽毛球大师赛',
  }
];

export function getPlayers(): Player[] {
  const stored = localStorage.getItem(PLAYERS_KEY);
  return stored ? JSON.parse(stored) : initialPlayers;
}

export function savePlayers(players: Player[]) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function getMatches(): Match[] {
  const stored = localStorage.getItem(MATCHES_KEY);
  return stored ? JSON.parse(stored) : initialMatches;
}

export function saveMatches(matches: Match[]) {
  localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
}
