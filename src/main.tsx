// ============================================================
// NexusOS — Entry Point & Service Worker Registration
// ============================================================

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { getStore } from './lib/database';
import { checkAndTriggerReminders } from './lib/notifications';

// 1. Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[NexusOS] Service Worker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[NexusOS] Service Worker registration failed:', err);
      });
  });
}

// 2. Periodic background check for scheduled task reminders (every 60 seconds)
setInterval(async () => {
  try {
    const store = await getStore();
    await checkAndTriggerReminders(store);
  } catch (err) {
    // Silent background handling
  }
}, 60 * 1000);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
