// ============================================================
// Diayana OS 'Track balancing' — useSettings hook
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { NexusSettings } from '../lib/types';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from '../lib/supabase';

const STORAGE_KEY = 'nexus_settings';

export const DEFAULT_SETTINGS: NexusSettings = {
  geminiApiKey: (import.meta.env?.VITE_GEMINI_API_KEY as string) || '',
  geminiModel: 'gemini-2.5-flash',
  customTranscriptionEndpoint: '',
  useCustomTranscription: false,
  supabaseUrl: DEFAULT_SUPABASE_URL,
  supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
  hermesWebhookUrl: 'https://vps.yourdomain.com:3300/webhooks/nexus-text',
  hermesWebhookToken: 'nexus-secret-token',
  telegramBotToken: '',
  telegramChatId: '',
  publicTunnelUrl: 'https://diayana-os.loca.lt',
  gitBranch: 'feature/diayana-v2-track-balancing',
  appVersion: "v2.1.0 'Track balancing'",
  notificationsEnabled: true,
  activeIntegrations: {
    supabase: true,
    gemini: true,
    hermes: true,
    telegram: true,
    public_ip: true,
  },
};

function loadSettings(): NexusSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NexusSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        geminiApiKey: parsed.geminiApiKey || DEFAULT_SETTINGS.geminiApiKey,
        supabaseUrl: parsed.supabaseUrl || DEFAULT_SUPABASE_URL,
        supabaseAnonKey: parsed.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY,
      };
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: NexusSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function dispatchSettingsEvent(): void {
  window.dispatchEvent(new CustomEvent('nexus-settings-changed'));
}

export function useSettings() {
  const [settings, setSettings] = useState<NexusSettings>(loadSettings);

  // Sync when another tab / component updates settings
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSettings(loadSettings());
      }
    };

    const handleCustom = () => {
      setSettings(loadSettings());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('nexus-settings-changed', handleCustom);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nexus-settings-changed', handleCustom);
    };
  }, []);

  const updateSettings = useCallback((partial: Partial<NexusSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      saveSettings(updated);
      dispatchSettingsEvent();
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    dispatchSettingsEvent();
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
