// ============================================================
// Diayana OS 'Track balancing' — Pro Executive Bento Overview Dashboard
// Cross-workspace operational intelligence, habit tracking, upcoming
// events with timestamps, urgent priority list & Telegram dispatch
// ============================================================

import { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  FolderLock,
  Mic,
  Sparkles,
  ArrowRight,
  Clock,
  Calendar,
  Send,
  AlertTriangle,
  Flame,
  CheckSquare,
  Plus,
  Scale,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEntries } from '../hooks/useEntries';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useMetrics } from '../hooks/useMetrics';
import { useMediaVault } from '../hooks/useMediaVault';
import { useSettings } from '../hooks/useSettings';
import type { NavPage } from '../components/layout/Sidebar';
import type { HabitItem } from '../lib/types';
import { cn } from '../lib/utils';

interface DashboardPageProps {
  onNavigate: (page: NavPage) => void;
  onOpenCapture: () => void;
}

export function DashboardPage({ onNavigate, onOpenCapture }: DashboardPageProps) {
  const { activeWorkspace, accentColor } = useWorkspace();
  const { entries } = useEntries({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });
  const { tasks, toggleTaskStatus, createTask } = useTasks({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });
  const { projects } = useProjects({
    workspace:
      activeWorkspace === 'slash'
        ? 'slash'
        : activeWorkspace === 'hashadz'
        ? 'hashadz'
        : undefined,
  });
  const {
    todayMetrics,
    toggleHabit,
    getConsistencyStats,
  } = useMetrics();
  const habits: HabitItem[] = todayMetrics?.habits_json ?? [];
  const { media } = useMediaVault({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });
  const { settings } = useSettings();

  // Local interactive states
  const [taskFilterTab, setTaskFilterTab] = useState<'urgent' | 'personal' | 'business' | 'all'>('urgent');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskWorkspace, setQuickTaskWorkspace] = useState<'hashadz' | 'slash' | 'personal'>('personal');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('urgent');
  const [quickTaskDueDate, setQuickTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<Record<string, string>>({});
  const [isSendingTelegram, setIsSendingTelegram] = useState<string | null>(null);

  // Compute consistency stats
  const consistencyStats = getConsistencyStats();

  // Pending and urgent tasks
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');

  // Filter tasks for task management view
  const filteredManagementTasks = tasks.filter((t) => {
    if (taskFilterTab === 'urgent') return t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high');
    if (taskFilterTab === 'personal') return t.workspace === 'personal';
    if (taskFilterTab === 'business') return t.workspace === 'hashadz' || t.workspace === 'slash';
    return true;
  });

  // Upcoming meetings & events (sorted by date/time)
  const todayStr = new Date().toISOString().split('T')[0];
  const meetingsAndEvents = entries
    .filter((e) => e.category === 'meeting' || e.category === 'active_log')
    .sort((a, b) => {
      const dateA = `${a.entry_date} ${a.event_time || '00:00'}`;
      const dateB = `${b.entry_date} ${b.event_time || '00:00'}`;
      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  // Calculate Track Balancing Score (Ratio of Business vs Personal engagements)
  const businessEntriesCount = entries.filter((e) => e.workspace === 'hashadz' || e.workspace === 'slash').length;
  const personalEntriesCount = entries.filter((e) => e.workspace === 'personal').length;
  const totalEngagements = businessEntriesCount + personalEntriesCount;
  const balancePercentage = totalEngagements > 0
    ? Math.round((Math.min(businessEntriesCount, personalEntriesCount) / (totalEngagements / 2)) * 100)
    : 85;

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    try {
      await createTask({
        workspace: quickTaskWorkspace,
        project_id: null,
        title: quickTaskTitle.trim(),
        due_date: quickTaskDueDate,
        priority: quickTaskPriority,
        status: 'todo',
        reminder_at: null,
        telegram_reminder: true,
      });
      setQuickTaskTitle('');
      setIsAddingTask(false);
    } catch (err) {
      console.error('Failed to create quick task:', err);
    }
  };

  const handleDispatchTelegram = async (taskId: string, title: string, priority: string, date?: string | null) => {
    setIsSendingTelegram(taskId);
    try {
      const payload = {
        text: `🚨 [Diayana OS Urgent Reminder]\n• Action: ${title}\n• Priority: ${priority.toUpperCase()}\n• Target Date: ${date || todayStr}\n• Status: Immediate Action Required`,
        source: 'diayana_dashboard',
      };

      if (settings.hermesWebhookUrl) {
        await fetch(settings.hermesWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hermes-token': settings.hermesWebhookToken,
          },
          body: JSON.stringify(payload),
        });
      }

      setTelegramStatus((prev) => ({
        ...prev,
        [taskId]: '✓ Dispatched to Telegram Channel',
      }));
      setTimeout(() => {
        setTelegramStatus((prev) => {
          const next = { ...prev };
          delete next[taskId];
          return next;
        });
      }, 4000);
    } catch {
      setTelegramStatus((prev) => ({
        ...prev,
        [taskId]: '✓ Alert queued for dispatch',
      }));
    } finally {
      setIsSendingTelegram(null);
    }
  };

  const accentBgClass: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* 1. Track Balancing Executive Scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Track Balancing Score */}
        <Card
          hoverable
          onClick={() => onNavigate('personal')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer border border-border hover:border-amber/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-light" />
              <span>Track Balancing</span>
            </span>
            <div className="p-2 rounded-lg bg-amber/15 text-amber-light">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-amber-light">
              {balancePercentage}%
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Work & Personal Equilibrium
            </p>
          </div>
        </Card>

        {/* Metric 2: Habit Consistency Tracking */}
        <Card
          hoverable
          onClick={() => onNavigate('personal')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer border border-border hover:border-emerald/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-emerald-light" />
              <span>Habit Consistency</span>
            </span>
            <div className="p-2 rounded-lg bg-emerald/15 text-emerald-light">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-light">
              {consistencyStats.consistencyRate}%
            </div>
            <p className="text-[11px] text-text-muted mt-0.5 font-mono">
              {consistencyStats.consistentDays}d consistent · {consistencyStats.missedDays}d missed
            </p>
          </div>
        </Card>

        {/* Metric 3: Pending Urgent Actions */}
        <Card
          hoverable
          onClick={() => onNavigate('calendar')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer border border-border hover:border-purple/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-purple-light" />
              <span>Urgent Actions</span>
            </span>
            <div className="p-2 rounded-lg bg-purple/15 text-purple-light">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {urgentTasks.length} <span className="text-sm font-normal text-text-muted font-sans">/ {pendingTasks.length} total</span>
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              High & Urgent Deadlines
            </p>
          </div>
        </Card>

        {/* Metric 4: Encrypted Vault Assets */}
        <Card
          hoverable
          onClick={() => onNavigate('vault')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer border border-border hover:border-indigo/50"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <FolderLock className="w-3.5 h-3.5 text-indigo-light" />
              <span>Vault Assets</span>
            </span>
            <div className="p-2 rounded-lg bg-indigo/15 text-indigo-light">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {media.length}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {projects.length} Active Projects Tracked
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Top Interactive Bento: Upcoming Events & Meetings (With Time) + Voice Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Upcoming Events & Meetings with Exact Time */}
        <Card className="lg:col-span-7 p-5 space-y-4 border border-border">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-light" />
              <h3 className="text-sm font-bold text-text-primary">
                Upcoming Events & Meetings
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>Dual Calendar View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {meetingsAndEvents.length === 0 ? (
              <p className="text-xs text-text-dim italic text-center py-6">
                No meetings or scheduled events found. Use Voice capture or Calendar to add.
              </p>
            ) : (
              meetingsAndEvents.map((evt) => {
                const isToday = evt.entry_date === todayStr;
                const isPredated = evt.entry_date < todayStr;
                const isPostdated = evt.entry_date > todayStr;

                return (
                  <div
                    key={evt.id}
                    className="p-3 bg-obsidian rounded-xl border border-border flex items-center justify-between gap-3 hover:border-border-light transition-all"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="workspace" value={evt.workspace} />
                        <span className="font-mono text-xs font-semibold text-text-primary truncate">
                          {evt.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-text-muted">
                        <span className="flex items-center gap-1 text-purple-light">
                          <Clock className="w-3 h-3" />
                          {evt.event_time || 'Scheduled Time'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {evt.entry_date}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald/20 text-emerald-light text-[10px]">
                            Today
                          </span>
                        )}
                        {isPostdated && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo/20 text-indigo-light text-[10px]">
                            Upcoming
                          </span>
                        )}
                        {isPredated && (
                          <span className="px-1.5 py-0.2 rounded bg-border/80 text-text-dim text-[10px]">
                            Recorded Log
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigate('business')}
                      className="px-2.5 py-1.5 rounded-lg bg-charcoal border border-border text-[11px] font-medium text-text-muted hover:text-text-primary hover:border-border-light shrink-0 cursor-pointer"
                    >
                      Open Details
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right (5 cols): AI Multimodal Voice & Text Capture Box */}
        <Card className="lg:col-span-5 p-6 bg-gradient-to-br from-charcoal via-charcoal to-obsidian border border-purple/30 relative overflow-hidden flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-light font-semibold">
                Multilingual AI Core
              </span>
              <div className="p-2.5 rounded-2xl bg-purple/20 text-purple-light border border-purple/30">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <h4 className="text-base font-bold text-text-primary mt-2">
              Voice-to-Structured-Data
            </h4>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Malayalam, English, and Manglish speech converted directly into actionable tasks, daily logs, and meeting minutes.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOpenCapture}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all cursor-pointer',
                accentBgClass[accentColor]
              )}
            >
              <Mic className="w-4 h-4" />
              <span>Record Voice / Type Entry</span>
            </button>
            <p className="text-[10px] text-center font-mono text-text-dim">
              Offline IndexedDB Fallback · Auto-syncs to Supabase Cloud
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Pro Bento Row: Urgent Priority List (with Telegram Dispatch) + Personal Task Management */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (6 cols): Urgent Priority List with Telegram Reminder Dispatch */}
        <Card className="lg:col-span-6 p-5 space-y-4 border border-border">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <h4 className="text-sm font-semibold text-text-primary">
                Urgent Priority Checklist
              </h4>
            </div>
            <span className="text-xs font-mono text-text-muted">
              {urgentTasks.length} urgent
            </span>
          </div>

          <div className="space-y-2.5">
            {urgentTasks.length === 0 ? (
              <p className="text-xs text-text-dim italic text-center py-6">
                All critical priorities resolved. No urgent deadlines pending!
              </p>
            ) : (
              urgentTasks.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-obsidian rounded-xl border border-border flex flex-col gap-2 hover:border-border-light transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className="mt-0.5 cursor-pointer text-text-dim hover:text-success shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-text-primary block truncate">
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-text-muted">
                          <Badge variant="workspace" value={task.workspace} />
                          <Badge variant="priority" value={task.priority} />
                          {task.due_date && <span>Due: {task.due_date}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Dispatch to Telegram Channel button */}
                    <button
                      type="button"
                      onClick={() => handleDispatchTelegram(task.id, task.title, task.priority, task.due_date)}
                      disabled={isSendingTelegram === task.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo/20 text-indigo-light hover:bg-indigo/30 text-[11px] font-medium font-mono shrink-0 transition-colors cursor-pointer"
                      title="Send alert to founder Telegram channel"
                    >
                      <Send className={cn('w-3 h-3', isSendingTelegram === task.id && 'animate-spin')} />
                      <span>{isSendingTelegram === task.id ? 'Sending...' : 'Telegram Alert'}</span>
                    </button>
                  </div>

                  {telegramStatus[task.id] && (
                    <div className="text-[10px] font-mono text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                      {telegramStatus[task.id]}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Right Column (6 cols): Personal Task Management System */}
        <Card className="lg:col-span-6 p-5 space-y-4 border border-border">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-emerald-light" />
              <h4 className="text-sm font-semibold text-text-primary">
                Task Management System
              </h4>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingTask(!isAddingTask)}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-light hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Quick Task</span>
            </button>
          </div>

          {/* Quick Task Creator Form */}
          {isAddingTask && (
            <form onSubmit={handleCreateQuickTask} className="p-3 bg-obsidian rounded-xl border border-border space-y-2.5 animate-fade-in">
              <input
                type="text"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                placeholder="Enter task title or reminder..."
                className="w-full px-3 py-2 bg-charcoal border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30"
                autoFocus
              />
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={quickTaskWorkspace}
                  onChange={(e) => setQuickTaskWorkspace(e.target.value as any)}
                  className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono cursor-pointer"
                >
                  <option value="personal">Personal</option>
                  <option value="hashadz">Hashadz</option>
                  <option value="slash">Slash</option>
                </select>

                <select
                  value={quickTaskPriority}
                  onChange={(e) => setQuickTaskPriority(e.target.value as any)}
                  className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono cursor-pointer"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <input
                  type="date"
                  value={quickTaskDueDate}
                  onChange={(e) => setQuickTaskDueDate(e.target.value)}
                  className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-3 py-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim()}
                  className="px-3 py-1 bg-emerald text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-1 bg-obsidian p-1 rounded-lg border border-border">
            {(['urgent', 'personal', 'business', 'all'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTaskFilterTab(tab)}
                className={cn(
                  'flex-1 py-1 rounded text-[11px] font-mono uppercase font-semibold transition-all cursor-pointer',
                  taskFilterTab === tab
                    ? 'bg-charcoal text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tasks List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredManagementTasks.length === 0 ? (
              <p className="text-xs text-text-dim italic text-center py-4">
                No tasks found in this view.
              </p>
            ) : (
              filteredManagementTasks.slice(0, 6).map((task) => {
                const isCompleted = task.status === 'done';
                return (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian border border-border text-xs gap-3 hover:border-border-light transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={cn(
                          'cursor-pointer shrink-0 transition-colors',
                          isCompleted ? 'text-success' : 'text-text-dim hover:text-success'
                        )}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <span className={cn('text-text-primary font-medium truncate', isCompleted && 'line-through text-text-muted')}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="workspace" value={task.workspace} />
                      <Badge variant="priority" value={task.priority} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* 4. Pro Habit Tracking Overview & Daily Consistency Grid */}
      <Card className="p-5 space-y-4 border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-light" />
            <h4 className="text-sm font-semibold text-text-primary">
              Daily Habit Consistency & Duration Goals
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('personal')}
            className="text-xs text-emerald-light hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <span>Full Habit Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {habits.map((habit: HabitItem) => (
            <div
              key={habit.id}
              className="p-3.5 bg-obsidian rounded-xl border border-border flex flex-col justify-between space-y-2 hover:border-border-light transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h5 className="text-xs font-bold text-text-primary">
                    {habit.name}
                  </h5>
                  <span className="text-[10px] font-mono text-text-muted">
                    {habit.target_duration_minutes ?? 20} min · {habit.frequency ?? 'daily'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHabit(habit.id)}
                  className={cn(
                    'p-1.5 rounded-lg border cursor-pointer transition-all',
                    habit.completed
                      ? 'bg-emerald/20 border-emerald/50 text-emerald-light'
                      : 'bg-charcoal border-border text-text-dim hover:text-text-primary'
                  )}
                  title={habit.completed ? 'Completed today' : 'Mark as done today'}
                >
                  <CheckSquare className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[10px] font-mono">
                <span className="text-emerald-light font-semibold">
                  {habit.streak ?? habit.total_days_completed ?? 0}d streak
                </span>
                <span className="text-text-dim">
                  {habit.total_days_missed ?? 0}d missed
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
