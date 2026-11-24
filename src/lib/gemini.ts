// ============================================================
// Diayana OS 'Track balancing' — Multimodal Gemini AI Ingestion Engine
// Malayalam / English / Manglish Audio & Text Processing
// With Resilient Free In-Browser Speech Fallback & Clean Executive Extraction
// ============================================================

import { GoogleGenAI } from '@google/genai';
import type { GeminiResponse, NexusSettings } from './types';

const SYSTEM_PROMPT = `You are the Diayana OS executive ingestion engine for a founder managing two businesses ('hashadz' and 'slash') and a 'personal' life workspace.

The user provides audio or text in Malayalam, English, or Manglish.
Your instructions:
1. Transcribe the audio or evaluate the text accurately, recognizing Malayalam colloquialisms and business English.
2. Determine the most appropriate workspace ('hashadz', 'slash', or 'personal').
3. Categorize into: 'meeting' (client/team discussions, appointments), 'project' (milestones), 'active_log' (daily operational tasks), or 'journal' (personal reflections).
4. Generate a concise title summarizing the core topic.
5. Create a structured_summary with clean markdown-style bullet points highlighting key decisions and action steps. Do not include any error notices, system disclaimers, or API warning notes.
6. Extract actionable tasks with due dates (YYYY-MM-DD; compute relative dates from context) and priority ('low', 'medium', 'high', 'urgent').
7. If workspace is 'personal', extract achievements and time wasters.

Return ONLY valid JSON matching this schema:
{
  "workspace": "hashadz | slash | personal",
  "category": "meeting | project | active_log | journal",
  "title": "Concise summary title",
  "raw_transcript": "Exact transcript of what was spoken or written",
  "structured_summary": "Bullet-point structured notes without any error disclaimers",
  "extracted_tasks": [
    { "title": "Task name", "due_date": "YYYY-MM-DD", "priority": "high|medium|low|urgent", "reminder_at": "ISO_TIMESTAMP or null" }
  ],
  "extracted_metrics": {
    "achievements": [],
    "time_wasters": []
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

/**
 * Smart Natural Language Date & Time parser for local extraction
 */
function parseDateAndDetails(text: string): {
  dueDate: string;
  eventTime: string | null;
  category: 'meeting' | 'project' | 'active_log' | 'journal';
  cleanTitle: string;
} {
  const now = new Date();
  let dueDate = now.toISOString().split('T')[0];
  let eventTime: string | null = null;

  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // Check for "23 nov", "23rd november", "nov 23"
  const dayMonthMatch = text.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i);
  const monthDayMatch = text.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i);

  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthKey = dayMonthMatch[2].toLowerCase();
    const month = months[monthKey];
    if (month !== undefined) {
      const target = new Date(now.getFullYear(), month, day);
      if (target < now && (now.getMonth() - month > 6)) {
        target.setFullYear(target.getFullYear() + 1);
      }
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');
      dueDate = `${y}-${m}-${d}`;
    }
  } else if (monthDayMatch) {
    const monthKey = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const month = months[monthKey];
    if (month !== undefined) {
      const target = new Date(now.getFullYear(), month, day);
      if (target < now && (now.getMonth() - month > 6)) {
        target.setFullYear(target.getFullYear() + 1);
      }
      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');
      dueDate = `${y}-${m}-${d}`;
    }
  } else if (/\btomorrow\b/i.test(text)) {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    dueDate = target.toISOString().split('T')[0];
  }

  // Parse time: "3 PM", "3:30 PM", "15:00"
  const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const ampm = timeMatch[3].toLowerCase();
    if (ampm === 'pm' && hour < 12) hour += 12;
    if (ampm === 'am' && hour === 12) hour = 0;
    eventTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  // Determine category
  const isMeeting = /\b(meet|meeting|call|client|discussion|zoom|schedule|appointment)\b/i.test(text);
  const isProject = /\b(milestone|sprint|architecture|release|blueprint|inspection|subcontractor)\b/i.test(text);
  const category = isMeeting ? 'meeting' : isProject ? 'project' : 'active_log';

  // Generate clean title
  let cleanTitle = text.trim();
  if (isMeeting) {
    const withMatch = text.match(/\b(?:meet|meeting|call)\s+(?:with\s+)?([A-Za-z0-9\s\-]+?)(?:\s+by|\s+on|\s+at|\s+for|$)/i);
    const forMatch = text.match(/\bfor\s+([A-Za-z0-9\s\-]+?)(?:\s+by|\s+on|\s+at|$)/i);
    const party = withMatch ? withMatch[1].trim() : 'Discussion';
    const topic = forMatch ? ` — ${forMatch[1].trim()}` : '';
    cleanTitle = `Meeting with ${party}${topic}`;
  } else {
    cleanTitle = cleanTitle.slice(0, 50) + (cleanTitle.length > 50 ? '...' : '');
  }

  return { dueDate, eventTime, category, cleanTitle };
}

export function extractOfflineStructuredData(
  text: string,
  defaultWorkspace = 'personal'
): GeminiResponse {
  const { dueDate, eventTime, category, cleanTitle } = parseDateAndDetails(text);
  const effectiveCategory = defaultWorkspace === 'personal' ? 'journal' : category;

  // Format clean structured summary without any error notices
  let structuredSummary = '';
  if (effectiveCategory === 'meeting') {
    structuredSummary = `## Executive Meeting Agenda\n\n- **Subject**: ${cleanTitle}\n- **Scheduled Date**: ${dueDate}${eventTime ? ` at ${eventTime}` : ''}\n- **Context**: ${text.trim()}\n- **Action Required**: Attend and follow up on key deliverables`;
  } else {
    structuredSummary = `## Operational Log\n\n- ${text.trim()}\n- **Timeline Target**: ${dueDate}${eventTime ? ` at ${eventTime}` : ''}\n- **Status**: Captured and logged to ${defaultWorkspace.toUpperCase()} timeline`;
  }

  // Extract actionable task
  const taskTitle = effectiveCategory === 'meeting'
    ? `${cleanTitle}${eventTime ? ` (${eventTime})` : ''}`
    : cleanTitle;

  const tasks = [
    {
      title: taskTitle,
      due_date: dueDate,
      priority: 'high',
      reminder_at: eventTime ? `${dueDate}T${eventTime}:00` : null,
    },
  ];

  return {
    workspace: defaultWorkspace,
    category: effectiveCategory,
    title: cleanTitle,
    raw_transcript: text.trim(),
    structured_summary: structuredSummary,
    extracted_tasks: tasks,
    extracted_metrics: {
      achievements: defaultWorkspace === 'personal' ? [cleanTitle] : [],
      time_wasters: [],
    },
  };
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

  // Strip any accidental error notes if present in raw
  let cleanSummary = String(raw.structured_summary || '- Processed note');
  cleanSummary = cleanSummary.replace(/>\s*⚠️\s*\*Note:.*?\*/gi, '').trim();

  return {
    workspace: ws,
    category: cat,
    title: raw.title || 'Executive Entry',
    raw_transcript: raw.raw_transcript || '',
    structured_summary: cleanSummary,
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
  defaultWorkspace = 'personal',
  spokenTranscript?: string
): Promise<GeminiResponse> {
  // If in-browser speech recognition or user transcript is available and Gemini has no key
  const apiKey = settings.geminiApiKey || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';

  // If custom endpoint is enabled
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

  // If no Gemini key or spoken transcript was already transcribed by Web Speech API
  if (!apiKey) {
    if (spokenTranscript && spokenTranscript.trim()) {
      return extractOfflineStructuredData(spokenTranscript, defaultWorkspace);
    }
    return extractOfflineStructuredData('Spoken audio recorded via microphone', defaultWorkspace);
  }

  try {
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
  } catch (err: any) {
    console.warn('[Gemini] Cloud processing failed. Falling back to clean local extractor:', err);
    const textToUse = spokenTranscript && spokenTranscript.trim()
      ? spokenTranscript
      : 'Voice note recorded on ' + new Date().toLocaleDateString();
    return extractOfflineStructuredData(textToUse, defaultWorkspace);
  }
}

export async function processTextCapture(
  text: string,
  settings: NexusSettings,
  defaultWorkspace = 'personal'
): Promise<GeminiResponse> {
  const apiKey = settings.geminiApiKey || (import.meta.env?.VITE_GEMINI_API_KEY as string) || '';
  if (!apiKey) {
    return extractOfflineStructuredData(text, defaultWorkspace);
  }

  try {
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
  } catch (err: any) {
    console.warn('[Gemini] Cloud processing failed. Falling back to clean local extractor:', err);
    return extractOfflineStructuredData(text, defaultWorkspace);
  }
}
