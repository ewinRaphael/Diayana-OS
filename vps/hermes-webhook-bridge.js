// ============================================================
// NexusOS — Hermes Webhook Bridge (Node.js / Express)
// ============================================================
// Deploy on Hostinger VPS alongside keep-alive-cron.sh
// Install: npm install express cors helmet dotenv @google/genai @supabase/supabase-js
// Run: node hermes-webhook-bridge.js
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '25mb' }));

const PORT = process.env.PORT || 3300;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const HERMES_WEBHOOK_TOKEN = process.env.HERMES_WEBHOOK_TOKEN || 'nexus-secret-token';

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const SYSTEM_PROMPT = `You are the NexusOS ingestion engine for a founder managing two businesses ('hashadz' and 'slash') and a 'personal' life workspace.
Transcribe the input (which may contain Malayalam, English, or Manglish) accurately and extract structured JSON matching this exact schema:
{
  "workspace": "hashadz | slash | personal",
  "category": "meeting | project | active_log | journal",
  "title": "Concise summary title",
  "raw_transcript": "Exact transcript of the audio or text",
  "structured_summary": "Bullet-point structured notes",
  "extracted_tasks": [
    { "title": "Task name", "due_date": "YYYY-MM-DD", "priority": "high|medium|low", "reminder_at": "ISO_TIMESTAMP or null" }
  ],
  "extracted_metrics": {
    "achievements": ["list of wins if personal"],
    "time_wasters": ["list of distractions if personal"]
  }
}`;

function validateToken(req, res, next) {
  const token = req.headers['x-hermes-token'];
  if (token !== HERMES_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Invalid Hermes webhook token' });
  }
  next();
}

async function persistToSupabase(parsed, source, audioUrl = null) {
  let workspace = (parsed.workspace || 'personal').toLowerCase();
  if (!['hashadz', 'slash', 'personal'].includes(workspace)) workspace = 'personal';

  let category = (parsed.category || 'active_log').toLowerCase();
  if (!['meeting', 'project', 'active_log', 'journal'].includes(category)) {
    category = workspace === 'personal' ? 'journal' : 'active_log';
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Insert entry
  const { data: entryData, error: entryError } = await supabase.table('entries').insert({
    workspace,
    category,
    title: parsed.title || 'Untitled Capture',
    raw_transcript: parsed.raw_transcript || '',
    structured_content: parsed.structured_summary || '',
    audio_url: audioUrl,
    source,
    entry_date: today,
  }).select();

  if (entryError) console.error('Entry insert error:', entryError);

  // 2. Insert tasks
  let tasksCreated = 0;
  for (const t of (parsed.extracted_tasks || [])) {
    if (t.title) {
      const priority = ['low', 'medium', 'high', 'urgent'].includes(t.priority) ? t.priority : 'medium';
      await supabase.table('tasks').insert({
        workspace,
        title: t.title,
        priority,
        due_date: t.due_date || today,
        reminder_at: t.reminder_at || null,
      });
      tasksCreated++;
    }
  }

  // 3. Update personal metrics
  const metrics = parsed.extracted_metrics || {};
  const achievements = metrics.achievements || [];
  const timeWasters = metrics.time_wasters || [];

  if (workspace === 'personal' && (achievements.length || timeWasters.length)) {
    const { data: existing } = await supabase
      .from('personal_daily_metrics')
      .select('*')
      .eq('entry_date', today);

    if (existing && existing.length > 0) {
      const row = existing[0];
      const updatedAch = [...(row.achievements_list || []), ...achievements];
      const updatedTw = [...(row.time_wasters_list || []), ...timeWasters];
      const score = Math.max(0, Math.min(100, 50 + updatedAch.length * 15 - updatedTw.length * 10));

      await supabase.from('personal_daily_metrics').update({
        achievements_list: updatedAch,
        time_wasters_list: updatedTw,
        productivity_score: score,
      }).eq('id', row.id);
    } else {
      const score = Math.max(0, Math.min(100, 50 + achievements.length * 15 - timeWasters.length * 10));
      await supabase.from('personal_daily_metrics').insert({
        entry_date: today,
        achievements_list: achievements,
        time_wasters_list: timeWasters,
        productivity_score: score,
      });
    }
  }

  return { entry: entryData, tasks_created: tasksCreated, parsed };
}

// Text ingestion endpoint
app.post('/webhooks/nexus-text', validateToken, async (req, res) => {
  try {
    const { text, source = 'telegram', default_workspace } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text field' });

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [SYSTEM_PROMPT, `Input text: ${text}`],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text);
    if (['hashadz', 'slash', 'personal'].includes(default_workspace)) {
      parsed.workspace = default_workspace;
    }

    const result = await persistToSupabase(parsed, source);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Text ingestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Audio ingestion endpoint (expects base64 audio in body)
app.post('/webhooks/nexus-audio', validateToken, async (req, res) => {
  try {
    const { audio_base64, mime_type = 'audio/ogg', source = 'telegram' } = req.body;
    if (!audio_base64) return res.status(400).json({ error: 'Missing audio_base64 field' });

    const response = await genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        SYSTEM_PROMPT,
        { inlineData: { data: audio_base64, mimeType: mime_type } },
      ],
      config: { responseMimeType: 'application/json' },
    });

    const parsed = JSON.parse(response.text);
    const result = await persistToSupabase(parsed, source);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Audio ingestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'NexusOS Hermes Bridge', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[NexusOS Hermes Bridge] Running on port ${PORT}`);
});
