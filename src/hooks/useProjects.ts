// ============================================================
// NexusOS — useProjects hook
// CRUD operations for Project records with workspace filtering
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Project } from '../lib/types';
import type { ProjectFilter } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface UseProjectsOptions {
  workspace?: 'hashadz' | 'slash';
}

export function useProjects(options?: UseProjectsOptions) {
  const { store } = useDatabase();
  const { activeWorkspace } = useWorkspace();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const buildFilter = useCallback((): ProjectFilter | undefined => {
    if (options?.workspace) {
      return { workspace: options.workspace };
    }
    // Projects only exist in hashadz or slash workspaces
    if (activeWorkspace === 'hashadz' || activeWorkspace === 'slash') {
      return { workspace: activeWorkspace };
    }
    // 'all' or 'personal' — show all projects (hashadz + slash)
    return undefined;
  }, [options?.workspace, activeWorkspace]);

  const refreshProjects = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const result = await store.getProjects(buildFilter());
      if (mountedRef.current) {
        setProjects(result);
      }
    } catch (err) {
      console.error('[useProjects] Failed to fetch projects:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store, buildFilter]);

  useEffect(() => {
    mountedRef.current = true;
    refreshProjects();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshProjects]);

  const createProject = useCallback(
    async (project: Omit<Project, 'id' | 'created_at'>) => {
      if (!store) throw new Error('Database not ready');
      const created = await store.createProject(project);
      await refreshProjects();
      return created;
    },
    [store, refreshProjects],
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      if (!store) throw new Error('Database not ready');
      const updated = await store.updateProject(id, updates);
      await refreshProjects();
      return updated;
    },
    [store, refreshProjects],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!store) throw new Error('Database not ready');
      await store.deleteProject(id);
      await refreshProjects();
    },
    [store, refreshProjects],
  );

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,
  };
}
