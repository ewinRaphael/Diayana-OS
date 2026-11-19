// ============================================================
// NexusOS — Workspace Context & Provider
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { WorkspaceOrAll } from '../lib/types';

interface WorkspaceContextValue {
  activeWorkspace: WorkspaceOrAll;
  setActiveWorkspace: (ws: WorkspaceOrAll) => void;
  accentColor: string;
}

const workspaceAccentMap: Record<WorkspaceOrAll, string> = {
  all: 'purple',
  hashadz: 'indigo',
  slash: 'emerald',
  personal: 'amber',
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceOrAll>('all');

  const setActiveWorkspace = useCallback((ws: WorkspaceOrAll) => {
    setActiveWorkspaceState(ws);
  }, []);

  const accentColor = workspaceAccentMap[activeWorkspace];

  return (
    <WorkspaceContext.Provider value={{ activeWorkspace, setActiveWorkspace, accentColor }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}

export { workspaceAccentMap };
