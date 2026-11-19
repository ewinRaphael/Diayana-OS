// ============================================================
// NexusOS — Dual Calendar Ecosystem Page
// Mode Switcher: Notes & Activity Timeline vs. Task & To-Do Action
// ============================================================

import { useState } from 'react';
import { CalendarDays, CheckSquare, Layers } from 'lucide-react';
import { NotesCalendar } from '../components/calendar/NotesCalendar';
import { TaskCalendar } from '../components/calendar/TaskCalendar';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { cn } from '../lib/utils';

type CalendarMode = 'timeline' | 'tasks';

export function CalendarPage() {
  const [mode, setMode] = useState<CalendarMode>('timeline');
  const { accentColor } = useWorkspace();

  const accentActiveClasses: Record<string, string> = {
    purple: 'bg-purple/20 text-purple-light border-purple/40',
    indigo: 'bg-indigo/20 text-indigo-light border-indigo/40',
    emerald: 'bg-emerald/20 text-emerald-light border-emerald/40',
    amber: 'bg-amber/20 text-amber-light border-amber/40',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Prominent Mode Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-charcoal rounded-xl border border-border">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-light" />
            <span>Dual Calendar Ecosystem</span>
          </h2>
          <p className="text-xs text-text-muted">
            Strict separation between historical documentation and actionable deadlines
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-obsidian rounded-xl border border-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMode('timeline')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              mode === 'timeline'
                ? cn('border shadow-sm', accentActiveClasses[accentColor])
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <Layers className="w-4 h-4" />
            <span>1. Activity Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('tasks')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              mode === 'tasks'
                ? cn('border shadow-sm', accentActiveClasses[accentColor])
                : 'text-text-muted hover:text-text-primary'
            )}
          >
            <CheckSquare className="w-4 h-4" />
            <span>2. Task & To-Do Action</span>
          </button>
        </div>
      </div>

      {/* Render Mode Component */}
      <div>
        {mode === 'timeline' ? <NotesCalendar /> : <TaskCalendar />}
      </div>
    </div>
  );
}

export default CalendarPage;
