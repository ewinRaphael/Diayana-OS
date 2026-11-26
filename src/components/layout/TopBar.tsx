// ============================================================
// Diayana OS 'Track balancing' — Top Bar with Global Workspace Switcher
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
  keyvault: { title: 'Password Manager & KeyVault', subtitle: 'Master-password protected credentials, multi-account manager & security audit' },
  vault: { title: 'Media & Document Vault', subtitle: 'Project blueprints, contracts, and photo timeline' },
  settings: { title: 'System Settings', subtitle: 'Gemini AI, Supabase persistence, and Hermes bridge' },
};

export function TopBar({ currentPage, onOpenCapture, className }: TopBarProps) {
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
        'h-16 px-4 md:px-6 border-b border-border bg-charcoal/80 backdrop-blur-md flex items-center justify-between gap-4 shrink-0',
        className
      )}
    >
      {/* 1. Page Title & Subtitle */}
      <div className="hidden sm:block min-w-0">
        <h2 className="text-base font-bold text-text-primary tracking-tight truncate">
          {pageMeta.title}
        </h2>
        <p className="text-xs text-text-muted truncate">
          {pageMeta.subtitle}
        </p>
      </div>

      {/* 2. Global Segmented Workspace Switcher */}
      <div className="flex-1 max-w-md mx-auto flex justify-center">
        <WorkspaceSwitcher />
      </div>

      {/* 3. Header Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenCapture}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white shadow-md transition-all transform hover:scale-102 active:scale-98 cursor-pointer',
            accentButtonMap[accentColor]
          )}
        >
          <Mic className="w-4 h-4" />
          <span className="hidden md:inline">Voice & Text AI</span>
        </button>

        <button
          type="button"
          className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-border/40 transition-colors relative cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple animate-pulse" />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
