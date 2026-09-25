# Sermon Series

An installable web app (PWA) for following a sermon series day by day. It was built for the **30-week Romans series at Neighbors and Nations Church** and can be reused for any future series.

- **Today:** today's ESV reading, this Sunday's sermon, last week's message, and your progress.
- **Weeks:** every sermon in the series. Each one has its date, passage, big idea, the pastor's video from before or after Sunday, the podcast episode, discussion questions, and the day-by-day reading plan.
- **Reading view:** the ESV text, a reflection prompt, private notes, and a "mark as read" button.
- **Listen:** the latest recorded message plus an archive of earlier ones (Spotify embeds).
- **Settings:** a daily reminder, a calendar export of the whole plan, text size, install help, and a series switcher.

It runs as a website that can be installed from the browser, **and** as real iPhone and Android apps built from the same code with [Capacitor](https://capacitorjs.com). See [Phone apps](#phone-apps).

The app works offline once installed. Progress and notes stay on each person's device, so nobody needs an account.

The website has no build step: it's plain HTML, CSS, and JavaScript modules, so any static host works.

---

## Filling in the Romans plan

Everything lives in **`series/romans/series.json`**. The 30 weeks are already scaffolded with empty fields. **Week 1 contains sample content** so you can see how screens look; replace it with your own.

```jsonc
{
  "id": "romans",
  "title": "Romans",
  "subtitle": "The gospel of God for neighbors and nations",
  "church": "Neighbors and Nations Church",
  "startDate": "2026-10-04",        // FIRST SERMON SUNDAY — set this! (placeholder)
  "sermonTime": "10:00",            // used for calendar export
  "theme": { "accent": "#b5832a" }, // per-series accent color
  "readingPlan": { "dayOffsets": [-6, -5, -4, -3, -2, -1] },
  "podcast": { "spotifyShowUrl": "", "applePodcastsUrl": "", "rssUrl": "" },
  "weeks": [
    {
      "title": "Set Apart for the Gospel",
      "passage": "Romans 1:1-17",
      "preacher": "Pastor Name",
      "date": "2026-10-04",          // optional — override this week's Sunday
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
- **Phone apps:** real reminders. The iPhone and Android apps schedule a notification for each upcoming reading at the chosen time, directly on the phone, so no server is needed. They skip readings already marked as read and top up the schedule each time the app opens (iOS allows 64 pending notifications, so the next 60 are scheduled).

## Podcast on Spotify

The simplest route is **[Spotify for Creators](https://creators.spotify.com)** (formerly Anchor). It's free. Upload each Sunday's recording, and it can also distribute the show to Apple Podcasts. After each upload:

1. Copy the episode's share link into that week's `podcastEpisodeUrl`.
2. Put the show link in `podcast.spotifyShowUrl` once. That adds a "Follow on Spotify" button.

## Running and publishing

```bash
npm start          # serves at http://localhost:8080
npm test           # schedule, media-link and series-file tests
npm run validate   # checks every series file
npm run build      # copies the web app into www/ (used by the apps and the site deploy)
```

**Publishing (GitHub Pages):** the included workflow tests and deploys every push to `main`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**. Any other static host also works, such as Netlify or Cloudflare Pages.

When you change app code (anything outside `series/`), bump `VERSION` in `sw.js` so installed copies update. Series data always loads fresh when people are online.

## Phone apps

`android/` and `ios/` are the native projects. They wrap the same web code (`npm run build` copies it into `www/`).

**How plan updates reach the apps:** the apps download `series/` files from the live website (`remoteBase` in `config.js`) every time they open. Editing `series.json` and pushing to `main` updates the apps too, with no new store release. If the phone is offline, the apps use the last copy they downloaded, then the copy built into the app.

You only need a new store release when the **app code** changes (anything outside `series/`).

**Test builds, without installing anything:** every push to `main` runs the *Phone apps* workflow in GitHub Actions.
- **Android:** it builds an installable test app. Open the run in the **Actions** tab and download **sermon-series-android** at the bottom of the page. Unzip it and open `app-debug.apk` on an Android phone. You'll need to allow "install unknown apps".
- **iPhone:** it checks that the app compiles. To run it on an iPhone you need a Mac with Xcode, or a cloud build service.

**Working on the apps locally:**

```bash
npm install
npm run android    # builds, syncs, opens Android Studio
npm run ios        # builds, syncs, opens Xcode (Mac only)
```

After changing icons, run `npm run icons`, then `npx @capacitor/assets generate --iconBackgroundColor '#1f2a44' --splashBackgroundColor '#f7f3ec' --splashBackgroundColorDark '#11151d'`.

**Publishing to the stores**

| | Google Play | Apple App Store |
|---|---|---|
| Account | Play Console, $25 one-time | Apple Developer Program, $99/year |
| Build | Android Studio → *Build → Generate Signed App Bundle* | Xcode → *Product → Archive* → upload |
| Notes | New personal accounts must run a closed test with 12 testers for 14 days before going public. An organization account (needs a D-U-N-S number) skips this. | Review usually takes 1–3 days. Describe the scheduled reminders, offline reading, and progress tracking in the review notes: Apple rejects apps that are "just a website". |

- **App ID:** `org.neighborsandnations.sermonseries`, set in `capacitor.config.json` and the native projects. **It can't change after the first store upload**, so confirm it first.
- **App name:** "Sermon Series", which people see under the icon.
- **ESV in the apps:** the apps call the ESV API from `https://localhost` (Android) and `capacitor://localhost` (iOS). If you use the proxy, add both to `ALLOWED_ORIGINS`.

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
js/native.js                              phone-app-only features (notifications, back button, links)
css/app.css                               styles (light + dark)
android/, ios/, capacitor.config.json     the phone apps (Capacitor)
assets/                                   phone icon + splash sources
icons/                                    app icons (npm run icons re-renders PNGs)
server/esv-proxy.worker.js                optional key-hiding ESV proxy
scripts/                                  scaffold, validate, icon tools
```
