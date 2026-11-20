// ============================================================
// NexusOS — Local IndexedDB Data Store (IDataStore interface + impl)
// ============================================================

import type {
  Entry,
  Task,
  Project,
  PersonalDailyMetrics,
  MediaItem,
  KeepAlive,
  Workspace,
  EntryCategory,
  TaskStatus,
  TaskPriority,
} from './types';
import { generateSeedData } from './seedData';

// ---------------------------------------------------------------------------
// IDataStore — abstract interface consumed by all hooks
// ---------------------------------------------------------------------------

export interface EntryFilter {
  workspace?: Workspace;
  category?: EntryCategory;
  date?: string;
  search?: string;
}

export interface TaskFilter {
  workspace?: Workspace;
  status?: TaskStatus;
  priority?: TaskPriority;
  date?: string;
}

export interface ProjectFilter {
  workspace?: 'hashadz' | 'slash';
}

export interface MediaFilter {
  workspace?: Workspace;
  file_type?: 'photo' | 'document';
}

export interface IDataStore {
  // Entries
  getEntries(filter?: EntryFilter): Promise<Entry[]>;
  createEntry(entry: Omit<Entry, 'id' | 'created_at'>): Promise<Entry>;
  updateEntry(id: string, updates: Partial<Entry>): Promise<Entry>;
  deleteEntry(id: string): Promise<void>;

  // Tasks
  getTasks(filter?: TaskFilter): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'created_at' | 'notification_sent'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Projects
  getProjects(filter?: ProjectFilter): Promise<Project[]>;
  createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Metrics
  getMetrics(date: string): Promise<PersonalDailyMetrics | null>;
  getMetricsRange(startDate: string, endDate: string): Promise<PersonalDailyMetrics[]>;
  upsertMetrics(metrics: Omit<PersonalDailyMetrics, 'id' | 'updated_at'>): Promise<PersonalDailyMetrics>;

  // Media
  getMedia(filter?: MediaFilter): Promise<MediaItem[]>;
  createMedia(media: Omit<MediaItem, 'id' | 'uploaded_at'>): Promise<MediaItem>;
  deleteMedia(id: string): Promise<void>;

  // Keep Alive
  getKeepAlive(): Promise<KeepAlive | null>;
  pingKeepAlive(): Promise<KeepAlive>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// IndexedDB-backed implementation
// ---------------------------------------------------------------------------

const DB_NAME = 'nexus_os';
const DB_VERSION = 1;

const STORES = {
  entries: 'entries',
  tasks: 'tasks',
  projects: 'projects',
  metrics: 'metrics',
  media: 'media',
} as const;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.entries)) {
        const store = db.createObjectStore(STORES.entries, { keyPath: 'id' });
        store.createIndex('workspace', 'workspace', { unique: false });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('entry_date', 'entry_date', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.tasks)) {
        const store = db.createObjectStore(STORES.tasks, { keyPath: 'id' });
        store.createIndex('workspace', 'workspace', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.projects)) {
        const store = db.createObjectStore(STORES.projects, { keyPath: 'id' });
        store.createIndex('workspace', 'workspace', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.metrics)) {
        const store = db.createObjectStore(STORES.metrics, { keyPath: 'id' });
        store.createIndex('entry_date', 'entry_date', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.media)) {
        const store = db.createObjectStore(STORES.media, { keyPath: 'id' });
        store.createIndex('workspace', 'workspace', { unique: false });
        store.createIndex('file_type', 'file_type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txGet<T>(db: IDBDatabase, storeName: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function txPut<T>(db: IDBDatabase, storeName: string, value: T): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(value);
    req.onerror = () => reject(req.error);
  });
}

