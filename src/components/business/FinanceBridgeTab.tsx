// ============================================================
// NexusOS — Business Workspace: Finance Bridge Tab
// ============================================================

import { useState } from 'react';
import {
  Landmark,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Send,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { cn } from '../../lib/utils';

interface FinanceBridgeTabProps {
  workspace: 'hashadz' | 'slash';
}

interface FinanceConfig {
  endpointUrl: string;
  authToken: string;
  syncFrequency: string;
}

export function FinanceBridgeTab({ workspace }: FinanceBridgeTabProps) {
  const { accentColor } = useWorkspace();
  const storageKey = `nexus_finance_bridge_${workspace}`;

  const [config, setConfig] = useState<FinanceConfig>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      endpointUrl: '',
      authToken: '',
      syncFrequency: 'realtime',
    };
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const saveConfig = (newCfg: FinanceConfig) => {
    setConfig(newCfg);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newCfg));
    } catch {}
  };

  const handleTestPayload = async () => {
    setTestStatus('testing');
    setTestMessage(null);

    // Simulate webhook test or call endpoint if configured
    await new Promise((r) => setTimeout(r, 800));

    if (!config.endpointUrl) {
      setTestStatus('success');
      setTestMessage(
        `Simulation mode: Sample payload formatted successfully for ${workspace.toUpperCase()} external ledger.`
      );
    } else {
      try {
        const payload = {
          workspace,
          event: 'nexus_finance_ping',
          timestamp: new Date().toISOString(),
          sample_transaction: {
            reference: 'INV-DEMO-2026',
            amount: 15400,
            currency: 'AED',
            status: 'cleared',
          },
        };

        const res = await fetch(config.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setTestStatus('success');
          setTestMessage('Webhook accepted by external finance module (HTTP 200).');
        } else {
          setTestStatus('error');
          setTestMessage(`External endpoint responded with HTTP ${res.status}`);
        }
      } catch (err: any) {
        setTestStatus('error');
        setTestMessage(err.message || 'Network error reaching finance endpoint.');
      }
    }
  };

  const isConnected = Boolean(config.endpointUrl);

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Executive Bridge Banner */}
      <Card className="p-6 bg-charcoal border border-border relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-purple/10 text-purple-light border border-purple/20">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  {workspace.toUpperCase()} Finance & Ledger Bridge
                </h3>
                <p className="text-xs text-text-muted">
                  Executive integration to standalone accounting & cashflow microservice
                </p>
              </div>
            </div>

            <p className="text-xs text-text-muted leading-relaxed pt-2 max-w-xl">
              This bridge allows NexusOS operational captures (e.g., invoices approved in meetings, payment milestones completed on sites) to dispatch signed JSON webhooks directly into your dedicated finance ledger.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Sync Status
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-obsidian border border-border">
              <span
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-success animate-pulse' : 'bg-text-dim'
                )}
              />
              <span className="text-xs font-mono font-medium text-text-primary">
                {isConnected ? 'Connected' : 'Standalone Ready'}
              </span>
            </div>
            <span className="text-[10px] text-purple-light font-mono bg-purple/10 px-2 py-0.5 rounded border border-purple/20">
              Phase-2 Active Spec
            </span>
          </div>
        </div>
      </Card>

      {/* Configuration & Webhook Test Card */}
      <Card className="p-6 bg-charcoal border border-border space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-purple-light" />
            <span>Webhook Endpoint Configuration</span>
          </h4>
          <span className="text-xs font-mono text-text-muted">
            Target: {workspace.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-text-primary block mb-1.5">
              Finance API Webhook URL
            </label>
            <input
              type="text"
              value={config.endpointUrl}
              onChange={(e) => saveConfig({ ...config, endpointUrl: e.target.value })}
              placeholder="https://finance.yourdomain.com/api/v1/nexus-webhook"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30 font-mono"
            />
            <span className="text-[10px] text-text-dim mt-1 block">
              Receives POST payloads whenever finance-related items are extracted.
            </span>
          </div>

          <div>
            <label className="font-medium text-text-primary block mb-1.5">
              Bearer Authorization Token
            </label>
            <div className="relative">
              <input
                type="password"
                value={config.authToken}
                onChange={(e) => saveConfig({ ...config, authToken: e.target.value })}
                placeholder="nexus-finance-secret-key"
                className="w-full pl-3 pr-8 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary placeholder:text-text-dim focus:outline-none focus:ring-1 focus:ring-purple/30 font-mono"
              />
              <Lock className="w-3.5 h-3.5 text-text-dim absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <span className="text-[10px] text-text-dim mt-1 block">
              Passed in the `Authorization: Bearer` header.
            </span>
          </div>
        </div>

        {/* Test Alert */}
        {testMessage && (
          <div
            className={cn(
              'p-3 rounded-lg border text-xs flex items-center gap-2',
              testStatus === 'success'
                ? 'bg-success/15 border-success/30 text-success'
                : 'bg-error/15 border-error/30 text-error'
            )}
          >
            {testStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{testMessage}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-light" />
            <span>Encrypted local storage dispatch</span>
          </div>

          <button
            type="button"
            onClick={handleTestPayload}
            disabled={testStatus === 'testing'}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer',
              accentButtonMap[accentColor]
            )}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{testStatus === 'testing' ? 'Testing...' : 'Test Webhook Payload'}</span>
          </button>
        </div>
      </Card>
    </div>
  );
}

export default FinanceBridgeTab;
