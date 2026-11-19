// ============================================================
// NexusOS — Floating Quick-Voice Capture Button
// ============================================================

import { Mic } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

interface FloatingCaptureButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingCaptureButton({ onClick, className }: FloatingCaptureButtonProps) {
  const { accentColor } = useWorkspace();

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple shadow-purple/40 hover:bg-purple-light',
    indigo: 'bg-indigo shadow-indigo/40 hover:bg-indigo-light',
    emerald: 'bg-emerald shadow-emerald/40 hover:bg-emerald-light',
    amber: 'bg-amber shadow-amber/40 hover:bg-amber-light',
  };

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-40 hidden md:flex items-center gap-2',
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 animate-pulse-glow cursor-pointer',
          accentButtonMap[accentColor]
        )}
        title="Quick AI Voice & Text Capture (Malayalam + English)"
      >
        <Mic className="w-6 h-6" />
      </button>
    </div>
  );
}

export default FloatingCaptureButton;
