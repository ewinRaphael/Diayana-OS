// ============================================================
// Diayana OS 'Track balancing' — Media & Security Vault Page
// Password Manager (KeyVault), Documents, and Photo Timeline
// ============================================================

import { useState } from 'react';
import { FolderLock, Image as ImageIcon, FileText, Plus, ShieldCheck } from 'lucide-react';
import { PhotoTimeline } from '../components/vault/PhotoTimeline';
import { DocumentRepo } from '../components/vault/DocumentRepo';
import { UploadModal } from '../components/vault/UploadModal';
import { KeyVaultManager } from '../components/keyvault/KeyVaultManager';
import { useWorkspace } from '../contexts/WorkspaceContext';
import type { VaultTab } from '../lib/types';
import { cn } from '../lib/utils';

interface VaultPageProps {
  initialTab?: VaultTab;
}

export function VaultPage({ initialTab = 'passwords' }: VaultPageProps) {
  const [activeView, setActiveView] = useState<VaultTab>(initialTab);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { accentColor } = useWorkspace();

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-obsidian font-bold',
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
            <span>Executive Vault & KeyVault</span>
          </h2>
          <p className="text-xs text-text-muted">
            Master-password protected login vault, encrypted documents & media repository
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-obsidian rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setActiveView('passwords')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                activeView === 'passwords'
                  ? cn('border shadow-sm', accentActiveClasses[accentColor])
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Passwords & KeyVault</span>
            </button>

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

          {/* Upload Button (for Document & Photo views) */}
          {activeView !== 'passwords' && (
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
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div>
        {activeView === 'passwords' && <KeyVaultManager />}
        {activeView === 'document' && <DocumentRepo />}
        {activeView === 'photo' && <PhotoTimeline />}
      </div>

      {/* Upload Modal */}
      {activeView !== 'passwords' && (
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          defaultFileType={activeView as 'document' | 'photo'}
        />
      )}
    </div>
  );
}

export default VaultPage;
