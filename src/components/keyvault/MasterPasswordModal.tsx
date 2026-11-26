// ============================================================
// Diayana OS — Master Password Verification & Setup Modal
// Protects Credential Viewing & Decryption
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { Lock, KeyRound, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface MasterPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (passcode: string) => void;
  isChangeMode?: boolean;
  onChangeSuccess?: (oldPass: string, newPass: string) => boolean;
}

export function MasterPasswordModal({
  isOpen,
  onClose,
  onSuccess,
  isChangeMode = false,
  onChangeSuccess,
}: MasterPasswordModalProps) {
  const [passcode, setPasscode] = useState('');
  const [oldPasscode, setOldPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setOldPasscode('');
      setNewPasscode('');
      setConfirmPasscode('');
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passcode.trim()) {
      setErrorMsg('Please enter your Master Password.');
      return;
    }

    try {
      onSuccess(passcode.trim());
      onClose();
    } catch {
      setErrorMsg('Incorrect Master Password. (Default initial PIN is 1234)');
    }
  };

  const handleChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!oldPasscode.trim()) {
      setErrorMsg('Please enter your current Master Password.');
      return;
    }
    if (!newPasscode.trim() || newPasscode.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.');
      return;
    }
    if (newPasscode !== confirmPasscode) {
      setErrorMsg('New passwords do not match. Please verify.');
      return;
    }

    if (onChangeSuccess) {
      const ok = onChangeSuccess(oldPasscode.trim(), newPasscode.trim());
      if (ok) {
        onClose();
      } else {
        setErrorMsg('Current Master Password was incorrect. (Default initial PIN is 1234)');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-light" />
          <span>{isChangeMode ? 'Change Master Vault Password' : 'Unlock Executive KeyVault'}</span>
        </div>
      }
    >
      {!isChangeMode ? (
        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            Your login passwords and secure notes are protected by your Master Vault Password. Enter it below to unlock access for this session.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-error/15 border border-error/30 text-error text-xs rounded-lg animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
              Master Password / Security PIN
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter Master Password..."
                className="w-full bg-obsidian border border-border px-3 py-2.5 pr-10 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-purple/40 font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-text-dim mt-1.5 flex items-center justify-between">
              <span>Default initial PIN is <code className="text-amber-light">1234</code></span>
              <span className="text-emerald-light flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Auto-locks after 5 min
              </span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-amber hover:bg-amber-light text-obsidian font-bold shadow-md shadow-amber/20 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock Vault</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleChangeSubmit} className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed">
            Update the Master Passcode used to reveal and decrypt your credentials.
          </p>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 bg-error/15 border border-error/30 text-error text-xs rounded-lg animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                Current Master Password
              </label>
              <input
                ref={inputRef}
                type="password"
                value={oldPasscode}
                onChange={(e) => setOldPasscode(e.target.value)}
                placeholder="Current password (default 1234)..."
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-purple/40 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                New Master Password
              </label>
              <input
                type="password"
                value={newPasscode}
                onChange={(e) => setNewPasscode(e.target.value)}
                placeholder="Enter new master password..."
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-purple/40 font-mono"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-text-muted block mb-1">
                Confirm New Master Password
              </label>
              <input
                type="password"
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Confirm new password..."
                className="w-full bg-obsidian border border-border px-3 py-2 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-purple/40 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple hover:bg-purple-light text-white shadow-md shadow-purple/20 transition-all cursor-pointer"
            >
              Save New Master Password
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
export default MasterPasswordModal;
