// ============================================================
// NexusOS — Badge Component
// ============================================================

import { cn } from '../../lib/utils';

type BadgeVariant = 'workspace' | 'status' | 'priority' | 'source';

interface BadgeProps {
  variant: BadgeVariant;
  value: string;
  className?: string;
}

const workspaceColors: Record<string, string> = {
  hashadz: 'bg-indigo/15 text-indigo-light',
  slash: 'bg-emerald/15 text-emerald-light',
  personal: 'bg-amber/15 text-amber-light',
};

const statusColors: Record<string, string> = {
  todo: 'bg-text-dim/15 text-text-muted',
  in_progress: 'bg-info/15 text-info',
  done: 'bg-success/15 text-success',
};

const priorityColors: Record<string, string> = {
  low: 'bg-text-dim/15 text-text-muted',
  medium: 'bg-info/15 text-info',
  high: 'bg-warning/15 text-warning',
  urgent: 'bg-error/15 text-error',
};

const sourceColors: Record<string, string> = {
  pwa: 'bg-purple/15 text-purple-light',
  telegram: 'bg-info/15 text-info',
  phone_call: 'bg-emerald/15 text-emerald-light',
  hermes_api: 'bg-amber/15 text-amber-light',
};

const variantColorMaps: Record<BadgeVariant, Record<string, string>> = {
  workspace: workspaceColors,
  status: statusColors,
  priority: priorityColors,
  source: sourceColors,
};

const displayLabels: Record<string, string> = {
  hashadz: 'Hashadz',
  slash: 'Slash',
  personal: 'Personal',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
  pwa: 'PWA',
  telegram: 'Telegram',
  phone_call: 'Phone Call',
  hermes_api: 'Hermes API',
};

function Badge({ variant, value, className }: BadgeProps) {
  const colorMap = variantColorMaps[variant];
  const colorClasses = colorMap[value] ?? 'bg-text-dim/15 text-text-muted';
  const label = displayLabels[value] ?? value;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full text-xs font-medium px-2.5 py-0.5',
        colorClasses,
        className
      )}
    >
      {label}
    </span>
  );
}

export { Badge };
export default Badge;
