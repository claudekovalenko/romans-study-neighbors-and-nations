import { config } from '../config.js';
import { buildSchedule, locate } from './schedule.js';
import { settings, progress, dataCache } from './store.js';
import { checkReminder } from './reminders.js';
import { isNative, initNative, scheduleReadingReminders } from './native.js';
import { esc } from './ui.js';
import { homeView } from './views/home.js';
import { weeksListView, weekDetailView } from './views/weeks.js';
import { dayView } from './views/day.js';
import { listenView } from './views/listen.js';
import { settingsView } from './views/settings.js';

const routes = [
  [/^\/?$/, homeView, 'today'],
  [/^\/weeks$/, weeksListView, 'weeks'],
  [/^\/week\/(\d+)$/, weekDetailView, 'weeks'],
  [/^\/week\/(\d+)\/day\/(\d+)$/, dayView, 'weeks'],
  [/^\/listen$/, listenView, 'listen'],
  [/^\/settings$/, settingsView, 'settings'],
];

const main = document.getElementById('main');
let lastPath = null;

const ctx = {
  index: null,
  series: null,
  schedule: [],
  installPrompt: null,
  rerender: () => render({ keepScroll: true }),
  onProgressChange: () => remind(),
  onReminderSettingsChange: () => remind(),
  applySettings,
  switchSeries,
};

async function fetchLocal(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
}

// In the phone apps, prefer the live website's copy so plan edits arrive
// without a store update; fall back to the last copy seen, then the bundle.
async function fetchJSON(path) {
  if (!isNative() || !config.remoteBase) return fetchLocal(path);
  try {
    const res = await fetch(new URL(path, config.remoteBase), { cache: 'no-cache', signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    dataCache.put(path, data);
    return data;
  } catch {
    return dataCache.get(path) ?? fetchLocal(path);
  }
}

async function loadSeries(id) {
  const entry = ctx.index.series.find((s) => s.id === id) ?? ctx.index.series.find((s) => s.id === ctx.index.active);
  ctx.series = await fetchJSON(entry.path);
  ctx.schedule = buildSchedule(ctx.series);
  const accent = ctx.series.theme?.accent;
  if (accent) document.documentElement.style.setProperty('--accent', accent);
  document.querySelector('.app-series').textContent = ctx.series.title;
}

async function switchSeries(id) {
  settings.set({ seriesId: id });
  await loadSeries(id);
  location.hash = '#/';
  render();
}

function applySettings() {
  document.documentElement.dataset.textSize = settings.get().textSize;
}

function render({ keepScroll = false } = {}) {
  const path = location.hash.replace(/^#/, '') || '/';
  let view = null;
  let tab = null;
  for (const [re, fn, t] of routes) {
    const m = path.match(re);
    if (m) {
      view = fn(ctx, m.slice(1));
      tab = t;
      break;
    }
  }
  if (!view) {
    view = { title: 'Not found', html: '<h1>Page not found</h1><p><a href="#/">Go to today</a></p>' };
  }

  main.innerHTML = view.html;
  view.mount?.(main);
  document.title = `${view.title} · ${config.appName}`;
  document.querySelectorAll('.tabbar a').forEach((a) => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  if (!keepScroll && path !== lastPath) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
  lastPath = path;
}

function remind() {
  if (!ctx.series) return;
  if (isNative()) {
    const s = settings.get();
    scheduleReadingReminders({
      series: ctx.series,
      schedule: ctx.schedule,
      time: s.reminderTime,
      enabled: s.remindersOn,
      isDone: (id) => progress.isDone(ctx.series.id, id),
    }).catch(() => {});
  } else {
    checkReminder({ series: ctx.series, readings: locate(ctx.schedule).todayReadings }).catch(() => {});
  }
}

async function start() {
  initNative();
  applySettings();
  try {
    ctx.index = await fetchJSON(config.seriesIndex);
    await loadSeries(settings.get().seriesId ?? ctx.index.active);
  } catch (err) {
    main.innerHTML = `<h1>Couldn’t load the series</h1><p class="muted">${esc(err.message)}</p><p>Check your connection and try again.</p>`;
    return;
  }
  window.addEventListener('hashchange', () => render());
  render();
  remind();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      render({ keepScroll: true }); // the date may have rolled over
      remind();
    }
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  ctx.installPrompt = e;
  if (location.hash === '#/settings') ctx.rerender();
});

if ('serviceWorker' in navigator && !isNative()) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
