// ============================================================
// Diayana OS 'Track balancing' — Collapsible Navigation Sidebar
// ============================================================

import { useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  User,
  CalendarDays,
  ShieldCheck,
  FolderLock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

export type NavPage = 'dashboard' | 'business' | 'personal' | 'calendar' | 'keyvault' | 'vault' | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  className?: string;
}

export function Sidebar({ currentPage, onNavigate, className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { activeWorkspace, accentColor } = useWorkspace();

  const accentTextMap: Record<string, string> = {
    purple: 'text-purple-light',
    indigo: 'text-indigo-light',
    emerald: 'text-emerald-light',
    amber: 'text-amber-light',
  };

  const accentBgMap: Record<string, string> = {
    purple: 'bg-purple/15 text-purple-light border-r-2 border-purple',
    indigo: 'bg-indigo/15 text-indigo-light border-r-2 border-indigo',
    emerald: 'bg-emerald/15 text-emerald-light border-r-2 border-emerald',
    amber: 'bg-amber/15 text-amber-light border-r-2 border-amber',
  };

  const navItems = [
    { id: 'dashboard' as NavPage, label: 'Overview', icon: LayoutDashboard },
    {
      id: 'business' as NavPage,
      label: activeWorkspace === 'slash' ? 'Slash Hub' : 'Hashadz Hub',
      icon: Briefcase,
    },
    { id: 'personal' as NavPage, label: 'Personal Life', icon: User },
    { id: 'calendar' as NavPage, label: 'Dual Calendars', icon: CalendarDays },
    { id: 'keyvault' as NavPage, label: 'Password Manager', icon: ShieldCheck },
    { id: 'vault' as NavPage, label: 'Media & Vault', icon: FolderLock },
    { id: 'settings' as NavPage, label: 'Integrations', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-border bg-charcoal transition-all duration-300 relative select-none',
        isCollapsed ? 'w-16' : 'w-60',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-dim to-indigo flex items-center justify-center shadow-md">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-text-primary flex items-center gap-1.5">
                Diayana<span className={accentTextMap[accentColor]}>OS</span>
              </h1>
              <p className="text-[10px] text-text-muted font-mono tracking-tight text-amber-light/90">
                'Track balancing'
              </p>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-dim to-indigo flex items-center justify-center shadow-md">
            <Layers className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
                isActive
                  ? accentBgMap[accentColor]
                  : 'text-text-muted hover:text-text-primary hover:bg-border/40'
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'opacity-100' : 'opacity-70')} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse / Expand Toggle */}
      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
