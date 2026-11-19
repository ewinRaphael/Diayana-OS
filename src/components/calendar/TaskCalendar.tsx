// ============================================================
// NexusOS — Calendar 2: Task & To-Do Action Calendar
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
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { useTasks } from '../../hooks/useTasks';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { TaskPriority, TaskStatus, Workspace } from '../../lib/types';
import { cn } from '../../lib/utils';

export function TaskCalendar() {
  const { activeWorkspace, accentColor } = useWorkspace();
  const {
    tasks,
    createTask,
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      });
      setNewTitle('');
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
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
      {/* Inline Task Creator Card */}
      <Card className="p-5 bg-charcoal border border-border space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-purple-light" />
          <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
            Direct Action & Deadline Creator
          </h3>
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
              <option value="urgent">Urgent</option>
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
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'p-4 rounded-xl border transition-all flex items-center justify-between gap-4',
                task.status === 'done'
                  ? 'bg-charcoal/40 border-border opacity-70'
                  : 'bg-charcoal border-border hover:border-border-light shadow-sm'
              )}
            >
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

              {/* Due Date & Reminder */}
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
                    <span className="hidden sm:inline">Reminder Set</span>
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TaskCalendar;
