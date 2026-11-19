// ============================================================
// NexusOS — Business Workspace: Meetings & Plans Tab
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
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useEntries } from '../../hooks/useEntries';

interface MeetingsTabProps {
  workspace: 'hashadz' | 'slash';
}

export function MeetingsTab({ workspace }: MeetingsTabProps) {
  const { entries, loading } = useEntries({
    workspace,
    category: 'meeting',
  });

  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading meeting records...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Meetings Recorded"
        description={`Record client meetings or strategic sessions for ${workspace.toUpperCase()} using the AI Voice capture.`}
      />
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => {
        const isTranscriptOpen = Boolean(expandedTranscripts[entry.id]);
        return (
          <Card key={entry.id} className="space-y-3 p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-text-primary tracking-tight">
                  {entry.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs font-mono text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {entry.entry_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(entry.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <Badge variant="source" value={entry.source} />
                </div>
              </div>

              {entry.audio_url && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-border text-text-primary text-xs font-mono">
                  <Volume2 className="w-3.5 h-3.5 text-purple-light" />
                  <span>Audio Recorded</span>
                </div>
              )}
            </div>

            {/* Structured Content */}
            <div className="p-3.5 bg-obsidian rounded-xl border border-border text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px] mb-2 font-medium uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-purple-light" />
                <span>Executive Minutes & Decisions</span>
              </div>
              {entry.structured_content}
            </div>

            {/* Raw Transcript Toggle */}
            {entry.raw_transcript && (
              <div>
                <button
                  type="button"
                  onClick={() => toggleTranscript(entry.id)}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors cursor-pointer font-medium"
                >
                  {isTranscriptOpen ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Hide Raw Transcript</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>View Multilingual Raw Transcript</span>
                    </>
                  )}
                </button>

                {isTranscriptOpen && (
                  <div className="mt-2 p-3 bg-charcoal/80 border border-border rounded-lg text-xs font-mono text-text-muted italic leading-relaxed animate-fade-in">
                    "{entry.raw_transcript}"
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

export default MeetingsTab;
