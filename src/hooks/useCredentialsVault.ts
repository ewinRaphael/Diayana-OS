// ============================================================
// Diayana OS 'Track balancing' — useCredentialsVault Hook
// Executive KeyVault & Multi-Account Password Manager
// Master Password Protected, Multiple Logins per App, Security Audits
// ============================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CredentialItem, CredentialCategory, Workspace } from '../lib/types';

const VAULT_STORAGE_KEY = 'diayana_credentials_vault';
const MASTER_PASS_KEY = 'diayana_vault_master_passcode';
const SESSION_DURATION_SECONDS = 300; // 5 minutes auto-lock timeout

// Pre-seeded multi-account credentials demonstrating multi-login architecture
const INITIAL_SEED_CREDENTIALS: CredentialItem[] = [
  {
    id: 'cred_fb_hashadz',
    service_name: 'Facebook',
    account_label: 'Hashadz Agency Ads Manager',
    username: 'hashadz.agency',
    email: 'ads@hashadz.com',
    password: 'Hashadz#Meta2026!Pro',
    website_url: 'https://business.facebook.com',
    category: 'social',
    workspace: 'hashadz',
    notes: 'Meta Business Manager Account ID: 8941205912. 2FA Authenticator enabled on primary mobile.',
    is_favorite: true,
    last_updated: '2026-11-24T10:00:00.000Z',
    created_at: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'cred_fb_personal',
    service_name: 'Facebook',
    account_label: 'Personal Founder Profile',
    username: 'ashil.founder',
    email: 'ashil@personal.com',
    password: 'AshilSecure*2026_Key',
    website_url: 'https://facebook.com',
    category: 'personal',
    workspace: 'personal',
    notes: 'Personal account. Recovery email set to backup Yahoo.',
    is_favorite: false,
    last_updated: '2026-11-20T14:30:00.000Z',
    created_at: '2026-11-01T12:00:00.000Z',
  },
  {
    id: 'cred_google_slash',
    service_name: 'Google Workspace',
    account_label: 'Slash Business Suite Admin',
    username: 'admin.slash',
    email: 'admin@slash.co',
    password: 'Slash!Cloud99@GoogleAdmin',
    website_url: 'https://admin.google.com',
    category: 'business',
    workspace: 'slash',
    notes: 'Super Admin for Slash organization. Emergency security key stored in physical office safe.',
    is_favorite: true,
    last_updated: '2026-11-22T08:15:00.000Z',
    created_at: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'cred_google_personal',
    service_name: 'Google Workspace',
    account_label: 'Personal Gmail & Drive',
    username: 'ashil.personal',
    email: 'ashil.primary@gmail.com',
    password: 'MyPersonalGSuite!786',
    website_url: 'https://mail.google.com',
    category: 'personal',
    workspace: 'personal',
    notes: 'Linked to personal Android device. 100GB Google One active.',
    is_favorite: false,
    last_updated: '2026-11-15T11:00:00.000Z',
    created_at: '2026-11-02T10:00:00.000Z',
  },
  {
    id: 'cred_hostinger_vps',
    service_name: 'Hostinger VPS',
    account_label: 'Hermes AI Production Server',
    username: 'root_hermes',
    email: 'devops@hashadz.com',
    password: 'Hostinger#VPS9821_SecureKVM',
    website_url: 'https://hpanel.hostinger.com',
    category: 'devops',
    workspace: 'hashadz',
    notes: 'IP: 195.35.40.12. SSH Port: 22. Runs Hermes Webhook bridge & Keep-Alive cron.',
    is_favorite: true,
    last_updated: '2026-11-23T16:45:00.000Z',
    created_at: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'cred_supabase_db',
    service_name: 'Supabase Cloud',
    account_label: 'Diayana OS PostgreSQL DB',
    username: 'postgres',
    email: 'database@hashadz.com',
    password: 'Aphaelz@2941.@db.vudbwbqctvbfoqnvidfr',
    website_url: 'https://supabase.com/dashboard/project/vudbwbqctvbfoqnvidfr',
    category: 'devops',
    workspace: 'hashadz',
    notes: 'Reference ID: vudbwbqctvbfoqnvidfr. Contains entries, tasks, media_vault, metrics.',
    is_favorite: false,
    last_updated: '2026-11-25T11:20:00.000Z',
    created_at: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'cred_bank_enbd',
    service_name: 'Emirates NBD',
    account_label: 'Hashadz Corporate Banking',
    username: 'ashil_enbd_biz',
    email: 'finance@hashadz.com',
    password: 'ENBD#CorpFinance2026$',
    website_url: 'https://www.emiratesnbd.com/en/business-banking',
    category: 'finance',
    workspace: 'hashadz',
    notes: 'Corporate Account No: 102948201928. Hard token required for wire transfers > 50,000 AED.',
    is_favorite: true,
    last_updated: '2026-11-18T10:00:00.000Z',
    created_at: '2026-11-01T12:00:00.000Z',
  },
];

