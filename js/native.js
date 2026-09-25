// Features that only exist in the iPhone/Android app (Capacitor).
// In a normal browser every function here is a no-op.

import { allDays } from './schedule.js';

export const isNative = () => window.Capacitor?.isNativePlatform?.() === true;

const plugins = {};
function plugin(name) {
  return (plugins[name] ??= window.Capacitor.registerPlugin(name));
}

// iOS keeps at most 64 pending notifications per app, so schedule the next
// stretch and top it up each time the app opens.
const MAX_PENDING = 60;

const notificationId = (day) => day.weekNumber * 100 + day.index;

export async function nativeNotificationPermission({ ask = false } = {}) {
  const ln = plugin('LocalNotifications');
  const { display } = ask ? await ln.requestPermissions() : await ln.checkPermissions();
  return display; // 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'
}

// Replaces all pending reading reminders with fresh ones, skipping
// readings already marked as read.
export async function scheduleReadingReminders({ series, schedule, time, enabled, isDone, now = new Date() }) {
  const ln = plugin('LocalNotifications');
  const { notifications: pending } = await ln.getPending();
  if (pending.length) await ln.cancel({ notifications: pending.map((n) => ({ id: n.id })) });
  if (!enabled || (await nativeNotificationPermission()) !== 'granted') return 0;

  const [h, m] = time.split(':').map(Number);
  const upcoming = allDays(schedule)
    .filter((d) => !isDone(d.id))
    .map((d) => ({ day: d, at: new Date(d.date.getFullYear(), d.date.getMonth(), d.date.getDate(), h, m) }))
    .filter(({ at }) => at > now)
    .slice(0, MAX_PENDING);

  if (upcoming.length) {
    await ln.schedule({
      notifications: upcoming.map(({ day, at }) => ({
        id: notificationId(day),
        title: `${series.title}: today's reading`,
        body: day.passage ? `${day.passage}${day.title ? ' — ' + day.title : ''}` : "Open the app for today's reading.",
        schedule: { at, allowWhileIdle: true },
        extra: { url: `#/week/${day.weekNumber}/day/${day.index}` },
      })),
    });
  }
  return upcoming.length;
}

export function initNative() {
  if (!isNative()) return;
  document.documentElement.classList.add('native');

  // Tapping a reminder opens that day's reading.
  plugin('LocalNotifications').addListener('localNotificationActionPerformed', (e) => {
    const url = e.notification?.extra?.url;
    if (url) location.hash = url;
  });

  // Links that would open a new tab go to the in-app browser instead of
  // replacing the app.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[target="_blank"]');
    if (!a) return;
    e.preventDefault();
    plugin('Browser').open({ url: a.href });
  });

  // Android back button: go back within the app, or leave it from the home screen.
  plugin('App').addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && location.hash && location.hash !== '#/') history.back();
    else plugin('App').exitApp();
  });
}
