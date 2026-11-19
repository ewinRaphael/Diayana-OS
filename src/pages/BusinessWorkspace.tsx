// ============================================================
// NexusOS — Business Workspace Page (Hashadz & Slash Hub)
// ============================================================

import { useState } from 'react';
import {
  FileText,
  FolderKanban,
  Activity,
  Landmark,
  Building2,
} from 'lucide-react';
import { Tabs, type TabItem } from '../components/ui/Tabs';
import { MeetingsTab } from '../components/business/MeetingsTab';
import { ProjectsTab } from '../components/business/ProjectsTab';
import { ActiveLogsTab } from '../components/business/ActiveLogsTab';
import { FinanceBridgeTab } from '../components/business/FinanceBridgeTab';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { cn } from '../lib/utils';

export function BusinessWorkspace() {
  const { activeWorkspace, setActiveWorkspace, accentColor } = useWorkspace();

  // If currently in 'personal' or 'all', allow selecting between hashadz or slash
  const businessWorkspace =
    activeWorkspace === 'slash' ? 'slash' : 'hashadz';

  const [activeTab, setActiveTab] = useState<string>('meetings');

  const tabs: TabItem[] = [
    { id: 'meetings', label: 'Meetings & Plans', icon: <FileText className="w-4 h-4" /> },
    { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'logs', label: 'Active Handling Logs', icon: <Activity className="w-4 h-4" /> },
    { id: 'finance', label: 'Finance Bridge', icon: <Landmark className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Workspace Quick Switcher if not explicitly set */}
      {activeWorkspace === 'all' && (
        <div className="flex items-center justify-between p-3 bg-charcoal rounded-xl border border-border">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Building2 className="w-4 h-4 text-purple-light" />
            <span>Viewing Business Hub:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveWorkspace('hashadz')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                businessWorkspace === 'hashadz'
                  ? 'bg-indigo/20 text-indigo-light border border-indigo/40'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Hashadz Hub
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkspace('slash')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                businessWorkspace === 'slash'
                  ? 'bg-emerald/20 text-emerald-light border border-emerald/40'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              Slash Hub
            </button>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accent={accentColor as any}
      />

      {/* Tab Panels */}
      <div>
        {activeTab === 'meetings' && <MeetingsTab workspace={businessWorkspace} />}
        {activeTab === 'projects' && <ProjectsTab workspace={businessWorkspace} />}
        {activeTab === 'logs' && <ActiveLogsTab workspace={businessWorkspace} />}
        {activeTab === 'finance' && <FinanceBridgeTab workspace={businessWorkspace} />}
      </div>
    </div>
  );
}

export default BusinessWorkspace;