export function useCredentialsVault() {
  const [credentials, setCredentials] = useState<CredentialItem[]>(() => {
    try {
      const stored = localStorage.getItem(VAULT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[KeyVault] Error loading stored credentials:', e);
    }
    return INITIAL_SEED_CREDENTIALS;
  });

  // Master Passcode state
  const [storedMasterPasscode, setStoredMasterPasscode] = useState<string>(() => {
    return localStorage.getItem(MASTER_PASS_KEY) || '1234'; // Default initial PIN
  });

  // Unlocked Session State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SESSION_DURATION_SECONDS);

  // Sync credentials to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(credentials));
    } catch (e) {
      console.error('[KeyVault] Failed to save credentials to localStorage:', e);
    }
  }, [credentials]);

  // Session auto-lock countdown timer
  useEffect(() => {
    if (!isUnlocked) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setIsUnlocked(false);
          return SESSION_DURATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked]);

  // Unlock Vault
  const unlockVault = useCallback((passcode: string): boolean => {
    if (passcode.trim() === storedMasterPasscode.trim()) {
      setIsUnlocked(true);
      setRemainingTime(SESSION_DURATION_SECONDS);
      return true;
    }
    return false;
  }, [storedMasterPasscode]);

  // Lock Vault
  const lockVault = useCallback(() => {
    setIsUnlocked(false);
    setRemainingTime(SESSION_DURATION_SECONDS);
  }, []);

  // Update Master Passcode
  const updateMasterPasscode = useCallback((oldPass: string, newPass: string): boolean => {
    if (oldPass.trim() !== storedMasterPasscode.trim()) {
      return false;
    }
    localStorage.setItem(MASTER_PASS_KEY, newPass.trim());
    setStoredMasterPasscode(newPass.trim());
    return true;
  }, [storedMasterPasscode]);

  // Direct set Master Passcode (initial setup)
  const setInitialMasterPasscode = useCallback((newPass: string) => {
    localStorage.setItem(MASTER_PASS_KEY, newPass.trim());
    setStoredMasterPasscode(newPass.trim());
    setIsUnlocked(true);
    setRemainingTime(SESSION_DURATION_SECONDS);
  }, []);

  // CRUD: Add Credential
  const addCredential = useCallback((item: Omit<CredentialItem, 'id' | 'created_at' | 'last_updated'>): CredentialItem => {
    const newItem: CredentialItem = {
      ...item,
      id: `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      password_history: [{ password: item.password, changed_at: new Date().toISOString() }],
    };

    setCredentials((prev) => [newItem, ...prev]);
    return newItem;
  }, []);

  // CRUD: Update Credential
  const updateCredential = useCallback((id: string, updates: Partial<CredentialItem>) => {
    setCredentials((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const isPasswordChanged = updates.password && updates.password !== item.password;
        const history = item.password_history || [];

        if (isPasswordChanged) {
          history.unshift({
            password: item.password,
            changed_at: item.last_updated || item.created_at,
          });
        }

        return {
          ...item,
          ...updates,
          password_history: history.slice(0, 5), // Keep last 5 passwords
          last_updated: new Date().toISOString(),
        };
      })
    );
  }, []);

  // CRUD: Delete Credential
  const deleteCredential = useCallback((id: string) => {
    setCredentials((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Toggle Favorite
  const toggleFavorite = useCallback((id: string) => {
    setCredentials((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_favorite: !item.is_favorite } : item))
    );
  }, []);

  // Export Encrypted / Clean JSON Backup
  const exportVaultJson = useCallback((): string => {
    return JSON.stringify(credentials, null, 2);
  }, [credentials]);

  // Import JSON Backup
  const importVaultJson = useCallback((jsonStr: string): number => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!Array.isArray(parsed)) throw new Error('Expected array of credentials');

      let importedCount = 0;
      setCredentials((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newItems: CredentialItem[] = [];

        for (const item of parsed) {
          if (item.service_name && item.password) {
            const safeItem: CredentialItem = {
              id: existingIds.has(item.id) ? `cred_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` : item.id,
              service_name: String(item.service_name),
              account_label: String(item.account_label || 'Default Account'),
              username: String(item.username || ''),
              email: String(item.email || ''),
              password: String(item.password),
              website_url: item.website_url ? String(item.website_url) : undefined,
              category: (item.category as CredentialCategory) || 'other',
              workspace: (item.workspace as Workspace) || 'personal',
              notes: item.notes ? String(item.notes) : '',
              is_favorite: Boolean(item.is_favorite),
              created_at: item.created_at || new Date().toISOString(),
              last_updated: item.last_updated || new Date().toISOString(),
            };
            newItems.push(safeItem);
            importedCount++;
          }
        }
        return [...newItems, ...prev];
      });

      return importedCount;
    } catch (err: any) {
      console.error('[KeyVault] Import failed:', err);
      throw new Error(`Failed to parse credentials backup JSON: ${err.message}`);
    }
  }, []);

  // Security Analytics & Audit Computations
  const securityAudit = useMemo(() => {
    let weakCount = 0;
    const passwordCounts: Record<string, number> = {};

    for (const c of credentials) {
      const pass = c.password || '';
      // Weak check: < 8 chars or lacks both upper & lower or lacks numbers/symbols
      const isShort = pass.length < 8;
      const lacksComplexity = !(/[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9!@#$%^&*]/.test(pass));
      if (isShort || lacksComplexity) {
        weakCount++;
      }

      // Reused check
      passwordCounts[pass] = (passwordCounts[pass] || 0) + 1;
    }

    let reusedCount = 0;
    for (const count of Object.values(passwordCounts)) {
      if (count > 1) {
        reusedCount += count;
      }
    }

    const total = credentials.length;
    // Calculate 0-100 score
    let score = 100;
    if (total > 0) {
      score -= Math.round((weakCount / total) * 40);
      score -= Math.round((reusedCount / total) * 30);
    }
    const healthScore = Math.max(10, Math.min(100, score));

    // Unique applications
    const uniqueApps = new Set(credentials.map((c) => c.service_name.trim().toLowerCase())).size;

    return {
      totalAccounts: total,
      uniqueApps,
      weakCount,
      reusedCount,
      strongCount: total - weakCount,
      healthScore,
    };
  }, [credentials]);

  // Group credentials by application
  const groupedByApp = useMemo(() => {
    const map = new Map<string, CredentialItem[]>();
    for (const c of credentials) {
      const key = c.service_name.trim();
      const existing = map.get(key) || [];
      existing.push(c);
      map.set(key, existing);
    }
    return map;
  }, [credentials]);

  return {
    credentials,
    groupedByApp,
    isUnlocked,
    remainingTime,
    hasMasterPasscode: Boolean(storedMasterPasscode),
    securityAudit,
    unlockVault,
    lockVault,
    updateMasterPasscode,
    setInitialMasterPasscode,
    addCredential,
    updateCredential,
    deleteCredential,
    toggleFavorite,
    exportVaultJson,
    importVaultJson,
  };
}
