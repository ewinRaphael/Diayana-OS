// ============================================================
// NexusOS — Personal Workspace Page (Habits & Reflections Hub)
// ============================================================

import { JournalStream } from '../components/personal/JournalStream';
import { HabitTracker } from '../components/personal/HabitTracker';
import { ReflectionIndex } from '../components/personal/ReflectionIndex';

export function PersonalWorkspace() {
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Journal Stream (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider font-mono">
              Daily Journal & Voice Notes
            </h2>
          </div>
          <JournalStream />
        </div>

        {/* Right Column: Habit Protocol & Reflection Index (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <HabitTracker />
          <ReflectionIndex />
        </div>
      </div>
    </div>
  );
}

export default PersonalWorkspace;
