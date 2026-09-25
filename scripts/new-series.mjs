#!/usr/bin/env node
// Scaffolds a blank series file with placeholder weeks and reading days.
//   node scripts/new-series.mjs --id=james --title="James" --weeks=12 --start=2027-06-06
// Then add it to series/index.json.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=')];
  }),
);

const id = args.id;
const weeks = Number(args.weeks ?? 12);
const daysPerWeek = Number(args.days ?? 6);
if (!id || !args.title || !/^\d{4}-\d{2}-\d{2}$/.test(args.start ?? '')) {
  console.error('Usage: node scripts/new-series.mjs --id=<id> --title="<title>" --start=YYYY-MM-DD [--weeks=12] [--days=6]');
  process.exit(1);
}

const file = `series/${id}/series.json`;
if (existsSync(file) && !('force' in args)) {
  console.error(`${file} already exists (pass --force to overwrite)`);
  process.exit(1);
}

const series = {
  id,
  title: args.title,
  subtitle: args.subtitle ?? '',
  church: args.church ?? 'Neighbors and Nations Church',
  translation: 'ESV',
  startDate: args.start,
  sermonTime: '10:00',
  theme: { accent: '#b5832a' },
  readingPlan: { dayOffsets: [-6, -5, -4, -3, -2, -1].slice(0, daysPerWeek) },
  podcast: { spotifyShowUrl: '', applePodcastsUrl: '', rssUrl: '' },
  weeks: Array.from({ length: weeks }, () => ({
    title: '',
    passage: '',
    preacher: '',
    summary: '',
    bigIdea: '',
    videos: { before: '', after: '' },
    podcastEpisodeUrl: '',
    questions: [],
    days: Array.from({ length: daysPerWeek }, () => ({ passage: '', title: '', prompt: '' })),
  })),
};

mkdirSync(`series/${id}`, { recursive: true });
writeFileSync(file, JSON.stringify(series, null, 2) + '\n');
console.log(`Created ${file} with ${weeks} weeks. Add { "id": "${id}", "path": "series/${id}/series.json" } to series/index.json.`);
