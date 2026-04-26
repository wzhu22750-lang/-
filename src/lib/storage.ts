import { createClient } from '@supabase/supabase-js';
import { Player, Match, Club } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 俱乐部操作 ---
export async function createClub(name: string): Promise<Club | null> {
  // 生成一个更可靠的 6 位随机码
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const { data, error } = await supabase
    .from('clubs')
    .insert([{ name, invite_code }])
    .select() // 返回插入的数据
    .single(); // 因为只插入一条，所以用 single
  
  if (error) { 
    // 如果还是失败，请在浏览器控制台查看这个报错信息
    console.error('数据库插入错误详情:', error.message, error.details); 
    return null; 
  }
  return data;
}

export async function joinClub(inviteCode: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .single();
  
  if (error) { alert('邀请码无效'); return null; }
  return data;
}

// --- 球员操作 (带 club_id 过滤) ---
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
  // 确保 player 对象里包含了 elo_rating
  const { error } = await supabase.from('players').upsert(player);
  if (error) console.error('保存球员失败:', error.message);
}

export async function deletePlayerFromCloud(id: string) {
  const { error } = await supabase.from('players').delete().eq('id', id);
  if (error) console.error('删除球员失败:', error.message);
}

// --- 比赛操作 (带 club_id 过滤) ---
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
