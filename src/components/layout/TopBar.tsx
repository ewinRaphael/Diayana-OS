// ============================================================
// NexusOS — Top Bar with Global Workspace Switcher
// ============================================================

import { Mic, Bell } from 'lucide-react';
import { WorkspaceSwitcher } from '../workspace/WorkspaceSwitcher';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { NavPage } from './Sidebar';
import { cn } from '../../lib/utils';

interface TopBarProps {
  currentPage: NavPage;
  onOpenCapture: () => void;
  onNavigate: (page: NavPage) => void;
  className?: string;
}

const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Cross-workspace operational intelligence' },
  business: { title: 'Business Operations', subtitle: 'Meetings, projects, and active handling logs' },
  personal: { title: 'Personal Diary & Habits', subtitle: 'Voice journals, daily reflection, and habit tracking' },
  calendar: { title: 'Dual Calendars', subtitle: 'Activity timeline and task action schedule' },
  vault: { title: 'Media & Document Vault', subtitle: 'Project blueprints, contracts, and photo timeline' },
  settings: { title: 'System Settings', subtitle: 'Gemini AI, Supabase persistence, and Hermes bridge' },
};

export function TopBar({ currentPage, onOpenCapture, onNavigate, className }: TopBarProps) {
  const { accentColor } = useWorkspace();
  const pageMeta = pageTitles[currentPage] || pageTitles.dashboard;

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light shadow-purple/20',
    indigo: 'bg-indigo hover:bg-indigo-light shadow-indigo/20',
    emerald: 'bg-emerald hover:bg-emerald-light shadow-emerald/20',
    amber: 'bg-amber hover:bg-amber-light shadow-amber/20',
  };

  return (
    <header
      className={cn(
        'h-16 px-4 md:px-6 border-b border-border bg-charcoal/90 backdrop-blur-md flex items-center justify-between sticky top-0 z-30',
        className
      )}
    >
      {/* Left: Page Title */}
      <div className="hidden lg:flex flex-col">
        <h2 className="text-sm font-semibold text-text-primary leading-tight">
          {pageMeta.title}
        </h2>
        <span className="text-[11px] text-text-muted">
          {pageMeta.subtitle}
        </span>
      </div>

      {/* Center: Global Segmented Workspace Switcher */}
      <div className="flex-1 lg:flex-none flex justify-center">
        <WorkspaceSwitcher />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCapture}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all cursor-pointer',
            accentButtonMap[accentColor]
          )}
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Voice & Text AI</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-border/40 rounded-lg transition-colors cursor-pointer"
          title="Notifications & Settings"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
