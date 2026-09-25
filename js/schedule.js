// Pure date/schedule logic — no DOM, so it can be unit-tested in Node.

// Reading days default to Monday–Saturday leading up to the Sunday sermon,
// so people read the passage ahead of hearing it preached.
export const DEFAULT_DAY_OFFSETS = [-6, -5, -4, -3, -2, -1];

export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function sameDay(a, b) {
  return toISO(a) === toISO(b);
}

// Turns series.json into weeks with concrete dates.
// A week may set its own "date" (e.g. to skip a holiday Sunday); later weeks
// continue one week after it. Days beyond the configured offsets continue
// one day at a time after the last offset.
export function buildSchedule(series) {
  const offsets = series.readingPlan?.dayOffsets ?? DEFAULT_DAY_OFFSETS;
  let prevSermon = null;

  return series.weeks.map((week, i) => {
    const number = i + 1;
    const sermonDate = week.date
      ? parseDate(week.date)
      : prevSermon
        ? addDays(prevSermon, 7)
        : parseDate(series.startDate);
    prevSermon = sermonDate;

    const rawDays = week.days ?? [];
    const days = rawDays.map((day, j) => ({
      ...day,
      index: j + 1,
      weekNumber: number,
      id: `w${number}d${j + 1}`,
      date: day.date
        ? parseDate(day.date)
        : addDays(sermonDate, offsets[j] ?? (offsets.at(-1) ?? -1) + j - offsets.length + 1),
    }));

    return { ...week, number, sermonDate, days };
  });
}

export function allDays(schedule) {
  return schedule.flatMap((w) => w.days).sort((a, b) => a.date - b.date);
}

// Where are we in the series today?
export function locate(schedule, now = new Date()) {
  const today = startOfDay(now);
  const days = allDays(schedule);

  const todayReadings = days.filter((d) => sameDay(d.date, today));
  const nextReading = days.find((d) => d.date > today) ?? null;
  // The sermon people are preparing for (today's, if it's Sunday).
  const currentWeek = schedule.find((w) => w.sermonDate >= today) ?? null;
  // The most recent sermon already preached.
  const lastWeek = [...schedule].reverse().find((w) => w.sermonDate < today) ?? null;

  const first = days[0]?.date ?? schedule[0]?.sermonDate;
  const lastSermon = schedule.at(-1)?.sermonDate;
  let status = 'active';
  if (first && today < first) status = 'upcoming';
  else if (lastSermon && today > lastSermon) status = 'complete';

  return { today, status, todayReadings, nextReading, currentWeek, lastWeek };
}

export function daysUntil(date, now = new Date()) {
  return Math.round((startOfDay(date) - startOfDay(now)) / 86400000);
}

// Which series is being preached now? The one with the soonest sermon still
// to come (today counts); once every series is over, the most recent one.
// `list` is [{ id, schedule }].
export function pickCurrentSeries(list, now = new Date()) {
  const today = startOfDay(now);
  let best = null;
  for (const { id, schedule } of list) {
    const next = schedule.find((w) => w.sermonDate >= today)?.sermonDate;
    if (next && (!best?.next || next < best.next)) best = { id, next };
  }
  if (best) return best.id;
  const latest = [...list].sort((a, b) => b.schedule.at(-1).sermonDate - a.schedule.at(-1).sermonDate)[0];
  return latest?.id ?? null;
}

// A gap of more than a week before this sermon means the series paused
// (e.g. Romans breaks for Advent) and this week resumes it.
export function resumesAfterBreak(schedule, week) {
  const prev = schedule[week.number - 2];
  return Boolean(prev) && daysUntil(week.sermonDate, prev.sermonDate) > 7;
}
