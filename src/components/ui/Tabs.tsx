// ============================================================
// NexusOS — Tabs Component
// ============================================================

import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  accent?: 'purple' | 'indigo' | 'emerald' | 'amber';
  className?: string;
}

const accentActiveClasses: Record<string, string> = {
  purple: 'text-purple-light border-purple bg-purple/10',
  indigo: 'text-indigo-light border-indigo bg-indigo/10',
  emerald: 'text-emerald-light border-emerald bg-emerald/10',
  amber: 'text-amber-light border-amber bg-amber/10',
};

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  accent = 'purple',
  className,
}: TabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b border-border overflow-x-auto pb-px', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap rounded-t-lg',
              isActive
                ? cn('border-current', accentActiveClasses[accent])
                : 'text-text-muted border-transparent hover:text-text-primary hover:bg-charcoal'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-mono',
                  isActive
                    ? 'bg-current/20 text-current'
                    : 'bg-border text-text-muted'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
