// ============================================================
// Diayana OS 'Track balancing' — Enhanced Reflection Index
// Auto date picker, timeline tracking, editable fields,
// reflection sub-goals, and 7-day productivity visualization
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
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Edit2,
  Check,
  X,
  Target,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useMetrics } from '../../hooks/useMetrics';
import { todayDate } from '../../lib/localStore';
import { cn } from '../../lib/utils';

export function ReflectionIndex() {
  const {
    activeDate,
    setActiveDate,
    todayMetrics,
    weekMetrics,
    addAchievement,
    updateAchievement,
    removeAchievement,
    addTimeWaster,
    updateTimeWaster,
    removeTimeWaster,
    addReflectionSubGoal,
    toggleReflectionSubGoal,
    removeReflectionSubGoal,
  } = useMetrics();

  const [newAchievement, setNewAchievement] = useState('');
  const [newTimeWaster, setNewTimeWaster] = useState('');
  const [newSubGoal, setNewSubGoal] = useState('');

  // Editing states
  const [editingAchIndex, setEditingAchIndex] = useState<number | null>(null);
  const [editingAchText, setEditingAchText] = useState('');

  const [editingTwIndex, setEditingTwIndex] = useState<number | null>(null);
  const [editingTwText, setEditingTwText] = useState('');

  const achievements = todayMetrics?.achievements_list || [];
  const timeWasters = todayMetrics?.time_wasters_list || [];
  const subGoals = todayMetrics?.reflection_sub_goals || [];
  const score = todayMetrics?.productivity_score ?? 60;

  const isToday = activeDate === todayDate();

  const handleDateChange = (dateStr: string) => {
    setActiveDate(dateStr);
  };

  const handlePrevDay = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() - 1);
    setActiveDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(activeDate);
    d.setDate(d.getDate() + 1);
    setActiveDate(d.toISOString().split('T')[0]);
  };

  const handleAddAchievement = async () => {
    if (!newAchievement.trim()) return;
    await addAchievement(newAchievement.trim());
    setNewAchievement('');
  };

  const handleSaveEditAch = async (index: number) => {
    if (!editingAchText.trim()) return;
    await updateAchievement(index, editingAchText.trim());
    setEditingAchIndex(null);
  };

  const handleAddTimeWaster = async () => {
    if (!newTimeWaster.trim()) return;
    await addTimeWaster(newTimeWaster.trim());
    setNewTimeWaster('');
  };

  const handleSaveEditTw = async (index: number) => {
    if (!editingTwText.trim()) return;
    await updateTimeWaster(index, editingTwText.trim());
    setEditingTwIndex(null);
  };

  const handleAddSubGoal = async () => {
    if (!newSubGoal.trim()) return;
    await addReflectionSubGoal(newSubGoal.trim());
    setNewSubGoal('');
  };

  // 7-day SVG Chart Data Calculation
  const days = weekMetrics.slice(-7);
  const chartHeight = 120;
  const chartWidth = 320;
  const maxBarVal = Math.max(
    4,
    ...days.map((d) =>
      Math.max(
        (d.achievements_list || []).length,
        (d.time_wasters_list || []).length
      )
    )
  );

  return (
    <Card className="p-5 space-y-5 bg-charcoal border border-border">
      {/* Header with Auto Date Picker & Timeline Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-light" />
            <span>Daily Reflection & Balance Index</span>
          </h3>
          <p className="text-[11px] text-text-muted">
            Tracking achievements, eliminating time wasters, and reviewing goals
          </p>
        </div>

        {/* Auto Date Picker Control */}
        <div className="flex items-center gap-1.5 bg-obsidian p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-1 px-2">
            <Calendar className="w-3.5 h-3.5 text-amber-light" />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-text-primary focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {!isToday && (
            <button
              type="button"
              onClick={() => setActiveDate(todayDate())}
              className="px-2 py-0.5 text-[10px] font-mono bg-amber/20 text-amber-light rounded cursor-pointer"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Productivity Score Metric Card */}
      <div className="p-3 bg-obsidian rounded-xl border border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber/15 text-amber-light">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider">
              {isToday ? "Today's Track Balance Score" : `Balance Score (${activeDate})`}
            </span>
            <p className="text-base font-bold font-mono text-text-primary">
              {score} / 100
            </p>
          </div>
        </div>

        <span
          className={cn(
            'text-xs font-mono font-semibold px-2.5 py-1 rounded-full border',
            score >= 70
              ? 'bg-emerald/15 text-emerald-light border-emerald/30'
              : score >= 50
              ? 'bg-amber/15 text-amber-light border-amber/30'
              : 'bg-error/15 text-error border-error/30'
          )}
        >
          {score >= 70 ? 'High Focus 🔥' : score >= 50 ? 'Balanced ⚡' : 'Needs Reset ⚠️'}
        </span>
      </div>

      {/* Dual Column: Editable Wins vs. Editable Time Wasters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Achievements Column */}
        <div className="p-3.5 bg-obsidian rounded-xl border border-emerald/20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-light flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              <span>Achievements & Wins ({achievements.length})</span>
            </span>
            <span className="text-[10px] font-mono text-text-dim">Editable</span>
          </div>

          <div className="space-y-1.5 min-h-[80px]">
            {achievements.length === 0 ? (
              <p className="text-xs text-text-dim italic">
                No wins logged for {activeDate}. Type below to add.
              </p>
            ) : (
              achievements.map((item, idx) => {
                const isEditing = editingAchIndex === idx;

                return (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs text-text-primary gap-2"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingAchText}
                          onChange={(e) => setEditingAchText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditAch(idx);
                          }}
                          className="flex-1 px-2 py-0.5 bg-obsidian border border-emerald/40 rounded text-xs text-text-primary focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditAch(idx)}
                          className="p-1 text-emerald-light hover:bg-emerald/20 rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingAchIndex(null)}
                          className="p-1 text-text-muted hover:bg-border rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate pr-2 flex-1">✓ {item}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAchIndex(idx);
                              setEditingAchText(item);
                            }}
                            className="p-1 text-text-dim hover:text-text-primary cursor-pointer"
                            title="Edit Achievement"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeAchievement(idx)}
                            className="p-1 text-text-dim hover:text-error cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
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
            <span className="text-[10px] font-mono text-text-dim">Editable</span>
          </div>

          <div className="space-y-1.5 min-h-[80px]">
            {timeWasters.length === 0 ? (
              <p className="text-xs text-text-dim italic">
                Zero distractions logged for {activeDate}. Excellent focus!
              </p>
            ) : (
              timeWasters.map((item, idx) => {
                const isEditing = editingTwIndex === idx;

                return (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs text-text-primary gap-2"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingTwText}
                          onChange={(e) => setEditingTwText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditTw(idx);
                          }}
                          className="flex-1 px-2 py-0.5 bg-obsidian border border-error/40 rounded text-xs text-text-primary focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditTw(idx)}
                          className="p-1 text-error hover:bg-error/20 rounded cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTwIndex(null)}
                          className="p-1 text-text-muted hover:bg-border rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate pr-2 flex-1">⚠ {item}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTwIndex(idx);
                              setEditingTwText(item);
                            }}
                            className="p-1 text-text-dim hover:text-text-primary cursor-pointer"
                            title="Edit Time Waster"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeTimeWaster(idx)}
                            className="p-1 text-text-dim hover:text-error cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
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

      {/* Reflection Sub-Goals Section */}
      <div className="p-4 bg-obsidian rounded-xl border border-border space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Target className="w-4 h-4 text-purple-light" />
            <span>Daily Reflection Sub-Goals & Milestones</span>
          </span>
          <span className="text-[10px] font-mono text-text-muted">
            {subGoals.filter((s) => s.completed).length} / {subGoals.length} completed
          </span>
        </div>

        <div className="space-y-1.5">
          {subGoals.length === 0 ? (
            <p className="text-[11px] text-text-dim italic">
              No reflection sub-goals set. Add below (e.g. 'Review upcoming sprint deliverables', 'Evening 10m meditation').
            </p>
          ) : (
            subGoals.map((sg) => (
              <div
                key={sg.id}
                className="group flex items-center justify-between p-2 rounded-lg bg-charcoal border border-border text-xs text-text-primary"
              >
                <div
                  className="flex items-center gap-2 flex-1 cursor-pointer select-none"
                  onClick={() => toggleReflectionSubGoal(sg.id)}
                >
                  {sg.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-text-dim shrink-0" />
                  )}
                  <span className={cn(sg.completed && 'line-through text-text-muted')}>
                    {sg.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeReflectionSubGoal(sg.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-dim hover:text-error transition-opacity cursor-pointer"
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
            value={newSubGoal}
            onChange={(e) => setNewSubGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubGoal();
            }}
            placeholder="Add reflection sub-goal milestone..."
            className="flex-1 px-2.5 py-1 text-xs bg-charcoal border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/40"
          />
          <button
            type="button"
            onClick={handleAddSubGoal}
            className="px-2.5 py-1 bg-purple/20 hover:bg-purple/30 text-purple-light rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
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

        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-32 bg-obsidian rounded-xl border border-border p-2"
          >
            <line x1="20" y1="20" x2={chartWidth - 10} y2="20" stroke="#1F2433" strokeDasharray="2 2" />
            <line x1="20" y1="60" x2={chartWidth - 10} y2="60" stroke="#1F2433" strokeDasharray="2 2" />
            <line x1="20" y1="95" x2={chartWidth - 10} y2="95" stroke="#1F2433" />

            {days.map((item, i) => {
              const xCenter = 40 + i * 40;
              const achCount = (item.achievements_list || []).length;
              const wasterCount = (item.time_wasters_list || []).length;

              const achBarH = Math.max(3, (achCount / maxBarVal) * 60);
              const wasterBarH = Math.max(3, (wasterCount / maxBarVal) * 60);

              const dateLabel = item.entry_date.slice(5);

              return (
                <g key={item.id || i}>
                  <rect
                    x={xCenter - 7}
                    y={95 - achBarH}
                    width="6"
                    height={achBarH}
                    rx="2"
                    fill="#10B981"
                  />
                  <rect
                    x={xCenter + 1}
                    y={95 - wasterBarH}
                    width="6"
                    height={wasterBarH}
                    rx="2"
                    fill="#EF4444"
                  />
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