function txGetByKey<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function txGetByIndex<T>(db: IDBDatabase, storeName: string, indexName: string, value: IDBValidKey): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const req = index.getAll(value);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function txDelete(db: IDBDatabase, storeName: string, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

class LocalStore implements IDataStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (!this.db) {
      this.db = await openDB();
      try {
        const [entries, projects, tasks, metrics, media] = await Promise.all([
          txGet<Entry>(this.db, STORES.entries),
          txGet<Project>(this.db, STORES.projects),
          txGet<Task>(this.db, STORES.tasks),
          txGet<PersonalDailyMetrics>(this.db, STORES.metrics),
          txGet<MediaItem>(this.db, STORES.media),
        ]);

        const seed = generateSeedData();

        if (!projects || projects.length === 0) {
          for (const p of seed.projects) await txPut(this.db, STORES.projects, p);
        }
        if (!entries || entries.length === 0) {
          for (const e of seed.entries) await txPut(this.db, STORES.entries, e);
        }
        if (!tasks || tasks.length === 0) {
          for (const t of seed.tasks) await txPut(this.db, STORES.tasks, t);
        }
        if (!metrics || metrics.length === 0) {
          for (const m of seed.metrics) await txPut(this.db, STORES.metrics, m);
        }
        if (!media || media.length === 0) {
          for (const med of seed.media) await txPut(this.db, STORES.media, med);
        }
      } catch (err) {
        console.warn('IndexedDB seed verification warning:', err);
      }
    }
  }

  private getDB(): IDBDatabase {
    if (!this.db) throw new Error('LocalStore not initialized. Call init() first.');
    return this.db;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ---- Entries ----

  async getEntries(filter?: EntryFilter): Promise<Entry[]> {
    const db = this.getDB();
    let results: Entry[];

    if (filter?.workspace) {
      results = await txGetByIndex<Entry>(db, STORES.entries, 'workspace', filter.workspace);
    } else {
      results = await txGet<Entry>(db, STORES.entries);
    }

    if (filter?.category) {
      results = results.filter((e) => e.category === filter.category);
    }
    if (filter?.date) {
      results = results.filter((e) => e.entry_date === filter.date);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.raw_transcript.toLowerCase().includes(q) ||
          e.structured_content.toLowerCase().includes(q),
      );
    }

    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createEntry(entry: Omit<Entry, 'id' | 'created_at'>): Promise<Entry> {
    const db = this.getDB();
    const full: Entry = {
      ...entry,
      id: generateId(),
      created_at: isoNow(),
    };
    return txPut<Entry>(db, STORES.entries, full);
  }

  async updateEntry(id: string, updates: Partial<Entry>): Promise<Entry> {
    const db = this.getDB();
    const existing = await txGetByKey<Entry>(db, STORES.entries, id);
    if (!existing) throw new Error(`Entry ${id} not found`);
    const updated: Entry = { ...existing, ...updates, id };
    return txPut<Entry>(db, STORES.entries, updated);
  }

  async deleteEntry(id: string): Promise<void> {
    return txDelete(this.getDB(), STORES.entries, id);
  }

  // ---- Tasks ----

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const db = this.getDB();
    let results: Task[];

    if (filter?.workspace) {
      results = await txGetByIndex<Task>(db, STORES.tasks, 'workspace', filter.workspace);
    } else {
      results = await txGet<Task>(db, STORES.tasks);
    }

    if (filter?.status) {
      results = results.filter((t) => t.status === filter.status);
    }
    if (filter?.priority) {
      results = results.filter((t) => t.priority === filter.priority);
    }
    if (filter?.date) {
      results = results.filter((t) => t.due_date === filter.date);
    }

    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createTask(task: Omit<Task, 'id' | 'created_at' | 'notification_sent'>): Promise<Task> {
    const db = this.getDB();
    const full: Task = {
      ...task,
      id: generateId(),
      notification_sent: false,
      created_at: isoNow(),
    };
    return txPut<Task>(db, STORES.tasks, full);
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const db = this.getDB();
    const existing = await txGetByKey<Task>(db, STORES.tasks, id);
    if (!existing) throw new Error(`Task ${id} not found`);
    const updated: Task = { ...existing, ...updates, id };
    return txPut<Task>(db, STORES.tasks, updated);
  }

  async deleteTask(id: string): Promise<void> {
    return txDelete(this.getDB(), STORES.tasks, id);
  }

  // ---- Projects ----

  async getProjects(filter?: ProjectFilter): Promise<Project[]> {
    const db = this.getDB();
    let results: Project[];

    if (filter?.workspace) {
      results = await txGetByIndex<Project>(db, STORES.projects, 'workspace', filter.workspace);
    } else {
      results = await txGet<Project>(db, STORES.projects);
    }

    return results.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const db = this.getDB();
    const full: Project = {
      ...project,
      id: generateId(),
      created_at: isoNow(),
    };
    return txPut<Project>(db, STORES.projects, full);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const db = this.getDB();
    const existing = await txGetByKey<Project>(db, STORES.projects, id);
    if (!existing) throw new Error(`Project ${id} not found`);
    const updated: Project = { ...existing, ...updates, id };
    return txPut<Project>(db, STORES.projects, updated);
  }

  async deleteProject(id: string): Promise<void> {
    return txDelete(this.getDB(), STORES.projects, id);
  }

  // ---- Metrics ----

  async getMetrics(date: string): Promise<PersonalDailyMetrics | null> {
    const db = this.getDB();
    const all = await txGet<PersonalDailyMetrics>(db, STORES.metrics);
    return all.find((m) => m.entry_date === date) ?? null;
  }

  async getMetricsRange(startDate: string, endDate: string): Promise<PersonalDailyMetrics[]> {
    const db = this.getDB();
    const all = await txGet<PersonalDailyMetrics>(db, STORES.metrics);
    return all
      .filter((m) => m.entry_date >= startDate && m.entry_date <= endDate)
      .sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  }

  async upsertMetrics(
    metrics: Omit<PersonalDailyMetrics, 'id' | 'updated_at'>,
  ): Promise<PersonalDailyMetrics> {
    const db = this.getDB();
    const existing = await this.getMetrics(metrics.entry_date);
    const full: PersonalDailyMetrics = {
      id: existing?.id ?? generateId(),
      ...metrics,
      updated_at: isoNow(),
    };
    return txPut<PersonalDailyMetrics>(db, STORES.metrics, full);
  }

  // ---- Media ----

  async getMedia(filter?: MediaFilter): Promise<MediaItem[]> {
    const db = this.getDB();
    let results: MediaItem[];

    if (filter?.workspace) {
      results = await txGetByIndex<MediaItem>(db, STORES.media, 'workspace', filter.workspace);
    } else {
      results = await txGet<MediaItem>(db, STORES.media);
    }

    if (filter?.file_type) {
      results = results.filter((m) => m.file_type === filter.file_type);
    }

    return results.sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  }

  async createMedia(media: Omit<MediaItem, 'id' | 'uploaded_at'>): Promise<MediaItem> {
    const db = this.getDB();
    const full: MediaItem = {
      ...media,
      id: generateId(),
      uploaded_at: isoNow(),
    };
    return txPut<MediaItem>(db, STORES.media, full);
  }

  async deleteMedia(id: string): Promise<void> {
    return txDelete(this.getDB(), STORES.media, id);
  }

  // ---- Keep Alive ----

  async getKeepAlive(): Promise<KeepAlive | null> {
    try {
      const raw = localStorage.getItem('nexus_keep_alive');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { id: 1, last_pinged_at: isoNow(), status: 'active' };
  }

  async pingKeepAlive(): Promise<KeepAlive> {
    const item: KeepAlive = { id: 1, last_pinged_at: isoNow(), status: 'active' };
    try {
      localStorage.setItem('nexus_keep_alive', JSON.stringify(item));
    } catch {}
    return item;
  }
}

// ---------------------------------------------------------------------------
// database.ts equivalent — singleton accessor
// ---------------------------------------------------------------------------

let _storeInstance: LocalStore | null = null;

export async function getStore(): Promise<IDataStore> {
  if (!_storeInstance) {
    _storeInstance = new LocalStore();
    await _storeInstance.init();
  }
  return _storeInstance;
}

export function resetStore(): void {
  if (_storeInstance) {
    _storeInstance.close();
    _storeInstance = null;
  }
}

export { todayDate };
