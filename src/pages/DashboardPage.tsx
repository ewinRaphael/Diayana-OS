// ============================================================
// NexusOS — Executive Bento Overview Dashboard
// Cross-workspace operational intelligence & quick actions
// ============================================================

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
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useEntries } from '../hooks/useEntries';
import { useTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useMetrics } from '../hooks/useMetrics';
import { useMediaVault } from '../hooks/useMediaVault';
import type { NavPage } from '../components/layout/Sidebar';
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
  const { tasks, toggleTaskStatus } = useTasks({
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
  const { todayMetrics } = useMetrics();
  const { media } = useMediaVault({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });

  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'urgent' || t.priority === 'high');
  const recentEntries = entries.slice(0, 5);

  const score = todayMetrics?.productivity_score ?? 75;

  const accentBgClass: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* 1. Executive Top Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1: Active Projects */}
        <Card
          hoverable
          onClick={() => onNavigate('business')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">
              Active Projects
            </span>
            <div className="p-2 rounded-lg bg-indigo/15 text-indigo-light">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {projects.length}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Hashadz & Slash Ventures
            </p>
          </div>
        </Card>

        {/* Metric 2: Pending To-Dos */}
        <Card
          hoverable
          onClick={() => onNavigate('calendar')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">
              Pending Actions
            </span>
            <div className="p-2 rounded-lg bg-emerald/15 text-emerald-light">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {pendingTasks.length}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              {urgentTasks.length} urgent / high priority
            </p>
          </div>
        </Card>

        {/* Metric 3: Personal Productivity Index */}
        <Card
          hoverable
          onClick={() => onNavigate('personal')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">
              Daily Reflection
            </span>
            <div className="p-2 rounded-lg bg-amber/15 text-amber-light">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-amber-light">
              {score}/100
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Productivity Score
            </p>
          </div>
        </Card>

        {/* Metric 4: Encrypted Vault Assets */}
        <Card
          hoverable
          onClick={() => onNavigate('vault')}
          className="p-5 flex flex-col justify-between space-y-2 cursor-pointer"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-mono uppercase tracking-wider">
              Vault Documents
            </span>
            <div className="p-2 rounded-lg bg-purple/15 text-purple-light">
              <FolderLock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-text-primary">
              {media.length}
            </div>
            <p className="text-[11px] text-text-muted mt-0.5">
              Verified files & drawings
            </p>
          </div>
        </Card>
      </div>

      {/* 2. Bento Grid: Operational Feed + Actions & Urgent To-Dos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Multilingual Operational Activity Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-light" />
              <span>Recent Operational Feed</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View Full Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-text-muted bg-charcoal rounded-xl border border-border">
                No entries recorded yet. Tap the Voice Capture button to record.
              </div>
            ) : (
              recentEntries.map((entry) => (
                <Card
                  key={entry.id}
                  hoverable
                  onClick={() =>
                    entry.workspace === 'personal'
                      ? onNavigate('personal')
                      : onNavigate('business')
                  }
                  className="p-4 space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="workspace" value={entry.workspace} />
                      <Badge variant="status" value={entry.category} />
                    </div>
                    <span className="text-[11px] font-mono text-text-dim">
                      {entry.entry_date}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-text-primary">
                    {entry.title}
                  </h4>

                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
                    {entry.structured_content}
                  </p>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Quick AI Action Bento + Urgent Action List */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bento Box 1: Voice-to-Structured-Data Hero Card */}
          <Card className="p-6 bg-gradient-to-br from-charcoal via-charcoal to-obsidian border border-purple/30 relative overflow-hidden space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-light font-semibold">
                  Multimodal AI Engine
                </span>
                <h4 className="text-base font-bold text-text-primary mt-1">
                  Voice to Structured Data
                </h4>
                <p className="text-xs text-text-muted mt-1 leading-relaxed">
                  Record meetings, voice notes, or site inspections in Malayalam, English, or Manglish.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-purple/20 text-purple-light border border-purple/30 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenCapture}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all cursor-pointer',
                accentBgClass[accentColor]
              )}
            >
              <Mic className="w-4 h-4" />
              <span>Launch Quick Voice Capture</span>
            </button>
          </Card>

          {/* Bento Box 2: Immediate Deadlines Checklist */}
          <Card className="p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-emerald-light" />
                <span>Urgent & High Priority Actions</span>
              </h4>
              <span className="text-xs font-mono text-text-muted">
                {urgentTasks.length} active
              </span>
            </div>

            <div className="space-y-2">
              {urgentTasks.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-4">
                  No urgent deadlines pending. All clear!
                </p>
              ) : (
                urgentTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-obsidian border border-border text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className="cursor-pointer text-text-dim hover:text-success shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <span className="text-text-primary font-medium truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="workspace" value={task.workspace} />
                      <Badge variant="priority" value={task.priority} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
