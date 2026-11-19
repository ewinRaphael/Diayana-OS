// ============================================================
// Diayana OS 'Track balancing' — Core Type Definitions
// ============================================================

export type Workspace = 'hashadz' | 'slash' | 'personal';
export type WorkspaceOrAll = Workspace | 'all';

export type EntryCategory = 'meeting' | 'project' | 'active_log' | 'journal';
export type EntrySource = 'pwa' | 'telegram' | 'phone_call' | 'hermes_api';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

export type FileType = 'photo' | 'document';

export interface Project {
  id: string;
  workspace: 'hashadz' | 'slash';
  name: string;
  client_name: string;
  status: ProjectStatus;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface Entry {
  id: string;
  workspace: Workspace;
  category: EntryCategory;
  project_id: string | null;
  title: string;
  raw_transcript: string;
  structured_content: string;
  audio_url: string | null;
  source: EntrySource;
  entry_date: string; // supports predated and postdated dates (YYYY-MM-DD)
  event_time?: string | null; // e.g. "14:30" or "10:00 AM"
  created_at: string;
}

export interface Task {
  id: string;
  workspace: Workspace;
  project_id: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null; // supports predated and postdated dates
  reminder_at: string | null;
  notification_sent: boolean;
  telegram_reminder?: boolean;
  created_at: string;
}

export interface HabitSubGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface HabitItem {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  longest_streak?: number;
  total_days_completed?: number;
  total_days_missed?: number;
  target_duration_minutes?: number;
  main_goal?: string;
  sub_goals?: HabitSubGoal[];
  frequency?: 'daily' | 'weekdays' | 'weekends' | 'custom';
  custom_days?: string[]; // e.g. ['Mon', 'Wed', 'Fri']
}

export interface ReflectionSubGoal {
  id: string;
  title: string;
  completed: boolean;
}

export interface PersonalDailyMetrics {
  id: string;
  entry_date: string; // auto date picker & timeline tracking
  habits_json: HabitItem[];
  achievements_list: string[];
  time_wasters_list: string[];
  reflection_sub_goals?: ReflectionSubGoal[];
  productivity_score: number;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  workspace: Workspace;
  entry_id: string | null;
  file_type: FileType;
  file_name: string;
  storage_path: string;
  file_size_kb: number;
  caption: string;
  uploaded_at: string;
}

export interface KeepAlive {
  id: number;
  last_pinged_at: string;
  status: string;
}

export interface GeminiResponse {
  workspace: string;
  category: string;
  title: string;
  raw_transcript: string;
  structured_summary: string;
  extracted_tasks: {
    title: string;
    due_date: string;
    priority: string;
    reminder_at: string | null;
  }[];
  extracted_metrics: {
    achievements: string[];
    time_wasters: string[];
  };
}

export interface ConnectedApiItem {
  id: string;
  name: string;
  category: 'database' | 'ai' | 'vps' | 'messaging' | 'network';
  description: string;
  status: 'connected' | 'disconnected' | 'testing';
  lastPing?: string;
  endpoint?: string;
  requiresConfig?: boolean;
}

export interface NexusSettings {
  geminiApiKey: string;
  geminiModel: string;
  customTranscriptionEndpoint: string;
  useCustomTranscription: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  hermesWebhookUrl: string;
  hermesWebhookToken: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  publicTunnelUrl?: string;
  gitBranch?: string;
  appVersion?: string;
  notificationsEnabled: boolean;
  activeIntegrations?: Record<string, boolean>;
}
