#!/usr/bin/env node
// Checks every series listed in series/index.json. Run: npm run validate
import { readFileSync } from 'node:fs';
import { validateSeries } from '../js/validate.js';

const index = JSON.parse(readFileSync('series/index.json', 'utf8'));
let failed = false;
for (const entry of index.series) {
  const series = JSON.parse(readFileSync(entry.path, 'utf8'));
  const errors = validateSeries(series);
  if (entry.id !== series.id) errors.push(`index id "${entry.id}" does not match file id "${series.id}"`);
  if (errors.length) {
    failed = true;
    console.error(`✗ ${entry.path}\n  - ${errors.join('\n  - ')}`);
  } else {
    console.log(`✓ ${entry.path} (${series.weeks.length} weeks)`);
  }
}
process.exit(failed ? 1 : 0);
