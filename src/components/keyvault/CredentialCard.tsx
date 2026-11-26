// ============================================================
// Diayana OS — Credential Card Component
// Multi-Account Profile Switcher, Master-Authenticated Unmasking,
// Quick-Copy, and 1-Click Launch
// ============================================================

import { useState } from 'react';
import {
  Copy,
  Check,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  Plus,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CredentialItem } from '../../lib/types';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface CredentialCardProps {
  appName: string;
  accounts: CredentialItem[];
  isUnlocked: boolean;
  onRequireUnlock: () => void;
  onEdit: (item: CredentialItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onAddAnotherAccount: (item: CredentialItem) => void;
}

export function CredentialCard({
  appName,
  accounts,
  isUnlocked,
  onRequireUnlock,
  onEdit,
  onDelete,
  onToggleFavorite,
  onAddAnotherAccount,
}: CredentialCardProps) {
  // If multiple accounts exist for this app, manage active account index
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'email' | 'password' | 'notes' | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const current = accounts[activeAccountIndex] || accounts[0];
  if (!current) return null;

  const handleCopy = (text: string, field: 'username' | 'email' | 'password' | 'notes') => {
    if (!text) return;

    if (field === 'password' && !isUnlocked) {
      onRequireUnlock();
      return;
    }

    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleReveal = () => {
    if (!isUnlocked) {
      onRequireUnlock();
      return;
    }
    setIsRevealed(!isRevealed);
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  // Icon initial
  const appInitial = appName.charAt(0).toUpperCase();

  return (
    <div className="p-4 bg-charcoal rounded-xl border border-border hover:border-border-light transition-all shadow-sm space-y-3.5">
      {/* 1. Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-obsidian border border-border flex items-center justify-center font-bold font-mono text-purple-light text-base shrink-0 shadow-sm">
            {appInitial}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-text-primary truncate">
                {appName}
              </h3>
              {accounts.length > 1 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple/15 text-purple-light border border-purple/30 shrink-0">
                  {accounts.length} Accounts
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <Badge variant="workspace" value={current.workspace} />
              <span className="text-[11px] font-medium text-text-dim capitalize">
                {current.category}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(current.id)}
            title={current.is_favorite ? 'Favorited' : 'Favorite'}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              current.is_favorite
                ? 'text-amber-light hover:bg-amber/15'
                : 'text-text-muted hover:text-text-primary hover:bg-border/40'
            )}
          >
            <Star className={cn('w-4 h-4', current.is_favorite && 'fill-current')} />
          </button>

          {current.website_url && (
            <a
              href={current.website_url}
              target="_blank"
              rel="noreferrer"
              title="Launch Login Page"
              className="p-1.5 rounded-lg text-text-muted hover:text-purple-light hover:bg-border/40 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onEdit(current)}
            title="Edit Login Details"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-border/40 transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(current.id)}
            title="Delete Account Login"
            className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/15 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Multiple Account Profiles Pill Switcher (Crucial for multiple accounts per app) */}
      {accounts.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border/60">
          {accounts.map((acc, idx) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => {
                setActiveAccountIndex(idx);
                setIsRevealed(false);
              }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 cursor-pointer',
                activeAccountIndex === idx
                  ? 'bg-purple/20 text-purple-light border border-purple/40 font-semibold'
                  : 'bg-obsidian text-text-muted hover:text-text-primary border border-border/80'
              )}
            >
              {acc.account_label || `Account ${idx + 1}`}
            </button>
          ))}

          {/* Quick Add Another Account directly for this app */}
          <button
            type="button"
            onClick={() => onAddAnotherAccount(current)}
            title="Add another login for this application"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-text-muted hover:text-text-primary bg-obsidian border border-dashed border-border/80 hover:border-purple/40 shrink-0 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add Login</span>
          </button>
        </div>
      )}

      {/* 3. Account Profile Label Header (if single account) */}
      {accounts.length === 1 && (
        <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
          <span className="text-[11px] font-semibold text-text-primary">
            {current.account_label}
          </span>
          <button
            type="button"
            onClick={() => onAddAnotherAccount(current)}
            className="text-[11px] text-purple-light hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Add another {appName} account</span>
          </button>
        </div>
      )}

      {/* 4. Credentials Detail Box */}
      <div className="p-3 bg-obsidian rounded-xl border border-border/80 space-y-2.5 text-xs font-mono">
        {/* Email */}
        {current.email && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted text-[11px]">Email:</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-text-primary truncate">{current.email}</span>
              <button
                type="button"
                onClick={() => handleCopy(current.email, 'email')}
                title="Copy Email"
                className="text-text-muted hover:text-text-primary cursor-pointer shrink-0"
              >
                {copiedField === 'email' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-light" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Username / Handle */}
        {current.username && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-muted text-[11px]">User / ID:</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-text-primary truncate">{current.username}</span>
              <button
                type="button"
                onClick={() => handleCopy(current.username, 'username')}
                title="Copy Username"
                className="text-text-muted hover:text-text-primary cursor-pointer shrink-0"
              >
                {copiedField === 'username' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-light" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Password (Protected by Master Password) */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
          <span className="text-text-muted text-[11px] flex items-center gap-1">
            {!isUnlocked ? <Lock className="w-3 h-3 text-amber-light" /> : <ShieldCheck className="w-3 h-3 text-emerald-light" />}
            <span>Password:</span>
          </span>

          <div className="flex items-center gap-2">
            <span className={cn('tracking-wider text-xs', isRevealed && isUnlocked ? 'text-text-primary font-bold' : 'text-text-muted')}>
              {isRevealed && isUnlocked ? current.password : '••••••••••••'}
            </span>

            {/* Reveal Toggle */}
            <button
              type="button"
              onClick={handleToggleReveal}
              title={isUnlocked ? (isRevealed ? 'Hide Password' : 'Show Password') : 'Unlock to view password'}
              className="p-1 text-text-muted hover:text-text-primary cursor-pointer"
            >
              {isRevealed && isUnlocked ? (
                <EyeOff className="w-3.5 h-3.5 text-text-primary" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Copy Password */}
            <button
              type="button"
              onClick={() => handleCopy(current.password, 'password')}
              title={isUnlocked ? 'Copy Password' : 'Unlock to copy password'}
              className="p-1 text-text-muted hover:text-purple-light cursor-pointer"
            >
              {copiedField === 'password' ? (
                <Check className="w-3.5 h-3.5 text-emerald-light" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Notes Drawer (Expandable for 2FA / PINs) */}
      {current.notes && (
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            <span>Secure Notes / 2FA</span>
            {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showNotes && (
            <div className="p-2.5 bg-obsidian rounded-lg border border-border text-[11px] font-mono text-text-muted leading-relaxed whitespace-pre-wrap relative animate-fade-in">
              {current.notes}
              <button
                type="button"
                onClick={() => handleCopy(current.notes || '', 'notes')}
                title="Copy Notes"
                className="absolute top-2 right-2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                {copiedField === 'notes' ? (
                  <Check className="w-3 h-3 text-emerald-light" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. Footer: Last Updated */}
      <div className="flex items-center justify-between text-[10px] text-text-dim font-mono pt-1">
        <span>Updated: {formatDate(current.last_updated)}</span>
        {current.website_url && (
          <a
            href={current.website_url}
            target="_blank"
            rel="noreferrer"
            className="hover:text-purple-light truncate max-w-[140px]"
          >
            {current.website_url.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>
    </div>
  );
}
export default CredentialCard;
