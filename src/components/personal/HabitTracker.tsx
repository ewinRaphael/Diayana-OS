// ============================================================
// NexusOS — Personal Workspace: Dynamic Habit Tracker
// ============================================================

import { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Flame,
  Trash2,
  CalendarCheck2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useMetrics } from '../../hooks/useMetrics';
import { cn } from '../../lib/utils';

export function HabitTracker() {
  const { todayMetrics, toggleHabit, addHabit, removeHabit } = useMetrics();
  const [newHabitName, setNewHabitName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const habits = todayMetrics?.habits_json || [];

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    setIsAdding(true);
    try {
      await addHabit(newHabitName.trim());
      setNewHabitName('');
    } catch (err) {
      console.error('Failed to add habit:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const completedCount = habits.filter((h) => h.completed).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <Card className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-amber-light" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Daily Habit Protocol
            </h3>
            <span className="text-[11px] text-text-muted">
              {completedCount} of {habits.length} habits accomplished ({progressPercent}%)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber/15 text-amber-light font-mono text-xs font-semibold">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Active Streaks</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-obsidian rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-dim to-amber h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Habit Items */}
      <div className="space-y-2">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className={cn(
              'group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none',
              habit.completed
                ? 'bg-amber/10 border-amber/30 text-text-primary'
                : 'bg-obsidian border-border text-text-muted hover:border-border-light hover:text-text-primary'
            )}
            onClick={() => toggleHabit(habit.id)}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-amber-light transition-transform active:scale-90"
              >
                {habit.completed ? (
                  <CheckSquare className="w-4 h-4 fill-amber/20" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span
                className={cn(
                  'text-xs font-medium',
                  habit.completed && 'line-through text-text-muted font-normal'
                )}
              >
                {habit.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full',
                  habit.streak > 0
                    ? 'bg-amber/20 text-amber-light'
                    : 'bg-border/60 text-text-dim'
                )}
                title="Current consecutive streak"
              >
                <Flame className="w-3 h-3" />
                <span>{habit.streak}d</span>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHabit(habit.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-dim hover:text-error transition-all cursor-pointer rounded"
                title="Delete habit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Habit Row */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddHabit();
          }}
          placeholder="New daily habit (e.g. 'Read 20 pages', 'No sugar')..."
          className="flex-1 px-3 py-1.5 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-amber/30"
        />
        <button
          type="button"
          onClick={handleAddHabit}
          disabled={!newHabitName.trim() || isAdding}
          className="flex items-center gap-1 px-3 py-1.5 bg-amber hover:bg-amber-light text-obsidian rounded-lg font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>
    </Card>
  );
}

export default HabitTracker;
