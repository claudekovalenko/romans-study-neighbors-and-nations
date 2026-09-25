// Optional: keeps your ESV API key off the public website.
// Deploy as a Cloudflare Worker (free tier is plenty):
//   1. npx wrangler init esv-proxy   → replace the generated worker with this file
//   2. npx wrangler secret put ESV_API_KEY        (paste your key from api.esv.org)
//   3. Set ALLOWED_ORIGINS in wrangler.toml [vars], e.g. "https://yourchurch.github.io"
//   4. npx wrangler deploy  → put the worker URL in config.js as esv.proxyUrl
// Any serverless platform works the same way: forward the query string to
// api.esv.org with the Authorization header added.

const ESV = 'https://api.esv.org/v3/passage/html/';

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.length ? (allowed.includes(origin) ? origin : allowed[0]) : '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      Vary: 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: cors });
    if (allowed.length && !allowed.includes(origin)) return new Response('Forbidden', { status: 403, headers: cors });

    const upstream = new URL(ESV);
    upstream.search = new URL(request.url).search;
    const res = await fetch(upstream, {
      headers: { Authorization: `Token ${env.ESV_API_KEY}` },
      cf: { cacheTtl: 86400, cacheEverything: true },
    });

    return new Response(res.body, {
      status: res.status,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
    });
  },
};
