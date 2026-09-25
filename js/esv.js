import { config } from '../config.js';
import { esvCache } from './store.js';

const API = 'https://api.esv.org/v3/passage/html/';

const PARAMS = {
  'include-passage-references': 'false',
  'include-footnotes': 'false',
  'include-headings': 'true',
  'include-subheadings': 'true',
  'include-audio-link': 'false',
  'include-short-copyright': 'false',
  'include-copyright': 'false',
};

export const ESV_COPYRIGHT =
  'Scripture quotations are from the ESV® Bible (The Holy Bible, English Standard Version®), ' +
  '© 2001 by Crossway, a publishing ministry of Good News Publishers. Used by permission. All rights reserved.';

export function esvConfigured() {
  return Boolean(config.esv.proxyUrl || config.esv.apiKey);
}

export function esvLink(ref) {
  return `https://www.esv.org/${encodeURIComponent(ref).replace(/%20/g, '+')}/`;
}

export async function getPassageHtml(ref) {
  const cached = esvCache.get(ref);
  if (cached) return cached;
  if (!esvConfigured()) throw new Error('not-configured');

  const params = new URLSearchParams({ q: ref, ...PARAMS });
  const url = `${config.esv.proxyUrl || API}?${params}`;
  const headers = config.esv.proxyUrl ? {} : { Authorization: `Token ${config.esv.apiKey}` };

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`esv-${res.status}`);
  const data = await res.json();
  const html = (data.passages ?? []).join('');
  if (!html) throw new Error('esv-empty');
  esvCache.put(ref, html);
  return html;
}
