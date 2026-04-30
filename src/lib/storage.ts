import { createClient } from '@supabase/supabase-js';
import { Player, Match, Club } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 俱乐部操作 ---

/**
 * 创建俱乐部并生成管理员令牌
 */
export async function createClub(name: string): Promise<Club | null> {
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  // 生成随机的管理令牌 (隐形钥匙)
  const manager_token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const { data, error } = await supabase
    .from('clubs')
    .insert([{ name, invite_code, manager_token }])
    .select('*')
    .single();
  
  if (error) {
    console.error('创建俱乐部失败:', error.message);
    return null;
  }
  return data;
}

/**
 * 加入俱乐部 (获取俱乐部信息)
 */
export async function joinClub(inviteCode: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  
  if (error) {
    console.error('加入俱乐部失败:', error.message);
    return null;
  }
  return data;
}

// --- 球员操作 ---

export async function getPlayers(clubId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('club_id', clubId)
    .order('name');
  if (error) return [];
  return data || [];
}

export async function savePlayerToCloud(player: Player) {
  const { error } = await supabase.from('players').upsert(player);
  if (error) console.error('保存球员失败:', error.message);
}

export async function deletePlayerFromCloud(id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) console.error('删除球员失败:', error.message);
}

// --- 比赛操作 ---

export async function getMatches(clubId: string): Promise<Match[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('club_id', clubId)
    .order('date', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function saveMatchToCloud(match: Match) {
  const { error } = await supabase.from('matches').upsert(match);
  if (error) console.error('保存比赛失败:', error.message);
}

export async function deleteMatchFromCloud(id: string) {
  const { error } = await supabase.from('matches').delete().eq('id', id);
  if (error) console.error('删除比赛失败:', error.message);
}
