// ============================================================
// Diayana OS — Credential Add & Edit Modal
// Supports Multiple Logins per Application, Custom Profiles & Generator
// ============================================================

import { useState, useEffect } from 'react';
import { KeyRound, Sparkles, Eye, EyeOff, Globe, Layers, Tag, FileText } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';
import type { CredentialItem, CredentialCategory, Workspace } from '../../lib/types';

interface CredentialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<CredentialItem, 'id' | 'created_at' | 'last_updated'>) => void;
  initialData?: CredentialItem | null;
  prefillApp?: {
    service_name: string;
    website_url?: string;
    category?: CredentialCategory;
    workspace?: Workspace | 'all';
  };
}

const COMMON_APPS = [
  'Facebook',
  'Google Workspace',
  'Instagram',
  'LinkedIn',
  'Twitter (X)',
  'GitHub',
  'Hostinger VPS',
  'Supabase Cloud',
  'AWS',
  'Cloudflare',
  'Emirates NBD',
  'Stripe',
  'PayPal',
  'OpenAI',
  'WhatsApp Business',
  'Telegram',
];

export function CredentialFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  prefillApp,
}: CredentialFormModalProps) {
  const [serviceName, setServiceName] = useState('');
  const [accountLabel, setAccountLabel] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState<CredentialCategory>('business');
  const [workspace, setWorkspace] = useState<Workspace | 'all'>('personal');
  const [notes, setNotes] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setServiceName(initialData.service_name);
        setAccountLabel(initialData.account_label);
        setUsername(initialData.username || '');
        setEmail(initialData.email || '');
        setPassword(initialData.password);
        setWebsiteUrl(initialData.website_url || '');
        setCategory(initialData.category || 'business');
        setWorkspace(initialData.workspace || 'personal');
        setNotes(initialData.notes || '');
      } else if (prefillApp) {
        setServiceName(prefillApp.service_name);
        setAccountLabel('');
        setUsername('');
        setEmail('');
        setPassword('');
        setWebsiteUrl(prefillApp.website_url || '');
        setCategory(prefillApp.category || 'business');
        setWorkspace(prefillApp.workspace || 'personal');
        setNotes('');
      } else {
        setServiceName('');
        setAccountLabel('Primary Account');
        setUsername('');
        setEmail('');
        setPassword('');
        setWebsiteUrl('');
        setCategory('business');
        setWorkspace('personal');
        setNotes('');
      }
      setShowPassword(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialData, prefillApp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!serviceName.trim()) {
      setErrorMsg('Application / Service Name is required (e.g. Facebook, Google, Hostinger).');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }

    onSave({
      service_name: serviceName.trim(),
      account_label: accountLabel.trim() || 'Primary Account',
      username: username.trim(),
      email: email.trim(),
      password: password.trim(),
      website_url: websiteUrl.trim() || undefined,
      category,
      workspace,
      notes: notes.trim(),
    });

    onClose();
  };

  const handleApplyGenerated = (genPass: string) => {
    setPassword(genPass);
    setShowPassword(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-purple-light" />
            <span>{initialData ? 'Update Account Credential' : 'Add New Account Login'}</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-error/15 border border-error/30 text-error rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Application Name & Account Profile Label (Enables Multiple Accounts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-obsidian rounded-xl border border-border">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                Application / Service Name *
              </label>
              <input
                type="text"
                list="common-apps-list"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="e.g. Facebook, Google Workspace, AWS..."
                className="w-full bg-charcoal border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40 font-semibold"
              />
              <datalist id="common-apps-list">
                {COMMON_APPS.map((app) => (
                  <option key={app} value={app} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1 flex items-center justify-between">
                <span>Account Profile / Label *</span>
                <span className="text-emerald-light text-[10px]">Multi-account support</span>
              </label>
              <input
                type="text"
                value={accountLabel}
                onChange={(e) => setAccountLabel(e.target.value)}
                placeholder="e.g. Personal Profile, Hashadz Ads, Slash Core..."
                className="w-full bg-charcoal border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40"
              />
            </div>
          </div>

          {/* Section 2: Login Identifiers (Email, Username, URL) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                Login Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@company.com"
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                Username / Handle / ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. @ashil_dev or account ID"
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40"
              />
            </div>
          </div>

          {/* Section 3: Password with Generator Action */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted">
                Password *
              </label>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="text-[11px] text-purple-light hover:text-purple-lighter flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Strong Password</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-obsidian border border-border px-3 py-2 pr-10 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40 font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Section 4: Website URL, Category & Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                <span>Website URL</span>
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CredentialCategory)}
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40 cursor-pointer capitalize"
              >
                <option value="business">Business</option>
                <option value="social">Social Media</option>
                <option value="devops">Cloud & DevOps</option>
                <option value="finance">Banking & Finance</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </label>
              <select
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value as any)}
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40 cursor-pointer capitalize"
              >
                <option value="hashadz">Hashadz</option>
                <option value="slash">Slash</option>
                <option value="personal">Personal</option>
                <option value="all">Unified (All)</option>
              </select>
            </div>
          </div>

          {/* Section 5: Secure Notes & 2FA Recovery Codes */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Secure Notes (2FA Recovery Codes, PIN, Security Questions)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Backup 2FA code: 8941 2014, Pin: 4920, Security Question: First pet..."
              className="w-full bg-obsidian border border-border p-3 rounded-lg text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-purple/40 resize-none font-mono"
            />
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-xs font-semibold rounded-xl bg-purple hover:bg-purple-light text-white shadow-md shadow-purple/20 transition-all cursor-pointer"
            >
              {initialData ? 'Save Changes' : 'Add Credential'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Embedded Password Generator */}
      <PasswordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onApplyPassword={handleApplyGenerated}
      />
    </>
  );
}
export default CredentialFormModal;
