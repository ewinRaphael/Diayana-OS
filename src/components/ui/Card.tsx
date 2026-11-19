// ============================================================
// NexusOS — Card Component
// ============================================================

import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: string;
  hoverable?: boolean;
  children: ReactNode;
}

const accentBorderMap: Record<string, string> = {
  purple: 'border-t-purple',
  indigo: 'border-t-indigo',
  emerald: 'border-t-emerald',
  amber: 'border-t-amber',
  info: 'border-t-info',
  success: 'border-t-success',
  warning: 'border-t-warning',
  error: 'border-t-error',
};

function Card({ className, children, accent, hoverable = false, onClick, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-charcoal border border-border rounded-xl p-5 transition-all duration-200',
        accent && 'border-t-2',
        accent && (accentBorderMap[accent] ?? 'border-t-purple'),
        hoverable && 'hover:border-border-light hover:shadow-lg hover:shadow-black/20',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
}

export { Card };
export default Card;
