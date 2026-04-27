// src/lib/storage.ts 覆盖更新
import { createClient } from '@supabase/supabase-js';
import { Player, Match, Club } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createClub(name: string): Promise<Club | null> {
  const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const { data, error } = await supabase.from('clubs').insert([{ name, invite_code }]).select().single();
  if (error) return null;
  return data;
}

export async function joinClub(inviteCode: string): Promise<Club | null> {
  const { data, error } = await supabase.from('clubs').select('*').eq('invite_code', inviteCode.toUpperCase()).single();
  return error ? null : data;
}

export async function getPlayers(clubId: string): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').eq('club_id', clubId).order('name');
  return error ? [] : (data || []);
}

// 优化：单球员保存
export async function savePlayerToCloud(player: Player) {
  await supabase.from('players').upsert(player);
}

// 优化：批量更新球员（核心优化：减少网络请求）
export async function savePlayersToCloud(players: Player[]) {
  if (players.length === 0) return;
  const { error } = await supabase.from('players').upsert(players);
  if (error) console.error('批量更新失败:', error.message);
}

export async function deletePlayerFromCloud(id: string) {
  await supabase.from('players').delete().eq('id', id);
}

export async function getMatches(clubId: string): Promise<Match[]> {
  const { data, error } = await supabase.from('matches').select('*').eq('club_id', clubId).order('date', { ascending: false });
  return error ? [] : (data || []);
}

export async function saveMatchToCloud(match: Match) {
  await supabase.from('matches').upsert(match);
}

export async function deleteMatchFromCloud(id: string) {
  await supabase.from('matches').delete().eq('id', id);
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
