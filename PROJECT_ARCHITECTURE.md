# Diayana OS 'Track balancing' — System Architecture & Specification

## 1. Executive Overview

**Diayana OS 'Track balancing'** is an executive-grade Progressive Web Application (PWA) designed as an AI-powered personal diary, multi-business operational hub (`Hashadz` and `Slash`), voice-to-structured-data workspace with multilingual Malayalam / English / Manglish support, dual-calendar task manager, habit consistency tracker, and encrypted media/document vault.

The architecture emphasizes:
- **Track Balancing Intelligence**: Continuous equilibrium scoring between corporate enterprise operations (`Hashadz`, `Slash`) and personal health/spiritual reflections.
- **Offline-First Resilience**: Full IndexedDB/localStorage fallback pre-populated with realistic multi-workspace seed data. Operates 100% out of the box without initial API keys.
- **Live Supabase PostgreSQL Integration**: Direct connection to Supabase project (`vudbwbqctvbfoqnvidfr.supabase.co`) with SSR utilities, keep-alive heartbeat daemon, and full table CRUD.
- **Free Public IP Tunneling**: Zero-cost remote tunnel access via reverse proxy (`npm run tunnel` / localtunnel), auto-reconnecting for instant mobile and external access.
- **Multimodal AI Ingestion**: In-browser voice capture (live waveform, audio playback, file upload, text) processed via Google Gemini (`gemini-2.5-flash`) with structured JSON schema auto-distribution across entries, tasks, and daily reflections.
- **Strict Workspace Separation**: Global context switcher (`Unified`, `Hashadz`, `Slash`, `Personal`) with dynamic accent shifting.
- **Hostinger VPS Bridge**: Webhook bridge connecting Telegram bots and phone recordings via Gemini to Supabase.

---

## 2. Directory Structure

```text
├── PROJECT_ARCHITECTURE.md         # Full system documentation
├── index.html                      # PWA root with dark theme & fonts
├── vite.config.ts                  # Vite + React + Tailwind v4
├── supabase/
│   └── migrations/
│       └── 001_nexusos_schema.sql  # 6 tables, storage & realtime publication
├── vps/
│   ├── keep-alive-cron.sh          # Supabase keep-alive cron script
│   ├── hermes-webhook-bridge.js    # Node/Express webhook bridge
│   └── hermes_nexus_bridge.py      # Python FastAPI bridge
├── public/
│   ├── manifest.json               # PWA web manifest
│   ├── sw.js                       # Service Worker (offline cache & notifications)
│   └── icons/                      # PWA launcher icons
└── src/
    ├── index.css                   # Dark Minimal Executive theme variables
    ├── main.tsx                    # React root + SW registration
    ├── App.tsx                     # Main application container
    ├── lib/
    │   ├── types.ts                # TypeScript domain models
    │   ├── utils.ts                # Tailwind merge and utility helpers
    │   ├── seedData.ts             # Realistic multi-workspace seed dataset
    │   ├── localStore.ts           # IndexedDB offline store implementation
    │   ├── supabaseStore.ts        # Live Supabase store implementation
    │   ├── supabase.ts             # Dynamic Supabase client factory
    │   ├── database.ts             # Unified store dispatcher (Supabase / Local)
    │   ├── gemini.ts               # Gemini 2.5 multimodal audio/text ingestion
    │   └── notifications.ts        # Web notification scheduler
    ├── contexts/
    │   ├── WorkspaceContext.tsx    # Active workspace state & accent management
    │   └── DatabaseContext.tsx     # Unified data layer provider
    ├── hooks/
    │   ├── useSettings.ts          # Settings and runtime credentials
    │   ├── useEntries.ts           # Journal, meeting, and log CRUD
    │   ├── useTasks.ts             # Task and to-do operations
    │   ├── useProjects.ts          # Business project tracking
    │   ├── useMetrics.ts           # Habits, achievements, and time wasters
    │   └── useMediaVault.ts        # Photo and document vault management
    ├── components/
    │   ├── ui/                     # Button, Card, Badge, Modal, Tabs, etc.
    │   ├── layout/                 # Sidebar, TopBar, MobileNav, AppShell
    │   ├── workspace/              # Segmented pill WorkspaceSwitcher
    │   ├── capture/                # AudioRecorder, CaptureModal, FloatingCaptureButton
    │   ├── business/               # MeetingsTab, ProjectsTab, ActiveLogsTab, FinanceBridgeTab
    │   ├── personal/               # JournalStream, HabitTracker, ReflectionIndex (SVG chart)
    │   ├── calendar/               # NotesCalendar, TaskCalendar, DaySnapshot drawer
    │   ├── vault/                  # PhotoTimeline, DocumentRepo, UploadModal
    │   └── settings/               # Settings modals for AI, Supabase, VPS, Notifications
    └── pages/
        ├── DashboardPage.tsx       # Executive Bento overview
        ├── BusinessWorkspace.tsx   # Hashadz & Slash multi-tab hub
        ├── PersonalWorkspace.tsx   # Personal habits & reflection hub
        ├── CalendarPage.tsx        # Dual calendar ecosystem
        ├── VaultPage.tsx           # Media and document vault
        └── SettingsPage.tsx        # Integrations and settings
```

