import { createClient } from '@supabase/supabase-js';
import { Player, Match } from '../types';

// 从环境变量获取 Key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getPlayers(): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('获取球员失败:', err);
    return [];
  }
}

export async function savePlayerToCloud(player: Player) {
  const { error } = await supabase.from('players').upsert(player);
  if (error) console.error('保存球员失败:', error);
}

export async function getMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('获取比赛失败:', err);
    return [];
  }
}

export async function saveMatchToCloud(match: Match) {
  const { error } = await supabase.from('matches').upsert(match);
  if (error) console.error('保存比赛失败:', error);
}
