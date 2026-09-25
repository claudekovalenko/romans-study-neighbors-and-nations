import { config } from '../config.js';
import { buildSchedule, locate } from './schedule.js';
import { settings } from './store.js';
import { checkReminder } from './reminders.js';
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
  applySettings,
  switchSeries,
};

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.json();
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
  checkReminder({ series: ctx.series, readings: locate(ctx.schedule).todayReadings }).catch(() => {});
}

async function start() {
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

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

start();
