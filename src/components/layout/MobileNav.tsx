// ============================================================
// NexusOS — Mobile Bottom Sticky Navigation (PWA View)
// ============================================================

import {
  LayoutDashboard,
  Briefcase,
  Mic,
  CalendarDays,
  FolderLock,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { NavPage } from './Sidebar';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  onOpenCapture: () => void;
}

export function MobileNav({ currentPage, onNavigate, onOpenCapture }: MobileNavProps) {
  const { accentColor } = useWorkspace();

  const accentActiveColor: Record<string, string> = {
    purple: 'text-purple-light',
    indigo: 'text-indigo-light',
    emerald: 'text-emerald-light',
    amber: 'text-amber-light',
  };

  const centerMicButtonBg: Record<string, string> = {
    purple: 'bg-purple shadow-purple/40',
    indigo: 'bg-indigo shadow-indigo/40',
    emerald: 'bg-emerald shadow-emerald/40',
    amber: 'bg-amber shadow-amber/40',
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal/95 backdrop-blur-md border-t border-border px-2 py-1.5 flex items-center justify-around">
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={cn(
          'flex flex-col items-center justify-center p-1.5 text-[10px] font-medium transition-colors cursor-pointer',
          currentPage === 'dashboard'
            ? accentActiveColor[accentColor]
            : 'text-text-muted hover:text-text-primary'
        )}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Overview</span>
      </button>

      {/* 2. Business */}
      <button
        type="button"
        onClick={() => onNavigate('business')}
        className={cn(
          'flex flex-col items-center justify-center p-1.5 text-[10px] font-medium transition-colors cursor-pointer',
          currentPage === 'business'
            ? accentActiveColor[accentColor]
            : 'text-text-muted hover:text-text-primary'
        )}
      >
        <Briefcase className="w-5 h-5 mb-0.5" />
        <span>Business</span>
      </button>

      {/* 3. Center Prominent Microphone Button */}
      <div className="-mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={onOpenCapture}
          className={cn(
            'w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-pulse-glow cursor-pointer',
            centerMicButtonBg[accentColor]
          )}
          title="One-Tap Voice & Text Capture"
        >
          <Mic className="w-6 h-6" />
        </button>
        <span className="text-[9px] text-text-muted font-medium mt-1">Capture</span>
      </div>

      {/* 4. Calendar */}
      <button
        type="button"
        onClick={() => onNavigate('calendar')}
        className={cn(
          'flex flex-col items-center justify-center p-1.5 text-[10px] font-medium transition-colors cursor-pointer',
          currentPage === 'calendar'
            ? accentActiveColor[accentColor]
            : 'text-text-muted hover:text-text-primary'
        )}
      >
        <CalendarDays className="w-5 h-5 mb-0.5" />
        <span>Calendar</span>
      </button>

      {/* 5. Vault */}
      <button
        type="button"
        onClick={() => onNavigate('vault')}
        className={cn(
          'flex flex-col items-center justify-center p-1.5 text-[10px] font-medium transition-colors cursor-pointer',
          currentPage === 'vault'
            ? accentActiveColor[accentColor]
            : 'text-text-muted hover:text-text-primary'
        )}
      >
        <FolderLock className="w-5 h-5 mb-0.5" />
        <span>Vault</span>
      </button>
    </nav>
  );
}

export default MobileNav;
