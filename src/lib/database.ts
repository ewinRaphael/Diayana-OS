// ============================================================
// Diayana OS 'Track balancing' — Resilient Unified Data Store Dispatcher
// Transparently switches between SupabaseStore and LocalStore (IndexedDB).
// Probes Supabase schema: if tables are not yet created or unreachable,
// seamlessly falls back to LocalStore with complete seed data.
// ============================================================

import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { SupabaseStore } from './supabaseStore';
import {
  getStore as getLocalStore,
  resetStore as resetLocalStore,
  type IDataStore,
} from './localStore';

export type DatabaseMode = 'supabase' | 'local_offline';
export type SchemaStatus = 'ready' | 'missing_tables' | 'not_configured' | 'error';

let _activeStore: IDataStore | null = null;
let _isUsingSupabase = false;
let _supabaseSchemaStatus: SchemaStatus = 'not_configured';
let _lastError: string | null = null;

export function getStoreStatus() {
  return {
    isUsingSupabase: _isUsingSupabase,
    schemaStatus: _supabaseSchemaStatus,
    lastError: _lastError,
  };
}

export async function getStore(): Promise<IDataStore> {
  if (_activeStore) {
    return _activeStore;
  }

  const isConfigured = isSupabaseConfigured();

  if (isConfigured) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // Probe if Supabase tables actually exist in the schema cache
        const { error } = await client.from('entries').select('id').limit(1);
        if (!error) {
          _activeStore = new SupabaseStore(client);
          _isUsingSupabase = true;
          _supabaseSchemaStatus = 'ready';
          _lastError = null;
          console.log('[Diayana OS] Supabase cloud store active & verified.');
          return _activeStore;
        } else {
          _lastError = error.message;
          _supabaseSchemaStatus = 'missing_tables';
          console.warn('[Diayana OS] Supabase tables not found in schema cache (' + error.message + '). Falling back to LocalStore.');
        }
      } catch (err: any) {
        _lastError = err?.message || 'Connection error';
        _supabaseSchemaStatus = 'error';
        console.warn('[Diayana OS] Supabase probe failed, using LocalStore fallback:', err?.message);
      }
    }
  } else {
    _supabaseSchemaStatus = 'not_configured';
  }

  // Graceful, resilient LocalStore fallback with seed data
  _activeStore = await getLocalStore();
  _isUsingSupabase = false;
  return _activeStore;
}

export function resetStore(): void {
  resetLocalStore();
  _activeStore = null;
  _isUsingSupabase = false;
  _supabaseSchemaStatus = 'not_configured';
  _lastError = null;
}

export type { IDataStore };
