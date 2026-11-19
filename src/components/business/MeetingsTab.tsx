// ============================================================
// Diayana OS 'Track balancing' — Meetings & Plans Tab
// Complete field mapping, inline editing, postdated & predated
// meeting scheduler, transcript viewer, and live actions
// ============================================================

import { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Volume2,
  Clock,
  Sparkles,
  Plus,
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
import type { Entry, EntrySource } from '../../lib/types';
import { cn } from '../../lib/utils';

interface MeetingsTabProps {
  workspace: 'hashadz' | 'slash';
}

export function MeetingsTab({ workspace }: MeetingsTabProps) {
  const { entries, loading, createEntry, updateEntry, deleteEntry } = useEntries({
    workspace,
    category: 'meeting',
  });
  const { accentColor } = useWorkspace();

  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  // Form states for creating/editing
  const [title, setTitle] = useState('');
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('14:00');
  const [source, setSource] = useState<EntrySource>('pwa');
  const [structuredContent, setStructuredContent] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEventTime('14:00');
    setSource('pwa');
    setStructuredContent('## Executive Minutes & Decisions\n\n- \n- \n- Action items:');
    setRawTranscript('');
    setIsNewModalOpen(true);
  };

  const handleOpenEditModal = (entry: Entry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setEntryDate(entry.entry_date);
    setEventTime(entry.event_time || '14:00');
    setSource(entry.source);
    setStructuredContent(entry.structured_content);
    setRawTranscript(entry.raw_transcript || '');
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      if (editingEntry) {
        await updateEntry(editingEntry.id, {
          title: title.trim(),
          entry_date: entryDate,
          event_time: eventTime,
          source,
          structured_content: structuredContent,
          raw_transcript: rawTranscript,
        });
        setEditingEntry(null);
      } else {
        await createEntry({
          workspace,
          category: 'meeting',
          project_id: null,
          title: title.trim(),
          entry_date: entryDate,
          event_time: eventTime,
          source,
          structured_content: structuredContent,
          raw_transcript: rawTranscript,
          audio_url: null,
        });
        setIsNewModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to save meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Delete this meeting record permanently?')) {
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
        Loading meeting records...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Meetings & Executive Decisions ({entries.length})
          </h3>
          <p className="text-xs text-text-muted">
            Track and review upcoming, live, and historical meetings for {workspace.toUpperCase()}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
            accentButtonMap[accentColor]
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Meeting / Event</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Meetings Recorded"
          description={`Record client meetings or strategic sessions for ${workspace.toUpperCase()} using the AI Voice capture or the New Meeting button.`}
        />
      ) : (
        entries.map((entry) => {
          const isTranscriptOpen = Boolean(expandedTranscripts[entry.id]);
          const isToday = entry.entry_date === new Date().toISOString().split('T')[0];
          const isUpcoming = entry.entry_date > new Date().toISOString().split('T')[0];

          return (
            <Card key={entry.id} className="space-y-3.5 p-5 border border-border">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-text-primary tracking-tight">
                      {entry.title}
                    </h3>
                    {isToday && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald/20 text-emerald-light border border-emerald/30">
                        TODAY
                      </span>
                    )}
                    {isUpcoming && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo/20 text-indigo-light border border-indigo/30">
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-dim" />
                      {entry.entry_date}
                    </span>
                    <span className="flex items-center gap-1 text-purple-light">
                      <Clock className="w-3.5 h-3.5" />
                      {entry.event_time || new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Badge variant="source" value={entry.source} />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {entry.audio_url && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-border text-text-primary text-xs font-mono">
                      <Volume2 className="w-3.5 h-3.5 text-purple-light" />
                      <span>Audio</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(entry)}
                    className="p-1.5 rounded-lg bg-obsidian border border-border text-text-muted hover:text-text-primary hover:border-border-light cursor-pointer"
                    title="Edit meeting fields"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMeeting(entry.id)}
                    className="p-1.5 rounded-lg bg-obsidian border border-border text-text-muted hover:text-error hover:border-error/30 cursor-pointer"
                    title="Delete meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Structured Content */}
              <div className="p-3.5 bg-obsidian rounded-xl border border-border text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px] mb-2 font-medium uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-purple-light" />
                  <span>Executive Minutes & Decisions</span>
                </div>
                {entry.structured_content}
              </div>

              {/* Multilingual Raw Transcript Collapsible */}
              {entry.raw_transcript && (
                <div className="border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={() => toggleTranscript(entry.id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    {isTranscriptOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    <span>{isTranscriptOpen ? 'Hide' : 'View'} Multilingual Raw Transcript</span>
                  </button>

                  {isTranscriptOpen && (
                    <div className="mt-2 p-3 bg-obsidian/60 rounded-lg border border-border text-xs text-text-muted italic leading-relaxed whitespace-pre-wrap animate-fade-in font-sans">
                      &quot;{entry.raw_transcript}&quot;
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* CREATE / EDIT MODAL */}
      {(isNewModalOpen || editingEntry) && (
        <Modal
          isOpen={isNewModalOpen || Boolean(editingEntry)}
          onClose={() => {
            setIsNewModalOpen(false);
            setEditingEntry(null);
          }}
          title={editingEntry ? 'Edit Meeting Details' : 'Schedule or Log Meeting'}
        >
          <form onSubmit={handleSaveMeeting} className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-medium text-text-primary block mb-1">
                Meeting Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Al-Noor Tower — Contractor Review with Rashid"
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Date (Predated / Postdated) *
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Time *
                </label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-text-primary block mb-1">
                  Source Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as EntrySource)}
                  className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono cursor-pointer"
                >
                  <option value="pwa">PWA Web</option>
                  <option value="phone_call">Phone Call</option>
                  <option value="telegram_text">Telegram</option>
                  <option value="hermes_api">Hermes Bridge</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-text-primary block mb-1">
                Executive Minutes & Decisions (Markdown) *
              </label>
              <textarea
                value={structuredContent}
                onChange={(e) => setStructuredContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-text-primary block mb-1">
                Multilingual Raw Notes / Speech Transcript
              </label>
              <textarea
                value={rawTranscript}
                onChange={(e) => setRawTranscript(e.target.value)}
                rows={2}
                placeholder="Malayalam or English spoken notes..."
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingEntry(null);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
                  accentButtonMap[accentColor],
                  (!title.trim() || isSubmitting) && 'opacity-60 cursor-not-allowed'
                )}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editingEntry ? 'Save Changes' : 'Record Meeting'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default MeetingsTab;
