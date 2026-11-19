// ============================================================
// NexusOS — Day Snapshot Historical Drawer / Panel
// Displays all logs, meetings, reflections, and media for a date
// ============================================================

import {
  Calendar,
  X,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import type { Entry, MediaItem } from '../../lib/types';

interface DaySnapshotProps {
  date: string;
  entries: Entry[];
  media: MediaItem[];
  onClose: () => void;
}

export function DaySnapshot({ date, entries, media, onClose }: DaySnapshotProps) {
  const dayEntries = entries.filter((e) => e.entry_date === date);
  const dayMedia = media.filter((m) => m.uploaded_at.startsWith(date));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-charcoal border-l border-border p-6 shadow-2xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple/15 text-purple-light">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Historical Day Snapshot
            </h3>
            <span className="text-xs font-mono text-text-muted">{date}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-border transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {dayEntries.length === 0 && dayMedia.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-xs">
            No logs or media captured on this date.
          </div>
        ) : (
          <>
            {/* Entries Section */}
            {dayEntries.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Timeline Entries ({dayEntries.length})
                </span>

                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 bg-obsidian rounded-xl border border-border space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="workspace" value={entry.workspace} />
                        <Badge variant="status" value={entry.category} />
                      </div>
                      <span className="text-[10px] font-mono text-text-dim flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
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
                  </div>
                ))}
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
