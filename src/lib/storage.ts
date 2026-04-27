// src/lib/storage.ts 完整干净版
import { createClient } from '@supabase/supabase-js';
import { Player, Match, Club } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 俱乐部操作 ---
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

// --- 球员操作 ---
export async function getPlayers(clubId: string): Promise<Player[]> {
  const { data, error } = await supabase.from('players').select('*').eq('club_id', clubId).order('name');
  return error ? [] : (data || []);
}

export async function savePlayerToCloud(player: Player) {
  await supabase.from('players').upsert(player);
}

// 批量保存球员（用于积分重算后的同步）
export async function savePlayersToCloud(players: Player[]) {
  if (players.length === 0) return;
  const { error } = await supabase.from('players').upsert(players);
  if (error) console.error('批量更新球员失败:', error.message);
}

export async function deletePlayerFromCloud(id: string) {
  await supabase.from('players').delete().eq('id', id);
}

// --- 比赛操作 ---
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
