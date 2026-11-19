// ============================================================
// NexusOS — useEntries hook
// CRUD operations for Entry records with workspace filtering
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Entry, EntryCategory, Workspace } from '../lib/types';
import type { EntryFilter } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface UseEntriesOptions {
  workspace?: Workspace;
  category?: EntryCategory;
  date?: string;
  search?: string;
}

export function useEntries(options: UseEntriesOptions = {}) {
  const { store } = useDatabase();
  const { activeWorkspace } = useWorkspace();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const buildFilter = useCallback((): EntryFilter => {
    const filter: EntryFilter = {};

    // Use explicit workspace option, or auto-filter by activeWorkspace (unless 'all')
    const ws = options.workspace ?? (activeWorkspace !== 'all' ? activeWorkspace : undefined);
    if (ws) filter.workspace = ws;
    if (options.category) filter.category = options.category;
    if (options.date) filter.date = options.date;
    if (options.search) filter.search = options.search;

    return filter;
  }, [options.workspace, options.category, options.date, options.search, activeWorkspace]);

  const refreshEntries = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const result = await store.getEntries(buildFilter());
      if (mountedRef.current) {
        setEntries(result);
      }
    } catch (err) {
      console.error('[useEntries] Failed to fetch entries:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store, buildFilter]);

  useEffect(() => {
    mountedRef.current = true;
    refreshEntries();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshEntries]);

  const createEntry = useCallback(
    async (entry: Omit<Entry, 'id' | 'created_at'>) => {
      if (!store) throw new Error('Database not ready');
      const created = await store.createEntry(entry);
      await refreshEntries();
      return created;
    },
    [store, refreshEntries],
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Entry>) => {
      if (!store) throw new Error('Database not ready');
      const updated = await store.updateEntry(id, updates);
      await refreshEntries();
      return updated;
    },
    [store, refreshEntries],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!store) throw new Error('Database not ready');
      await store.deleteEntry(id);
      await refreshEntries();
    },
    [store, refreshEntries],
  );

  return {
    entries,
    loading,
    createEntry,
    updateEntry,
    deleteEntry,
    refreshEntries,
  } as const;
}

export default useEntries;
