// ============================================================
// NexusOS — Media & Document Vault Page
// Switches between Timeline Photo View and Document Repository View
// ============================================================

import { useState } from 'react';
import { FolderLock, Image as ImageIcon, FileText, Plus } from 'lucide-react';
import { PhotoTimeline } from '../components/vault/PhotoTimeline';
import { DocumentRepo } from '../components/vault/DocumentRepo';
import { UploadModal } from '../components/vault/UploadModal';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { FileType } from '../lib/types';
import { cn } from '../lib/utils';

export function VaultPage() {
  const [activeView, setActiveView] = useState<FileType>('document');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { accentColor } = useWorkspace();

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  const accentActiveClasses: Record<string, string> = {
    purple: 'bg-purple/20 text-purple-light border-purple/40',
    indigo: 'bg-indigo/20 text-indigo-light border-indigo/40',
    emerald: 'bg-emerald/20 text-emerald-light border-emerald/40',
    amber: 'bg-amber/20 text-amber-light border-amber/40',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-charcoal rounded-xl border border-border">
        <div>
          <h2 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-purple-light" />
            <span>Encrypted Vault & Documents</span>
          </h2>
          <p className="text-xs text-text-muted">
            Secure asset repository with multimodal OCR and quick retrieval
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-obsidian rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveView('document')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeView === 'document'
                  ? cn('border shadow-sm', accentActiveClasses[accentColor])
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Documents</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('photo')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeView === 'photo'
                  ? cn('border shadow-sm', accentActiveClasses[accentColor])
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Photo Timeline</span>
            </button>
          </div>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer',
              accentButtonMap[accentColor]
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Main View */}
      <div>
        {activeView === 'document' ? <DocumentRepo /> : <PhotoTimeline />}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultFileType={activeView}
      />
    </div>
  );
}

export default VaultPage;
