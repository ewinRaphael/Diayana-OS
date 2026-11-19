// ============================================================
// NexusOS — Business Workspace: Active Handling Logs Tab
// ============================================================

import { useState } from 'react';
import {
  Activity,
  Clock,
  Send,
  FileCheck2,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useEntries } from '../../hooks/useEntries';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

interface ActiveLogsTabProps {
  workspace: 'hashadz' | 'slash';
}

export function ActiveLogsTab({ workspace }: ActiveLogsTabProps) {
  const { entries, loading, createEntry } = useEntries({
    workspace,
    category: 'active_log',
  });
  const { accentColor } = useWorkspace();

  const [quickLogText, setQuickLogText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickAdd = async () => {
    if (!quickLogText.trim()) return;
    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const title = quickLogText.trim().slice(0, 40) + (quickLogText.length > 40 ? '...' : '');

      await createEntry({
        workspace,
        category: 'active_log',
        project_id: null,
        title,
        raw_transcript: quickLogText.trim(),
        structured_content: `- ${quickLogText.trim()}`,
        audio_url: null,
        source: 'pwa',
        entry_date: today,
      });

      setQuickLogText('');
    } catch (err) {
      console.error('Failed to create quick log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading active operational stream...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Quick Entry Box */}
      <Card className="p-4 bg-charcoal border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-light" />
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
            Fast Operational Handler
          </h4>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={quickLogText}
            onChange={(e) => setQuickLogText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            placeholder={`Log active handling for ${workspace.toUpperCase()} (e.g. 'Dispatched MEP consultant to site for client review')...`}
            className="flex-1 px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30"
          />
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!quickLogText.trim() || isSubmitting}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
              accentButtonMap[accentColor],
              (!quickLogText.trim() || isSubmitting) && 'opacity-60 cursor-not-allowed'
            )}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Log</span>
          </button>
        </div>
      </Card>

      {/* Stream of logs */}
      {entries.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Active Logs Today"
          description="Operational updates from PWA, Hermes VPS Webhooks, and Telegram appear here."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-charcoal rounded-xl border border-border flex items-start justify-between gap-4 transition-all hover:border-border-light"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-dim" />
                    {new Date(log.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs font-mono text-text-dim">
                    {log.entry_date}
                  </span>
                  <Badge variant="source" value={log.source} />
                </div>

                <h4 className="text-sm font-semibold text-text-primary">
                  {log.title}
                </h4>

                <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">
                  {log.structured_content}
                </p>
              </div>

              <div className="p-2 rounded-lg bg-obsidian border border-border shrink-0">
                <FileCheck2 className="w-4 h-4 text-emerald-light" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActiveLogsTab;
