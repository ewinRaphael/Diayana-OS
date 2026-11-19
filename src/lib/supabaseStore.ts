// ============================================================
// NexusOS — Supabase Live Data Store (IDataStore implementation)
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Entry,
  Task,
  Project,
  PersonalDailyMetrics,
  MediaItem,
  KeepAlive,
} from './types';
import type {
  IDataStore,
  EntryFilter,
  TaskFilter,
  ProjectFilter,
  MediaFilter,
} from './localStore';

export class SupabaseStore implements IDataStore {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  // ---- Entries ----

  async getEntries(filter?: EntryFilter): Promise<Entry[]> {
    let query = this.client.from('entries').select('*');

    if (filter?.workspace) {
      query = query.eq('workspace', filter.workspace);
    }
    if (filter?.category) {
      query = query.eq('category', filter.category);
    }
    if (filter?.date) {
      query = query.eq('entry_date', filter.date);
    }
    if (filter?.search) {
      query = query.or(
        `title.ilike.%${filter.search}%,raw_transcript.ilike.%${filter.search}%,structured_content.ilike.%${filter.search}%`
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('[SupabaseStore] getEntries error:', error);
      return [];
    }
    return (data || []) as Entry[];
  }

  async createEntry(entry: Omit<Entry, 'id' | 'created_at'>): Promise<Entry> {
    const { data, error } = await this.client
      .from('entries')
      .insert(entry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create entry: ${error.message}`);
    }
    return data as Entry;
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
    const { data, error } = await this.client
      .from('entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update entry: ${error.message}`);
    }
    return data as Entry;
  }

  async deleteEntry(id: string): Promise<void> {
    const { error } = await this.client.from('entries').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete entry: ${error.message}`);
    }
  }

  // ---- Tasks ----

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    let query = this.client.from('tasks').select('*');

    if (filter?.workspace) {
      query = query.eq('workspace', filter.workspace);
    }
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.priority) {
      query = query.eq('priority', filter.priority);
    }
    if (filter?.date) {
      query = query.eq('due_date', filter.date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('[SupabaseStore] getTasks error:', error);
      return [];
    }
    return (data || []) as Task[];
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'notification_sent'>): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .insert({ ...task, notification_sent: false })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }
    return data as Task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }
    return data as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.client.from('tasks').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  // ---- Projects ----

  async getProjects(filter?: ProjectFilter): Promise<Project[]> {
    let query = this.client.from('projects').select('*');

    if (filter?.workspace) {
      query = query.eq('workspace', filter.workspace);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.error('[SupabaseStore] getProjects error:', error);
      return [];
    }
    return (data || []) as Project[];
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await this.client
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
    return data as Project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await this.client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
    return data as Project;
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.client.from('projects').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  // ---- Metrics ----

  async getMetrics(date: string): Promise<PersonalDailyMetrics | null> {
    const { data, error } = await this.client
      .from('personal_daily_metrics')
      .select('*')
      .eq('entry_date', date)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseStore] getMetrics error:', error);
      return null;
    }
    return data as PersonalDailyMetrics | null;
  }

  async getMetricsRange(startDate: string, endDate: string): Promise<PersonalDailyMetrics[]> {
    const { data, error } = await this.client
      .from('personal_daily_metrics')
      .select('*')
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true });

    if (error) {
      console.error('[SupabaseStore] getMetricsRange error:', error);
      return [];
    }
    return (data || []) as PersonalDailyMetrics[];
  }

  async upsertMetrics(
    metrics: Omit<PersonalDailyMetrics, 'id' | 'updated_at'>
  ): Promise<PersonalDailyMetrics> {
    const { data, error } = await this.client
      .from('personal_daily_metrics')
      .upsert(
        {
          entry_date: metrics.entry_date,
          habits_json: metrics.habits_json,
          achievements_list: metrics.achievements_list,
          time_wasters_list: metrics.time_wasters_list,
          productivity_score: metrics.productivity_score,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'entry_date' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert metrics: ${error.message}`);
    }
    return data as PersonalDailyMetrics;
  }

  // ---- Media ----

  async getMedia(filter?: MediaFilter): Promise<MediaItem[]> {
    let query = this.client.from('media_vault').select('*');

    if (filter?.workspace) {
      query = query.eq('workspace', filter.workspace);
    }
    if (filter?.file_type) {
      query = query.eq('file_type', filter.file_type);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });
    if (error) {
      console.error('[SupabaseStore] getMedia error:', error);
      return [];
    }
    return (data || []) as MediaItem[];
  }

  async createMedia(media: Omit<MediaItem, 'id' | 'uploaded_at'>): Promise<MediaItem> {
    const { data, error } = await this.client
      .from('media_vault')
      .insert(media)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create media item: ${error.message}`);
    }
    return data as MediaItem;
  }

  async deleteMedia(id: string): Promise<void> {
    const { error } = await this.client.from('media_vault').delete().eq('id', id);
    if (error) {
      throw new Error(`Failed to delete media item: ${error.message}`);
    }
  }

  // ---- Keep Alive ----

  async getKeepAlive(): Promise<KeepAlive | null> {
    const { data, error } = await this.client
      .from('_keep_alive')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('[SupabaseStore] getKeepAlive error:', error);
      return null;
    }
    return data as KeepAlive | null;
  }

  async pingKeepAlive(): Promise<KeepAlive> {
    const { data, error } = await this.client
      .from('_keep_alive')
      .upsert(
        { id: 1, last_pinged_at: new Date().toISOString(), status: 'active' },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Keep-alive ping failed: ${error.message}`);
    }
    return data as KeepAlive;
  }
}
