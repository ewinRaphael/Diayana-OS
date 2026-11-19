// ============================================================
// Diayana OS 'Track balancing' — Enhanced useMetrics Hook
// Dynamic habits, duration/goals/sub-goals, consistency analytics,
// and auto-date timeline reflection editing
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  PersonalDailyMetrics,
  HabitItem,
  HabitSubGoal,
} from '../lib/types';
import { todayDate } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';

function dateOffset(baseDate: string, days: number): string {
  const [y, m, d] = baseDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyMetrics(date: string): Omit<PersonalDailyMetrics, 'id' | 'updated_at'> {
  return {
    entry_date: date,
    habits_json: [],
    achievements_list: [],
    time_wasters_list: [],
    reflection_sub_goals: [],
    productivity_score: 50,
  };
}

export function useMetrics(initialDate?: string) {
  const { store } = useDatabase();
  const [activeDate, setActiveDate] = useState<string>(initialDate || todayDate());
  const [currentMetrics, setCurrentMetrics] = useState<PersonalDailyMetrics | null>(null);
  const [weekMetrics, setWeekMetrics] = useState<PersonalDailyMetrics[]>([]);
  const [allHistory, setAllHistory] = useState<PersonalDailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const weekStart = dateOffset(activeDate, -6);
      const historyStart = dateOffset(activeDate, -30);

      const [selectedData, weekData, historyData] = await Promise.all([
        store.getMetrics(activeDate),
        store.getMetricsRange(weekStart, activeDate),
        store.getMetricsRange(historyStart, activeDate),
      ]);

      if (mountedRef.current) {
        setCurrentMetrics(selectedData);
        setWeekMetrics(weekData);
        setAllHistory(historyData);
      }
    } catch (err) {
      console.error('[useMetrics] Failed to fetch metrics:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store, activeDate]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  // Compute consistency metrics
  const getConsistencyStats = useCallback(
    (habitName?: string) => {
      if (allHistory.length === 0) {
        return { totalDays: 0, consistentDays: 0, missedDays: 0, consistencyRate: 0 };
      }

      let consistent = 0;
      let evaluated = 0;

      for (const day of allHistory) {
        const habits = day.habits_json || [];
        if (habitName) {
          const match = habits.find((h) => h.name.toLowerCase() === habitName.toLowerCase());
          if (match) {
            evaluated++;
            if (match.completed) consistent++;
          }
        } else {
          if (habits.length > 0) {
            evaluated++;
            const completedCount = habits.filter((h) => h.completed).length;
            if (completedCount >= habits.length * 0.5) consistent++;
          }
        }
      }

      const total = evaluated || allHistory.length;
      const missed = Math.max(0, total - consistent);
      const rate = total > 0 ? Math.round((consistent / total) * 100) : 0;

      return {
        totalDays: total,
        consistentDays: consistent,
        missedDays: missed,
        consistencyRate: rate,
      };
    },
    [allHistory]
  );

  const upsertMetrics = useCallback(
    async (data: Partial<PersonalDailyMetrics>) => {
      if (!store) throw new Error('Database not ready');
      const targetDate = data.entry_date || activeDate;
      const existing = await store.getMetrics(targetDate);
      const merged: Omit<PersonalDailyMetrics, 'id' | 'updated_at'> = {
        entry_date: targetDate,
        habits_json: data.habits_json ?? existing?.habits_json ?? [],
        achievements_list: data.achievements_list ?? existing?.achievements_list ?? [],
        time_wasters_list: data.time_wasters_list ?? existing?.time_wasters_list ?? [],
        reflection_sub_goals: data.reflection_sub_goals ?? existing?.reflection_sub_goals ?? [],
        productivity_score: data.productivity_score ?? existing?.productivity_score ?? 50,
      };

      const result = await store.upsertMetrics(merged);
      await refresh();
      return result;
    },
    [store, activeDate, refresh]
  );

  // ---------------------------------------------------------------------------
  // Habit Operations
  // ---------------------------------------------------------------------------

  const addHabit = useCallback(
    async (params: {
      name: string;
      target_duration_minutes?: number;
      main_goal?: string;
      sub_goals?: HabitSubGoal[];
      frequency?: 'daily' | 'weekdays' | 'weekends' | 'custom';
      custom_days?: string[];
    }) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const habits = [...(current.habits_json ?? [])];

      const newHabit: HabitItem = {
        id: crypto.randomUUID(),
        name: params.name,
        completed: false,
        streak: 0,
        longest_streak: 0,
        total_days_completed: 0,
        total_days_missed: 0,
        target_duration_minutes: params.target_duration_minutes || 30,
        main_goal: params.main_goal || '',
        sub_goals: params.sub_goals || [],
        frequency: params.frequency || 'daily',
        custom_days: params.custom_days || [],
      };

      habits.push(newHabit);
      await upsertMetrics({ habits_json: habits });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const updateHabit = useCallback(
    async (habitId: string, updates: Partial<HabitItem>) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const habits = (current.habits_json ?? []).map((h) =>
        h.id === habitId ? { ...h, ...updates } : h
      );
      await upsertMetrics({ habits_json: habits });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const habits = [...(current.habits_json ?? [])];
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) return;

      const habit = { ...habits[idx] };
      habit.completed = !habit.completed;

      if (habit.completed) {
        habit.streak = (habit.streak || 0) + 1;
        habit.total_days_completed = (habit.total_days_completed || 0) + 1;
        if (habit.streak > (habit.longest_streak || 0)) {
          habit.longest_streak = habit.streak;
        }
      } else {
        habit.streak = Math.max(0, (habit.streak || 1) - 1);
        habit.total_days_missed = (habit.total_days_missed || 0) + 1;
      }

      habits[idx] = habit;
      await upsertMetrics({ habits_json: habits });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const toggleHabitSubGoal = useCallback(
    async (habitId: string, subGoalId: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const habits = (current.habits_json ?? []).map((h) => {
        if (h.id !== habitId) return h;
        const updatedSubs = (h.sub_goals || []).map((sg) =>
          sg.id === subGoalId ? { ...sg, completed: !sg.completed } : sg
        );
        return { ...h, sub_goals: updatedSubs };
      });
      await upsertMetrics({ habits_json: habits });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const removeHabit = useCallback(
    async (habitId: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const habits = (current.habits_json ?? []).filter((h) => h.id !== habitId);
      await upsertMetrics({ habits_json: habits });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  // ---------------------------------------------------------------------------
  // Achievement & Time Waster Operations
  // ---------------------------------------------------------------------------

  const addAchievement = useCallback(
    async (achievement: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const achievements = [...(current.achievements_list ?? []), achievement];
      const newScore = Math.min(
        100,
        50 + achievements.length * 15 - (current.time_wasters_list?.length || 0) * 10
      );
      await upsertMetrics({ achievements_list: achievements, productivity_score: newScore });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const updateAchievement = useCallback(
    async (index: number, newText: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const achievements = [...(current.achievements_list ?? [])];
      achievements[index] = newText;
      await upsertMetrics({ achievements_list: achievements });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const removeAchievement = useCallback(
    async (index: number) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const achievements = [...(current.achievements_list ?? [])];
      achievements.splice(index, 1);
      const newScore = Math.max(
        0,
        50 + achievements.length * 15 - (current.time_wasters_list?.length || 0) * 10
      );
      await upsertMetrics({ achievements_list: achievements, productivity_score: newScore });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const addTimeWaster = useCallback(
    async (waster: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const wasters = [...(current.time_wasters_list ?? []), waster];
      const newScore = Math.max(
        0,
        50 + (current.achievements_list?.length || 0) * 15 - wasters.length * 10
      );
      await upsertMetrics({ time_wasters_list: wasters, productivity_score: newScore });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const updateTimeWaster = useCallback(
    async (index: number, newText: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const wasters = [...(current.time_wasters_list ?? [])];
      wasters[index] = newText;
      await upsertMetrics({ time_wasters_list: wasters });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const removeTimeWaster = useCallback(
    async (index: number) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const wasters = [...(current.time_wasters_list ?? [])];
      wasters.splice(index, 1);
      const newScore = Math.max(
        0,
        50 + (current.achievements_list?.length || 0) * 15 - wasters.length * 10
      );
      await upsertMetrics({ time_wasters_list: wasters, productivity_score: newScore });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  // ---------------------------------------------------------------------------
  // Reflection Sub-Goals
  // ---------------------------------------------------------------------------

  const addReflectionSubGoal = useCallback(
    async (title: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const subGoals = [
        ...(current.reflection_sub_goals ?? []),
        { id: crypto.randomUUID(), title, completed: false },
      ];
      await upsertMetrics({ reflection_sub_goals: subGoals });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const toggleReflectionSubGoal = useCallback(
    async (subGoalId: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const subGoals = (current.reflection_sub_goals ?? []).map((sg) =>
        sg.id === subGoalId ? { ...sg, completed: !sg.completed } : sg
      );
      await upsertMetrics({ reflection_sub_goals: subGoals });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  const removeReflectionSubGoal = useCallback(
    async (subGoalId: string) => {
      if (!store) throw new Error('Database not ready');
      const current = currentMetrics ?? (emptyMetrics(activeDate) as PersonalDailyMetrics);
      const subGoals = (current.reflection_sub_goals ?? []).filter(
        (sg) => sg.id !== subGoalId
      );
      await upsertMetrics({ reflection_sub_goals: subGoals });
    },
    [store, currentMetrics, activeDate, upsertMetrics]
  );

  return {
    activeDate,
    setActiveDate,
    todayMetrics: currentMetrics,
    weekMetrics,
    allHistory,
    loading,
    refreshMetrics: refresh,
    upsertMetrics,
    getConsistencyStats,
    addHabit,
    updateHabit,
    toggleHabit,
    toggleHabitSubGoal,
    removeHabit,
    addAchievement,
    updateAchievement,
    removeAchievement,
    addTimeWaster,
    updateTimeWaster,
    removeTimeWaster,
    addReflectionSubGoal,
    toggleReflectionSubGoal,
    removeReflectionSubGoal,
  } as const;
}

export default useMetrics;
