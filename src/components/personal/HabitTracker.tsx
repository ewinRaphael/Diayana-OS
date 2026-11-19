// ============================================================
// Diayana OS 'Track balancing' — Enhanced Habit Tracker
// Consistency & missing day metrics, target durations,
// main goals & sub-goals, and auto-recurring frequency
// ============================================================

import { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Flame,
  Trash2,
  CalendarCheck2,
  Target,
  Clock,
  Repeat,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
  Edit2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { useMetrics } from '../../hooks/useMetrics';
import type { HabitItem } from '../../lib/types';
import { cn } from '../../lib/utils';

export function HabitTracker() {
  const {
    todayMetrics,
    toggleHabit,
    addHabit,
    updateHabit,
    toggleHabitSubGoal,
    removeHabit,
    getConsistencyStats,
  } = useMetrics();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null);

  // New Habit Form States
  const [name, setName] = useState('');
  const [targetDuration, setTargetDuration] = useState('30');
  const [mainGoal, setMainGoal] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekdays' | 'weekends' | 'custom'>('daily');
  const [subGoalsInput, setSubGoalsInput] = useState('');
  const [expandedHabits, setExpandedHabits] = useState<Record<string, boolean>>({});

  const habits = todayMetrics?.habits_json || [];
  const stats = getConsistencyStats();

  const completedCount = habits.filter((h) => h.completed).length;
  const progressPercent = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  const toggleExpand = (id: string) => {
    setExpandedHabits((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveHabit = async () => {
    if (!name.trim()) return;

    const subGoals = subGoalsInput
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((title) => ({
        id: crypto.randomUUID(),
        title,
        completed: false,
      }));

    if (editingHabit) {
      await updateHabit(editingHabit.id, {
        name: name.trim(),
        target_duration_minutes: parseInt(targetDuration, 10) || 30,
        main_goal: mainGoal.trim(),
        frequency,
        sub_goals: subGoals.length > 0 ? subGoals : editingHabit.sub_goals,
      });
    } else {
      await addHabit({
        name: name.trim(),
        target_duration_minutes: parseInt(targetDuration, 10) || 30,
        main_goal: mainGoal.trim(),
        sub_goals: subGoals,
        frequency,
      });
    }

    setName('');
    setTargetDuration('30');
    setMainGoal('');
    setSubGoalsInput('');
    setEditingHabit(null);
    setIsModalOpen(false);
  };

  const openEditModal = (habit: HabitItem) => {
    setEditingHabit(habit);
    setName(habit.name);
    setTargetDuration(String(habit.target_duration_minutes || 30));
    setMainGoal(habit.main_goal || '');
    setFrequency(habit.frequency || 'daily');
    setSubGoalsInput((habit.sub_goals || []).map((s) => s.title).join('\n'));
    setIsModalOpen(true);
  };

  return (
    <Card className="p-5 space-y-4 bg-charcoal border border-border">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-amber-light" />
          <div>
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <span>Daily Habit Protocol</span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-light bg-amber/15 px-2 py-0.5 rounded border border-amber/30">
                Track Balancing
              </span>
            </h3>
            <span className="text-[11px] text-text-muted">
              {completedCount} of {habits.length} habits accomplished today ({progressPercent}%)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingHabit(null);
            setName('');
            setMainGoal('');
            setSubGoalsInput('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber hover:bg-amber-light text-obsidian text-xs font-semibold shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Consistency & Missing Days Analytics Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-obsidian rounded-xl border border-border text-xs font-mono">
        <div className="space-y-0.5">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span>Consistent</span>
          </span>
          <p className="text-sm font-bold text-success">{stats.consistentDays} Days</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Clock className="w-3 h-3 text-error" />
            <span>Missing</span>
          </span>
          <p className="text-sm font-bold text-error">{stats.missedDays} Days</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Percent className="w-3 h-3 text-amber-light" />
            <span>Consistency</span>
          </span>
          <p className="text-sm font-bold text-amber-light">{stats.consistencyRate}%</p>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-text-muted flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-light" />
            <span>Max Streak</span>
          </span>
          <p className="text-sm font-bold text-text-primary">
            {Math.max(0, ...habits.map((h) => h.longest_streak || h.streak || 0))}d
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-obsidian rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-dim to-amber h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Habits List */}
      <div className="space-y-2.5">
        {habits.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted bg-obsidian/40 rounded-xl border border-dashed border-border">
            No habits active. Click "+ New Habit" to set up your tracking routine.
          </div>
        ) : (
          habits.map((habit) => {
            const isExpanded = Boolean(expandedHabits[habit.id]);
            const subGoals = habit.sub_goals || [];
            const subGoalsCompleted = subGoals.filter((sg) => sg.completed).length;

            return (
              <div
                key={habit.id}
                className={cn(
                  'rounded-xl border transition-all p-3.5 space-y-2.5',
                  habit.completed
                    ? 'bg-amber/10 border-amber/30 text-text-primary'
                    : 'bg-obsidian border-border text-text-muted hover:border-border-light'
                )}
              >
                {/* Main Row */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <button
                      type="button"
                      className="text-amber-light transition-transform active:scale-90 shrink-0"
                    >
                      {habit.completed ? (
                        <CheckSquare className="w-4 h-4 fill-amber/20" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-xs font-semibold text-text-primary truncate',
                          habit.completed && 'line-through text-text-muted font-normal'
                        )}
                      >
                        {habit.name}
                      </p>

                      {habit.main_goal && (
                        <p className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5 truncate">
                          <Target className="w-3 h-3 text-amber-light shrink-0" />
                          <span>{habit.main_goal}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {habit.target_duration_minutes && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-border/60 text-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{habit.target_duration_minutes}m</span>
                      </span>
                    )}

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-border/60 text-text-muted capitalize flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      <span>{habit.frequency || 'Daily'}</span>
                    </span>

                    <div
                      className={cn(
                        'flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold',
                        habit.streak > 0
                          ? 'bg-amber/20 text-amber-light'
                          : 'bg-border/60 text-text-dim'
                      )}
                      title={`Current streak: ${habit.streak}d | Longest: ${habit.longest_streak || habit.streak}d`}
                    >
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{habit.streak}d</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditModal(habit)}
                      className="p-1 text-text-dim hover:text-text-primary rounded cursor-pointer transition-colors"
                      title="Edit Habit & Goals"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeHabit(habit.id)}
                      className="p-1 text-text-dim hover:text-error rounded cursor-pointer transition-colors"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {subGoals.length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(habit.id)}
                        className="p-1 text-text-muted hover:text-text-primary rounded cursor-pointer"
                        title="Toggle Sub-Goals"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-Goals Section */}
                {subGoals.length > 0 && (isExpanded || habit.completed) && (
                  <div className="pt-2 border-t border-border/50 pl-7 space-y-1.5 animate-fade-in">
                    <div className="flex items-center justify-between text-[10px] text-text-muted font-mono mb-1">
                      <span>Sub-Goals Milestone Progress:</span>
                      <span>
                        {subGoalsCompleted} / {subGoals.length} completed
                      </span>
                    </div>

                    {subGoals.map((sg) => (
                      <div
                        key={sg.id}
                        onClick={() => toggleHabitSubGoal(habit.id, sg.id)}
                        className="flex items-center gap-2 text-xs text-text-primary hover:text-amber-light cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={sg.completed}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded bg-charcoal border-border text-amber focus:ring-0 cursor-pointer"
                        />
                        <span
                          className={cn(
                            'text-[11px]',
                            sg.completed && 'line-through text-text-muted'
                          )}
                        >
                          {sg.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        title={editingHabit ? 'Edit Habit Protocol' : 'Create New Habit Protocol'}
      >
        <div className="space-y-4 pt-1 text-xs">
          <div>
            <label className="font-semibold text-text-primary block mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 'Deep Work & Architecture Review' or 'Gym Session'"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-amber/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-text-primary block mb-1">
                Target Duration (Minutes)
              </label>
              <input
                type="number"
                value={targetDuration}
                onChange={(e) => setTargetDuration(e.target.value)}
                placeholder="45"
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-amber/30"
              />
            </div>

            <div>
              <label className="font-semibold text-text-primary block mb-1">
                Auto-Recurring Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-amber/30 cursor-pointer"
              >
                <option value="daily">Everyday (Daily)</option>
                <option value="weekdays">Weekdays Only</option>
                <option value="weekends">Weekends Only</option>
                <option value="custom">Custom Milestone</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-1">
              Main High-Level Goal
            </label>
            <input
              type="text"
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              placeholder="e.g. 'Complete 90-day physical transformation' or 'Ship MVP on schedule'"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-amber/30"
            />
          </div>

          <div>
            <label className="font-semibold text-text-primary block mb-1">
              Sub-Goals / Milestones (One per line)
            </label>
            <textarea
              rows={3}
              value={subGoalsInput}
              onChange={(e) => setSubGoalsInput(e.target.value)}
              placeholder={`Milestone 1: 15 consecutive days\nMilestone 2: Double intensity\nMilestone 3: 30 consecutive days`}
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-amber/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingHabit(null);
              }}
              className="px-4 py-2 text-text-muted hover:text-text-primary cursor-pointer font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveHabit}
              disabled={!name.trim()}
              className="px-5 py-2 rounded-lg bg-amber hover:bg-amber-light text-obsidian font-semibold transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {editingHabit ? 'Update Habit' : 'Save Habit'}
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default HabitTracker;
