import { test } from 'node:test';
import assert from 'node:assert/strict';
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
