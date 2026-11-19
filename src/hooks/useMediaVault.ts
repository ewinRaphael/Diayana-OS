// ============================================================
// NexusOS — useMediaVault hook
// Media vault: photos & documents with upload support
// ============================================================

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { MediaItem, Workspace, FileType } from '../lib/types';
import type { MediaFilter } from '../lib/localStore';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

interface UploadMediaParams {
  workspace: Workspace;
  entry_id?: string | null;
  file_type: FileType;
  file_name?: string;
  file_size_kb?: number;
  caption: string;
  file: File | Blob;
}

interface UseMediaVaultOptions {
  workspace?: Workspace;
  file_type?: FileType;
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useMediaVault(options?: UseMediaVaultOptions) {
  const { store } = useDatabase();
  const { activeWorkspace } = useWorkspace();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const buildFilter = useCallback((): MediaFilter | undefined => {
    const ws = options?.workspace ?? (activeWorkspace !== 'all' ? (activeWorkspace as Workspace) : undefined);
    const filter: MediaFilter = {};
    if (ws) filter.workspace = ws;
    if (options?.file_type) filter.file_type = options.file_type;
    return Object.keys(filter).length > 0 ? filter : undefined;
  }, [options?.workspace, options?.file_type, activeWorkspace]);

  const refreshMedia = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    try {
      const result = await store.getMedia(buildFilter());
      if (mountedRef.current) {
        setMedia(result);
      }
    } catch (err) {
      console.error('[useMediaVault] Failed to fetch media:', err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [store, buildFilter]);

  useEffect(() => {
    mountedRef.current = true;
    refreshMedia();
    return () => {
      mountedRef.current = false;
    };
  }, [refreshMedia]);

  const photos = useMemo(() => media.filter((m) => m.file_type === 'photo'), [media]);
  const documents = useMemo(() => media.filter((m) => m.file_type === 'document'), [media]);

  const uploadMedia = useCallback(
    async (params: UploadMediaParams) => {
      if (!store) throw new Error('Database not ready');

      const fileName = params.file_name || (params.file instanceof File ? params.file.name : 'upload.bin');
      const fileSizeKb = params.file_size_kb ?? Math.round(params.file.size / 1024);

      let storagePath: string;

      // Try Supabase Storage if configured, otherwise fall back to base64 blob URL
      try {
        const settingsRaw = localStorage.getItem('nexus_settings');
        const settings = settingsRaw ? JSON.parse(settingsRaw) : null;

        if (settings?.supabaseUrl && settings?.supabaseAnonKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(settings.supabaseUrl, settings.supabaseAnonKey);

          const path = `${params.workspace}/${Date.now()}_${fileName}`;
          const { error } = await supabase.storage
            .from('nexus-vault')
            .upload(path, params.file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from('nexus-vault')
            .getPublicUrl(path);

          storagePath = urlData.publicUrl;
        } else {
          storagePath = await fileToDataUrl(params.file);
        }
      } catch {
        storagePath = await fileToDataUrl(params.file);
      }

      const created = await store.createMedia({
        workspace: params.workspace,
        entry_id: params.entry_id ?? null,
        file_type: params.file_type,
        file_name: fileName,
        storage_path: storagePath,
        file_size_kb: fileSizeKb,
        caption: params.caption,
      });

      await refreshMedia();
      return created;
    },
    [store, refreshMedia],
  );

  const deleteMedia = useCallback(
    async (id: string) => {
      if (!store) throw new Error('Database not ready');
      await store.deleteMedia(id);
      await refreshMedia();
    },
    [store, refreshMedia],
  );

  return {
    media,
    photos,
    documents,
    loading,
    uploadMedia,
    deleteMedia,
    refreshMedia,
  };
}
