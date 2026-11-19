// ============================================================
// NexusOS — Button Component
// ============================================================

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  accent?: string;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const accentBgMap: Record<string, string> = {
  purple: 'bg-purple hover:bg-purple-light',
  indigo: 'bg-indigo hover:bg-indigo-light',
  emerald: 'bg-emerald hover:bg-emerald-light',
  amber: 'bg-amber hover:bg-amber-light',
};

const accentRingMap: Record<string, string> = {
  purple: 'focus-visible:ring-purple/50',
  indigo: 'focus-visible:ring-indigo/50',
  emerald: 'focus-visible:ring-emerald/50',
  amber: 'focus-visible:ring-amber/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

const iconOnlySizeClasses: Record<ButtonSize, string> = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
};

function Button({
  variant = 'primary',
  size = 'md',
  accent = 'purple',
  loading = false,
  disabled = false,
  icon,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isIconOnly = icon && !children;

  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses: Record<ButtonVariant, string> = {
    primary: cn(
      'text-white shadow-sm',
      accentBgMap[accent] ?? accentBgMap.purple,
      accentRingMap[accent] ?? accentRingMap.purple
    ),
    secondary: cn(
      'bg-charcoal border border-border text-text-primary hover:border-border-light',
      accentRingMap[accent] ?? accentRingMap.purple
    ),
    ghost: cn(
      'bg-transparent text-text-primary hover:bg-charcoal',
      accentRingMap[accent] ?? accentRingMap.purple
    ),
    danger:
      'bg-error/10 text-error hover:bg-error/20 focus-visible:ring-error/50',
  };

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        isIconOnly
          ? iconOnlySizeClasses[size]
          : sizeClasses[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}

export { Button };
export default Button;
