// ============================================================
// NexusOS — EmptyState Component
// ============================================================

import { type ReactNode, type ElementType } from 'react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-border bg-charcoal/40',
        className
      )}
    >
      {Icon && (
        <div className="p-3 rounded-full bg-border/40 text-text-muted mb-3">
          <Icon className="w-8 h-8 opacity-80" />
        </div>
      )}
      <h4 className="text-base font-medium text-text-primary mb-1">{title}</h4>
      {description && (
        <p className="text-xs text-text-muted max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
