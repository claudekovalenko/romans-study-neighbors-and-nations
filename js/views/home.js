import { locate, allDays, daysUntil, sameDay } from '../schedule.js';
import { progress } from '../store.js';
import { esc, fmtLong, icon, videoBlock, spotifyBlock, progressBar } from '../ui.js';
import { weekHeading } from './weeks.js';

function readingCard(ctx, day, eyebrow) {
  const done = progress.isDone(ctx.series.id, day.id);
  return `
    <a class="card card-link card-feature ${done ? 'is-done' : ''}" href="#/week/${day.weekNumber}/day/${day.index}">
      <p class="eyebrow">${esc(eyebrow)} · Week ${day.weekNumber}, Day ${day.index}</p>
      <h2 class="passage">${esc(day.passage || 'Reading coming soon')}</h2>
      ${day.title ? `<p class="lead">${esc(day.title)}</p>` : ''}
      <span class="btn ${done ? 'btn-secondary' : 'btn-primary'}">
        ${done ? `${icon('check')} Read — open again` : `${icon('book')} Start reading`}
      </span>
    </a>`;
}

export function homeView(ctx) {
  const { series, schedule } = ctx;
  const loc = locate(schedule);
  const days = allDays(schedule);
  const doneCount = days.filter((d) => progress.isDone(series.id, d.id)).length;
  const parts = [];

  parts.push(`
    <header class="hero">
      <p class="eyebrow">${esc(series.church)}</p>
      <h1>${esc(series.title)}</h1>
      ${series.subtitle ? `<p class="lead">${esc(series.subtitle)}</p>` : ''}
      <p class="muted">${esc(fmtLong(loc.today))}</p>
    </header>`);

  if (loc.status === 'upcoming') {
    const first = days[0];
    const n = daysUntil(first?.date ?? schedule[0].sermonDate);
    parts.push(`
      <section class="card">
        <p class="eyebrow">Getting ready</p>
        <h2>The series begins in ${n} day${n === 1 ? '' : 's'}</h2>
        <p>Daily readings start ${esc(fmtLong(first?.date ?? schedule[0].sermonDate))}, leading up to the first sermon on ${esc(fmtLong(schedule[0].sermonDate))}.</p>
        <a class="btn btn-secondary" href="#/settings">${icon('bell')} Set up reminders</a>
      </section>`);
    if (first) parts.push(readingCard(ctx, first, 'First reading'));
  }

  for (const day of loc.todayReadings) parts.push(readingCard(ctx, day, "Today's reading"));

  if (loc.status === 'active' && !loc.todayReadings.length && loc.nextReading) {
    parts.push(`
      <section class="card">
        <p class="eyebrow">No reading today</p>
        <p>Next reading: ${loc.nextReading.passage
          ? `<a href="#/week/${loc.nextReading.weekNumber}/day/${loc.nextReading.index}">${esc(loc.nextReading.passage)}</a> on `
          : ''}${esc(fmtLong(loc.nextReading.date))}.</p>
      </section>`);
  }

  const cw = loc.currentWeek;
  const cwGap = cw ? daysUntil(cw.sermonDate) : 0;
  if (cw && cwGap > 7 && loc.status === 'active') {
    // Between parts of the series (e.g. Romans pauses for Advent).
    parts.push(`
      <section class="card">
        <p class="eyebrow">${esc(series.title)} is on a break</p>
        <h2>We pick back up ${esc(fmtLong(cw.sermonDate))}</h2>
        <p>${cw.part ? `${esc(cw.part)} begins with ` : 'Next: '}week ${cw.number}${cw.passage ? `, ${esc(cw.passage)}` : ''}.</p>
        <a class="text-link" href="#/weeks">See the whole series ${icon('chevron')}</a>
      </section>`);
  } else if (cw && cwGap <= 7) {
    const isToday = sameDay(cw.sermonDate, loc.today);
    parts.push(`
      <section class="card">
        <p class="eyebrow">${isToday ? 'Today’s sermon' : 'This Sunday'} · Week ${cw.number} · ${esc(fmtLong(cw.sermonDate))}</p>
        <h2>${esc(weekHeading(cw))}</h2>
        ${cw.title && cw.passage ? `<p class="passage-sm">${esc(cw.passage)}</p>` : ''}
        ${cw.bigIdea ? `<blockquote class="big-idea">${esc(cw.bigIdea)}</blockquote>` : ''}
        ${videoBlock(cw.videos?.before, 'A word from our pastor')}
        <a class="text-link" href="#/week/${cw.number}">See the week’s plan ${icon('chevron')}</a>
      </section>`);
  }

  const lw = loc.lastWeek;
  if (lw && (lw.podcastEpisodeUrl || lw.videos?.after)) {
    parts.push(`
      <section class="card">
        <p class="eyebrow">Remember last week · Week ${lw.number}</p>
        <h2>${esc(weekHeading(lw))}</h2>
        ${spotifyBlock(lw.podcastEpisodeUrl)}
        ${videoBlock(lw.videos?.after, 'After the message')}
        <a class="text-link" href="#/week/${lw.number}">Revisit week ${lw.number} ${icon('chevron')}</a>
      </section>`);
  }

  if (loc.status === 'complete') {
    parts.push(`
      <section class="card">
        <p class="eyebrow">Series complete</p>
        <h2>Thank you for reading ${esc(series.title)} with us</h2>
        <p>Every week and message stays here — revisit the readings or <a href="#/listen">listen to the messages</a>.</p>
      </section>`);
  }

  parts.push(`
    <section class="card card-quiet">
      <p class="eyebrow">Your progress</p>
      <p><strong>${doneCount}</strong> of ${days.length} readings</p>
      ${progressBar(doneCount, days.length, 'Series reading progress')}
    </section>`);

  return { title: series.title, html: parts.join('') };
}