---

## 3. Data Architecture & Schema

### PostgreSQL / Supabase Schema (001_nexusos_schema.sql)

1. **`projects`**: High-level ventures for `hashadz` and `slash`.
   - `id UUID`, `workspace TEXT`, `name TEXT`, `client_name TEXT`, `status TEXT`, `metadata_json JSONB`, `created_at TIMESTAMPTZ`
2. **`entries`**: Core log stream for meetings, projects, active operational logs, and personal journals.
   - `id UUID`, `workspace TEXT`, `category TEXT`, `project_id UUID REFERENCES projects(id)`, `title TEXT`, `raw_transcript TEXT`, `structured_content TEXT`, `audio_url TEXT`, `source TEXT`, `entry_date DATE`, `created_at TIMESTAMPTZ`
3. **`tasks`**: Actionable to-dos with deadlines and reminders.
   - `id UUID`, `workspace TEXT`, `project_id UUID REFERENCES projects(id)`, `title TEXT`, `status TEXT`, `priority TEXT`, `due_date DATE`, `reminder_at TIMESTAMPTZ`, `notification_sent BOOLEAN`, `created_at TIMESTAMPTZ`
4. **`personal_daily_metrics`**: Daily reflection index and habit tracking.
   - `id UUID`, `entry_date DATE UNIQUE`, `habits_json JSONB`, `achievements_list JSONB`, `time_wasters_list JSONB`, `productivity_score INT`, `updated_at TIMESTAMPTZ`
5. **`media_vault`**: Uploaded photos and company documentation.
   - `id UUID`, `workspace TEXT`, `entry_id UUID REFERENCES entries(id)`, `file_type TEXT`, `file_name TEXT`, `storage_path TEXT`, `file_size_kb INT`, `caption TEXT`, `uploaded_at TIMESTAMPTZ`
6. **`_keep_alive`**: Free-tier persistence heartbeat.
   - `id INT PRIMARY KEY DEFAULT 1`, `last_pinged_at TIMESTAMPTZ`, `status TEXT`

---

## 4. Multimodal AI Voice & Structured Ingestion Engine

### Ingestion Flow
1. Audio recorded directly via browser `MediaRecorder` (Opus / WebM) or uploaded (.mp3, .wav, .m4a, .webm).
2. Audio converted to base64 `inlineData` and sent to `gemini-2.5-flash` using `@google/genai`.
3. Model instructed with specialized Malayalam, English, and Manglish context rules and strict JSON schema enforcement (`responseMimeType: "application/json"`).
4. Auto-Distribution:
   - Saves structured entry into `entries`.
   - Automatically breaks down and inserts all detected tasks into `tasks`.
   - If `workspace === 'personal'`, appends accomplishments to `achievements_list` and distractions to `time_wasters_list`, recalculating daily productivity score.

---

## 5. Dual-Calendar Architecture

- **Calendar 1: Activity Timeline & Historical Snapshot**:
  - Highlights all recorded entries, meetings, operational logs, and media by workspace dot indicators.
  - Clicking any date summons the **Day Snapshot Drawer**, consolidating everything recorded on that day.
- **Calendar 2: Task & To-Do Action Calendar**:
  - Focuses strictly on deliverables, status workflows (`todo` $\rightarrow$ `in_progress` $\rightarrow$ `done`), priorities, and reminder alarms.

---

## 6. Progressive Web App (PWA) & Offline Strategy

- Manifest configured with Obsidian `#090A0F` background, standalone display mode, and custom icons.
- Service Worker caches shell assets for offline availability and handles background notification triggers for approaching task reminders.
- Dynamic credential fallback: Seamless switch between local IndexedDB and live Supabase instance with zero data loss or page reloads.
