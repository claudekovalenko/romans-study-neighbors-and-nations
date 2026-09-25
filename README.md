# Sermon Series

An installable web app (PWA) for following a sermon series day by day. It was built for the **30-week Romans series at Neighbors and Nations Church** and can be reused for any future series.

- **Today:** today's ESV reading, this Sunday's sermon, last week's message, and your progress.
- **Weeks:** every sermon in the series. Each one has its date, passage, big idea, the pastor's video from before or after Sunday, the podcast episode, discussion questions, and the day-by-day reading plan.
- **Reading view:** the ESV text, a reflection prompt, private notes, and a "mark as read" button.
- **Listen:** the latest recorded message plus an archive of earlier ones (Spotify embeds).
- **Settings:** a daily reminder, a calendar export of the whole plan, text size, install help, and a series switcher.

The app works offline once installed. Progress and notes stay on each person's device, so nobody needs an account.

There's no build step: it's plain HTML, CSS, and JavaScript modules, so any static host works.

---

## Filling in the Romans plan

Everything lives in **`series/romans/series.json`**. All 31 sermons are filled in from the church's *Sermon Series Proposal Fall 2026 – 2027*: dates, passages, the three parts, and speakers where known. The **daily readings are still blank**, and each shows "Coming soon" until you add it.

```jsonc
{
  "id": "romans",
  "title": "Romans",
  "subtitle": "The gospel of God for neighbors and nations",
  "church": "Neighbors and Nations Church",
  "startDate": "2026-09-13",        // first sermon Sunday
  "sermonTime": "10:00",            // used for calendar export
  "theme": { "accent": "#b5832a" }, // per-series accent color
  "readingPlan": { "dayOffsets": [-6, -5, -4, -3, -2, -1] },
  "podcast": { "spotifyShowUrl": "", "applePodcastsUrl": "", "rssUrl": "" },
  "weeks": [
    {
      "title": "Introduction",
      "passage": "Romans 1:1-7",
      "preacher": "Josh",
      "part": "Part 1",               // optional — groups weeks on the Weeks screen
      "date": "2026-09-13",          // optional — override this week's Sunday
      "summary": "One short paragraph.",
      "bigIdea": "One sentence people can carry all week.",
      "videos": {
        "before": "https://youtu.be/...",   // shown in the lead-up to Sunday
        "after":  "https://youtu.be/..."    // shown after, to keep thinking about it
      },
      "podcastEpisodeUrl": "https://open.spotify.com/episode/...",
      "questions": ["Discussion question 1", "..."],
      "days": [
        { "passage": "Romans 1:1-7", "title": "Called and set apart", "prompt": "Reflection question" }
        // ...one entry per reading day
      ]
    }
  ]
}
```

**How dates work**
- Sermon dates are `startDate` plus one week for each week after it. To skip a Sunday (a holiday, for example), give that week a `"date"`. Every later week follows from there.
  Romans does this at the start of each part: week 11 is dated Apr 4, 2027 and week 21 is dated Aug 15, 2027. During the breaks, the Romans Today screen shows "Romans is on a break — we pick back up Sunday, April 4".
- Reading days fall **Monday–Saturday before each sermon**, so people read the passage *ahead* of hearing it preached. To change that, edit `readingPlan.dayOffsets`, which counts days relative to Sunday. For example, `[1,2,3,4,5]` puts the readings in the week *after* the sermon. Any single day can also set its own `"date"`.
- Leave any field empty and the app shows "Coming soon". You can fill the plan in gradually.

**Videos:** paste a YouTube or Vimeo link, or a direct `.mp4` link.
**Podcast:** paste the Spotify episode share link. It's embedded on the week page, the Today page (the week after), and the Listen archive.

Check your edits with `npm run validate`.

## Scripture text (ESV)

The text comes from the [ESV API](https://api.esv.org), which is free for non-commercial church use.

1. Create an account at api.esv.org and register an application to get a key.
2. Choose one option in `config.js`:
   - **`proxyUrl` (recommended):** deploy `server/esv-proxy.worker.js` as a free Cloudflare Worker (steps are in the file). The key stays secret.
   - **`apiKey`:** paste the key directly. It's quick, but anyone viewing the site source can see it.

Until one of these is set, each reading shows a **"Read on ESV.org"** button instead of the text.

The ESV terms limit how much text an app may store. This app keeps only the 20 most recent passages on the device for offline reading, and it shows Crossway's copyright notice wherever text appears.

## Reminders

- **Calendar export (the dependable one):** Settings → *Download calendar file* adds every remaining reading to the phone's calendar with an alert at the chosen time. It can also add the Sunday sermons. It works on iPhone and Android.
- **In-app notification:** if reminders are on and today's reading isn't done, the app sends a notification when it's opened after the reminder time. It also shows a badge on the app icon where supported.
  On iPhone, the app must first be added to the Home Screen.
- **Future option:** true scheduled push notifications, sent even when nobody opens the app, need a small server or a push service such as OneSignal or Firebase. The service worker already handles notification taps, so this can be added later.

## Podcast on Spotify

The simplest route is **[Spotify for Creators](https://creators.spotify.com)** (formerly Anchor). It's free. Upload each Sunday's recording, and it can also distribute the show to Apple Podcasts. After each upload:

1. Copy the episode's share link into that week's `podcastEpisodeUrl`.
2. Put the show link in `podcast.spotifyShowUrl` once. That adds a "Follow on Spotify" button.

## Running and publishing

```bash
npm start          # serves at http://localhost:8080
npm test           # schedule, media-link and series-file tests
npm run validate   # checks every series file
```

**Publishing (GitHub Pages):** the included workflow tests and deploys every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. Any other static host also works, such as Netlify or Cloudflare Pages.

When you change app code (anything outside `series/`), bump `VERSION` in `sw.js` so installed copies update. Series data always loads fresh when people are online.

## The other series

The app also holds the rest of the 2026–27 preaching calendar, each in its own `series/<id>/series.json`:

| Series | Sundays | Status |
|---|---|---|
| Romans | Sep 13 – Nov 15, Apr 4 – Jun 6, Aug 15 – Oct 24 | passages + some speakers |
| Advent (`advent-2026`) | Nov 29 – Dec 27, 2026 | Luke 1–2 passages |
| The Sermon on the Mount | Jan 3 – Mar 7, 2027 | Matthew 5–7 passages |
| Easter (`easter-2027`) | Mar 14 – Mar 28, 2027 | titles only, passages TBD |

**The app opens whichever series is being preached now**, meaning the one with the soonest upcoming Sunday. Nobody has to switch anything when Romans pauses for Advent. People can still pin a series in Settings. Thanksgiving (Nov 22) and the summer series are not included yet, because the proposal marks them as undecided.

## Starting a new series later

```bash
npm run new-series -- --id=james --title="James" --weeks=12 --start=2027-06-06
```

Then add it to `series/index.json` and set `"active"` to it. Older series stay available: once more than one exists, a series picker appears in Settings.

## Project layout

```
index.html, manifest.webmanifest, sw.js   app shell, install metadata, offline cache
config.js                                 app name, church, ESV settings
series/index.json                         list of series + which is active
series/romans/series.json                 the Romans plan (edit this)
js/schedule.js                            date logic (unit-tested)
js/esv.js, js/reminders.js, js/media.js   ESV fetch, reminders + .ics, video/Spotify embeds
js/views/*.js                             the five screens
css/app.css                               styles (light + dark)
icons/                                    app icons (npm run icons re-renders PNGs)
server/esv-proxy.worker.js                optional key-hiding ESV proxy
scripts/                                  scaffold, validate, icon tools
```
