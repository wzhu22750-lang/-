import { Match } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface H2HTrendProps {
  matches: Match[];
  team1Ids: string[];
}

export function H2HTrend({ matches, team1Ids }: H2HTrendProps) {
  if (matches.length < 2) return null;

  // Sort chronologically (oldest first)
  const chronological = [...matches].sort((a, b) => a.date - b.date);

  // Compute win/loss sequence from team1's perspective
  const results = chronological.map(m => {
    const isT1 = team1Ids.every(id => m.team1.includes(id)) && m.team1.length === team1Ids.length;
    let t1G = 0; let t2G = 0;
    m.scores.forEach(s => { if (s.team1 > s.team2) t1G++; else if (s.team2 > s.team1) t2G++; });
    const t1Won = t1G > t2G;
    return isT1 ? t1Won : !t1Won;
  });

  // Cumulative win rate at each match
  const cumRates: number[] = [];
  let wins = 0;
  results.forEach((won, i) => {
    if (won) wins++;
    cumRates.push(Math.round((wins / (i + 1)) * 100));
  });

  // Recent 5 matches
  const recent5 = results.slice(-5);
  const recentWins = recent5.filter(Boolean).length;
  const trendDir = recent5.length >= 2
    ? cumRates[cumRates.length - 1] > cumRates[Math.max(0, cumRates.length - 6)]
      ? 'up' : cumRates[cumRates.length - 1] < cumRates[Math.max(0, cumRates.length - 6)]
      ? 'down' : 'flat'
    : 'flat';

  // SVG chart dimensions
  const w = 280;
  const h = 52;
  const padX = 2;
  const padY = 4;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const maxRate = Math.max(100, ...cumRates);
  const minRate = Math.min(0, ...cumRates);

  const points = cumRates.map((rate, i) => {
    const x = padX + (cumRates.length > 1 ? (i / (cumRates.length - 1)) * plotW : plotW / 2);
    const y = padY + plotH - ((rate - minRate) / (maxRate - minRate || 1)) * plotH;
    return `${x},${y}`;
  }).join(' ');

  // Last 10 match dots (most recent shown)
  const displayResults = results.slice(-10);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-black text-neutral-800 italic uppercase">胜率趋势</h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-neutral-400">近5场</span>
          <span className={`text-xs font-black ${recentWins >= 3 ? 'text-green-600' : recentWins >= 2 ? 'text-amber-600' : 'text-red-500'}`}>
            {recentWins}胜{recent5.length - recentWins}负
          </span>
          {trendDir === 'up' ? <TrendingUp size={14} className="text-green-500" /> :
           trendDir === 'down' ? <TrendingDown size={14} className="text-red-400" /> :
           <Minus size={14} className="text-neutral-300" />}
        </div>
      </div>

      {/* SVG line chart */}
      {cumRates.length >= 2 && (
        <div className="mb-4 bg-neutral-50 rounded-xl overflow-hidden">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            {/* Grid lines */}
            <line x1={padX} y1={padY + plotH * 0.25} x2={w - padX} y2={padY + plotH * 0.25} stroke="#e5e5e5" strokeWidth="0.5" />
            <line x1={padX} y1={padY + plotH * 0.5} x2={w - padX} y2={padY + plotH * 0.5} stroke="#e5e5e5" strokeWidth="0.5" />
            <line x1={padX} y1={padY + plotH * 0.75} x2={w - padX} y2={padY + plotH * 0.75} stroke="#e5e5e5" strokeWidth="0.5" />

            {/* Area fill */}
            {cumRates.length >= 2 && (
              <polygon
                points={`${padX},${padY + plotH} ${points} ${w - padX},${padY + plotH}`}
                fill="url(#trendGrad)"
                opacity="0.3"
              />
            )}

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Match dot timeline */}
      <div className="flex items-center gap-1.5 justify-center">
        {displayResults.map((won, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full border-2 ${
              won ? 'bg-green-400 border-green-500' : 'bg-red-300 border-red-400'
            }`}
            title={`第${results.length - displayResults.length + i + 1}场: ${won ? '胜' : '负'}`}
          />
        ))}
        <span className="text-[9px] font-bold text-neutral-300 ml-1">
          {results.length > 10 ? `共${results.length}场` : `${results.length}场`}
        </span>
      </div>
    </div>
  );
}
