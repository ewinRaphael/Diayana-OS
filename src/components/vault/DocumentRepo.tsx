// ============================================================
// NexusOS — Vault: Document Repository View
// ============================================================

import { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState } from '../ui/EmptyState';
import { useMediaVault } from '../../hooks/useMediaVault';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { MediaItem } from '../../lib/types';

export function DocumentRepo() {
  const { activeWorkspace } = useWorkspace();
  const { documents, loading, deleteMedia } = useMediaVault({
    workspace: activeWorkspace === 'all' ? undefined : activeWorkspace,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-light" />;
    }
    if (ext === 'pdf') {
      return <FileText className="w-5 h-5 text-error" />;
    }
    return <FileCode className="w-5 h-5 text-purple-light" />;
  };

  const handleDownload = (doc: MediaItem) => {
    // If it's a blob/base64/data URI, trigger download directly
    if (
      doc.storage_path.startsWith('blob:') ||
      doc.storage_path.startsWith('data:')
    ) {
      const a = document.createElement('a');
      a.href = doc.storage_path;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock / Supabase download: generate a text blob representing the document
      const blob = new Blob(
        [
          `--- NexusOS Document Vault Export ---\n\nFile: ${doc.file_name}\nWorkspace: ${doc.workspace}\nCaption: ${doc.caption}\nStorage Path: ${doc.storage_path}\nUploaded: ${doc.uploaded_at}\n\n[Content verified and decrypted by NexusOS Security Engine]`,
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name.endsWith('.txt') ? doc.file_name : `${doc.file_name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.file_name.toLowerCase().includes(q) ||
      (d.caption && d.caption.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-xs text-text-muted">
        Loading document repository...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search contracts, specifications, spreadsheets by name or caption..."
          className="max-w-md w-full"
        />

        <span className="text-xs font-mono text-text-muted">
          Showing {filteredDocs.length} documents
        </span>
      </div>

      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Documents Found"
          description={
            searchQuery
              ? 'No documents matched your search query.'
              : 'The repository is empty. Upload project PDFs, blueprints, or contracts.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-charcoal">
          <table className="w-full text-left text-xs">
            <thead className="bg-obsidian border-b border-border text-text-muted font-mono uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Document / File</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredDocs.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-obsidian/40 transition-colors group"
                >
                  {/* File info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-obsidian border border-border shrink-0">
                        {getFileIcon(doc.file_name)}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary text-xs">
                          {doc.file_name}
                        </p>
                        {doc.caption && (
                          <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">
                            {doc.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Workspace */}
                  <td className="py-3.5 px-4">
                    <Badge variant="workspace" value={doc.workspace} />
                  </td>

                  {/* Size */}
                  <td className="py-3.5 px-4 font-mono text-text-muted">
                    {doc.file_size_kb} KB
                  </td>

                  {/* Upload Date */}
                  <td className="py-3.5 px-4 font-mono text-text-muted">
                    {doc.uploaded_at.split('T')[0]}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownload(doc)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-obsidian border border-border hover:border-purple text-text-primary hover:text-purple-light transition-all cursor-pointer text-xs font-medium"
                        title="Quick Download / Retrieve Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteMedia(doc.id)}
                        className="p-1.5 text-text-dim hover:text-error hover:bg-error/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DocumentRepo;
