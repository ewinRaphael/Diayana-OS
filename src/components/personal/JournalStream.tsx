// ============================================================
// NexusOS — Personal Workspace: Daily Journal Stream
// ============================================================

import { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useEntries } from '../../hooks/useEntries';
import { cn } from '../../lib/utils';

export function JournalStream() {
  const { entries, loading } = useEntries({
    workspace: 'personal',
  });

  const [filterType, setFilterType] = useState<'all' | 'journal' | 'voice' | 'logs'>('all');
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});

  const toggleTranscript = (id: string) => {
    setExpandedTranscripts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const journalCount = entries.filter((e) => e.category === 'journal').length;
  const voiceCount = entries.filter((e) => Boolean(e.audio_url || (e.raw_transcript && e.raw_transcript.length > 0))).length;
  const otherCount = entries.filter((e) => e.category !== 'journal').length;

  const filteredEntries = entries.filter((e) => {
    if (filterType === 'journal') return e.category === 'journal';
    if (filterType === 'voice') return Boolean(e.audio_url || (e.raw_transcript && e.raw_transcript.length > 0));
    if (filterType === 'logs') return e.category !== 'journal';
    return true;
  });

  // Helper to detect mood / energy tags from structured content
  const extractTags = (content: string) => {
    const tags: string[] = [];
    const lower = content.toLowerCase();
    if (lower.includes('grateful') || lower.includes('blessed') || lower.includes('alhamdulillah')) tags.push('Gratitude 🙏');
    if (lower.includes('focused') || lower.includes('productive') || lower.includes('flow')) tags.push('Deep Focus ⚡');
    if (lower.includes('tired') || lower.includes('fatigue') || lower.includes('exhausted')) tags.push('Low Energy 💤');
    if (lower.includes('gym') || lower.includes('workout') || lower.includes('run')) tags.push('Fitness 💪');
    if (lower.includes('family') || lower.includes('home')) tags.push('Family 🏡');
    return tags;
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading personal reflections...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Switcher */}
      {entries.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 bg-obsidian rounded-xl border border-border w-fit flex-wrap">
          {[
            { id: 'all', label: `All Notes (${entries.length})` },
            { id: 'journal', label: `Reflections (${journalCount})` },
            { id: 'voice', label: `Voice Notes (${voiceCount})` },
            { id: 'logs', label: `Other Logs (${otherCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id as any)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                filterType === f.id
                  ? 'bg-charcoal text-text-primary shadow-sm border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={entries.length === 0 ? 'Your Journal is Empty' : 'No Matching Entries'}
          description={
            entries.length === 0
              ? 'Speak freely in Malayalam, English, or Manglish using Voice AI to record your daily reflections.'
              : `No entries found under "${filterType}". Switch to "All Notes" to view all records.`
          }
        />
      ) : (
        filteredEntries.map((entry) => {
          const isTranscriptOpen = Boolean(expandedTranscripts[entry.id]);
          const detectedTags = extractTags(entry.structured_content + ' ' + (entry.raw_transcript || ''));
          const isVoice = Boolean(entry.audio_url || (entry.raw_transcript && entry.raw_transcript.length > 0));

          return (
            <Card key={entry.id} className="p-5 space-y-3.5 border border-border">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-semibold text-text-primary tracking-tight">
                      {entry.title}
                    </h4>
                    <Badge variant="status" value={entry.category} />
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-text-dim" />
                      {entry.entry_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-text-dim" />
                      {entry.event_time ||
                        new Date(entry.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </span>
                    <Badge variant="source" value={entry.source} />
                  </div>
                </div>

                {isVoice && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-border text-text-primary text-xs font-mono shrink-0">
                    <Volume2 className="w-3.5 h-3.5 text-amber-light" />
                    <span>Voice Note</span>
                  </div>
                )}
              </div>

            {/* Mood / Energy Tags */}
            {detectedTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {detectedTags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-amber/15 text-amber-light font-medium border border-amber/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Structured Content */}
            <div className="p-3.5 bg-obsidian rounded-xl border border-border text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              <div className="flex items-center gap-1.5 text-text-muted font-mono text-[11px] mb-2 font-medium uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-amber-light" />
                <span>Structured Diary Notes</span>
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
                      <span>Hide Original Audio Transcript</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Show Original Audio Transcript</span>
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
      })
    )}
  </div>
  );
}

export default JournalStream;
