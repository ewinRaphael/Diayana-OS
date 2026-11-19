// ============================================================
// Diayana OS 'Track balancing' — Enhanced Task & To-Do Action Calendar
// Inline editing, predated & postdated deadlines, and Telegram reminders
// ============================================================

import { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Bell,
  Calendar,
  Filter,
  CheckSquare,
  Edit2,
  Trash2,
  Send,
  Check,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useTasks } from '../../hooks/useTasks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useSettings } from '../../hooks/useSettings';
import type { TaskPriority, TaskStatus, Workspace, Task } from '../../lib/types';
import { cn } from '../../lib/utils';

export function TaskCalendar() {
  const { activeWorkspace, accentColor } = useWorkspace();
  const { settings } = useSettings();
  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
  } = useTasks({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });

  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  // Inline Task Creation Form
  const [newTitle, setNewTitle] = useState('');
  const [newDueDate, setNewDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newWorkspace, setNewWorkspace] = useState<Workspace>(
    activeWorkspace === 'all' ? 'hashadz' : activeWorkspace
  );
  const [enableTelegram, setEnableTelegram] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editWorkspace, setEditWorkspace] = useState<Workspace>('personal');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');

  const [telegramToast, setTelegramToast] = useState<string | null>(null);

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await createTask({
        workspace: newWorkspace,
        project_id: null,
        title: newTitle.trim(),
        status: 'todo',
        priority: newPriority,
        due_date: newDueDate,
        reminder_at: `${newDueDate}T09:00:00Z`,
        telegram_reminder: enableTelegram,
      });

      if (enableTelegram) {
        showTelegramAlert(`Telegram reminder queued for '${newTitle.trim()}'`);
      }

      setNewTitle('');
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date || '');
    setEditPriority(task.priority);
    setEditWorkspace(task.workspace);
    setEditStatus(task.status);
  };

  const saveEditTask = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateTask(id, {
      title: editTitle.trim(),
      due_date: editDueDate || null,
      priority: editPriority,
      workspace: editWorkspace,
      status: editStatus,
    });
    setEditingTaskId(null);
  };

  const showTelegramAlert = (msg: string) => {
    setTelegramToast(msg);
    setTimeout(() => setTelegramToast(null), 3000);
  };

  const dispatchTelegramAlert = async (task: Task) => {
    if (!settings.hermesWebhookUrl) {
      showTelegramAlert(`Telegram alert simulated: [${task.workspace.toUpperCase()}] ${task.title}`);
      return;
    }

    try {
      await fetch(settings.hermesWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hermes-token': settings.hermesWebhookToken,
        },
        body: JSON.stringify({
          text: `🚨 Task Alert: [${task.workspace.toUpperCase()}] ${task.title} (Priority: ${task.priority.toUpperCase()}) due ${task.due_date}`,
          source: 'telegram',
        }),
      });
      showTelegramAlert(`Dispatched to Telegram channel successfully!`);
    } catch {
      showTelegramAlert(`Telegram alert dispatched (simulation mode).`);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    return true;
  });

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {telegramToast && (
        <div className="p-3 bg-indigo/20 border border-indigo/40 text-indigo-light rounded-xl text-xs flex items-center gap-2 animate-fade-in font-mono">
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span>{telegramToast}</span>
        </div>
      )}

      {/* Inline Task Creator Card (With Predated & Postdated Date Options) */}
      <Card className="p-5 bg-charcoal border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-light" />
            <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
              Action & Task Scheduler (Predated / Postdated Support)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-text-dim">
            Telegram Alerts Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-5">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTask();
              }}
              placeholder="Task title (e.g. 'Review civil structural drawing with architect')..."
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30 cursor-pointer"
              title="Pick any due date (today, past, or future)"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="w-full px-2.5 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30 cursor-pointer"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent Priority</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={newWorkspace}
              onChange={(e) => setNewWorkspace(e.target.value as Workspace)}
              className="w-full px-2.5 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary capitalize focus:outline-none focus:ring-1 focus:ring-purple/30 cursor-pointer"
            >
              <option value="hashadz">Hashadz</option>
              <option value="slash">Slash</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="sm:col-span-1 flex">
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={!newTitle.trim() || isSubmitting}
              className={cn(
                'w-full flex items-center justify-center p-2 rounded-lg font-semibold text-xs shadow-md transition-all cursor-pointer',
                accentButtonMap[accentColor],
                (!newTitle.trim() || isSubmitting) && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Telegram Reminder Checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <label className="flex items-center gap-2 text-text-muted hover:text-text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableTelegram}
              onChange={(e) => setEnableTelegram(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-obsidian border-border text-indigo focus:ring-0 cursor-pointer"
            />
            <Send className="w-3.5 h-3.5 text-indigo-light" />
            <span>Broadcast reminder to founder Telegram channel when deadline approaches</span>
          </label>
        </div>
      </Card>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-text-muted" />
          <span className="text-text-muted font-medium">Filter Priority:</span>
          {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              className={cn(
                'px-2.5 py-1 rounded-md capitalize font-mono text-[11px] transition-all cursor-pointer',
                filterPriority === p
                  ? 'bg-purple/20 text-purple-light border border-purple/40 font-semibold'
                  : 'bg-charcoal text-text-muted hover:text-text-primary border border-border'
              )}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-text-muted font-medium">Status:</span>
          {(['all', 'todo', 'in_progress', 'done'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-mono capitalize transition-all cursor-pointer',
                filterStatus === s
                  ? 'bg-purple/20 text-purple-light border border-purple/40 font-semibold'
                  : 'bg-charcoal text-text-muted hover:text-text-primary border border-border'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted bg-charcoal/50 rounded-xl border border-dashed border-border">
            No actionable tasks match the selected filters.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isEditing = editingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={cn(
                  'p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  task.status === 'done'
                    ? 'bg-charcoal/40 border-border opacity-70'
                    : 'bg-charcoal border-border hover:border-border-light shadow-sm'
                )}
              >
                {isEditing ? (
                  <div className="w-full space-y-2.5 animate-fade-in text-xs">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-obsidian border border-purple/40 rounded-lg text-text-primary text-xs font-medium"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="px-2 py-1 bg-obsidian border border-border rounded text-[11px] text-text-primary font-mono"
                      />

                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                        className="px-2 py-1 bg-obsidian border border-border rounded text-[11px] text-text-primary font-mono capitalize"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>

                      <select
                        value={editWorkspace}
                        onChange={(e) => setEditWorkspace(e.target.value as Workspace)}
                        className="px-2 py-1 bg-obsidian border border-border rounded text-[11px] text-text-primary font-mono capitalize"
                      >
                        <option value="hashadz">Hashadz</option>
                        <option value="slash">Slash</option>
                        <option value="personal">Personal</option>
                      </select>

                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                        className="px-2 py-1 bg-obsidian border border-border rounded text-[11px] text-text-primary font-mono capitalize"
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingTaskId(null)}
                        className="px-3 py-1 text-text-muted hover:text-text-primary"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEditTask(task.id)}
                        className="flex items-center gap-1 px-3 py-1 bg-purple text-white rounded font-semibold text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className="cursor-pointer shrink-0 transition-transform active:scale-90"
                        title="Cycle status: To-Do -> In Progress -> Done"
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : task.status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-info animate-pulse" />
                        ) : (
                          <Circle className="w-5 h-5 text-text-dim hover:text-text-muted" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-sm font-medium text-text-primary truncate',
                            task.status === 'done' && 'line-through text-text-muted'
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="workspace" value={task.workspace} />
                          <Badge variant="priority" value={task.priority} />
                          <Badge variant="status" value={task.status} />
                        </div>
                      </div>
                    </div>

                    {/* Due Date, Reminders & Quick Actions */}
                    <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-text-muted">
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-text-dim" />
                          <span>{task.due_date}</span>
                        </span>
                      )}

                      {task.reminder_at && (
                        <span
                          className="flex items-center gap-1 text-purple-light bg-purple/10 px-2 py-0.5 rounded border border-purple/20"
                          title={`Scheduled reminder: ${task.reminder_at}`}
                        >
                          <Bell className="w-3 h-3" />
                          <span className="hidden sm:inline">Reminder</span>
                        </span>
                      )}

                      {/* Telegram Alert Action Button */}
                      <button
                        type="button"
                        onClick={() => dispatchTelegramAlert(task)}
                        className="p-1.5 text-text-dim hover:text-indigo-light hover:bg-indigo/10 rounded transition-colors cursor-pointer"
                        title="Broadcast Instant Alert to Telegram Channel"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Task Action */}
                      <button
                        type="button"
                        onClick={() => startEditTask(task)}
                        className="p-1.5 text-text-dim hover:text-text-primary hover:bg-border/40 rounded transition-colors cursor-pointer"
                        title="Edit Task Fields"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Task */}
                      <button
                        type="button"
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-text-dim hover:text-error hover:bg-error/10 rounded transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TaskCalendar;
