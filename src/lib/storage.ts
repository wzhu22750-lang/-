import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Player, Match, Club, MatchCategory } from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase: SupabaseClient | null = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const LOCAL_CLUBS_KEY = 'h2h_local_clubs';
const LOCAL_CATEGORIES_PREFIX = 'h2h_local_categories_';

function getLocalClubs(): Club[] {
  try {
    const raw = localStorage.getItem(LOCAL_CLUBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalClub(club: Club) {
  const list = getLocalClubs().filter(c => c.id !== club.id);
  localStorage.setItem(LOCAL_CLUBS_KEY, JSON.stringify([club, ...list]));
}

function buildDefaultCategories(clubId: string): MatchCategory[] {
  return [
    { id: Math.random().toString(36).slice(2, 11), club_id: clubId, name: '常规赛', k_multiplier: 1.0, sort_order: 0 },
    { id: Math.random().toString(36).slice(2, 11), club_id: clubId, name: '挑战赛', k_multiplier: 1.5, sort_order: 1, require_elo_gap: true },
    { id: Math.random().toString(36).slice(2, 11), club_id: clubId, name: '白羽惜别羽毛球赛', k_multiplier: 2.0, sort_order: 2 },
  ];
}

// --- 俱乐部操作 ---

/**
 * 创建俱乐部并生成管理员令牌
 */
export async function createClub(name: string, mode: 'club' | 'tournament' = 'club'): Promise<Club | null> {
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const manager_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  if (!supabase) {
    const id = Math.random().toString(36).slice(2, 11);
    const defaultCategories = buildDefaultCategories(id);
    const localClub: Club = { id, name, invite_code, manager_token, mode, categories: defaultCategories };
    saveLocalClub(localClub);
    localStorage.setItem(`${LOCAL_CATEGORIES_PREFIX}${id}`, JSON.stringify(defaultCategories));
    return localClub;
  }

  const { data, error } = await supabase
    .from('clubs')
    .insert([{ name, invite_code, manager_token, mode }])
    .select('*')
    .single();

  if (error) {
    console.error('创建俱乐部失败:', error.message);
    return null;
  }

  const defaultCategories = buildDefaultCategories(data.id);
  const { error: catErr } = await supabase.from('match_categories').insert(defaultCategories);
  if (catErr) console.error('创建默认类别失败:', catErr.message);

  return { ...data, categories: defaultCategories } as Club;
}

/**
 * 加入俱乐部 (获取俱乐部信息，剥离敏感 manager_token)
 */
export async function joinClub(inviteCode: string): Promise<Club | null> {
  const normalizedCode = inviteCode.trim().toUpperCase();
  if (!supabase) {
    const found = getLocalClubs().find(c => c.invite_code.toUpperCase() === normalizedCode);
    if (!found) return null;
    const { manager_token: _, ...safeClub } = found;
    return safeClub as Club;
  }

  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, invite_code, mode')
    .eq('invite_code', normalizedCode)
    .single();

  if (error) {
    console.error('加入俱乐部失败:', error.message);
    return null;
  }
  return data;
}

// --- 球员操作 ---

export async function getPlayers(clubId: string): Promise<Player[]> {
  if (!supabase) {
    const cached = localStorage.getItem(`cache_players_${clubId}`);
    return cached ? JSON.parse(cached) : [];
  }
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('club_id', clubId)
    .order('name');
  if (error) return [];
  return data || [];
}

export async function savePlayerToCloud(player: Player) {
  if (!supabase) return;
  const { error } = await supabase.from('players').upsert(player);
  if (error) console.error('保存球员失败:', error.message);
}

export async function deletePlayerFromCloud(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) console.error('删除球员失败:', error.message);
}

// --- 比赛操作 ---

export async function getMatches(clubId: string): Promise<Match[]> {
  if (!supabase) {
    const cached = localStorage.getItem(`cache_matches_${clubId}`);
    return cached ? JSON.parse(cached) : [];
  }
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('club_id', clubId)
    .order('date', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveMatchToCloud(match: Match) {
  if (!supabase) return;
  const { error } = await supabase.from('matches').upsert(match);
  if (error) console.error('保存比赛失败:', error.message);
}

export async function deleteMatchFromCloud(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) console.error('删除比赛失败:', error.message);
}

// --- 比赛类别操作 ---

export async function getMatchCategories(clubId: string): Promise<MatchCategory[]> {
  if (!supabase) {
    const cached = localStorage.getItem(`${LOCAL_CATEGORIES_PREFIX}${clubId}`);
    return cached ? JSON.parse(cached) : [];
  }
  const { data, error } = await supabase
    .from('match_categories')
    .select('*')
    .eq('club_id', clubId)
    .order('sort_order');
  if (error) return [];
  return data || [];
}

export async function saveMatchCategory(category: MatchCategory) {
  if (!supabase) {
    const existing = await getMatchCategories(category.club_id);
    const updated = existing.some(c => c.id === category.id)
      ? existing.map(c => c.id === category.id ? category : c)
      : [...existing, category];
    localStorage.setItem(`${LOCAL_CATEGORIES_PREFIX}${category.club_id}`, JSON.stringify(updated));
    return;
  }
  const { error } = await supabase.from('match_categories').upsert(category);
  if (error) console.error('保存类别失败:', error.message);
}

export async function deleteMatchCategory(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('match_categories').delete().eq('id', id);
  if (error) console.error('删除类别失败:', error.message);
}
