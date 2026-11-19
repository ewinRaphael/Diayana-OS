// ============================================================
// NexusOS — useMetrics hook
// Personal daily metrics: habits, achievements, time wasters
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PersonalDailyMetrics, HabitItem } from '../lib/types';
import { todayDate } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function emptyMetrics(date: string): Omit<PersonalDailyMetrics, 'id' | 'updated_at'> {
  return {
    entry_date: date,
    habits_json: [],
    achievements_list: [],
    time_wasters_list: [],
    productivity_score: 0,
  };
}

export function useMetrics() {
  const { store } = useDatabase();
  const [todayMetrics, setTodayMetrics] = useState<PersonalDailyMetrics | null>(null);
  const [weekMetrics, setWeekMetrics] = useState<PersonalDailyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const today = todayDate();
      const weekStart = dateOffset(-6);

      const [todayData, weekData] = await Promise.all([
        store.getMetrics(today),
        store.getMetricsRange(weekStart, today),
      ]);

      if (mountedRef.current) {
        setTodayMetrics(todayData);
        setWeekMetrics(weekData);
      }
    } catch (err) {
      console.error('[useMetrics] Failed to fetch metrics:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  const upsertMetrics = useCallback(
    async (data: Omit<PersonalDailyMetrics, 'id' | 'updated_at'>) => {
      if (!store) throw new Error('Database not ready');
      const result = await store.upsertMetrics(data);
      await refresh();
      return result;
    },
    [store, refresh],
  );

  // ---------------------------------------------------------------------------
  // Habit operations
  // ---------------------------------------------------------------------------

  const addHabit = useCallback(
    async (name: string) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const habits = [...(current.habits_json ?? [])];

      const newHabit: HabitItem = {
        id: crypto.randomUUID(),
        name,
        completed: false,
        streak: 0,
      };

      habits.push(newHabit);

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: habits,
        achievements_list: current.achievements_list ?? [],
        time_wasters_list: current.time_wasters_list ?? [],
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const habits = [...(current.habits_json ?? [])];
      const idx = habits.findIndex((h) => h.id === habitId);
      if (idx === -1) throw new Error(`Habit ${habitId} not found`);

      const habit = { ...habits[idx] };
      const wasCompleted = habit.completed;
      habit.completed = !wasCompleted;

      // Streak calculation
      if (habit.completed) {
        // Check yesterday's data to decide whether to increment or start fresh
        const yesterday = dateOffset(-1);
        const yesterdayData = await store.getMetrics(yesterday);
        const yesterdayHabit = yesterdayData?.habits_json?.find((h) => h.name === habit.name);

        if (yesterdayHabit?.completed) {
          habit.streak = (yesterdayHabit.streak ?? 0) + 1;
        } else {
          habit.streak = 1;
        }
      } else {
        // Un-completing resets streak to 0
        habit.streak = 0;
      }

      habits[idx] = habit;

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: habits,
        achievements_list: current.achievements_list ?? [],
        time_wasters_list: current.time_wasters_list ?? [],
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  const removeHabit = useCallback(
    async (habitId: string) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const habits = (current.habits_json ?? []).filter((h) => h.id !== habitId);

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: habits,
        achievements_list: current.achievements_list ?? [],
        time_wasters_list: current.time_wasters_list ?? [],
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  // ---------------------------------------------------------------------------
  // Achievement operations
  // ---------------------------------------------------------------------------

  const addAchievement = useCallback(
    async (achievement: string) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const achievements = [...(current.achievements_list ?? []), achievement];

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: current.habits_json ?? [],
        achievements_list: achievements,
        time_wasters_list: current.time_wasters_list ?? [],
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  const removeAchievement = useCallback(
    async (index: number) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const achievements = [...(current.achievements_list ?? [])];
      achievements.splice(index, 1);

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: current.habits_json ?? [],
        achievements_list: achievements,
        time_wasters_list: current.time_wasters_list ?? [],
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  // ---------------------------------------------------------------------------
  // Time waster operations
  // ---------------------------------------------------------------------------

  const addTimeWaster = useCallback(
    async (waster: string) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const wasters = [...(current.time_wasters_list ?? []), waster];

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: current.habits_json ?? [],
        achievements_list: current.achievements_list ?? [],
        time_wasters_list: wasters,
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  const removeTimeWaster = useCallback(
    async (index: number) => {
      if (!store) throw new Error('Database not ready');
      const today = todayDate();
      const current = todayMetrics ?? { ...emptyMetrics(today) } as PersonalDailyMetrics;
      const wasters = [...(current.time_wasters_list ?? [])];
      wasters.splice(index, 1);

      await store.upsertMetrics({
        entry_date: current.entry_date || today,
        habits_json: current.habits_json ?? [],
        achievements_list: current.achievements_list ?? [],
        time_wasters_list: wasters,
        productivity_score: current.productivity_score ?? 0,
      });
      await refresh();
    },
    [store, todayMetrics, refresh],
  );

  return {
    todayMetrics,
    weekMetrics,
    loading,
    upsertMetrics,
    addHabit,
    toggleHabit,
    removeHabit,
    addAchievement,
    removeAchievement,
    addTimeWaster,
    removeTimeWaster,
  } as const;
}

export default useMetrics;
