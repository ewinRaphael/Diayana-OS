// ============================================================
// NexusOS — Realistic Seed Data Factory
// ============================================================

import type {
  Project,
  Entry,
  Task,
  PersonalDailyMetrics,
  HabitItem,
  MediaItem,
} from './types';

export function generateId(): string {
  return crypto.randomUUID();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function isoNow(): string {
  return new Date().toISOString();
}

function isoAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ── Projects ──────────────────────────────────────────────────

function createSeedProjects(): Project[] {
  return [
    {
      id: generateId(),
      workspace: 'hashadz',
      name: 'Al-Noor Tower Fit-Out',
      client_name: 'Al-Noor Properties LLC',
      status: 'Active',
      metadata_json: { floors: 12, budget_aed: 4500000, location: 'Business Bay' },
      created_at: isoAgo(45),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      name: 'Marina Walk Retail',
      client_name: 'Marina Developments',
      status: 'Planning',
      metadata_json: { units: 6, budget_aed: 1800000, location: 'Dubai Marina' },
      created_at: isoAgo(20),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      name: 'Palm View Interiors',
      client_name: 'Rashid Al Maktoum Group',
      status: 'Active',
      metadata_json: { villas: 3, budget_aed: 7200000, location: 'Palm Jumeirah' },
      created_at: isoAgo(60),
    },
    {
      id: generateId(),
      workspace: 'slash',
      name: 'Slash App V2 Redesign',
      client_name: 'Slash (Internal)',
      status: 'Active',
      metadata_json: { sprint: 4, stack: 'React Native + Supabase', team_size: 5 },
      created_at: isoAgo(30),
    },
    {
      id: generateId(),
      workspace: 'slash',
      name: 'E-Commerce Platform',
      client_name: 'BuyLocal MENA',
      status: 'Planning',
      metadata_json: { mvp_deadline: daysFromNow(45), stack: 'Next.js + Stripe', team_size: 3 },
      created_at: isoAgo(10),
    },
  ];
}

// ── Entries ───────────────────────────────────────────────────

function createSeedEntries(projects: Project[]): Entry[] {
  const alnoor = projects[0];
  const marina = projects[1];
  const palmView = projects[2];
  const slashApp = projects[3];
  const ecommerce = projects[4];

  return [
    {
      id: generateId(),
      workspace: 'hashadz',
      category: 'meeting',
      project_id: alnoor.id,
      title: 'Al-Noor Tower — Contractor Meeting with Rashid',
      raw_transcript:
        'Rashid-nod paranjathu floor 7-nte tiles complete aayittilla, delivery delay aanu. Next week Monday-kku ethum ennanu paranjathu. Budget-il extra 15,000 AED venam tile upgrade-nu. Client-nu Italian marble venam ennanu paranjathu.',
      structured_content:
        '## Meeting Notes — Al-Noor Tower\n\n- **Floor 7 tiles**: Not yet complete — delivery delayed\n- **Expected delivery**: Next Monday\n- **Budget impact**: +15,000 AED for tile upgrade\n- **Client preference**: Italian marble finish\n- **Action**: Confirm marble sample with client by Thursday',
      audio_url: null,
      source: 'pwa',
      entry_date: daysAgo(1),
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      category: 'active_log',
      project_id: palmView.id,
      title: 'Palm View — Site Visit Notes',
      raw_transcript:
        'Villa 2-nte living room false ceiling design client approve cheythu. Electrician-odu paranjathu LED strip lighting install cheyanam. Villa 3-nte kitchen cabinets measure cheythu, 2 weeks-il ready aakum.',
      structured_content:
        '## Site Visit — Palm View Interiors\n\n- **Villa 2**: Living room false ceiling design approved by client\n- **LED Strips**: Electrician confirmed for installation\n- **Villa 3**: Kitchen cabinet measurements done — ETA 2 weeks\n- **Pending**: Bathroom tile selection for Villa 1',
      audio_url: null,
      source: 'phone_call',
      entry_date: daysAgo(2),
      created_at: isoAgo(2),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      category: 'project',
      project_id: marina.id,
      title: 'Marina Walk — Initial Scope Discussion',
      raw_transcript:
        'Marina Walk retail space 6 units aanu. Each unit 800 sqft average. Client budget 300K per unit. Modern minimalist design venam. Glass frontage mandatory aanu. DEWA connection next month ready aakum.',
      structured_content:
        '## Project Scope — Marina Walk Retail\n\n- **Units**: 6 retail spaces, ~800 sqft each\n- **Budget**: 300,000 AED per unit\n- **Design style**: Modern minimalist\n- **Glass frontage**: Mandatory requirement\n- **DEWA connection**: Expected next month\n- **Next step**: Create mood boards for client review',
      audio_url: null,
      source: 'telegram',
      entry_date: daysAgo(3),
      created_at: isoAgo(3),
    },
    {
      id: generateId(),
      workspace: 'slash',
      category: 'meeting',
      project_id: slashApp.id,
      title: 'Sprint 4 Planning — Slash App V2',
      raw_transcript:
        'Auth flow complete aayittundu. Push notifications work cheyyunnu. This sprint chat module start cheyanam. Ashil design review cheyanam Wednesday-kku. Backend pagination add cheyanam API-yil.',
      structured_content:
        '## Sprint 4 Planning — Slash App V2\n\n- ✅ Auth flow — completed\n- ✅ Push notifications — working\n- 🔲 Chat module — starting this sprint\n- 🔲 Design review — Ashil to complete by Wednesday\n- 🔲 Backend pagination — API updates needed',
      audio_url: null,
      source: 'pwa',
      entry_date: daysAgo(1),
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'slash',
      category: 'active_log',
      project_id: ecommerce.id,
      title: 'E-Commerce Platform — Tech Stack Evaluation',
      raw_transcript:
        'Next.js 15 use cheyyam, app router stable aanu. Stripe integration direct aanu. Supabase for auth and DB. Vercel-il deploy cheyyam. Image CDN-nu Cloudflare R2 use cheyyam.',
      structured_content:
        '## Tech Stack Decision — E-Commerce\n\n- **Framework**: Next.js 15 (App Router)\n- **Payments**: Stripe (direct integration)\n- **Backend**: Supabase (Auth + DB)\n- **Hosting**: Vercel\n- **Image CDN**: Cloudflare R2\n- **Decision**: Approved — start scaffolding next week',
      audio_url: null,
      source: 'pwa',
      entry_date: daysAgo(4),
      created_at: isoAgo(4),
    },
    {
      id: generateId(),
      workspace: 'personal',
      category: 'journal',
      project_id: null,
      title: 'Weekly Reflection — Alhamdulillah',
      raw_transcript:
        'Ee week productive aayirunnu. 3 client meetings complete cheythu. Exercise 5 days cheythu. Reading habit improve cheythu, 30 pages daily average. Social media time kuranjthu. Ummaye call cheythu, kushtaayirunnu.',
      structured_content:
        '## Weekly Reflection\n\n### Wins 🏆\n- 3 client meetings completed successfully\n- Exercised 5 out of 7 days\n- Reading: 30 pages daily average\n- Social media usage reduced\n\n### Gratitude 🤲\n- Alhamdulillah for productive week\n- Called Umma — felt good\n\n### Next Week Focus\n- Maintain exercise streak\n- Start Quran memorization routine\n- Complete Marina Walk mood boards',
      audio_url: null,
      source: 'pwa',
      entry_date: daysAgo(0),
      created_at: isoNow(),
    },
    {
      id: generateId(),
      workspace: 'personal',
      category: 'journal',
      project_id: null,
      title: 'Morning Thoughts — Dua & Goals',
      raw_transcript:
        'Innu subah prayer time-nu ezhunnetthu. Day plan set cheythu. Priority: Al-Noor tile issue resolve cheyanam. Slash sprint tasks assign cheyanam. Evening gym pokanam.',
      structured_content:
        '## Morning Entry\n\n- ✅ Fajr prayer on time\n- **Day priorities**:\n  1. Resolve Al-Noor tile delivery issue\n  2. Assign Slash sprint tasks\n  3. Evening gym session\n- **Dua**: Ya Allah, bless this day with barakah',
      audio_url: null,
      source: 'pwa',
      entry_date: daysAgo(5),
      created_at: isoAgo(5),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      category: 'meeting',
      project_id: alnoor.id,
      title: 'Al-Noor — Client Review Call',
      raw_transcript:
        'Client happy aanu overall progress-il. Lighting design presentation next week venam. Lobby area design 2 options prepare cheyanam. Parking area signage discuss cheyanam building management-odu.',
      structured_content:
        '## Client Review — Al-Noor Tower\n\n- **Client mood**: Satisfied with overall progress\n- **Lighting design**: Presentation due next week\n- **Lobby**: Prepare 2 design options\n- **Parking signage**: Discuss with building management\n- **Follow-up**: Schedule onsite walkthrough',
      audio_url: null,
      source: 'phone_call',
      entry_date: daysAgo(6),
      created_at: isoAgo(6),
    },
  ];
}

// ── Tasks ─────────────────────────────────────────────────────

function createSeedTasks(projects: Project[]): Task[] {
  const alnoor = projects[0];
  const marina = projects[1];
  const palmView = projects[2];
  const slashApp = projects[3];
  const ecommerce = projects[4];

  return [
    {
      id: generateId(),
      workspace: 'hashadz',
      project_id: alnoor.id,
      title: 'Confirm Italian marble sample with Al-Noor client',
      status: 'todo',
      priority: 'high',
      due_date: daysFromNow(2),
      reminder_at: daysFromNow(1) + 'T09:00:00Z',
      notification_sent: false,
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      project_id: alnoor.id,
      title: 'Follow up on Floor 7 tile delivery',
      status: 'in_progress',
      priority: 'urgent',
      due_date: daysFromNow(0),
      reminder_at: null,
      notification_sent: false,
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      project_id: palmView.id,
      title: 'Order LED strip lighting for Villa 2',
      status: 'todo',
      priority: 'medium',
      due_date: daysFromNow(5),
      reminder_at: daysFromNow(4) + 'T10:00:00Z',
      notification_sent: false,
      created_at: isoAgo(2),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      project_id: marina.id,
      title: 'Create mood boards for Marina Walk retail units',
      status: 'todo',
      priority: 'high',
      due_date: daysFromNow(7),
      reminder_at: daysFromNow(5) + 'T09:00:00Z',
      notification_sent: false,
      created_at: isoAgo(3),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      project_id: palmView.id,
      title: 'Select bathroom tiles for Villa 1',
      status: 'done',
      priority: 'medium',
      due_date: daysAgo(1),
      reminder_at: null,
      notification_sent: true,
      created_at: isoAgo(5),
    },
    {
      id: generateId(),
      workspace: 'slash',
      project_id: slashApp.id,
      title: 'Complete chat module UI implementation',
      status: 'in_progress',
      priority: 'high',
      due_date: daysFromNow(4),
      reminder_at: daysFromNow(3) + 'T14:00:00Z',
      notification_sent: false,
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'slash',
      project_id: slashApp.id,
      title: 'Add backend API pagination',
      status: 'todo',
      priority: 'medium',
      due_date: daysFromNow(6),
      reminder_at: null,
      notification_sent: false,
      created_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'slash',
      project_id: ecommerce.id,
      title: 'Scaffold Next.js 15 project for E-Commerce',
      status: 'todo',
      priority: 'low',
      due_date: daysFromNow(10),
      reminder_at: null,
      notification_sent: false,
      created_at: isoAgo(4),
    },
    {
      id: generateId(),
      workspace: 'personal',
      project_id: null,
      title: 'Call Umma this weekend',
      status: 'done',
      priority: 'high',
      due_date: daysAgo(2),
      reminder_at: null,
      notification_sent: true,
      created_at: isoAgo(4),
    },
    {
      id: generateId(),
      workspace: 'personal',
      project_id: null,
      title: 'Start Quran memorization — Surah Al-Mulk',
      status: 'in_progress',
      priority: 'high',
      due_date: daysFromNow(14),
      reminder_at: daysFromNow(0) + 'T05:30:00Z',
      notification_sent: false,
      created_at: isoAgo(3),
    },
  ];
}

// ── Personal Daily Metrics ────────────────────────────────────

function createSeedMetrics(): PersonalDailyMetrics[] {
  const habitNames = [
    'Morning Prayer (Fajr)',
    'Exercise',
    'Reading (30 pages)',
    'Water 3L',
    'No Social Media before 12pm',
  ];

  const achievementsPool = [
    'Completed Al-Noor client presentation',
    'Fixed critical bug in Slash app auth flow',
    'Read 45 pages of "Deep Work"',
    'Morning run — 5km in 28 minutes',
    'Closed Marina Walk initial scope',
    'Shipped push notification feature',
    'Negotiated 10% discount on marble order',
    'Finished Sprint 3 retrospective document',
    'Called 3 potential clients for new leads',
    'Completed Villa 2 false ceiling design',
    'Set up CI/CD pipeline for E-Commerce project',
    'Had productive 1-on-1 with team lead',
    'Organized workspace and filing system',
    'Helped junior dev with React state issue',
  ];

  const timeWastersPool = [
    'Instagram reels — 45 min',
    'YouTube rabbit hole — 1 hour',
    'Twitter scrolling during lunch — 30 min',
    'Unnecessary meeting that could have been an email',
    'Overthinking tile color decisions — 40 min',
    'Reddit browsing before sleep — 20 min',
    'WhatsApp group chat distractions — multiple times',
    'Netflix after dinner — watched 2 episodes instead of 1',
    'Procrastinated on mood board task',
    'Spent too long on email formatting',
  ];

  const metrics: PersonalDailyMetrics[] = [];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = daysAgo(dayOffset);
    const score = Math.floor(Math.random() * 51) + 40; // 40-90

    const habits: HabitItem[] = habitNames.map((name) => {
      const isDone = Math.random() > (dayOffset < 3 ? 0.25 : 0.4);
      return {
        id: generateId(),
        name,
        completed: isDone,
        streak: Math.max(1, 7 - dayOffset),
        longest_streak: 15,
        total_days_completed: 18 - dayOffset,
        total_days_missed: dayOffset > 4 ? 2 : 1,
        target_duration_minutes: name.includes('Reading') ? 30 : name.includes('Exercise') ? 45 : 15,
        main_goal: `Consistent daily focus on ${name}`,
        sub_goals: [
          { id: generateId(), title: 'Phase 1: Morning execution', completed: true },
          { id: generateId(), title: 'Phase 2: Evening review & signoff', completed: isDone },
        ],
        frequency: 'daily',
      };
    });

    // Pick 2-3 random achievements
    const achieveCount = 2 + Math.floor(Math.random() * 2);
    const shuffledAch = [...achievementsPool].sort(() => Math.random() - 0.5);
    const achievements = shuffledAch.slice(0, achieveCount);

    // Pick 1-2 random time wasters
    const twCount = 1 + Math.floor(Math.random() * 2);
    const shuffledTw = [...timeWastersPool].sort(() => Math.random() - 0.5);
    const timeWasters = shuffledTw.slice(0, twCount);

    metrics.push({
      id: generateId(),
      entry_date: date,
      habits_json: habits,
      achievements_list: achievements,
      time_wasters_list: timeWasters,
      productivity_score: score,
      updated_at: isoAgo(dayOffset),
    });
  }

  return metrics;
}

