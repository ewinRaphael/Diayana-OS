// ============================================================
// NexusOS — Calendar 1: Notes & Activity Timeline Calendar
// ============================================================

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { DaySnapshot } from './DaySnapshot';
import { useEntries } from '../../hooks/useEntries';
import { useMediaVault } from '../../hooks/useMediaVault';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

export function NotesCalendar() {
  const { activeWorkspace } = useWorkspace();
  const { entries } = useEntries({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });
  const { media } = useMediaVault();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Map entries by date string (YYYY-MM-DD)
  const entriesByDate: Record<string, { hashadz: boolean; slash: boolean; personal: boolean; count: number }> = {};
  for (const entry of entries) {
    if (!entriesByDate[entry.entry_date]) {
      entriesByDate[entry.entry_date] = { hashadz: false, slash: false, personal: false, count: 0 };
    }
    entriesByDate[entry.entry_date].count++;
    if (entry.workspace === 'hashadz') entriesByDate[entry.entry_date].hashadz = true;
    if (entry.workspace === 'slash') entriesByDate[entry.entry_date].slash = true;
    if (entry.workspace === 'personal') entriesByDate[entry.entry_date].personal = true;
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation Bar */}
      <Card className="p-4 bg-charcoal border border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-purple-light" />
          <h3 className="text-base font-bold text-text-primary tracking-tight">
            {monthNames[month]} {year}
          </h3>
          <span className="text-xs font-mono text-text-muted hidden sm:inline">
            Timeline Activity Matrix
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={setToday}
            className="px-3 py-1.5 text-xs font-medium bg-obsidian border border-border rounded-lg text-text-primary hover:border-border-light cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-obsidian border border-border rounded-lg">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-mono text-text-muted px-2">
        <span className="text-[11px] uppercase tracking-wider text-text-dim">
          Activity Indicators:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo" /> Hashadz
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald" /> Slash
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber" /> Personal
        </span>
      </div>

      {/* Calendar Grid */}
      <Card className="p-4 bg-charcoal border border-border">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-mono text-text-dim">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 rounded-xl bg-obsidian/30 opacity-20" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const activity = entriesByDate[dateStr];

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={cn(
                  'h-20 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none',
                  isToday
                    ? 'border-purple/60 bg-purple/5'
                    : isSelected
                    ? 'border-purple bg-charcoal shadow-lg'
                    : 'border-border bg-obsidian hover:border-border-light hover:bg-charcoal/60'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-mono font-semibold',
                      isToday ? 'text-purple-light' : 'text-text-primary'
                    )}
                  >
                    {dayNum}
                  </span>

                  {activity && activity.count > 0 && (
                    <span className="text-[10px] font-mono text-text-muted bg-border/50 px-1.5 rounded">
                      {activity.count}
                    </span>
                  )}
                </div>

                {/* Dots indicator */}
                <div className="flex items-center gap-1 pb-1">
                  {activity?.hashadz && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo" title="Hashadz Log" />
                  )}
                  {activity?.slash && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald" title="Slash Log" />
                  )}
                  {activity?.personal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber" title="Personal Diary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Snapshot Drawer */}
      {selectedDate && (
        <DaySnapshot
          date={selectedDate}
          entries={entries}
          media={media}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

export default NotesCalendar;
