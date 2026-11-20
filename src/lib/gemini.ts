// ============================================================
// NexusOS — Multimodal Gemini AI Ingestion Engine
// Malayalam / English / Manglish Audio & Text Processing
// ============================================================

import { GoogleGenAI } from '@google/genai';
import type { GeminiResponse, NexusSettings } from './types';

const SYSTEM_PROMPT = `You are the NexusOS intelligent ingestion engine for a founder managing two businesses ('hashadz' and 'slash') and a 'personal' life workspace.

The user will provide either an audio recording or text in Malayalam, English, or Manglish (Malayalam written in Latin script, or mixed code-switching).
Your instructions:
1. Transcribe the spoken audio or evaluate the text accurately, recognizing Malayalam nuances, colloquial terms, and English business vocabulary.
2. Determine the most appropriate workspace ('hashadz', 'slash', or 'personal'). If unsure, classify based on business vs. personal tone.
3. Categorize into: 'meeting' (discussions with clients/teams), 'project' (milestone or technical update), 'active_log' (daily operational handling), or 'journal' (personal reflections/notes).
4. Generate a concise title summarizing the core topic.
5. Create a structured_summary with markdown-style bullet points highlighting key decisions, updates, and observations.
6. Extract actionable tasks with due dates (format: YYYY-MM-DD; if relative like 'tomorrow' or 'next Monday', calculate from current date) and priority ('low', 'medium', 'high', 'urgent').
7. If workspace is 'personal', extract any achievements (wins, progress) and time wasters (distractions, delays).

Return ONLY valid JSON matching this exact schema:
{
  "workspace": "hashadz | slash | personal",
  "category": "meeting | project | active_log | journal",
  "title": "Concise summary title",
  "raw_transcript": "Exact transcript of the audio or cleaned text",
  "structured_summary": "Bullet-point structured notes",
  "extracted_tasks": [
    { "title": "Task name", "due_date": "YYYY-MM-DD", "priority": "high|medium|low|urgent", "reminder_at": "ISO_TIMESTAMP or null" }
  ],
  "extracted_metrics": {
    "achievements": ["list of wins if personal"],
    "time_wasters": ["list of distractions if personal"]
  }
}`;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sanitizeResponse(raw: any, fallbackWorkspace = 'personal'): GeminiResponse {
  let ws = (raw.workspace || fallbackWorkspace).toLowerCase();
  if (!['hashadz', 'slash', 'personal'].includes(ws)) {
    ws = fallbackWorkspace;
  }

  let cat = (raw.category || (ws === 'personal' ? 'journal' : 'active_log')).toLowerCase();
  if (!['meeting', 'project', 'active_log', 'journal'].includes(cat)) {
    cat = ws === 'personal' ? 'journal' : 'active_log';
  }

  const tasks = Array.isArray(raw.extracted_tasks)
    ? raw.extracted_tasks.map((t: any) => ({
        title: String(t.title || 'Untitled Task'),
        due_date: String(t.due_date || new Date().toISOString().split('T')[0]),
        priority: ['low', 'medium', 'high', 'urgent'].includes(t.priority?.toLowerCase())
          ? t.priority.toLowerCase()
          : 'medium',
        reminder_at: t.reminder_at || null,
      }))
    : [];

  const achievements = Array.isArray(raw.extracted_metrics?.achievements)
    ? raw.extracted_metrics.achievements.map(String)
    : [];

  const timeWasters = Array.isArray(raw.extracted_metrics?.time_wasters)
    ? raw.extracted_metrics.time_wasters.map(String)
    : [];

  return {
    workspace: ws,
    category: cat,
    title: raw.title || 'Untitled Capture',
    raw_transcript: raw.raw_transcript || '',
    structured_summary: raw.structured_summary || '- Processed voice note',
    extracted_tasks: tasks,
    extracted_metrics: {
      achievements,
      time_wasters: timeWasters,
    },
  };
}

export async function processAudioCapture(
  audioBlob: Blob,
  settings: NexusSettings,
  defaultWorkspace = 'personal'
): Promise<GeminiResponse> {
  // If custom transcription endpoint is enabled and provided
  if (settings.useCustomTranscription && settings.customTranscriptionEndpoint) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'capture.webm');
    formData.append('default_workspace', defaultWorkspace);

    const res = await fetch(settings.customTranscriptionEndpoint, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Custom transcription endpoint returned HTTP ${res.status}`);
    }
    const data = await res.json();
    return sanitizeResponse(data.parsed || data, defaultWorkspace);
  }

  const apiKey = settings.geminiApiKey || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey) {
    return {
      workspace: defaultWorkspace,
      category: defaultWorkspace === 'personal' ? 'journal' : 'active_log',
      title: 'Voice Recording (' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ')',
      raw_transcript: 'Spoken audio captured successfully and stored locally. (Add Gemini API key in Settings for cloud multimodal transcription).',
      structured_summary: '## Operational Voice Entry\n\n- Audio recording captured via Diayana OS PWA Engine\n- Auto-classified under ' + defaultWorkspace.toUpperCase() + ' workspace\n\n### Action Items\n- Configure Gemini API key in Settings for cloud multimodal transcription',
      extracted_tasks: [
        {
          title: 'Review recorded voice log',
          due_date: new Date().toISOString().split('T')[0],
          priority: 'medium',
          reminder_at: null,
        },
      ],
      extracted_metrics: {
        achievements: ['Recorded operational voice entry'],
        time_wasters: [],
      },
    };
  }

  const client = new GoogleGenAI({ apiKey });
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = audioBlob.type || 'audio/webm';
  const modelName = settings.geminiModel || 'gemini-2.5-flash';

  const response = await client.models.generateContent({
    model: modelName,
    contents: [
      SYSTEM_PROMPT,
      `Current date context: ${new Date().toISOString().split('T')[0]}`,
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const parsed = JSON.parse(text);
  return sanitizeResponse(parsed, defaultWorkspace);
}

export async function processTextCapture(
  text: string,
  settings: NexusSettings,
  defaultWorkspace = 'personal'
): Promise<GeminiResponse> {
  const apiKey = settings.geminiApiKey || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey) {
    const cleanTitle = text.trim().slice(0, 45) + (text.trim().length > 45 ? '...' : '');
    const isPersonal = defaultWorkspace === 'personal';
    return {
      workspace: defaultWorkspace,
      category: isPersonal ? 'journal' : 'active_log',
      title: cleanTitle || 'Executive Note',
      raw_transcript: text,
      structured_summary: `## Executive Summary\n\n- ${text.trim()}\n\n*Classified under ${defaultWorkspace.toUpperCase()} timeline.*`,
      extracted_tasks: [
        {
          title: `Action: ${cleanTitle || 'Follow up on note'}`,
          due_date: new Date().toISOString().split('T')[0],
          priority: 'high',
          reminder_at: null,
        },
      ],
      extracted_metrics: {
        achievements: isPersonal ? [cleanTitle] : [],
        time_wasters: [],
      },
    };
  }

  const client = new GoogleGenAI({ apiKey });
  const modelName = settings.geminiModel || 'gemini-2.5-flash';

  const response = await client.models.generateContent({
    model: modelName,
    contents: [
      SYSTEM_PROMPT,
      `Current date context: ${new Date().toISOString().split('T')[0]}`,
      `Input text:\n${text}`,
    ],
    config: {
      responseMimeType: 'application/json',
    },
  });

  const responseText = response.text || '{}';
  const parsed = JSON.parse(responseText);
  return sanitizeResponse(parsed, defaultWorkspace);
}
