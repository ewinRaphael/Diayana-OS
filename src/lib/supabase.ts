// ============================================================
// NexusOS — Dynamic Supabase Client Factory
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { NexusSettings } from './types';

let cachedClient: SupabaseClient | null = null;
let cachedUrl: string | null = null;
let cachedKey: string | null = null;

function getSettingsFromLocalStorage(): Partial<NexusSettings> {
  try {
    const raw = localStorage.getItem('nexus_settings');
    if (raw) {
      return JSON.parse(raw) as Partial<NexusSettings>;
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

/**
 * Returns true if Supabase URL and anon key are configured
 * (via env vars or runtime localStorage settings).
 */
export function isSupabaseConfigured(): boolean {
  const settings = getSettingsFromLocalStorage();

  const url =
    settings.supabaseUrl ||
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_SUPABASE_URL
      : undefined) ||
    '';

  const key =
    settings.supabaseAnonKey ||
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_SUPABASE_ANON_KEY
      : undefined) ||
    '';

  return Boolean(url && key);
}

/**
 * Returns a Supabase client if configured, or null otherwise.
 * Caches the client and only recreates if the URL/key have changed.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const settings = getSettingsFromLocalStorage();

  const url: string =
    settings.supabaseUrl ||
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_SUPABASE_URL
      : undefined) ||
    '';

  const key: string =
    settings.supabaseAnonKey ||
    (typeof import.meta !== 'undefined'
      ? import.meta.env?.VITE_SUPABASE_ANON_KEY
      : undefined) ||
    '';

  if (!url || !key) {
    return null;
  }

  // Return cached client if URL and key haven't changed
  if (cachedClient && cachedUrl === url && cachedKey === key) {
    return cachedClient;
  }

  cachedClient = createClient(url, key);
  cachedUrl = url;
  cachedKey = key;

  return cachedClient;
}
