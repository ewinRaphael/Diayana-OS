// ============================================================
// NexusOS — Personal Workspace: Daily Reflection Index & 7-Day Chart
// ============================================================

import { useState } from 'react';
import {
  Trophy,
  Hourglass,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useMetrics } from '../../hooks/useMetrics';

export function ReflectionIndex() {
  const {
    todayMetrics,
    weekMetrics,
    addAchievement,
    removeAchievement,
    addTimeWaster,
    removeTimeWaster,
  } = useMetrics();

  const [newAchievement, setNewAchievement] = useState('');
  const [newTimeWaster, setNewTimeWaster] = useState('');

  const achievements = todayMetrics?.achievements_list || [];
  const timeWasters = todayMetrics?.time_wasters_list || [];
  const score = todayMetrics?.productivity_score ?? 60;

  const handleAddAchievement = async () => {
    if (!newAchievement.trim()) return;
    await addAchievement(newAchievement.trim());
    setNewAchievement('');
  };

  const handleAddTimeWaster = async () => {
    if (!newTimeWaster.trim()) return;
    await addTimeWaster(newTimeWaster.trim());
    setNewTimeWaster('');
  };

  // 7-day SVG Chart Data Calculation
  const days = weekMetrics.slice(-7);
  const chartHeight = 120;
  const chartWidth = 320;
  const maxBarVal = Math.max(
    4,
    ...days.map((d) => Math.max((d.achievements_list || []).length, (d.time_wasters_list || []).length))
  );

  return (
    <Card className="p-5 space-y-5">
      {/* Header & Productivity Score */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-light" />
            <span>Daily Reflection Index</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            End-of-day accomplishment audit and distraction elimination
          </p>
        </div>

        {/* Productivity Score Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian border border-border">
          <Zap className="w-4 h-4 text-amber-light" />
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-mono leading-none">
              Score
            </span>
            <span className="text-sm font-bold font-mono text-text-primary leading-tight">
              {score}/100
            </span>
          </div>
        </div>
      </div>

      {/* Dual Column: Wins vs. Time Wasters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Achievements Column */}
        <div className="p-3.5 bg-obsidian rounded-xl border border-emerald/20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-light flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>Today's Achievements ({achievements.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 min-h-[80px]">
            {achievements.length === 0 ? (
              <p className="text-xs text-text-dim italic">
                No wins logged today. Add from voice note or type below.
              </p>
            ) : (
              achievements.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs text-text-primary"
                >
                  <span className="truncate pr-2">✓ {item}</span>
                  <button
                    type="button"
                    onClick={() => removeAchievement(idx)}
                    className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-error transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newAchievement}
              onChange={(e) => setNewAchievement(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddAchievement();
              }}
              placeholder="Add key achievement..."
              className="flex-1 px-2.5 py-1 text-xs bg-charcoal border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-emerald/40"
            />
            <button
              type="button"
              onClick={handleAddAchievement}
              className="px-2.5 py-1 bg-emerald/20 hover:bg-emerald/30 text-emerald-light rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Time Wasters Column */}
        <div className="p-3.5 bg-obsidian rounded-xl border border-error/20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-error flex items-center gap-1.5">
              <Hourglass className="w-4 h-4" />
              <span>Main Time Wasters ({timeWasters.length})</span>
            </span>
          </div>

          <div className="space-y-1.5 min-h-[80px]">
            {timeWasters.length === 0 ? (
              <p className="text-xs text-text-dim italic">
                Zero distractions logged. Excellent focus!
              </p>
            ) : (
              timeWasters.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs text-text-primary"
                >
                  <span className="truncate pr-2">⚠ {item}</span>
                  <button
                    type="button"
                    onClick={() => removeTimeWaster(idx)}
                    className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-error transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newTimeWaster}
              onChange={(e) => setNewTimeWaster(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTimeWaster();
              }}
              placeholder="Log time waster..."
              className="flex-1 px-2.5 py-1 text-xs bg-charcoal border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-error/40"
            />
            <button
              type="button"
              onClick={handleAddTimeWaster}
              className="px-2.5 py-1 bg-error/20 hover:bg-error/30 text-error rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-Day Trend Visualization (SVG Chart) */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-purple-light" />
            <span>7-Day Productivity Trend</span>
          </span>
          <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald" /> Wins
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-error" /> Wasters
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-0.5 bg-amber-light" /> Score
            </span>
          </div>
        </div>

        {/* Pure SVG responsive chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-32 bg-obsidian rounded-xl border border-border p-2"
          >
            {/* Grid Lines */}
            <line x1="20" y1="20" x2={chartWidth - 10} y2="20" stroke="#1F2433" strokeDasharray="2 2" />
            <line x1="20" y1="60" x2={chartWidth - 10} y2="60" stroke="#1F2433" strokeDasharray="2 2" />
            <line x1="20" y1="95" x2={chartWidth - 10} y2="95" stroke="#1F2433" />

            {/* Bars and Scores */}
            {days.map((item, i) => {
              const xCenter = 40 + i * 40;
              const achCount = (item.achievements_list || []).length;
              const wasterCount = (item.time_wasters_list || []).length;

              const achBarH = Math.max(3, (achCount / maxBarVal) * 60);
              const wasterBarH = Math.max(3, (wasterCount / maxBarVal) * 60);

              const dateLabel = item.entry_date.slice(5); // MM-DD

              return (
                <g key={item.id || i}>
                  {/* Wins Bar (Green) */}
                  <rect
                    x={xCenter - 7}
                    y={95 - achBarH}
                    width="6"
                    height={achBarH}
                    rx="2"
                    fill="#10B981"
                  />
                  {/* Time Wasters Bar (Red) */}
                  <rect
                    x={xCenter + 1}
                    y={95 - wasterBarH}
                    width="6"
                    height={wasterBarH}
                    rx="2"
                    fill="#EF4444"
                  />
                  {/* Date Label */}
                  <text
                    x={xCenter}
                    y="110"
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {dateLabel}
                  </text>
                </g>
              );
            })}

            {/* Productivity Score Trend Line */}
            {days.length > 1 && (
              <polyline
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.5"
                points={days
                  .map((d, i) => {
                    const x = 40 + i * 40;
                    const y = 95 - (d.productivity_score / 100) * 75;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>
      </div>
    </Card>
  );
}

export default ReflectionIndex;
