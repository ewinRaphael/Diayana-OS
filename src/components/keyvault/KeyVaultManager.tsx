// ============================================================
// Diayana OS 'Track balancing' — KeyVault Manager
// Executive Password Manager with Master Passcode Protection,
// Multi-Account Grouping, Password Generator, and Security Audit
// ============================================================

import { useState, useMemo, useRef } from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Sparkles,
  Search,
  Download,
  Upload,
  AlertTriangle,
  Star,
  RefreshCw,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useCredentialsVault } from '../../hooks/useCredentialsVault';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { CredentialCard } from './CredentialCard';
import { CredentialFormModal } from './CredentialFormModal';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import { MasterPasswordModal } from './MasterPasswordModal';
import type { CredentialItem } from '../../lib/types';
import { cn } from '../../lib/utils';

export function KeyVaultManager() {
  const { activeWorkspace, accentColor } = useWorkspace();
  const {
    credentials,
    isUnlocked,
    remainingTime,
    securityAudit,
    unlockVault,
    lockVault,
    updateMasterPasscode,
    addCredential,
    updateCredential,
    deleteCredential,
    toggleFavorite,
    exportVaultJson,
    importVaultJson,
  } = useCredentialsVault();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [securityFilter, setSecurityFilter] = useState<'all' | 'weak' | 'reused'>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CredentialItem | null>(null);
  const [prefillApp, setPrefillApp] = useState<any>(null);

  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isMasterPassModalOpen, setIsMasterPassModalOpen] = useState(false);
  const [isChangePasscodeMode, setIsChangePasscodeMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Format countdown mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered credentials list
  const filteredCredentials = useMemo(() => {
    return credentials.filter((item) => {
      // Workspace filter
      if (activeWorkspace !== 'all' && item.workspace !== 'all' && item.workspace !== activeWorkspace) {
        return false;
      }

      // Search query (app name, email, username, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.service_name.toLowerCase().includes(q) ||
          item.account_label.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Favorites
      if (showOnlyFavorites && !item.is_favorite) {
        return false;
      }

      // Security filter
      if (securityFilter === 'weak') {
        const pass = item.password || '';
        const isWeak = pass.length < 8 || !(/[A-Z]/.test(pass) && /[a-z]/.test(pass) && /[0-9!@#$%^&*]/.test(pass));
        if (!isWeak) return false;
      }

      if (securityFilter === 'reused') {
        const duplicates = credentials.filter((c) => c.password === item.password && c.id !== item.id);
        if (duplicates.length === 0) return false;
      }

      return true;
    });
  }, [credentials, activeWorkspace, searchQuery, selectedCategory, showOnlyFavorites, securityFilter]);

  // Filtered grouped map
  const filteredGroupedMap = useMemo(() => {
    const map = new Map<string, CredentialItem[]>();
    for (const item of filteredCredentials) {
      const key = item.service_name.trim();
      const existing = map.get(key) || [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [filteredCredentials]);

  // Action handlers
  const handleAddNew = () => {
    setEditingItem(null);
    setPrefillApp(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: CredentialItem) => {
    setEditingItem(item);
    setPrefillApp(null);
    setIsFormOpen(true);
  };

  const handleAddAnotherAccount = (existingAppItem: CredentialItem) => {
    setEditingItem(null);
    setPrefillApp({
      service_name: existingAppItem.service_name,
      website_url: existingAppItem.website_url,
      category: existingAppItem.category,
      workspace: existingAppItem.workspace,
    });
    setIsFormOpen(true);
  };

  const handleSaveCredential = (data: Omit<CredentialItem, 'id' | 'created_at' | 'last_updated'>) => {
    if (editingItem) {
      updateCredential(editingItem.id, data);
      showToast(`Updated login for ${data.service_name}`);
    } else {
      addCredential(data);
      showToast(`Added new login for ${data.service_name}`);
    }
  };

  const handleDelete = (id: string) => {
    const item = credentials.find((c) => c.id === id);
    if (window.confirm(`Delete credential for ${item?.service_name || 'this account'}?`)) {
      deleteCredential(id);
      showToast('Credential removed from vault');
    }
  };

  const handleRequireUnlock = () => {
    setIsChangePasscodeMode(false);
    setIsMasterPassModalOpen(true);
  };

  const handleUnlockSuccess = (passcode: string) => {
    const ok = unlockVault(passcode);
    if (!ok) {
      throw new Error('Invalid master passcode');
    }
    showToast('Vault unlocked for 5 minutes');
  };

  const handleExport = () => {
    const jsonStr = exportVaultJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diayana_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Vault credentials exported to JSON backup');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const count = importVaultJson(text);
        showToast(`Successfully imported ${count} credentials into vault!`);
      } catch (err: any) {
        alert(err.message || 'Import failed');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white shadow-purple/20',
    indigo: 'bg-indigo hover:bg-indigo-light text-white shadow-indigo/20',
    emerald: 'bg-emerald hover:bg-emerald-light text-white shadow-emerald/20',
    amber: 'bg-amber hover:bg-amber-light text-obsidian font-bold shadow-amber/20',
  };

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Logins' },
    { id: 'business', label: 'Business' },
    { id: 'social', label: 'Social' },
    { id: 'devops', label: 'DevOps & VPS' },
    { id: 'finance', label: 'Finance & Banking' },
    { id: 'personal', label: 'Personal' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 bg-obsidian border border-purple/40 text-text-primary text-xs rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-light" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for JSON Backup Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImportFile}
        className="hidden"
      />

      {/* 1. Master Security Status & Quick Controls Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-charcoal rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center font-bold shadow-md shrink-0',
              isUnlocked
                ? 'bg-emerald/15 text-emerald-light border border-emerald/30'
                : 'bg-amber/15 text-amber-light border border-amber/30'
            )}
          >
            {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">
                {isUnlocked ? 'KeyVault Unlocked' : 'KeyVault Protected'}
              </h2>
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded-full border',
                  isUnlocked
                    ? 'bg-emerald/15 text-emerald-light border-emerald/30'
                    : 'bg-amber/15 text-amber-light border-amber/30'
                )}
              >
                {isUnlocked ? `Auto-locks in ${formatTimer(remainingTime)}` : 'Master Password Required'}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {isUnlocked
                ? 'Passwords and 2FA notes are decrypted for this session.'
                : 'Passwords are masked. Enter your Master Passcode to reveal or copy.'}
            </p>
          </div>
        </div>

        {/* Lock / Unlock & Security Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isUnlocked ? (
            <button
              type="button"
              onClick={lockVault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-obsidian border border-border text-amber-light hover:bg-amber/15 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Vault Now</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRequireUnlock}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber hover:bg-amber-light text-obsidian font-bold shadow-md shadow-amber/20 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Vault</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsChangePasscodeMode(true);
              setIsMasterPassModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-obsidian border border-border text-text-muted hover:text-text-primary transition-all cursor-pointer"
          >
            Change Master PIN
          </button>

          <button
            type="button"
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple/15 text-purple-light border border-purple/30 hover:bg-purple/25 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Password</span>
          </button>
        </div>
      </div>

      {/* 2. Security Health & Vulnerability Audit Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-charcoal rounded-xl border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block">
              Total Logins
            </span>
            <span className="text-xl font-bold font-mono text-text-primary">
              {securityAudit.totalAccounts}
            </span>
            <span className="text-[10px] text-text-dim block mt-0.5">
              Across {securityAudit.uniqueApps} applications
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-obsidian border border-border flex items-center justify-center text-purple-light">
            <KeyRound className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-charcoal rounded-xl border border-border flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block">
              Security Health
            </span>
            <span className="text-xl font-bold font-mono text-emerald-light">
              {securityAudit.healthScore}%
            </span>
            <span className="text-[10px] text-emerald-light/80 block mt-0.5">
              {securityAudit.strongCount} strong passwords
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald/10 border border-emerald/20 flex items-center justify-center text-emerald-light">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSecurityFilter(securityFilter === 'weak' ? 'all' : 'weak')}
          className={cn(
            'p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer',
            securityFilter === 'weak'
              ? 'bg-error/15 border-error text-error'
              : 'bg-charcoal border-border hover:border-error/40'
          )}
        >
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block">
              Weak Passwords
            </span>
            <span className={cn('text-xl font-bold font-mono', securityAudit.weakCount > 0 ? 'text-error' : 'text-text-primary')}>
              {securityAudit.weakCount}
            </span>
            <span className="text-[10px] text-text-dim block mt-0.5">
              {securityFilter === 'weak' ? 'Showing filtered' : 'Tap to filter'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center text-error">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSecurityFilter(securityFilter === 'reused' ? 'all' : 'reused')}
          className={cn(
            'p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer',
            securityFilter === 'reused'
              ? 'bg-amber/15 border-amber text-amber-light'
              : 'bg-charcoal border-border hover:border-amber/40'
          )}
        >
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted block">
              Reused Passwords
            </span>
            <span className={cn('text-xl font-bold font-mono', securityAudit.reusedCount > 0 ? 'text-amber-light' : 'text-text-primary')}>
              {securityAudit.reusedCount}
            </span>
            <span className="text-[10px] text-text-dim block mt-0.5">
              {securityFilter === 'reused' ? 'Showing duplicate' : 'Tap to filter'}
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center text-amber-light">
            <RefreshCw className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 3. Search Bar, Category Chips & Action Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by app, email, handle, or notes..."
              className="w-full bg-charcoal border border-border pl-9 pr-3 py-2 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-purple/40 placeholder:text-text-dim"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Grouped by App vs Flat List */}
            <div className="inline-flex items-center p-1 bg-charcoal rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                title="Group multiple accounts by Application"
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  viewMode === 'grouped'
                    ? 'bg-obsidian text-purple-light font-semibold shadow-sm border border-purple/30'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grouped</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Show all individual logins as flat list"
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-obsidian text-purple-light font-semibold shadow-sm border border-purple/30'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                <List className="w-3.5 h-3.5" />
                <span>All Logins</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              title="Filter Favorites"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer',
                showOnlyFavorites
                  ? 'bg-amber/15 text-amber-light border-amber/40'
                  : 'bg-charcoal text-text-muted hover:text-text-primary border-border'
              )}
            >
              <Star className={cn('w-3.5 h-3.5', showOnlyFavorites && 'fill-current')} />
              <span>Favorites</span>
            </button>

            {/* Backup Export/Import */}
            <button
              type="button"
              onClick={handleExport}
              title="Download Encrypted JSON Backup"
              className="p-2 rounded-xl bg-charcoal border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON Backup"
              className="p-2 rounded-xl bg-charcoal border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Add Credential Button */}
            <button
              type="button"
              onClick={handleAddNew}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer',
                accentButtonMap[accentColor]
              )}
            >
              <Plus className="w-4 h-4" />
              <span>Add Credential</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-obsidian border border-purple/40 text-purple-light font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-primary bg-charcoal/60 hover:bg-charcoal'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Credentials List / Application Cards Grid */}
      {viewMode === 'grouped' ? (
        filteredGroupedMap.size > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(filteredGroupedMap.entries()).map(([appName, accounts]) => (
              <CredentialCard
                key={appName}
                appName={appName}
                accounts={accounts}
                isUnlocked={isUnlocked}
                onRequireUnlock={handleRequireUnlock}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={toggleFavorite}
                onAddAnotherAccount={handleAddAnotherAccount}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAdd={handleAddNew} hasFilters={Boolean(searchQuery || selectedCategory !== 'all' || securityFilter !== 'all')} />
        )
      ) : (
        filteredCredentials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCredentials.map((c) => (
              <CredentialCard
                key={c.id}
                appName={c.service_name}
                accounts={[c]}
                isUnlocked={isUnlocked}
                onRequireUnlock={handleRequireUnlock}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggleFavorite={toggleFavorite}
                onAddAnotherAccount={handleAddAnotherAccount}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAdd={handleAddNew} hasFilters={Boolean(searchQuery || selectedCategory !== 'all' || securityFilter !== 'all')} />
        )
      )}

      {/* 5. Modals */}
      <CredentialFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveCredential}
        initialData={editingItem}
        prefillApp={prefillApp}
      />

      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
      />

      <MasterPasswordModal
        isOpen={isMasterPassModalOpen}
        onClose={() => setIsMasterPassModalOpen(false)}
        onSuccess={handleUnlockSuccess}
        isChangeMode={isChangePasscodeMode}
        onChangeSuccess={updateMasterPasscode}
      />
    </div>
  );
}

function EmptyState({ onAdd, hasFilters }: { onAdd: () => void; hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 bg-charcoal rounded-xl border border-border text-center space-y-3">
      <div className="w-12 h-12 rounded-xl bg-obsidian border border-border flex items-center justify-center text-text-muted">
        <KeyRound className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-text-primary">No credentials found</h4>
        <p className="text-xs text-text-muted mt-0.5 max-w-sm">
          {hasFilters
            ? 'No logins match your current search or security filters.'
            : 'Your KeyVault is ready. Add your first login account or import a backup.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple hover:bg-purple-light text-white shadow-md shadow-purple/20 transition-all cursor-pointer mt-1"
      >
        <Plus className="w-4 h-4" />
        <span>Add First Login</span>
      </button>
    </div>
  );
}

export default KeyVaultManager;
