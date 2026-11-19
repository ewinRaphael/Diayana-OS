-- ============================================================
-- NexusOS — Supabase PostgreSQL Schema
-- Migration: 001_nexusos_schema.sql
-- ============================================================

-- 1. Projects Table (For Hashadz & Slash)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace TEXT NOT NULL CHECK (workspace IN ('hashadz', 'slash')),
  name TEXT NOT NULL,
  client_name TEXT,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Planning', 'Active', 'On Hold', 'Completed')),
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Main Entries Table (Meetings, Project Logs, Active Handling Logs, Personal Journal)
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace TEXT NOT NULL CHECK (workspace IN ('hashadz', 'slash', 'personal')),
  category TEXT NOT NULL CHECK (category IN ('meeting', 'project', 'active_log', 'journal')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  raw_transcript TEXT,
  structured_content TEXT,
  audio_url TEXT,
  source TEXT DEFAULT 'pwa' CHECK (source IN ('pwa', 'telegram', 'phone_call', 'hermes_api')),
  entry_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tasks & To-Do Calendar Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace TEXT NOT NULL CHECK (workspace IN ('hashadz', 'slash', 'personal')),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  reminder_at TIMESTAMPTZ,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Personal Daily Metrics (Habits, Achievements, Time Wasters)
CREATE TABLE IF NOT EXISTS personal_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  habits_json JSONB DEFAULT '[]'::jsonb,
  achievements_list JSONB DEFAULT '[]'::jsonb,
  time_wasters_list JSONB DEFAULT '[]'::jsonb,
  productivity_score INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Media & Document Vault Table
CREATE TABLE IF NOT EXISTS media_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace TEXT NOT NULL CHECK (workspace IN ('hashadz', 'slash', 'personal')),
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('photo', 'document')),
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_kb INT,
  caption TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Supabase Free-Tier Keep-Alive Table
CREATE TABLE IF NOT EXISTS _keep_alive (
  id INT PRIMARY KEY DEFAULT 1,
  last_pinged_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

INSERT INTO _keep_alive (id, status) VALUES (1, 'active') ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entries_workspace ON entries(workspace);
CREATE INDEX IF NOT EXISTS idx_entries_category ON entries(category);
CREATE INDEX IF NOT EXISTS idx_entries_entry_date ON entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_media_vault_workspace ON media_vault(workspace);
CREATE INDEX IF NOT EXISTS idx_media_vault_file_type ON media_vault(file_type);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace);

-- ============================================================
-- Supabase Storage bucket for media vault
-- ============================================================
-- Run via Supabase Dashboard or SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('nexus-vault', 'nexus-vault', true);

-- ============================================================
-- Enable Realtime for entries and tasks
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE entries;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
