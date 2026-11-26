// ============================================================
// Diayana OS — Password Generator Modal
// Executive-Grade Entropy & Custom Rule Generator
// ============================================================

import { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { cn } from '../../lib/utils';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPassword?: (password: string) => void;
}

export function PasswordGeneratorModal({
  isOpen,
  onClose,
  onApplyPassword,
}: PasswordGeneratorModalProps) {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    let charset = '';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~|}{[]:;?><,./-=';

    if (!charset) {
      charset = 'abcdefghijklmnopqrstuvwxyz';
      setIncludeLower(true);
    }

    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += charset[array[i] % charset.length];
    }

    setGeneratedPassword(result);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      generate();
    }
  }, [isOpen, length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyPassword && generatedPassword) {
      onApplyPassword(generatedPassword);
    }
    onClose();
  };

  // Calculate password strength
  const calculateStrength = (pwd: string) => {
    if (!pwd) return { label: 'Empty', color: 'text-text-muted', percent: 0 };
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (pwd.length >= 14) score += 25;
    if (pwd.length >= 18) score += 15;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[0-9]/.test(pwd)) score += 10;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 10;

    if (score < 40) return { label: 'Weak', color: 'text-error', percent: 30 };
    if (score < 70) return { label: 'Good', color: 'text-amber-light', percent: 65 };
    if (score < 90) return { label: 'Strong', color: 'text-emerald-light', percent: 85 };
    return { label: 'Military-Grade', color: 'text-purple-light', percent: 100 };
  };

  const strength = calculateStrength(generatedPassword);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-light" />
          <span>Strong Password Generator</span>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Output Box */}
        <div className="p-4 bg-obsidian rounded-xl border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-text-muted">
              Generated Password
            </span>
            <span className={cn('text-[11px] font-mono font-semibold flex items-center gap-1', strength.color)}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{strength.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={generatedPassword}
              className="flex-1 bg-charcoal border border-border/80 px-3 py-2 rounded-lg text-text-primary font-mono text-sm tracking-wider focus:outline-none select-all"
            />
            <button
              type="button"
              onClick={generate}
              title="Regenerate"
              className="p-2.5 rounded-lg bg-charcoal border border-border text-text-muted hover:text-text-primary hover:border-purple/40 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 rounded-lg bg-purple/20 border border-purple/40 text-purple-light hover:bg-purple/30 transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-light" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Strength Bar */}
          <div className="w-full h-1.5 bg-charcoal rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                strength.percent <= 30
                  ? 'bg-error'
                  : strength.percent <= 65
                  ? 'bg-amber'
                  : strength.percent <= 85
                  ? 'bg-emerald'
                  : 'bg-purple'
              )}
              style={{ width: `${strength.percent}%` }}
            />
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="space-y-3 p-4 bg-charcoal rounded-xl border border-border">
          {/* Length Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-text-muted font-medium">Password Length</span>
              <span className="font-mono font-bold text-text-primary bg-obsidian px-2 py-0.5 rounded border border-border">
                {length} chars
              </span>
            </div>
            <input
              type="range"
              min={8}
              max={36}
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value, 10))}
              className="w-full accent-purple cursor-pointer"
            />
          </div>

          {/* Character Options */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary select-none">
              <input
                type="checkbox"
                checked={includeUpper}
                onChange={(e) => setIncludeUpper(e.target.checked)}
                className="rounded border-border bg-obsidian text-purple focus:ring-0"
              />
              <span>Uppercase (A-Z)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary select-none">
              <input
                type="checkbox"
                checked={includeLower}
                onChange={(e) => setIncludeLower(e.target.checked)}
                className="rounded border-border bg-obsidian text-purple focus:ring-0"
              />
              <span>Lowercase (a-z)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary select-none">
              <input
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="rounded border-border bg-obsidian text-purple focus:ring-0"
              />
              <span>Numbers (0-9)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer hover:text-text-primary select-none">
              <input
                type="checkbox"
                checked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                className="rounded border-border bg-obsidian text-purple focus:ring-0"
              />
              <span>Symbols (!@#$%)</span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary cursor-pointer"
          >
            Cancel
          </button>
          {onApplyPassword && (
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-purple hover:bg-purple-light text-white shadow-md shadow-purple/20 transition-all cursor-pointer"
            >
              Apply to Credential
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
export default PasswordGeneratorModal;
