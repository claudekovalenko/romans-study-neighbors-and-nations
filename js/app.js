import { config } from '../config.js';
import { buildSchedule, locate, pickCurrentSeries } from './schedule.js';
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
  all: {}, // id → series, for every series in the index
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

async function loadAll() {
  const loaded = await Promise.all(
    ctx.index.series.map((e) => fetchJSON(e.path).then((s) => [e.id, s], () => null)),
  );
  ctx.all = Object.fromEntries(loaded.filter(Boolean));
  if (!Object.keys(ctx.all).length) throw new Error('No series could be loaded');
}

// No saved choice means "whatever is being preached now".
function chooseSeries() {
  const saved = settings.get().seriesId;
  if (saved && ctx.all[saved]) return saved;
  const list = Object.entries(ctx.all).map(([id, s]) => ({ id, schedule: buildSchedule(s) }));
  return pickCurrentSeries(list) ?? (ctx.all[ctx.index.active] ? ctx.index.active : list[0].id);
}

function useSeries(id) {
  ctx.series = ctx.all[id];
  ctx.schedule = buildSchedule(ctx.series);
  document.documentElement.style.setProperty('--accent', ctx.series.theme?.accent ?? '#b5832a');
  document.querySelector('.app-series').textContent = ctx.series.title;
}

function switchSeries(id) {
  settings.set({ seriesId: id || null });
  useSeries(chooseSeries());
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
    await loadAll();
    useSeries(chooseSeries());
  } catch (err) {
    main.innerHTML = `<h1>Couldn’t load the series</h1><p class="muted">${esc(err.message)}</p><p>Check your connection and try again.</p>`;
    return;
  }
  window.addEventListener('hashchange', () => render());
  render();
  remind();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // The date may have rolled over — possibly into the next series.
      const id = chooseSeries();
      if (id !== ctx.series.id) useSeries(id);
      render({ keepScroll: true });
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
