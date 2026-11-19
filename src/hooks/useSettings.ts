// ============================================================
// NexusOS — useSettings hook
// Reads/writes NexusSettings from localStorage
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import type { NexusSettings } from '../lib/types';

const STORAGE_KEY = 'nexus_settings';

const DEFAULT_SETTINGS: NexusSettings = {
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  customTranscriptionEndpoint: '',
  useCustomTranscription: false,
  supabaseUrl: '',
  supabaseAnonKey: '',
  hermesWebhookUrl: '',
  hermesWebhookToken: '',
  notificationsEnabled: false,
};

function loadSettings(): NexusSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<NexusSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
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
      const next = { ...prev, ...partial };
      saveSettings(next);
      dispatchSettingsEvent();
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const defaults = { ...DEFAULT_SETTINGS };
    saveSettings(defaults);
    setSettings(defaults);
    dispatchSettingsEvent();
  }, []);

  return { settings, updateSettings, resetSettings } as const;
}

export default useSettings;
