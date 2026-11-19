// ============================================================
// NexusOS — Unified Data Store Dispatcher
// Transparently switches between SupabaseStore and LocalStore (IndexedDB)
// ============================================================

import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { SupabaseStore } from './supabaseStore';
import {
  getStore as getLocalStore,
  resetStore as resetLocalStore,
  type IDataStore,
} from './localStore';

let _activeStore: IDataStore | null = null;
let _isUsingSupabase = false;

export async function getStore(): Promise<IDataStore> {
  const shouldUseSupabase = isSupabaseConfigured();

  // If store type changed or store not initialized yet
  if (!_activeStore || shouldUseSupabase !== _isUsingSupabase) {
    if (shouldUseSupabase) {
      const client = getSupabaseClient();
      if (client) {
        _activeStore = new SupabaseStore(client);
        _isUsingSupabase = true;
        return _activeStore;
      }
    }

    _activeStore = await getLocalStore();
    _isUsingSupabase = false;
  }

  return _activeStore;
}

export function resetStore(): void {
  resetLocalStore();
  _activeStore = null;
  _isUsingSupabase = false;
}

export type { IDataStore };
