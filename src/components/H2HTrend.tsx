import { Match } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface H2HTrendProps {
  matches: Match[];
  team1Ids: string[];
}

export function H2HTrend({ matches, team1Ids }: H2HTrendProps) {
  if (matches.length < 2) return null;

  const chronological = [...matches].sort((a, b) => a.date - b.date);

  const results = chronological.map((m) => {
    const isT1 = team1Ids.every((id) => m.team1.includes(id)) && m.team1.length === team1Ids.length;
    let t1G = 0;
    let t2G = 0;
    m.scores.forEach((s) => {
      if (s.team1 > s.team2) t1G++;
      else if (s.team2 > s.team1) t2G++;
    });
    const t1Won = t1G > t2G;
    return isT1 ? t1Won : !t1Won;
  });

  const cumRates: number[] = [];
  let wins = 0;
  results.forEach((won, i) => {
    if (won) wins++;
    cumRates.push(Math.round((wins / (i + 1)) * 100));
  });

  const recent5 = results.slice(-5);
  const recentWins = recent5.filter(Boolean).length;
  const trendDir =
    recent5.length >= 2
      ? cumRates[cumRates.length - 1] > cumRates[Math.max(0, cumRates.length - 6)]
        ? 'up'
        : cumRates[cumRates.length - 1] < cumRates[Math.max(0, cumRates.length - 6)]
          ? 'down'
          : 'flat'
      : 'flat';

  const w = 320;
  const h = 64;
  const padX = 6;
  const padY = 6;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const points = cumRates
    .map((rate, i) => {
      const x = padX + (cumRates.length > 1 ? (i / (cumRates.length - 1)) * plotW : plotW / 2);
      const y = padY + plotH - (rate / 100) * plotH;
      return `${x},${y}`;
    })
    .join(' ');

  const displayResults = results.slice(-10);

  return (
    <div className="bg-white rounded-[24px] p-5 border border-[#dde2dc] court-card-shadow">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-extrabold text-[#111814]">A 队交手胜率走势</h3>
          <p className="text-[11px] text-[#5b665f]">按历史交锋时间序列累计胜率</p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#f5f6f3] px-3 py-1.5 rounded-xl border border-[#dde2dc]">
          <span className="text-[11px] font-semibold text-[#5b665f]">近 {recent5.length} 场</span>
          <span
            className={`text-xs font-extrabold tabular-nums ${
              recentWins >= 3 ? 'text-[#0b6e4f]' : recentWins >= 2 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {recentWins}胜 {recent5.length - recentWins}负
          </span>
          {trendDir === 'up' ? (
            <TrendingUp size={14} className="text-[#0b6e4f]" />
          ) : trendDir === 'down' ? (
            <TrendingDown size={14} className="text-rose-500" />
          ) : (
            <Minus size={14} className="text-[#5b665f]" />
          )}
        </div>
      </div>

      {/* SVG Line Chart */}
      {cumRates.length >= 2 && (
        <div className="mb-4 bg-[#f8faf7] rounded-2xl p-2 border border-[#edf0eb] overflow-hidden">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
            <line
              x1={padX}
              y1={padY + plotH * 0.5}
              x2={w - padX}
              y2={padY + plotH * 0.5}
              stroke="#cbd5ce"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <polygon
              points={`${padX},${padY + plotH} ${points} ${w - padX},${padY + plotH}`}
              fill="url(#courtTrendGrad)"
              opacity="0.28"
            />
            <polyline
              points={points}
              fill="none"
              stroke="#0b6e4f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="courtTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0b6e4f" />
                <stop offset="100%" stopColor="#0b6e4f" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Recent Sequence Pills */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-semibold text-[#5b665f]">近期赛果序列</span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {displayResults.map((won, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded-lg text-[11px] font-extrabold flex items-center justify-center ${
                won
                  ? 'bg-emerald-50 text-[#0b6e4f] border border-emerald-200'
                  : 'bg-rose-50 text-rose-600 border border-rose-200'
              }`}
              title={`第 ${results.length - displayResults.length + i + 1} 场: ${won ? '胜' : '负'}`}
            >
              {won ? '胜' : '负'}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
