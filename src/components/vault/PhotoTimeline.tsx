// ============================================================
// NexusOS — Vault: Chronological Photo Timeline View
// ============================================================

import { useState } from 'react';
import {
  Image as ImageIcon,
  Calendar,
  Maximize2,
  X,
  Trash2,
  ScanText,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useMediaVault } from '../../hooks/useMediaVault';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { MediaItem } from '../../lib/types';
import { cn } from '../../lib/utils';

export function PhotoTimeline() {
  const { activeWorkspace } = useWorkspace();
  const { photos, loading, deleteMedia } = useMediaVault({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });

  const [activeLightbox, setActiveLightbox] = useState<MediaItem | null>(null);
  const [ocrActive, setOcrActive] = useState<Record<string, boolean>>({});

  const toggleOcr = (id: string) => {
    setOcrActive((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading photo timeline...
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No Photos in Vault"
        description="Upload site inspection photos, whiteboards, or personal moments to view them chronologically."
      />
    );
  }

  // Group photos by date string
  const grouped: Record<string, MediaItem[]> = {};
  for (const photo of photos) {
    const dateKey = photo.uploaded_at.split('T')[0] || 'Unknown Date';
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(photo);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateStr, items]) => (
        <div key={dateStr} className="space-y-3">
          {/* Date Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Calendar className="w-4 h-4 text-purple-light" />
            <h4 className="text-xs font-mono font-semibold text-text-primary">
              {dateStr}
            </h4>
            <span className="text-[11px] font-mono text-text-muted">
              ({items.length} captures)
            </span>
          </div>

          {/* Photos Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const hasOcr = Boolean(ocrActive[item.id]);

              return (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden p-0 bg-charcoal border border-border flex flex-col justify-between"
                >
                  {/* Image Display */}
                  <div
                    className="relative w-full h-44 bg-obsidian flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setActiveLightbox(item)}
                  >
                    {item.storage_path.startsWith('data:image') ||
                    item.storage_path.startsWith('blob:') ||
                    item.storage_path.startsWith('http') ? (
                      <img
                        src={item.storage_path}
                        alt={item.caption || item.file_name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-text-muted">
                        <ImageIcon className="w-10 h-10 opacity-50" />
                        <span className="text-[11px] font-mono">
                          {item.file_name}
                        </span>
                      </div>
                    )}

                    {/* Quick Lightbox Action Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-charcoal/80 text-white shadow-lg">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Workspace Pill */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="workspace" value={item.workspace} />
                    </div>
                  </div>

                  {/* Caption & OCR details */}
                  <div className="p-3.5 space-y-2">
                    <p className="text-xs font-medium text-text-primary line-clamp-1">
                      {item.caption || item.file_name}
                    </p>

                    <div className="flex items-center justify-between text-[11px] font-mono text-text-muted">
                      <span>{item.file_size_kb} KB</span>

                      {/* Phase-2 AI Vision OCR Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleOcr(item.id);
                        }}
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded border transition-colors cursor-pointer',
                          hasOcr
                            ? 'bg-purple/20 text-purple-light border-purple/40'
                            : 'bg-obsidian text-text-dim border-border hover:text-text-primary'
                        )}
                        title="Simulate Multimodal Vision OCR extraction"
                      >
                        <ScanText className="w-3 h-3" />
                        <span>OCR Vision</span>
                      </button>
                    </div>

                    {/* Simulated OCR Text Result */}
                    {hasOcr && (
                      <div className="p-2 rounded bg-obsidian border border-purple/30 text-[10px] font-mono text-purple-light animate-fade-in leading-relaxed">
                        [AI Vision OCR]: Detected diagram labels, structural engineering notes & date stamp matching {item.caption}.
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setActiveLightbox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-charcoal rounded-2xl border border-border p-4 shadow-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-text-primary">
                  {activeLightbox.caption || activeLightbox.file_name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="workspace" value={activeLightbox.workspace} />
                  <span className="text-xs font-mono text-text-muted">
                    {activeLightbox.uploaded_at.split('T')[0]}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-lg hover:bg-border transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center max-h-[70vh] overflow-hidden rounded-xl bg-obsidian p-2">
              {activeLightbox.storage_path.startsWith('data:image') ||
              activeLightbox.storage_path.startsWith('blob:') ||
              activeLightbox.storage_path.startsWith('http') ? (
                <img
                  src={activeLightbox.storage_path}
                  alt={activeLightbox.caption}
                  className="max-h-[65vh] object-contain rounded-lg"
                />
              ) : (
                <div className="py-20 flex flex-col items-center text-text-muted gap-2">
                  <ImageIcon className="w-16 h-16 opacity-40" />
                  <span className="text-xs font-mono">
                    Storage Path: {activeLightbox.storage_path}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-border">
              <span>Size: {activeLightbox.file_size_kb} KB</span>
              <button
                type="button"
                onClick={() => {
                  deleteMedia(activeLightbox.id);
                  setActiveLightbox(null);
                }}
                className="text-error hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Photo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoTimeline;
