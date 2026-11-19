// ============================================================
// NexusOS — Vault Upload Modal
// Supports Photo or Document upload with workspace tagging
// ============================================================

import { useState, useRef, type ChangeEvent } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useMediaVault } from '../../hooks/useMediaVault';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { FileType, Workspace } from '../../lib/types';
import { cn } from '../../lib/utils';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFileType?: FileType;
}

export function UploadModal({
  isOpen,
  onClose,
  defaultFileType = 'document',
}: UploadModalProps) {
  const { uploadMedia } = useMediaVault();
  const { activeWorkspace, accentColor } = useWorkspace();

  const [fileType, setFileType] = useState<FileType>(defaultFileType);
  const [workspace, setWorkspace] = useState<Workspace>(
    activeWorkspace === 'all' ? 'hashadz' : activeWorkspace
  );
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      await uploadMedia({
        file: selectedFile,
        workspace,
        file_type: fileType,
        caption: caption.trim() || selectedFile.name,
      });

      setSelectedFile(null);
      setCaption('');
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err.message || 'Failed to upload file to vault.');
    } finally {
      setIsUploading(false);
    }
  };

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload to ${fileType === 'photo' ? 'Photo Timeline' : 'Document Repository'}`}
    >
      <div className="space-y-4 pt-1">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-error/15 border border-error/30 text-error rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Target Workspace */}
        <div>
          <label className="text-xs font-medium text-text-primary block mb-1.5">
            Target Workspace
          </label>
          <div className="flex items-center gap-2">
            {(['hashadz', 'slash', 'personal'] as Workspace[]).map((ws) => (
              <button
                key={ws}
                type="button"
                onClick={() => setWorkspace(ws)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs capitalize font-medium transition-all cursor-pointer',
                  workspace === ws
                    ? ws === 'hashadz'
                      ? 'bg-indigo/20 text-indigo-light border border-indigo/40'
                      : ws === 'slash'
                      ? 'bg-emerald/20 text-emerald-light border border-emerald/40'
                      : 'bg-amber/20 text-amber-light border border-amber/40'
                    : 'bg-obsidian border border-border text-text-muted hover:text-text-primary'
                )}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* File Type Switch */}
        <div>
          <label className="text-xs font-medium text-text-primary block mb-1.5">
            Vault Category
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFileType('document')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                fileType === 'document'
                  ? 'bg-charcoal border-purple text-purple-light shadow-sm'
                  : 'bg-obsidian border-border text-text-muted hover:text-text-primary'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Document (PDF/DOCX/XLSX)</span>
            </button>

            <button
              type="button"
              onClick={() => setFileType('photo')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                fileType === 'photo'
                  ? 'bg-charcoal border-purple text-purple-light shadow-sm'
                  : 'bg-obsidian border-border text-text-muted hover:text-text-primary'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Site / Personal Photo</span>
            </button>
          </div>
        </div>

        {/* File Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center p-6 bg-obsidian rounded-xl border-2 border-dashed border-border hover:border-border-light cursor-pointer transition-all"
        >
          <input
            type="file"
            ref={fileInputRef}
            accept={
              fileType === 'photo'
                ? 'image/*'
                : '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
            }
            onChange={handleFileChange}
            className="hidden"
          />
          <UploadCloud className="w-8 h-8 text-text-muted mb-2 opacity-70" />
          <span className="text-xs font-semibold text-text-primary">
            {selectedFile ? selectedFile.name : 'Click to select file'}
          </span>
          <span className="text-[11px] font-mono text-text-muted mt-0.5">
            {selectedFile
              ? `${Math.round(selectedFile.size / 1024)} KB`
              : 'Encrypted storage dispatch'}
          </span>
        </div>

        {/* Caption / Description */}
        <div>
          <label className="text-xs font-medium text-text-primary block mb-1">
            Caption or Reference Name
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. 'Marina Walk HVAC Site Inspection Drawing v2'..."
            className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
              accentButtonMap[accentColor],
              (!selectedFile || isUploading) && 'opacity-60 cursor-not-allowed'
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload to Vault</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default UploadModal;
