import { videoEmbed, spotifyEmbed } from './media.js';

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const fmt = (opts) => new Intl.DateTimeFormat(undefined, opts);
export const fmtLong = (d) => fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(d);
export const fmtShort = (d) => fmt({ month: 'short', day: 'numeric' }).format(d);
export const fmtWeekday = (d) => fmt({ weekday: 'short' }).format(d);

const PATHS = {
  today: '<path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/>',
  weeks: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  listen: '<path d="M3 14v-2a9 9 0 0 1 18 0v2"/><rect x="3" y="14" width="4" height="7" rx="1.5"/><rect x="17" y="14" width="4" height="7" rx="1.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3 5v14c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5z"/><path d="M12 6.5V20"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M8 14h3"/>',
  bell: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] ?? ''}</svg>`;
}

export function videoBlock(url, label) {
  const v = videoEmbed(url);
  if (!v) return '';
  let player;
  if (v.type === 'iframe') {
    player = `<div class="embed embed-video"><iframe src="${esc(v.src)}" title="${esc(label)}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>`;
  } else if (v.type === 'video') {
    player = `<div class="embed embed-video"><video src="${esc(v.src)}" controls preload="metadata" playsinline></video></div>`;
  } else {
    player = `<a class="btn btn-secondary" href="${esc(v.src)}" target="_blank" rel="noopener">${icon('play')} Watch video</a>`;
  }
  return `<figure class="media"><figcaption class="eyebrow">${esc(label)}</figcaption>${player}</figure>`;
}

export function spotifyBlock(url, { compact = true } = {}) {
  const s = spotifyEmbed(url);
  if (!s) {
    return url ? `<a class="btn btn-secondary" href="${esc(url)}" target="_blank" rel="noopener">${icon('listen')} Listen</a>` : '';
  }
  const height = s.kind === 'show' ? 232 : compact ? 152 : 232;
  return `<div class="embed embed-audio"><iframe src="${esc(s.src)}" height="${height}" title="Spotify player" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>`;
}

export function progressBar(done, total, label = '') {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}" aria-label="${esc(label || 'Progress')}"><span style="width:${pct}%"></span></div>`;
}

export const comingSoon = (what = 'Coming soon') => `<span class="muted">${esc(what)}</span>`;
