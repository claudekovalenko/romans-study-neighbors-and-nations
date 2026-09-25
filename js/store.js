// Small wrapper over localStorage. Everything here is per-device and
// optional — the app must still work if storage is blocked.

const PREFIX = 'sermon-series:';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export const settings = {
  defaults: {
    seriesId: null,
    remindersOn: false,
    reminderTime: '07:00',
    textSize: 'm',
    lastNotified: null,
  },
  get() {
    return { ...this.defaults, ...read('settings', {}) };
  },
  set(patch) {
    write('settings', { ...this.get(), ...patch });
  },
};

export const progress = {
  all(seriesId) {
    return read(`progress:${seriesId}`, {});
  },
  isDone(seriesId, dayId) {
    return Boolean(this.all(seriesId)[dayId]);
  },
  toggle(seriesId, dayId) {
    const all = this.all(seriesId);
    if (all[dayId]) delete all[dayId];
    else all[dayId] = new Date().toISOString();
    write(`progress:${seriesId}`, all);
    return Boolean(all[dayId]);
  },
  reset(seriesId) {
    write(`progress:${seriesId}`, {});
  },
};

export const notes = {
  get(seriesId, id) {
    return read(`notes:${seriesId}`, {})[id] ?? '';
  },
  set(seriesId, id, text) {
    const all = read(`notes:${seriesId}`, {});
    if (text) all[id] = text;
    else delete all[id];
    write(`notes:${seriesId}`, all);
  },
};

// Keep only a handful of passages: the ESV API terms limit how much text
// an app may store (see README).
const ESV_CACHE_MAX = 20;

export const esvCache = {
  get(ref) {
    const hit = read('esv-cache', []).find((e) => e.ref === ref);
    return hit?.html ?? null;
  },
  put(ref, html) {
    const list = read('esv-cache', []).filter((e) => e.ref !== ref);
    list.unshift({ ref, html });
    write('esv-cache', list.slice(0, ESV_CACHE_MAX));
  },
};

// Last series files fetched from the website (phone apps only), so the
// newest plan is still there when the phone is offline.
export const dataCache = {
  get(path) {
    return read(`data:${path}`, null);
  },
  put(path, data) {
    write(`data:${path}`, data);
  },
};
