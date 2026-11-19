// ============================================================
// Diayana OS 'Track balancing' — Business Workspace: Active Handling Logs
// Fast operational handler, predated/postdated date selection,
// in-place editing, and complete status tracking
// ============================================================

import { useState } from 'react';
import {
  Activity,
  Clock,
  Send,
  FileCheck2,
  Calendar,
  Edit2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { useEntries } from '../../hooks/useEntries';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { Entry } from '../../lib/types';
import { cn } from '../../lib/utils';

interface ActiveLogsTabProps {
  workspace: 'hashadz' | 'slash';
}

export function ActiveLogsTab({ workspace }: ActiveLogsTabProps) {
  const { entries, loading, createEntry, updateEntry, deleteEntry } = useEntries({
    workspace,
    category: 'active_log',
  });
  const { accentColor } = useWorkspace();

  const [quickLogText, setQuickLogText] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logTime, setLogTime] = useState('11:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit log state
  const [editingLog, setEditingLog] = useState<Entry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const handleQuickAdd = async () => {
    if (!quickLogText.trim()) return;
    setIsSubmitting(true);
    try {
      const title = quickLogText.trim().slice(0, 45) + (quickLogText.length > 45 ? '...' : '');

      await createEntry({
        workspace,
        category: 'active_log',
        project_id: null,
        title,
        raw_transcript: quickLogText.trim(),
        structured_content: `- ${quickLogText.trim()}`,
        audio_url: null,
        source: 'pwa',
        entry_date: logDate,
        event_time: logTime,
      });

      setQuickLogText('');
    } catch (err) {
      console.error('Failed to create quick log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (log: Entry) => {
    setEditingLog(log);
    setEditTitle(log.title);
    setEditContent(log.structured_content);
    setEditDate(log.entry_date);
    setEditTime(log.event_time || '11:00');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      await updateEntry(editingLog.id, {
        title: editTitle.trim(),
        structured_content: editContent,
        entry_date: editDate,
        event_time: editTime,
      });
      setEditingLog(null);
    } catch (err) {
      console.error('Failed to update log:', err);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Delete this operational log?')) {
      await deleteEntry(id);
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
      {/* Quick Entry Box with Date/Time Selectors */}
      <Card className="p-4 bg-charcoal border border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-light" />
            <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
              Fast Operational Handler ({workspace.toUpperCase()})
            </h4>
          </div>
          <span className="text-[10px] font-mono text-text-dim">
            Postdated & Predated supported
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={quickLogText}
            onChange={(e) => setQuickLogText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleQuickAdd();
            }}
            placeholder={`Log active handling (e.g. 'Dispatched MEP consultant to site for client review')...`}
            className="flex-1 px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30"
          />

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="px-2 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
              title="Target Date"
            />
            <input
              type="time"
              value={logTime}
              onChange={(e) => setLogTime(e.target.value)}
              className="px-2 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
              title="Target Time"
            />
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={!quickLogText.trim() || isSubmitting}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer shrink-0',
                accentButtonMap[accentColor],
                (!quickLogText.trim() || isSubmitting) && 'opacity-60 cursor-not-allowed'
              )}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Log</span>
            </button>
          </div>
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
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-text-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-text-dim" />
                    {log.event_time || new Date(log.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs font-mono text-purple-light flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
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

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2 rounded-lg bg-obsidian border border-border">
                  <FileCheck2 className="w-4 h-4 text-emerald-light" />
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(log)}
                  className="p-1.5 rounded-lg bg-obsidian border border-border text-text-muted hover:text-text-primary cursor-pointer"
                  title="Edit operational log"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteLog(log.id)}
                  className="p-1.5 rounded-lg bg-obsidian border border-border text-text-muted hover:text-error cursor-pointer"
                  title="Delete log"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Log Modal */}
      {editingLog && (
        <Modal
          isOpen={Boolean(editingLog)}
          onClose={() => setEditingLog(null)}
          title="Edit Operational Log"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-medium text-text-primary block mb-1">
                Log Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Date (Predated / Postdated)
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-primary block mb-1">
                Log Content / Notes
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
                  accentButtonMap[accentColor]
                )}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Update Log</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ActiveLogsTab;
