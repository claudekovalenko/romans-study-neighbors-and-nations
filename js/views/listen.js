import { locate } from '../schedule.js';
import { esc, fmtLong, fmtShort, icon, spotifyBlock } from '../ui.js';
import { weekHeading } from './weeks.js';

export function listenView(ctx) {
  const { series, schedule } = ctx;
  const loc = locate(schedule);
  const pod = series.podcast ?? {};

  const recorded = schedule.filter((w) => w.podcastEpisodeUrl).reverse();
  const latest = recorded[0];
  const pending = schedule.filter((w) => !w.podcastEpisodeUrl && w.sermonDate < loc.today);

  const links = [
    pod.spotifyShowUrl && `<a class="btn btn-primary" href="${esc(pod.spotifyShowUrl)}" target="_blank" rel="noopener">${icon('listen')} Follow on Spotify</a>`,
    pod.applePodcastsUrl && `<a class="btn btn-secondary" href="${esc(pod.applePodcastsUrl)}" target="_blank" rel="noopener">Apple Podcasts</a>`,
    pod.rssUrl && `<a class="btn btn-secondary" href="${esc(pod.rssUrl)}" target="_blank" rel="noopener">RSS</a>`,
  ].filter(Boolean);

  const archive = recorded.slice(1).map((w) => `
    <li>
      <details class="episode">
        <summary>
          <span class="week-num">${w.number}</span>
          <span class="week-body">
            <span class="week-date">${esc(fmtShort(w.sermonDate))}</span>
            <span class="week-title">${esc(weekHeading(w))}</span>
          </span>
        </summary>
        ${spotifyBlock(w.podcastEpisodeUrl)}
        <a class="text-link" href="#/week/${w.number}">Week ${w.number} readings ${icon('chevron')}</a>
      </details>
    </li>`);

  return {
    title: 'Listen',
    html: `
      <header class="page-head">
        <p class="eyebrow">${esc(series.title)} podcast</p>
        <h1>Listen again</h1>
        <p class="lead">Missed a Sunday, or want to sit with a message a little longer? Every sermon in the series lands here.</p>
      </header>

      ${links.length ? `<div class="btn-row">${links.join('')}</div>` : ''}

      ${latest ? `
        <section class="card card-feature">
          <p class="eyebrow">Latest message · Week ${latest.number} · ${esc(fmtLong(latest.sermonDate))}</p>
          <h2>${esc(weekHeading(latest))}</h2>
          ${spotifyBlock(latest.podcastEpisodeUrl, { compact: false })}
        </section>` : `
        <section class="card">
          <p class="eyebrow">Coming soon</p>
          <p>Recordings will appear here after each Sunday.</p>
        </section>`}

      ${archive.length ? `
        <section>
          <h2 class="section-title">Earlier messages</h2>
          <ol class="episode-list">${archive.join('')}</ol>
        </section>` : ''}

      ${pending.length ? `<p class="muted">Recordings for week${pending.length > 1 ? 's' : ''} ${pending.map((w) => w.number).join(', ')} are on the way.</p>` : ''}

      ${pod.spotifyShowUrl ? spotifyBlock(pod.spotifyShowUrl) : ''}`,
  };
}
