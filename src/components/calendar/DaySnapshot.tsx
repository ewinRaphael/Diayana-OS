// ============================================================
// Diayana OS 'Track balancing' — Editable Day Snapshot Drawer
// Direct field editing, predated & postdated event addition
// ============================================================

import { useState } from 'react';
import {
  Calendar,
  X,
  Image as ImageIcon,
  Clock,
  Edit2,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useEntries } from '../../hooks/useEntries';
import type { Entry, MediaItem, Workspace, EntryCategory } from '../../lib/types';

interface DaySnapshotProps {
  date: string;
  entries: Entry[];
  media: MediaItem[];
  onClose: () => void;
}

export function DaySnapshot({ date, entries, media, onClose }: DaySnapshotProps) {
  const { updateEntry, createEntry, deleteEntry } = useEntries();
  const dayEntries = entries.filter((e) => e.entry_date === date);
  const dayMedia = media.filter((m) => m.uploaded_at.startsWith(date));

  // Edit State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState(date);
  const [editTime, setEditTime] = useState('');
  const [editWorkspace, setEditWorkspace] = useState<Workspace>('personal');
  const [editCategory, setEditCategory] = useState<EntryCategory>('journal');

  // New Event Form State
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newWorkspace, setNewWorkspace] = useState<Workspace>('hashadz');
  const [newCategory, setNewCategory] = useState<EntryCategory>('meeting');

  const startEdit = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditTitle(entry.title);
    setEditContent(entry.structured_content);
    setEditDate(entry.entry_date);
    setEditTime(entry.event_time || '');
    setEditWorkspace(entry.workspace);
    setEditCategory(entry.category);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateEntry(id, {
      title: editTitle.trim(),
      structured_content: editContent.trim(),
      entry_date: editDate,
      event_time: editTime.trim() || null,
      workspace: editWorkspace,
      category: editCategory,
    });
    setEditingEntryId(null);
  };

  const handleCreateNewEvent = async () => {
    if (!newTitle.trim()) return;
    await createEntry({
      workspace: newWorkspace,
      category: newCategory,
      project_id: null,
      title: newTitle.trim(),
      raw_transcript: '',
      structured_content: newContent.trim() ? `- ${newContent.trim()}` : `- Scheduled ${newCategory}`,
      audio_url: null,
      source: 'pwa',
      entry_date: date,
      event_time: newTime,
    });

    setNewTitle('');
    setNewContent('');
    setIsAddingEvent(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-charcoal border-l border-border p-6 shadow-2xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple/15 text-purple-light">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Day Snapshot & Timeline
            </h3>
            <span className="text-xs font-mono text-text-muted">{date}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddingEvent(!isAddingEvent)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple/20 hover:bg-purple/30 text-purple-light text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-border transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* New Event Form (for predated or postdated scheduling) */}
      {isAddingEvent && (
        <div className="mb-4 p-4 bg-obsidian rounded-xl border border-purple/30 space-y-3 text-xs animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-purple-light font-mono">
              Schedule / Record for {date}
            </span>
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="text-text-dim hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Event or meeting title (e.g. 'Site Inspection with Client')..."
            className="w-full px-3 py-2 bg-charcoal border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/30"
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-text-muted block mb-0.5">Time</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-2 py-1.5 bg-charcoal border border-border rounded-lg text-text-primary font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-text-muted block mb-0.5">Workspace</label>
              <select
                value={newWorkspace}
                onChange={(e) => setNewWorkspace(e.target.value as Workspace)}
                className="w-full px-2 py-1.5 bg-charcoal border border-border rounded-lg text-text-primary font-mono capitalize"
              >
                <option value="hashadz">Hashadz</option>
                <option value="slash">Slash</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-text-muted block mb-0.5">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EntryCategory)}
                className="w-full px-2 py-1.5 bg-charcoal border border-border rounded-lg text-text-primary font-mono capitalize"
              >
                <option value="meeting">Meeting</option>
                <option value="project">Project</option>
                <option value="active_log">Active Log</option>
                <option value="journal">Journal</option>
              </select>
            </div>
          </div>

          <textarea
            rows={2}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Notes or agenda items..."
            className="w-full px-3 py-1.5 bg-charcoal border border-border rounded-lg text-text-primary placeholder:text-text-dim resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddingEvent(false)}
              className="px-3 py-1 text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateNewEvent}
              disabled={!newTitle.trim()}
              className="px-4 py-1 rounded-lg bg-purple hover:bg-purple-light text-white font-semibold shadow-md disabled:opacity-50"
            >
              Add to {date}
            </button>
          </div>
        </div>
      )}

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {dayEntries.length === 0 && dayMedia.length === 0 && !isAddingEvent ? (
          <div className="text-center py-16 text-text-muted text-xs">
            <Calendar className="w-8 h-8 opacity-30 mx-auto mb-2" />
            <p>No logs or media captured on {date}.</p>
            <button
              type="button"
              onClick={() => setIsAddingEvent(true)}
              className="mt-3 text-purple-light hover:underline font-medium cursor-pointer"
            >
              + Add a record for this date
            </button>
          </div>
        ) : (
          <>
            {/* Timeline Entries with In-Place Editing */}
            {dayEntries.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Timeline Entries ({dayEntries.length})
                </span>

                {dayEntries.map((entry) => {
                  const isEditing = editingEntryId === entry.id;

                  return (
                    <div
                      key={entry.id}
                      className="p-3.5 bg-obsidian rounded-xl border border-border space-y-2.5 text-xs transition-all"
                    >
                      {isEditing ? (
                        <div className="space-y-2.5 animate-fade-in">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-charcoal border border-purple/40 rounded-lg text-xs font-semibold text-text-primary"
                            placeholder="Entry Title"
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono"
                              title="Entry Date (Predated / Postdated)"
                            />

                            <input
                              type="text"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              placeholder="Time (e.g. 14:00)"
                              className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono"
                            />

                            <select
                              value={editWorkspace}
                              onChange={(e) => setEditWorkspace(e.target.value as Workspace)}
                              className="px-2 py-1 bg-charcoal border border-border rounded text-[11px] text-text-primary font-mono capitalize"
                            >
                              <option value="hashadz">Hashadz</option>
                              <option value="slash">Slash</option>
                              <option value="personal">Personal</option>
                            </select>
                          </div>

                          <textarea
                            rows={3}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 bg-charcoal border border-border rounded-lg text-xs text-text-primary resize-none"
                            placeholder="Structured content..."
                          />

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingEntryId(null)}
                              className="px-3 py-1 text-text-muted hover:text-text-primary"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEdit(entry.id)}
                              className="flex items-center gap-1 px-3 py-1 bg-purple text-white rounded font-semibold text-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="workspace" value={entry.workspace} />
                              <Badge variant="status" value={entry.category} />
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {entry.event_time ||
                                  new Date(entry.created_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                              </span>

                              <button
                                type="button"
                                onClick={() => startEdit(entry)}
                                className="p-1 text-text-dim hover:text-text-primary cursor-pointer rounded"
                                title="Edit Entry Fields"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1 text-text-dim hover:text-error cursor-pointer rounded"
                                title="Delete Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h4 className="font-semibold text-text-primary text-sm">
                            {entry.title}
                          </h4>

                          <p className="text-text-muted leading-relaxed line-clamp-4 whitespace-pre-wrap">
                            {entry.structured_content}
                          </p>

                          {entry.raw_transcript && (
                            <p className="text-[11px] text-text-dim italic font-mono pt-1 border-t border-border/50">
                              "{entry.raw_transcript}"
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Media Section */}
            {dayMedia.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Vault Media Uploads ({dayMedia.length})
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {dayMedia.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-obsidian rounded-lg border border-border flex flex-col items-center text-center gap-1.5"
                    >
                      <ImageIcon className="w-8 h-8 text-purple-light opacity-70" />
                      <span className="text-[11px] text-text-primary font-medium truncate w-full">
                        {item.file_name}
                      </span>
                      <span className="text-[9px] font-mono text-text-dim">
                        {item.file_size_kb} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DaySnapshot;
