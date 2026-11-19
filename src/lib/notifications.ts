// ============================================================
// NexusOS — Browser Notification & Reminder Engine
// ============================================================

import type { IDataStore } from './localStore';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function sendLocalNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  return new Notification(title, {
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    ...options,
  });
}

/**
 * Checks all pending tasks with reminder_at <= now and notification_sent == false,
 * fires a browser notification, and marks notification_sent = true.
 */
export async function checkAndTriggerReminders(store: IDataStore): Promise<number> {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return 0;
  }

  try {
    const tasks = await store.getTasks();
    const now = new Date().getTime();
    let triggered = 0;

    for (const task of tasks) {
      if (
        task.reminder_at &&
        !task.notification_sent &&
        task.status !== 'done'
      ) {
        const reminderTime = new Date(task.reminder_at).getTime();
        // If reminder time is within the past 15 minutes or now
        if (reminderTime <= now && now - reminderTime < 15 * 60 * 1000) {
          sendLocalNotification(`Reminder: ${task.title}`, {
            body: `Workspace: ${task.workspace.toUpperCase()} | Priority: ${task.priority.toUpperCase()}`,
            tag: `task-reminder-${task.id}`,
          });

          await store.updateTask(task.id, { notification_sent: true });
          triggered++;
        }
      }
    }

    return triggered;
  } catch (err) {
    console.error('[Notifications] Failed to check reminders:', err);
    return 0;
  }
}
