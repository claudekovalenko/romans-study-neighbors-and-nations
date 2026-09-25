import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateSeries } from '../js/validate.js';
import { buildICS } from '../js/reminders.js';
import { buildSchedule } from '../js/schedule.js';

const index = JSON.parse(readFileSync('series/index.json', 'utf8'));

test('index points at an existing active series', () => {
  assert.ok(index.series.some((s) => s.id === index.active));
});

for (const entry of index.series) {
  test(`${entry.path} is valid`, () => {
    const series = JSON.parse(readFileSync(entry.path, 'utf8'));
    assert.equal(series.id, entry.id);
    assert.deepEqual(validateSeries(series), []);
  });
}

test('calendar export has one alarmed event per remaining reading', () => {
  const series = JSON.parse(readFileSync('series/romans/series.json', 'utf8'));
  const schedule = buildSchedule(series);
  const ics = buildICS({ series, schedule, time: '07:00', appUrl: 'https://example.org/', from: new Date(2000, 0, 1), sermonTime: '10:00' });
  const readings = schedule.flatMap((w) => w.days).length;
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, readings + schedule.length);
  assert.equal(ics.match(/BEGIN:VALARM/g).length, readings);
  assert.ok(ics.includes('DTSTART:20260928T070000'));
  assert.ok(ics.split('\r\n').every((l) => l.length <= 75));
});
