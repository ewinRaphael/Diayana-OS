// ============================================================
// NexusOS — Settings, Hermes Agent Webhook & Reminders Page
// ============================================================

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Database,
  Server,
  Bell,
  CheckCircle2,
  Send,
  Lock,
  KeyRound,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useSettings } from '../hooks/useSettings';
import { useDatabase } from '../contexts/DatabaseContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import {
  requestNotificationPermission,
  sendLocalNotification,
  checkAndTriggerReminders,
} from '../lib/notifications';
import { getSupabaseClient } from '../lib/supabase';
import type { KeepAlive } from '../lib/types';
import { cn } from '../lib/utils';

export function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const { store } = useDatabase();
  const { accentColor } = useWorkspace();

  // Local draft states
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey || '');
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel || 'gemini-2.5-flash');
  const [useCustomTranscription, setUseCustomTranscription] = useState(
    settings.useCustomTranscription || false
  );
  const [customTranscriptionEndpoint, setCustomTranscriptionEndpoint] = useState(
    settings.customTranscriptionEndpoint || ''
  );
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey || '');
  const [hermesWebhookUrl, setHermesWebhookUrl] = useState(settings.hermesWebhookUrl || '');
  const [hermesWebhookToken, setHermesWebhookToken] = useState(
    settings.hermesWebhookToken || 'nexus-secret-token'
  );

  // Status message states
  const [supabaseTestStatus, setSupabaseTestStatus] = useState<string | null>(null);
  const [keepAliveData, setKeepAliveData] = useState<KeepAlive | null>(null);
  const [isPingingKeepAlive, setIsPingingKeepAlive] = useState(false);
  const [hermesTestStatus, setHermesTestStatus] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    // Fetch current keep-alive state
    if (store) {
      store.getKeepAlive().then(setKeepAliveData).catch(console.error);
    }
  }, [store]);

  const handleSaveAll = () => {
    updateSettings({
      geminiApiKey: geminiApiKey.trim(),
      geminiModel,
      useCustomTranscription,
      customTranscriptionEndpoint: customTranscriptionEndpoint.trim(),
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      hermesWebhookUrl: hermesWebhookUrl.trim(),
      hermesWebhookToken: hermesWebhookToken.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // 1. Test Supabase Connection
  const handleTestSupabase = async () => {
    setSupabaseTestStatus('Testing Supabase query against _keep_alive table...');
    try {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('Supabase URL or Key missing in configuration.');
      }
      const { data, error } = await client
        .from('_keep_alive')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      setSupabaseTestStatus(
        `✓ Connection Success! Database status: '${data?.status || 'active'}'. Table reachable.`
      );
    } catch (err: any) {
      setSupabaseTestStatus(`✗ Connection Failed: ${err.message || 'Check URL/Key or RLS'}`);
    }
  };

  // 2. Trigger Immediate Keep-Alive Ping
  const handleTriggerKeepAlive = async () => {
    if (!store) return;
    setIsPingingKeepAlive(true);
    try {
      const updated = await store.pingKeepAlive();
      setKeepAliveData(updated);
      setSupabaseTestStatus(`✓ Keep-Alive heartbeat recorded at ${new Date(updated.last_pinged_at).toLocaleString()}`);
    } catch (err: any) {
      setSupabaseTestStatus(`✗ Keep-Alive Ping Failed: ${err.message}`);
    } finally {
      setIsPingingKeepAlive(false);
    }
  };

  // 3. Test Hermes Webhook
  const handleTestHermes = async () => {
    setHermesTestStatus('Pinging Hermes Agent Webhook...');
    if (!hermesWebhookUrl) {
      setHermesTestStatus('✗ Please enter a Hostinger VPS Hermes Webhook URL first.');
      return;
    }

    try {
      const res = await fetch(hermesWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hermes-token': hermesWebhookToken,
        },
        body: JSON.stringify({
          text: 'Ping test from NexusOS Settings integration panel.',
          source: 'hermes_api',
        }),
      });

      if (res.ok) {
        setHermesTestStatus('✓ Hermes Webhook accepted test dispatch successfully (HTTP 200).');
      } else {
        setHermesTestStatus(`✗ Hermes Webhook returned HTTP ${res.status}. Check token or server.`);
      }
    } catch (err: any) {
      setHermesTestStatus(`✗ Hermes Connection Error: ${err.message}`);
    }
  };

  // 4. Request Notifications
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendLocalNotification('NexusOS Reminders Enabled', {
        body: 'Scheduled task deadlines and founder alerts are now active.',
      });
      if (store) {
        await checkAndTriggerReminders(store);
      }
    }
  };

  const accentButtonMap: Record<string, string> = {
    purple: 'bg-purple hover:bg-purple-light text-white',
    indigo: 'bg-indigo hover:bg-indigo-light text-white',
    emerald: 'bg-emerald hover:bg-emerald-light text-white',
    amber: 'bg-amber hover:bg-amber-light text-white',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-4 bg-charcoal rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple/15 text-purple-light">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">
              NexusOS Configuration Hub
            </h2>
            <p className="text-xs text-text-muted">
              Credentials, multimodal AI ingestion, and Hostinger VPS bridges
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className={cn(
            'flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer',
            accentButtonMap[accentColor]
          )}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-success/15 border border-success/30 text-success rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings successfully persisted to local executive profile.</span>
        </div>
      )}

      {/* 1. Gemini AI Multimodal Settings */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-light" />
            <h3 className="text-sm font-semibold text-text-primary">
              Google Gemini Multimodal AI Settings
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-light bg-purple/10 px-2 py-0.5 rounded border border-purple/20">
            Malayalam / English / Manglish
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-text-primary block mb-1">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-8 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
              />
              <KeyRound className="w-3.5 h-3.5 text-text-dim absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
            <span className="text-[10px] text-text-dim mt-1 block">
              Used for multimodal voice transcription and structured JSON extraction.
            </span>
          </div>

          <div>
            <label className="font-medium text-text-primary block mb-1">
              Gemini Model
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30 cursor-pointer"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended, Fast & Multilingual)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
            </select>
          </div>
        </div>

        {/* Custom Transcription Endpoint Toggle */}
        <div className="pt-3 border-t border-border space-y-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-primary">
            <input
              type="checkbox"
              checked={useCustomTranscription}
              onChange={(e) => setUseCustomTranscription(e.target.checked)}
              className="w-4 h-4 rounded bg-obsidian border-border text-purple focus:ring-0 cursor-pointer"
            />
            <span>Use Custom Malayalam-English Speech-to-Text Endpoint</span>
          </label>

          {useCustomTranscription && (
            <div className="animate-fade-in">
              <input
                type="text"
                value={customTranscriptionEndpoint}
                onChange={(e) => setCustomTranscriptionEndpoint(e.target.value)}
                placeholder="https://stt.yourdomain.com/v1/transcribe"
                className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
              />
              <span className="text-[10px] text-text-dim mt-1 block">
                Forward audio binary directly to your custom STT server.
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* 2. Supabase Persistence & Keep-Alive */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-light" />
            <h3 className="text-sm font-semibold text-text-primary">
              Supabase Cloud Database & Storage
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-light bg-emerald/10 px-2 py-0.5 rounded border border-emerald/20">
            Free-Tier Keep-Alive
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-text-primary block mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>

          <div>
            <label className="font-medium text-text-primary block mb-1">
              Supabase Anon / Public Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-3 pr-8 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
              />
              <Lock className="w-3.5 h-3.5 text-text-dim absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Keep-Alive Status Display */}
        {keepAliveData && (
          <div className="p-3 bg-obsidian rounded-xl border border-border flex items-center justify-between text-xs font-mono">
            <span className="text-text-muted">Last Heartbeat Ping:</span>
            <span className="text-text-primary font-semibold">
              {new Date(keepAliveData.last_pinged_at).toLocaleString()}
            </span>
          </div>
        )}

        {supabaseTestStatus && (
          <div
            className={cn(
              'p-3 rounded-lg text-xs font-mono border',
              supabaseTestStatus.startsWith('✓')
                ? 'bg-success/15 border-success/30 text-success'
                : 'bg-error/15 border-error/30 text-error'
            )}
          >
            {supabaseTestStatus}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleTestSupabase}
            className="px-4 py-2 bg-obsidian border border-border hover:border-border-light rounded-lg text-xs font-medium text-text-primary transition-all cursor-pointer"
          >
            Test Connection
          </button>

          <button
            type="button"
            onClick={handleTriggerKeepAlive}
            disabled={isPingingKeepAlive}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald/20 hover:bg-emerald/30 text-emerald-light rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isPingingKeepAlive && 'animate-spin')} />
            <span>Trigger Keep-Alive Ping</span>
          </button>
        </div>
      </Card>

      {/* 3. Hostinger VPS Hermes Agent Webhook */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-light" />
            <h3 className="text-sm font-semibold text-text-primary">
              Hostinger VPS Hermes Webhook Bridge
            </h3>
          </div>
          <span className="text-[10px] font-mono text-indigo-light bg-indigo/10 px-2 py-0.5 rounded border border-indigo/20">
            Telegram & Phone Call-In
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-medium text-text-primary block mb-1">
              Hermes Webhook Endpoint URL
            </label>
            <input
              type="text"
              value={hermesWebhookUrl}
              onChange={(e) => setHermesWebhookUrl(e.target.value)}
              placeholder="https://vps.yourdomain.com:3300/webhooks/nexus-text"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>

          <div>
            <label className="font-medium text-text-primary block mb-1">
              Auth Token (`x-hermes-token`)
            </label>
            <input
              type="password"
              value={hermesWebhookToken}
              onChange={(e) => setHermesWebhookToken(e.target.value)}
              placeholder="nexus-secret-token"
              className="w-full px-3 py-2 bg-obsidian border border-border rounded-lg text-xs text-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-purple/30"
            />
          </div>
        </div>

        {hermesTestStatus && (
          <div
            className={cn(
              'p-3 rounded-lg text-xs font-mono border',
              hermesTestStatus.startsWith('✓')
                ? 'bg-success/15 border-success/30 text-success'
                : 'bg-error/15 border-error/30 text-error'
            )}
          >
            {hermesTestStatus}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestHermes}
            className="flex items-center gap-1.5 px-4 py-2 bg-obsidian border border-border hover:border-indigo text-text-primary rounded-lg text-xs font-medium transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Test Hermes Webhook Ping</span>
          </button>
        </div>
      </Card>

      {/* 4. PWA Push Notifications & Task Reminders */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-light" />
            <h3 className="text-sm font-semibold text-text-primary">
              PWA Push Notifications & Scheduled Task Reminders
            </h3>
          </div>
          <span className="text-[10px] font-mono text-amber-light bg-amber/10 px-2 py-0.5 rounded border border-amber/20">
            Permission: {notificationPermission.toUpperCase()}
          </span>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          Enable background notifications to receive real-time alerts when your scheduled tasks, client follow-ups, and calendar reminders reach their trigger time.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-amber/20 hover:bg-amber/30 text-amber-light rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Request Browser Notification Permission</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sendLocalNotification('NexusOS Test Alert', {
                body: 'Push notification engine is operational and verified.',
              });
            }}
            className="px-4 py-2 bg-obsidian border border-border hover:border-border-light text-text-primary rounded-lg text-xs font-medium cursor-pointer"
          >
            Send Test Notification
          </button>
        </div>
      </Card>
    </div>
  );
}

export default SettingsPage;
