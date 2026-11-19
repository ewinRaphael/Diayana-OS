// ============================================================
// NexusOS — SearchInput Component
// ============================================================

import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  accent?: 'purple' | 'indigo' | 'emerald' | 'amber';
}

const accentFocusMap: Record<string, string> = {
  purple: 'focus:border-purple focus:ring-purple/20',
  indigo: 'focus:border-indigo focus:ring-indigo/20',
  emerald: 'focus:border-emerald focus:ring-emerald/20',
  amber: 'focus:border-amber focus:ring-amber/20',
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  accent = 'purple',
}: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 w-4 h-4 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-8 py-2 text-sm bg-obsidian border border-border rounded-lg text-text-primary placeholder:text-text-dim transition-all focus:outline-none focus:ring-2',
          accentFocusMap[accent]
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 text-text-dim hover:text-text-primary cursor-pointer p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
