// ============================================================
// NexusOS — Global Workspace Switcher (Segmented Pill)
// ============================================================

import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { WorkspaceOrAll } from '../../lib/types';
import { cn } from '../../lib/utils';

interface WorkspaceOption {
  id: WorkspaceOrAll;
  label: string;
  dotColor: string;
  activeBg: string;
  activeText: string;
}

const WORKSPACES: WorkspaceOption[] = [
  {
    id: 'all',
    label: 'Unified (All)',
    dotColor: 'bg-purple',
    activeBg: 'bg-purple/20',
    activeText: 'text-purple-light',
  },
  {
    id: 'hashadz',
    label: 'Hashadz',
    dotColor: 'bg-indigo',
    activeBg: 'bg-indigo/20',
    activeText: 'text-indigo-light',
  },
  {
    id: 'slash',
    label: 'Slash',
    dotColor: 'bg-emerald',
    activeBg: 'bg-emerald/20',
    activeText: 'text-emerald-light',
  },
  {
    id: 'personal',
    label: 'Personal',
    dotColor: 'bg-amber',
    activeBg: 'bg-amber/20',
    activeText: 'text-amber-light',
  },
];

interface WorkspaceSwitcherProps {
  className?: string;
}

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const { activeWorkspace, setActiveWorkspace } = useWorkspace();

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-obsidian border border-border rounded-full select-none',
        className
      )}
    >
      {WORKSPACES.map((ws) => {
        const isActive = activeWorkspace === ws.id;
        return (
          <button
            key={ws.id}
            type="button"
            onClick={() => setActiveWorkspace(ws.id)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer',
              isActive
                ? cn('shadow-sm font-semibold', ws.activeBg, ws.activeText)
                : 'text-text-muted hover:text-text-primary hover:bg-charcoal/50'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full transition-transform',
                ws.dotColor,
                isActive ? 'scale-110' : 'opacity-60'
              )}
            />
            <span>{ws.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default WorkspaceSwitcher;
