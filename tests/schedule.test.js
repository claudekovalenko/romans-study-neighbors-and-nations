import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildSchedule, locate, toISO, allDays } from '../js/schedule.js';

const series = {
  id: 't',
  title: 'Test',
  startDate: '2026-10-04', // a Sunday
  weeks: [
    { days: [{}, {}, {}, {}, {}, {}] },
    { days: [{}, {}, {}, {}, {}, {}] },
    { date: '2026-10-25', days: [{}, {}] }, // skips Oct 18
    { days: [] },
  ],
};

const at = (iso) => new Date(`${iso}T12:00:00`);

test('sermon dates step weekly and honor overrides', () => {
  const s = buildSchedule(series);
  assert.deepEqual(s.map((w) => toISO(w.sermonDate)), ['2026-10-04', '2026-10-11', '2026-10-25', '2026-11-01']);
});

test('readings fall Monday–Saturday before each sermon', () => {
  const [w1, w2] = buildSchedule(series);
  assert.equal(toISO(w1.days[0].date), '2026-09-28');
  assert.equal(toISO(w1.days[5].date), '2026-10-03');
  assert.equal(toISO(w2.days[0].date), '2026-10-05');
  assert.equal(w2.days[0].id, 'w2d1');
});

test('custom offsets and per-day date overrides', () => {
  const s = buildSchedule({
    ...series,
    readingPlan: { dayOffsets: [1, 2] },
    weeks: [{ days: [{}, {}, {}, { date: '2026-12-25' }] }],
  });
  const d = s[0].days.map((x) => toISO(x.date));
  assert.deepEqual(d, ['2026-10-05', '2026-10-06', '2026-10-07', '2026-12-25']);
});

test('locate: before the series starts', () => {
  const loc = locate(buildSchedule(series), at('2026-09-20'));
  assert.equal(loc.status, 'upcoming');
  assert.equal(loc.todayReadings.length, 0);
  assert.equal(loc.currentWeek.number, 1);
  assert.equal(loc.lastWeek, null);
});

test('locate: on a reading day', () => {
  const loc = locate(buildSchedule(series), at('2026-10-07'));
  assert.equal(loc.status, 'active');
  assert.deepEqual(loc.todayReadings.map((d) => d.id), ['w2d3']);
  assert.equal(loc.currentWeek.number, 2);
  assert.equal(loc.lastWeek.number, 1);
});

test('locate: on sermon Sunday the current week is today’s', () => {
  const loc = locate(buildSchedule(series), at('2026-10-11'));
  assert.equal(loc.todayReadings.length, 0);
  assert.equal(loc.currentWeek.number, 2);
  assert.equal(loc.lastWeek.number, 1);
  assert.equal(loc.nextReading.id, 'w3d1');
});

test('locate: after the last sermon', () => {
  const loc = locate(buildSchedule(series), at('2026-11-02'));
  assert.equal(loc.status, 'complete');
  assert.equal(loc.currentWeek, null);
  assert.equal(loc.lastWeek.number, 4);
});

test('allDays is chronological', () => {
  const days = allDays(buildSchedule(series));
  for (let i = 1; i < days.length; i++) assert.ok(days[i].date >= days[i - 1].date);
});

test('pickCurrentSeries follows the preaching calendar', async () => {
  const { pickCurrentSeries } = await import('../js/schedule.js');
  const load = (id) => ({ id, schedule: buildSchedule(JSON.parse(readFileSync(`series/${id}/series.json`, 'utf8'))) });
  const list = ['romans', 'advent-2026', 'sermon-on-the-mount', 'easter-2027'].map(load);
  const on = (iso) => pickCurrentSeries(list, at(iso));
  assert.equal(on('2026-09-25'), 'romans');
  assert.equal(on('2026-11-15'), 'romans'); // last Sunday of Part 1
  assert.equal(on('2026-11-16'), 'advent-2026');
  assert.equal(on('2027-01-01'), 'sermon-on-the-mount');
  assert.equal(on('2027-03-08'), 'easter-2027');
  assert.equal(on('2027-03-29'), 'romans'); // Part 2 starts Apr 4
  assert.equal(on('2028-01-01'), 'romans'); // everything over: most recent
});

test('Romans dates match the church calendar, including breaks', async () => {
  const { resumesAfterBreak } = await import('../js/schedule.js');
  const s = buildSchedule(JSON.parse(readFileSync('series/romans/series.json', 'utf8')));
  const dates = Object.fromEntries(s.map((w) => [w.number, toISO(w.sermonDate)]));
  assert.equal(s.length, 31);
  assert.equal(dates[1], '2026-09-13');
  assert.equal(dates[10], '2026-11-15');
  assert.equal(dates[11], '2027-04-04');
  assert.equal(dates[20], '2027-06-06');
  assert.equal(dates[21], '2027-08-15');
  assert.equal(dates[31], '2027-10-24');
  assert.deepEqual(s.filter((w) => resumesAfterBreak(s, w)).map((w) => w.number), [11, 21]);
});