// ── Media Items ───────────────────────────────────────────────

function createSeedMedia(_projects: Project[], entries: Entry[]): MediaItem[] {
  return [
    {
      id: generateId(),
      workspace: 'hashadz',
      entry_id: entries[0]?.id ?? null,
      file_type: 'photo',
      file_name: 'alnoor_floor7_tiles.jpg',
      storage_path: '/media/hashadz/alnoor_floor7_tiles.jpg',
      file_size_kb: 2340,
      caption: 'Al-Noor Tower Floor 7 — tile layout progress',
      uploaded_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      entry_id: entries[1]?.id ?? null,
      file_type: 'photo',
      file_name: 'palmview_villa2_ceiling.jpg',
      storage_path: '/media/hashadz/palmview_villa2_ceiling.jpg',
      file_size_kb: 3120,
      caption: 'Palm View Villa 2 — false ceiling approved design',
      uploaded_at: isoAgo(2),
    },
    {
      id: generateId(),
      workspace: 'slash',
      entry_id: entries[3]?.id ?? null,
      file_type: 'photo',
      file_name: 'slash_v2_chat_mockup.png',
      storage_path: '/media/slash/slash_v2_chat_mockup.png',
      file_size_kb: 890,
      caption: 'Slash App V2 — chat module UI mockup',
      uploaded_at: isoAgo(1),
    },
    {
      id: generateId(),
      workspace: 'hashadz',
      entry_id: null,
      file_type: 'document',
      file_name: 'marina_walk_scope_v1.pdf',
      storage_path: '/media/hashadz/marina_walk_scope_v1.pdf',
      file_size_kb: 4500,
      caption: 'Marina Walk Retail — project scope document v1',
      uploaded_at: isoAgo(3),
    },
    {
      id: generateId(),
      workspace: 'slash',
      entry_id: null,
      file_type: 'document',
      file_name: 'ecommerce_tech_spec.pdf',
      storage_path: '/media/slash/ecommerce_tech_spec.pdf',
      file_size_kb: 1850,
      caption: 'E-Commerce Platform — technical specification',
      uploaded_at: isoAgo(4),
    },
  ];
}

// ── Public Factory ────────────────────────────────────────────

export interface SeedData {
  projects: Project[];
  entries: Entry[];
  tasks: Task[];
  metrics: PersonalDailyMetrics[];
  media: MediaItem[];
}

export function generateSeedData(): SeedData {
  const projects = createSeedProjects();
  const entries = createSeedEntries(projects);
  const tasks = createSeedTasks(projects);
  const metrics = createSeedMetrics();
  const media = createSeedMedia(projects, entries);

  return { projects, entries, tasks, metrics, media };
}
