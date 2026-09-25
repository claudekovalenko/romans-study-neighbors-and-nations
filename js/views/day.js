import { allDays } from '../schedule.js';
import { progress, notes } from '../store.js';
import { getPassageHtml, esvConfigured, esvLink, ESV_COPYRIGHT } from '../esv.js';
import { esc, fmtLong, icon } from '../ui.js';

function toggleLabel(done) {
  return done ? `${icon('check')} Read — tap to undo` : `${icon('check')} Mark as read`;
}

export function dayView(ctx, [wn, dn]) {
  const { series, schedule } = ctx;
  const week = schedule[Number(wn) - 1];
  const day = week?.days[Number(dn) - 1];
  if (!day) return null;

  const ordered = allDays(schedule);
  const i = ordered.findIndex((d) => d.id === day.id);
  const prev = ordered[i - 1];
  const next = ordered[i + 1];
  const done = progress.isDone(series.id, day.id);
  const link = (d) => `#/week/${d.weekNumber}/day/${d.index}`;

  return {
    title: day.passage || `Week ${week.number}, Day ${day.index}`,
    html: `
      <a class="back-link" href="#/week/${week.number}">${icon('back')} Week ${week.number}</a>
      <header class="page-head">
        <p class="eyebrow">Week ${week.number} · Day ${day.index} · ${esc(fmtLong(day.date))}</p>
        <h1 class="passage">${esc(day.passage || 'Reading coming soon')}</h1>
        ${day.title ? `<p class="lead">${esc(day.title)}</p>` : ''}
      </header>

      ${day.passage ? `
        <article class="scripture" id="scripture" aria-live="polite">
          <p class="muted">Loading ${esc(day.passage)}…</p>
        </article>` : '<p class="muted">This reading hasn’t been posted yet — check back soon.</p>'}

      ${day.prompt ? `
        <section class="card card-quiet reflect">
          <p class="eyebrow">Reflect</p>
          <p>${esc(day.prompt)}</p>
        </section>` : ''}

      <section class="notes">
        <label class="eyebrow" for="note">My notes <span class="muted">(saved on this device)</span></label>
        <textarea id="note" rows="4" placeholder="What stood out? What will you carry into this week?">${esc(notes.get(series.id, day.id))}</textarea>
      </section>

      <button id="toggle-done" class="btn btn-block ${done ? 'btn-secondary' : 'btn-primary'}" aria-pressed="${done}">${toggleLabel(done)}</button>

      <nav class="pager" aria-label="Readings">
        ${prev ? `<a href="${link(prev)}">${icon('back')} ${esc(prev.passage || 'Previous')}</a>` : '<span></span>'}
        ${next ? `<a href="${link(next)}">${esc(next.passage || 'Next')} ${icon('chevron')}</a>` : '<span></span>'}
      </nav>

      ${day.passage ? `<p class="copyright">${esc(ESV_COPYRIGHT)}</p>` : ''}`,

    mount(root) {
      const btn = root.querySelector('#toggle-done');
      btn.addEventListener('click', () => {
        const now = progress.toggle(series.id, day.id);
        btn.innerHTML = toggleLabel(now);
        btn.setAttribute('aria-pressed', String(now));
        btn.classList.toggle('btn-primary', !now);
        btn.classList.toggle('btn-secondary', now);
        ctx.onProgressChange();
      });

      let t;
      root.querySelector('#note').addEventListener('input', (e) => {
        clearTimeout(t);
        t = setTimeout(() => notes.set(series.id, day.id, e.target.value.trim() ? e.target.value : ''), 400);
      });

      const target = root.querySelector('#scripture');
      if (!target) return;
      getPassageHtml(day.passage)
        .then((html) => {
          if (target.isConnected) target.innerHTML = html;
        })
        .catch((err) => {
          if (!target.isConnected) return;
          const why = !esvConfigured()
            ? ''
            : !navigator.onLine
              ? '<p class="muted">You’re offline, and this passage hasn’t been saved on this device yet.</p>'
              : `<p class="muted">We couldn’t load the passage right now (${esc(err.message)}).</p>`;
          target.innerHTML = `
            ${why}
            <a class="btn btn-secondary" href="${esc(esvLink(day.passage))}" target="_blank" rel="noopener">
              ${icon('book')} Read ${esc(day.passage)} on ESV.org ${icon('external')}
            </a>`;
        });
    },
  };
}
